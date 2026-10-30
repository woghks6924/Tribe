"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  buildBibMap,
  formatTakenAt,
  indexUrl,
  searchByBib,
  searchByTime,
  targetTimeMs,
  thumbUrl,
  type RacePhoto,
  type RacePhotoEvent,
  type RacePhotoIndex,
} from "@/lib/race-photos";
import { PhotoLightbox } from "./photo-lightbox";

const PAGE_SIZE = 30;
const RANGES = [3, 5, 10] as const;

type Mode = "bib" | "time";
type Query =
  | { mode: "bib"; bib: string }
  | { mode: "time"; spot: string; time: string; range: number };

type Load = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: RacePhotoIndex };

// override: 관리자가 등록한 대회 정보(있으면 index.json의 event 값보다 우선).
export function PhotoFinder({ event, override = null }: { event: string; override?: RacePhotoEvent | null }) {
  const router = useRouter();
  const params = useSearchParams();

  const [load, setLoad] = useState<Load>({ status: "loading" });

  // 입력 상태. URL(?bib= / ?spot=&t=&range=)로 들어오면 그 값으로 시작하고 바로 검색한다.
  const initialBib = params.get("bib") ?? "";
  const initialTime = params.get("t") ?? "";
  const initialRange = Number(params.get("range"));
  const [mode, setMode] = useState<Mode>(initialTime && !initialBib ? "time" : "bib");
  const [bibInput, setBibInput] = useState(initialBib);
  const [spotInput, setSpotInput] = useState(params.get("spot") ?? "");
  const [timeInput, setTimeInput] = useState(initialTime);
  const [rangeInput, setRangeInput] = useState<number>(RANGES.some((r) => r === initialRange) ? initialRange : 5);
  const [query, setQuery] = useState<Query | null>(
    initialBib
      ? { mode: "bib", bib: initialBib }
      : initialTime
        ? {
            mode: "time",
            spot: params.get("spot") ?? "",
            time: initialTime,
            range: RANGES.some((r) => r === initialRange) ? initialRange : 5,
          }
        : null,
  );
  const [inputError, setInputError] = useState<string | null>(null);
  const [shown, setShown] = useState<{ sig: string; n: number }>({ sig: "", n: PAGE_SIZE });
  const [openIndex, setOpenIndex] = useState<{ sig: string; i: number } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(indexUrl(event))
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? "대회 정보를 찾을 수 없어요." : "사진 목록을 불러오지 못했어요.");
        return res.json() as Promise<RacePhotoIndex>;
      })
      .then((data) => alive && setLoad({ status: "ready", data }))
      .catch((e: unknown) => alive && setLoad({ status: "error", message: e instanceof Error ? e.message : "문제가 발생했어요." }));
    return () => {
      alive = false;
    };
  }, [event]);

  const data = load.status === "ready" ? load.data : null;
  // 시간대 검색 기준일: 관리자가 등록한 대회 날짜가 우선
  const eventDate = override?.date ?? data?.event.date ?? "";
  // 배번 → 사진 맵은 JSON을 받은 뒤 한 번만 만든다.
  const bibMap = useMemo(() => (data ? buildBibMap(data.photos) : null), [data]);

  const results: RacePhoto[] | null = useMemo(() => {
    if (!data || !bibMap || !query) return null;
    if (query.mode === "bib") return searchByBib(bibMap, query.bib);
    const ms = targetTimeMs(eventDate, query.time);
    return ms == null ? [] : searchByTime(data.photos, query.spot, ms, query.range);
  }, [data, bibMap, query, eventDate]);

  const sig = query ? JSON.stringify(query) : "";
  const visibleCount = shown.sig === sig ? shown.n : PAGE_SIZE;
  const lightboxIndex = openIndex && openIndex.sig === sig ? openIndex.i : null;

  function writeUrl(q: Query) {
    const sp = new URLSearchParams();
    if (q.mode === "bib") sp.set("bib", q.bib);
    else {
      if (q.spot) sp.set("spot", q.spot);
      sp.set("t", q.time);
      sp.set("range", String(q.range));
    }
    router.replace(`/photos/${event}?${sp.toString()}`, { scroll: false });
  }

  function submitBib(e: React.FormEvent) {
    e.preventDefault();
    const bib = bibInput.trim();
    if (!bib) {
      setInputError("배번을 입력해 주세요.");
      return;
    }
    setInputError(null);
    const q: Query = { mode: "bib", bib };
    setQuery(q);
    writeUrl(q);
  }

  function submitTime(e: React.FormEvent) {
    e.preventDefault();
    if (!data || targetTimeMs(eventDate, timeInput) == null) {
      setInputError("통과 시각을 HH:MM 형식으로 입력해 주세요. 예: 09:42");
      return;
    }
    setInputError(null);
    const q: Query = { mode: "time", spot: spotInput, time: timeInput.trim(), range: rangeInput };
    setQuery(q);
    writeUrl(q);
  }

  if (load.status === "loading") {
    return <p className="px-5 py-10 text-sm text-ink-muted sm:px-8">사진 목록 불러오는 중…</p>;
  }
  if (load.status === "error" || !data) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-5 py-10 sm:px-8">
        <p className="text-sm text-ink-muted">{load.status === "error" ? load.message : "문제가 발생했어요."}</p>
        <Link href="/photos" className="w-fit text-sm underline">
          ← 대회 목록으로
        </Link>
      </div>
    );
  }

  const { spots } = data;
  const info: RacePhotoEvent = { ...data.event, ...(override ?? {}) };
  const modeTabClass = (active: boolean) =>
    `cursor-pointer border px-4 py-2 text-sm ${active ? "border-ink bg-ink text-base" : "border-line-strong text-ink-muted hover:border-ink hover:text-ink"}`;
  const fieldClass =
    "w-full border border-line-strong bg-base-elevated px-3 py-2.5 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:border-ink";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-2">
        <Link href="/photos" className="w-fit text-xs tracking-[0.06em] text-ink-faint uppercase hover:text-ink">
          ← Race Photos
        </Link>
        <h1 className="font-display text-2xl leading-tight font-extrabold sm:text-3xl">{info.name}</h1>
        <p className="text-sm text-ink-muted">
          {info.date} · 사진 {data.photos.length.toLocaleString("ko-KR")}장
        </p>
      </div>

      <section className="flex flex-col gap-4 border border-line bg-base-elevated p-4 sm:p-5">
        <div className="flex gap-2">
          <button type="button" aria-pressed={mode === "bib"} onClick={() => setMode("bib")} className={modeTabClass(mode === "bib")}>
            배번으로 찾기
          </button>
          <button type="button" aria-pressed={mode === "time"} onClick={() => setMode("time")} className={modeTabClass(mode === "time")}>
            시간대로 찾기
          </button>
        </div>

        {mode === "bib" ? (
          <form onSubmit={submitBib} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={bibInput}
              onChange={(e) => setBibInput(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="배번 (예: 12345)"
              aria-label="배번"
              className={fieldClass}
            />
            <button
              type="submit"
              className="shrink-0 cursor-pointer bg-ink px-6 py-2.5 text-sm font-bold text-base hover:opacity-85"
            >
              내 사진 찾기
            </button>
          </form>
        ) : (
          <form onSubmit={submitTime} className="flex flex-col gap-3">
            <p className="text-xs leading-relaxed text-ink-muted">
              배번이 인식되지 않은 사진은 시간으로 찾을 수 있어요. 공식 기록 조회에서 구간 통과 시각을 확인하고 입력하세요.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {spots.length > 0 && (
                <label className="flex flex-col gap-1 text-xs text-ink-muted">
                  촬영 지점
                  <select value={spotInput} onChange={(e) => setSpotInput(e.target.value)} className={fieldClass}>
                    <option value="">전체 지점</option>
                    {spots.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex flex-col gap-1 text-xs text-ink-muted">
                통과 시각 (HH:MM)
                <input
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  inputMode="numeric"
                  placeholder="09:42"
                  autoComplete="off"
                  className={fieldClass}
                />
              </label>
              <div className="flex flex-col gap-1 text-xs text-ink-muted">
                범위
                <div className="flex gap-1.5">
                  {RANGES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={rangeInput === r}
                      onClick={() => setRangeInput(r)}
                      className={`flex-1 cursor-pointer border px-2 py-2.5 text-sm ${
                        rangeInput === r ? "border-ink bg-ink text-base" : "border-line-strong text-ink-muted hover:border-ink"
                      }`}
                    >
                      ±{r}분
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full cursor-pointer bg-ink px-6 py-2.5 text-sm font-bold text-base hover:opacity-85 sm:w-fit"
            >
              시간대로 찾기
            </button>
          </form>
        )}
        {inputError && <p className="text-sm text-[#f08068]">{inputError}</p>}
      </section>

      {results && query && (
        <section className="flex flex-col gap-4" aria-live="polite">
          <h2 className="text-[16px] font-bold">
            {query.mode === "bib" ? `배번 ${query.bib}` : `${query.spot || "전체 지점"} · ${query.time} ±${query.range}분`}
            <span className="ml-2 text-sm font-normal text-ink-muted">사진 {results.length}장</span>
          </h2>

          {results.length === 0 ? (
            <div className="flex flex-col gap-3 border border-line px-4 py-6 text-sm text-ink-muted">
              <p>
                {query.mode === "bib"
                  ? "이 배번이 인식된 사진이 없어요."
                  : "그 시간대에 찍힌 사진이 없어요. 범위를 넓히거나 지점을 바꿔 보세요."}
              </p>
              {query.mode === "bib" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("time");
                    setQuery(null);
                  }}
                  className="w-fit cursor-pointer underline hover:text-ink"
                >
                  시간대로 찾아보기
                </button>
              )}
              <a href={info.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="w-fit underline hover:text-ink">
                드라이브 전체 폴더에서 직접 찾아보기
              </a>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {results.slice(0, visibleCount).map((p, i) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setOpenIndex({ sig, i })}
                      className="group relative block w-full cursor-pointer overflow-hidden border border-line bg-base-deep"
                      aria-label={`${p.spot} ${formatTakenAt(p.takenAt)} 사진 열기`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- next/image 최적화를 쓰지 않는 정적 썸네일 */}
                      <img
                        src={thumbUrl(event, p.id)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.03]"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pt-6 pb-1.5 text-left text-[11px] text-white">
                        {p.spot} · {formatTakenAt(p.takenAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {visibleCount < results.length && (
                <button
                  type="button"
                  onClick={() => setShown({ sig, n: visibleCount + PAGE_SIZE })}
                  className="w-full cursor-pointer border border-line-strong py-3 text-sm text-ink-muted hover:border-ink hover:text-ink"
                >
                  더보기 ({visibleCount}/{results.length})
                </button>
              )}
            </>
          )}
        </section>
      )}

      <footer className="flex flex-col gap-1 border-t border-line pt-5 text-xs leading-relaxed text-ink-faint">
        <p>
          사진 삭제를 원하시면 {info.contact}로 연락주세요.
        </p>
        <p>사진은 무료로 배포돼요. 개인적인 기록·SNS 공유는 자유롭게 하시되, 상업적 이용은 금지돼요.</p>
        <a href={info.driveFolderUrl} target="_blank" rel="noopener noreferrer" className="mt-1 w-fit underline hover:text-ink">
          드라이브 전체 폴더 보기
        </a>
      </footer>

      {results && lightboxIndex != null && results.length > 0 && (
        <PhotoLightbox
          event={event}
          photos={results}
          index={Math.min(lightboxIndex, results.length - 1)}
          onIndex={(i) => setOpenIndex({ sig, i })}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  );
}
