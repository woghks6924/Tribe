"use client";

import { useEffect, useRef } from "react";
import { driveDownloadUrl, driveViewUrl, formatTakenAt, thumbUrl, type RacePhoto } from "@/lib/race-photos";

// 라이트박스: 좌우 화살표/키보드/스와이프로 넘기고, 원본 보기·다운로드는 구글 드라이브로 연결한다.
export function PhotoLightbox({
  event,
  photos,
  index,
  onIndex,
  onClose,
}: {
  event: string;
  photos: RacePhoto[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const photo = photos[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && index > 0) onIndex(index - 1);
      else if (e.key === "ArrowRight" && index < photos.length - 1) onIndex(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, photos.length, onIndex, onClose]);

  // 열려 있는 동안 뒤 화면이 스크롤되지 않게 하고, 닫기 버튼에 포커스를 둔다.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`사진 ${index + 1} / ${photos.length}`}
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (dx > 60 && hasPrev) onIndex(index - 1);
        else if (dx < -60 && hasNext) onIndex(index + 1);
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <span className="text-white/70">
          {index + 1} / {photos.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="cursor-pointer border border-white/30 px-3 py-1.5 text-xs tracking-[0.06em] uppercase hover:border-white"
        >
          닫기
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image 최적화를 쓰지 않는 정적 썸네일 */}
        <img
          key={photo.id}
          src={thumbUrl(event, photo.id)}
          alt={`${photo.spot} ${formatTakenAt(photo.takenAt)}`}
          className="max-h-full max-w-full object-contain"
          draggable={false}
        />
        <button
          type="button"
          aria-label="이전 사진"
          disabled={!hasPrev}
          onClick={() => onIndex(index - 1)}
          className="absolute left-1 top-1/2 flex h-12 w-10 -translate-y-1/2 cursor-pointer items-center justify-center bg-black/40 text-2xl disabled:opacity-20 sm:left-4"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="다음 사진"
          disabled={!hasNext}
          onClick={() => onIndex(index + 1)}
          className="absolute right-1 top-1/2 flex h-12 w-10 -translate-y-1/2 cursor-pointer items-center justify-center bg-black/40 text-2xl disabled:opacity-20 sm:right-4"
        >
          ›
        </button>
      </div>

      <div className="flex flex-col gap-3 px-4 py-4">
        <p className="text-sm text-white/70">
          {photo.spot} · {formatTakenAt(photo.takenAt)}
          {photo.bibs.length > 0 && <> · 배번 {photo.bibs.join(", ")}</>}
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={driveViewUrl(photo.driveId)}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/40 px-4 py-2.5 text-sm font-medium hover:border-white"
          >
            원본 보기
          </a>
          <a
            href={driveDownloadUrl(photo.driveId)}
            rel="noopener noreferrer"
            className="bg-white px-4 py-2.5 text-sm font-bold text-black hover:bg-white/85"
          >
            원본 다운로드
          </a>
        </div>
      </div>
    </div>
  );
}
