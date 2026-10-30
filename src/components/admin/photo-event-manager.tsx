"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type PhotoEvent = {
  id: string;
  slug: string;
  name: string;
  date: string;
  driveFolderUrl: string;
  contact: string;
  published: boolean;
};

type Draft = Omit<PhotoEvent, "id">;

const EMPTY: Draft = { slug: "", name: "", date: "", driveFolderUrl: "", contact: "@tri.be 인스타그램 DM", published: true };

const fieldClass = "border border-line-strong bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-ink-faint";

function Fields({ draft, onChange, slugLocked }: { draft: Draft; onChange: (d: Draft) => void; slugLocked?: boolean }) {
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => onChange({ ...draft, [k]: v });
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <label className="flex flex-col gap-1 text-xs text-ink-muted">
        slug (public/race-photos 아래 폴더 이름)
        <input
          value={draft.slug}
          onChange={(e) => set("slug", e.target.value.trim().toLowerCase())}
          disabled={slugLocked}
          placeholder="jtbc-2026"
          className={`${fieldClass} disabled:opacity-50`}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-muted">
        대회 이름
        <input value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="2026 JTBC 서울마라톤" className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-muted">
        대회 날짜 (시간대 검색의 기준일)
        <input type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-muted">
        삭제 요청 문의처
        <input value={draft.contact} onChange={(e) => set("contact", e.target.value)} className={fieldClass} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-ink-muted md:col-span-2">
        구글 드라이브 폴더 링크
        <input
          value={draft.driveFolderUrl}
          onChange={(e) => set("driveFolderUrl", e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          className={fieldClass}
        />
      </label>
      <label className="flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" checked={draft.published} onChange={(e) => set("published", e.target.checked)} />
        공개 (끄면 /photos에서 숨겨요)
      </label>
    </div>
  );
}

// 사진 데이터(index.json)가 배포돼 있는지 브라우저에서 바로 확인한다.
function DataStatus({ slug }: { slug: string }) {
  const [state, setState] = useState<"checking" | "ok" | "missing">("checking");
  useEffect(() => {
    let alive = true;
    fetch(`/race-photos/${slug}/index.json`, { method: "HEAD" })
      .then((r) => alive && setState(r.ok ? "ok" : "missing"))
      .catch(() => alive && setState("missing"));
    return () => {
      alive = false;
    };
  }, [slug]);
  if (state === "checking") return <span className="text-xs text-ink-faint">확인 중…</span>;
  return state === "ok" ? (
    <span className="text-xs text-[#86d494]">사진 데이터 있음</span>
  ) : (
    <span className="text-xs text-[#f0b84a]">사진 데이터 없음 — public/race-photos/{slug}/ 배포 필요</span>
  );
}

export function PhotoEventManager({ events }: { events: PhotoEvent[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했어요.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("문제가 발생했어요.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {error && <p className="text-sm text-[#f08068]">{error}</p>}

      <div className="flex flex-col border border-line">
        <div className="border-b border-line bg-base-elevated px-4 py-3 text-xs tracking-[0.08em] text-ink-muted uppercase">대회 목록</div>
        {events.length === 0 && <p className="px-4 py-6 text-sm text-ink-faint">등록된 대회가 없어요. 아래에서 추가하세요.</p>}
        {events.map((e) =>
          editingId === e.id ? (
            <div key={e.id} className="flex flex-col gap-3 border-b border-line px-4 py-4 last:border-b-0">
              <Fields draft={editDraft} onChange={setEditDraft} slugLocked />
              <div className="flex gap-2">
                <Button
                  disabled={busy}
                  onClick={async () => {
                    // slug는 폴더 이름과 묶여 있어서 수정 화면에서는 바꾸지 않는다.
                    const body = { name: editDraft.name, date: editDraft.date, driveFolderUrl: editDraft.driveFolderUrl, contact: editDraft.contact, published: editDraft.published };
                    if (await call(`/api/admin/photo-events/${e.id}`, "PATCH", body)) setEditingId(null);
                  }}
                >
                  저장
                </Button>
                <Button variant="outline" onClick={() => setEditingId(null)}>
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <div key={e.id} className="flex flex-col gap-1.5 border-b border-line px-4 py-3 text-sm last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold">
                  {e.name} <span className="font-normal text-ink-faint">· {e.date} · /photos/{e.slug}</span>
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => call(`/api/admin/photo-events/${e.id}`, "PATCH", { published: !e.published })}
                    className={`cursor-pointer ${e.published ? "text-ink" : "text-ink-faint"}`}
                  >
                    {e.published ? "공개 중" : "숨김"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(e.id);
                      setEditDraft({ slug: e.slug, name: e.name, date: e.date, driveFolderUrl: e.driveFolderUrl, contact: e.contact, published: e.published });
                    }}
                    className="cursor-pointer text-ink-muted hover:text-ink"
                  >
                    수정
                  </button>
                  <a href={`/photos/${e.slug}`} target="_blank" rel="noopener noreferrer" className="text-ink-muted hover:text-ink">
                    페이지 열기
                  </a>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`'${e.name}' 정보를 삭제할까요? (사진 파일은 지워지지 않아요)`)) void call(`/api/admin/photo-events/${e.id}`, "DELETE");
                    }}
                    className="cursor-pointer text-ink-faint hover:text-red-400"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <a href={e.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="w-fit truncate text-xs text-ink-muted underline">
                {e.driveFolderUrl}
              </a>
              <div className="flex flex-wrap gap-3 text-xs text-ink-faint">
                <span>문의처: {e.contact}</span>
                <DataStatus slug={e.slug} />
              </div>
            </div>
          ),
        )}
      </div>

      <form
        onSubmit={async (ev) => {
          ev.preventDefault();
          if (await call("/api/admin/photo-events", "POST", creating)) setCreating(EMPTY);
        }}
        className="flex max-w-3xl flex-col gap-4"
      >
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">새 대회 등록</span>
        <Fields draft={creating} onChange={setCreating} />
        <div>
          <Button type="submit" disabled={busy}>
            {busy ? "저장 중…" : "대회 추가"}
          </Button>
        </div>
      </form>
    </div>
  );
}
