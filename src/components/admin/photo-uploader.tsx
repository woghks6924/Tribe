"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RACE_PHOTO_BUCKET } from "@/lib/race-photos";
import { supabaseBrowser } from "@/lib/supabase-browser";

// 대회 사진 올리기: 브라우저에서 원본 사진을 읽어 촬영 시각(EXIF)을 뽑고, 640px 썸네일을 만들어
// Supabase Storage로 직접 올린 뒤, 드라이브 파일 ID와 맞춰서 index.json을 만든다. 파이썬·Node 같은 도구가 필요 없다.

const THUMB_SIZE = 640;
const THUMB_QUALITY = 0.72;
const BATCH = 50; // 썸네일을 만들어서 한 번에 올리는 단위
const UPLOAD_PARALLEL = 6;

type Meta = { file: File; takenAt: string; hasExif: boolean };
type Phase = "idle" | "exif" | "drive" | "thumbs" | "publish" | "done" | "error";

const stem = (name: string) => name.replace(/\.[^.]+$/, "").trim().toLowerCase();

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

// "filename,value..." 형태의 CSV를 (소문자 이름 → 나머지 문자열) 로.
function parseCsv(text: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const i = line.indexOf(",");
    if (i < 0) continue;
    const name = line.slice(0, i).trim();
    const rest = line.slice(i + 1).trim();
    if (!name || /^filename$/i.test(name)) continue;
    map.set(stem(name), rest);
  }
  return map;
}

async function readTakenAt(file: File, tz: string): Promise<{ iso: string; hasExif: boolean }> {
  try {
    const exifr = (await import("exifr")).default;
    // reviveValues: false -> "2025:11:16 09:38:35" 원문 그대로. 시간대를 브라우저 설정에 맡기지 않으려고 직접 조립한다.
    const tags = (await exifr.parse(file, { pick: ["DateTimeOriginal", "CreateDate"], reviveValues: false })) as
      | Record<string, unknown>
      | undefined;
    const raw = String(tags?.DateTimeOriginal ?? tags?.CreateDate ?? "");
    const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(raw);
    if (m) return { iso: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${tz}`, hasExif: true };
  } catch {
    // EXIF를 못 읽는 파일은 수정 시각으로 대신한다.
  }
  return { iso: new Date(file.lastModified).toISOString(), hasExif: false };
}

async function makeThumb(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    bitmap = await createImageBitmap(file); // 일부 브라우저는 옵션을 모른다
  }
  const scale = Math.min(1, THUMB_SIZE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", THUMB_QUALITY));
  if (!blob) throw new Error("썸네일을 만들지 못했어요.");
  return blob;
}

export function PhotoUploader({ eventId, slug, hasDriveLink }: { eventId: string; slug: string; hasDriveLink: boolean }) {
  const router = useRouter();
  const folderRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [spot, setSpot] = useState("촬영 지점");
  const [tz, setTz] = useState("+09:00");
  const [bibsFile, setBibsFile] = useState<File | null>(null);
  const [idsFile, setIdsFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [notes, setNotes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const busy = phase !== "idle" && phase !== "done" && phase !== "error";

  function pickFiles(list: FileList | null) {
    const arr = [...(list ?? [])].filter((f) => /\.(jpe?g|png|webp)$/i.test(f.name));
    setFiles(arr);
    setPhase("idle");
    setNotes([]);
    setError(null);
  }

  async function run() {
    setError(null);
    setNotes([]);
    const warn: string[] = [];
    try {
      if (files.length === 0) throw new Error("사진을 먼저 선택해 주세요.");
      if (files.length > 10000) throw new Error("한 번에 올릴 수 있는 사진은 10,000장까지예요.");
      const spotName = spot.trim() || "촬영 지점";

      // 1) 촬영 시각 읽기
      setPhase("exif");
      setProgress({ done: 0, total: files.length });
      let done = 0;
      const metas: Meta[] = await mapLimit(files, 8, async (file) => {
        const t = await readTakenAt(file, tz);
        setProgress({ done: ++done, total: files.length });
        return { file, takenAt: t.iso, hasExif: t.hasExif };
      });
      const noExif = metas.filter((m) => !m.hasExif).length;
      if (noExif) warn.push(`촬영 시각(EXIF)이 없어서 파일 수정 시각을 쓴 사진이 ${noExif}장 있어요.`);
      metas.sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt) || a.file.name.localeCompare(b.file.name));

      // 2) 드라이브 파일 ID: ids.csv를 직접 주면 그걸, 아니면 연동(Apps Script 웹앱)에서 자동으로
      setPhase("drive");
      const idByStem = new Map<string, string>();
      if (idsFile) {
        for (const [k, v] of parseCsv(await idsFile.text())) idByStem.set(k, v);
      } else if (hasDriveLink) {
        const res = await fetch(`/api/admin/photo-events/${eventId}/drive-files`);
        const data = await res.json().catch(() => ({}));
        if (res.ok) for (const f of data.files as { name: string; id: string }[]) idByStem.set(stem(f.name), f.id);
        else warn.push(`드라이브 파일 ID를 가져오지 못했어요: ${data.error ?? res.status} (원본 보기·다운로드 버튼이 빠져요. 나중에 다시 올리면 채워져요)`);
      }
      const bibsByStem = bibsFile ? parseCsv(await bibsFile.text()) : new Map<string, string>();

      // 3) 번호 매기기 + 썸네일 만들어서 올리기
      const records = metas.map((m, i) => ({
        meta: m,
        id: `p${String(i + 1).padStart(4, "0")}`,
        driveId: idByStem.get(stem(m.file.name)) ?? "",
        bibs: (bibsByStem.get(stem(m.file.name)) ?? "").split(/[\s,;]+/).filter(Boolean),
      }));
      const failed: string[] = [];
      const ok = new Set<string>();

      setPhase("thumbs");
      setProgress({ done: 0, total: records.length });
      let uploaded = 0;
      for (let s = 0; s < records.length; s += BATCH) {
        const chunk = records.slice(s, s + BATCH);
        const blobs = await mapLimit(chunk, 4, async (r) => {
          try {
            return await makeThumb(r.meta.file);
          } catch {
            failed.push(r.meta.file.name);
            return null;
          }
        });
        const targets = chunk.map((r, i) => ({ r, blob: blobs[i] })).filter((x): x is { r: (typeof chunk)[number]; blob: Blob } => !!x.blob);
        if (targets.length) {
          const signRes = await fetch(`/api/admin/photo-events/${eventId}/upload-urls`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ names: targets.map((t) => `${t.r.id}.jpg`) }),
          });
          const sign = await signRes.json();
          if (!signRes.ok) throw new Error(sign.error ?? "업로드 준비에 실패했어요.");
          const byName = new Map<string, { path: string; token: string }>(
            (sign.results as { name: string; path?: string; token?: string }[])
              .filter((x) => x.path && x.token)
              .map((x) => [x.name, { path: x.path!, token: x.token! }]),
          );
          await mapLimit(targets, UPLOAD_PARALLEL, async (t) => {
            const sg = byName.get(`${t.r.id}.jpg`);
            if (!sg) {
              failed.push(t.r.meta.file.name);
              return;
            }
            const { error: upErr } = await supabaseBrowser.storage
              .from(RACE_PHOTO_BUCKET)
              .uploadToSignedUrl(sg.path, sg.token, t.blob, { contentType: "image/jpeg", upsert: true });
            if (upErr) failed.push(t.r.meta.file.name);
            else ok.add(t.r.id);
          });
        }
        uploaded += chunk.length;
        setProgress({ done: uploaded, total: records.length });
      }
      if (failed.length) warn.push(`올리지 못한 사진 ${failed.length}장(HEIC 등 브라우저가 못 여는 형식일 수 있어요): ${failed.slice(0, 5).join(", ")}${failed.length > 5 ? " …" : ""}`);

      // 4) index.json 만들기(올라간 사진만)
      setPhase("publish");
      const photos = records
        .filter((r) => ok.has(r.id))
        .map((r) => ({ id: r.id, driveId: r.driveId, takenAt: r.meta.takenAt, spot: spotName, bibs: r.bibs }));
      if (photos.length === 0) throw new Error("올라간 사진이 없어요.");
      const missingIds = photos.filter((p) => !p.driveId).length;
      if (missingIds) warn.push(`드라이브 파일 ID를 못 찾은 사진이 ${missingIds}장이에요(파일명이 드라이브와 같은지 확인하세요). 이 사진은 원본 버튼이 안 보여요.`);
      if (!photos.some((p) => p.bibs.length)) warn.push("배번 정보가 없어서 시간대 검색만 가능해요.");

      const pubRes = await fetch(`/api/admin/photo-events/${eventId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos, spots: [spotName] }),
      });
      const pub = await pubRes.json();
      if (!pubRes.ok) throw new Error(pub.error ?? "저장에 실패했어요.");
      warn.unshift(`완료! 사진 ${pub.count}장이 올라갔어요. /photos/${slug} 에서 바로 확인할 수 있어요.`);
      setNotes(warn);
      setPhase("done");
      router.refresh();
    } catch (e) {
      setNotes(warn);
      setError(e instanceof Error ? e.message : "문제가 발생했어요.");
      setPhase("error");
    }
  }

  const phaseLabel: Record<Phase, string> = {
    idle: "",
    exif: "촬영 시각 읽는 중",
    drive: "드라이브 파일 ID 가져오는 중",
    thumbs: "썸네일 만들어서 올리는 중",
    publish: "사진 목록 저장 중",
    done: "",
    error: "",
  };
  const fieldClass = "border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint";

  return (
    <div className="mt-3 flex flex-col gap-3 border border-line bg-base-elevated p-4">
      <p className="text-xs leading-relaxed text-ink-muted">
        원본 사진을 고르면 이 화면(브라우저)에서 촬영 시각을 읽고 썸네일(640px)을 만들어 올려요. 원본은 올라가지 않아요. 같은 대회에 다시 올리면 이전 사진은 새 사진으로 교체돼요.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <input ref={folderRef} type="file" className="hidden" multiple onChange={(e) => pickFiles(e.target.files)} {...({ webkitdirectory: "" } as object)} />
        <input ref={filesRef} type="file" className="hidden" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => pickFiles(e.target.files)} />
        <Button type="button" variant="outline" disabled={busy} onClick={() => folderRef.current?.click()}>
          폴더 선택
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => filesRef.current?.click()}>
          사진 여러 장 선택
        </Button>
        <span className="text-sm text-ink-muted">{files.length > 0 ? `${files.length}장 선택됨` : "선택된 사진 없음"}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          촬영 지점 이름
          <input value={spot} onChange={(e) => setSpot(e.target.value)} className={fieldClass} disabled={busy} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          카메라 시계의 시간대 (한국이면 그대로)
          <select value={tz} onChange={(e) => setTz(e.target.value)} className={fieldClass} disabled={busy}>
            <option value="+09:00">한국 (+09:00)</option>
            <option value="+00:00">UTC (+00:00)</option>
            <option value="+08:00">+08:00</option>
            <option value="+10:00">+10:00</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          배번 CSV (선택) — 파일명,배번 배번
          <input type="file" accept=".csv,text/csv" onChange={(e) => setBibsFile(e.target.files?.[0] ?? null)} disabled={busy} className="text-xs" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-muted">
          드라이브 ids.csv (선택) — 자동 연동이 없을 때만
          <input type="file" accept=".csv,text/csv" onChange={(e) => setIdsFile(e.target.files?.[0] ?? null)} disabled={busy} className="text-xs" />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={busy || files.length === 0} onClick={run}>
          {busy ? "올리는 중…" : "올리기 시작"}
        </Button>
        {busy && (
          <span className="text-sm text-ink-muted">
            {phaseLabel[phase]} {progress.total > 0 && `(${progress.done}/${progress.total})`}
          </span>
        )}
      </div>
      {busy && progress.total > 0 && (
        <div className="h-1.5 w-full bg-base-deep">
          <div className="h-1.5 bg-ink transition-all" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} />
        </div>
      )}
      {busy && <p className="text-xs text-ink-faint">끝날 때까지 이 창을 닫지 마세요.</p>}

      {error && <p className="text-sm text-[#f08068]">{error}</p>}
      {notes.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-ink-muted">
          {notes.map((n, i) => (
            <li key={i} className={i === 0 && phase === "done" ? "text-[#86d494]" : ""}>
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
