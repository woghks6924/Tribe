"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useHasMounted } from "@/lib/use-has-mounted";
import type { PopupNotice } from "@/lib/notices";

const STORAGE_PREFIX = "tribe-notice-hide-until-";

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function NoticePopup({ notices }: { notices: PopupNotice[] }) {
  const hydrated = useHasMounted();
  const [queue, setQueue] = useState<PopupNotice[]>([]);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    // localStorage(외부 시스템)를 마운트 시점에 동기화하는 용도 — 파생 상태로 대체 불가.
    if (!hydrated || notices.length === 0) return;
    const now = Date.now();
    const visible = notices.filter((n) => {
      const hideUntil = Number(localStorage.getItem(STORAGE_PREFIX + n.id));
      return !hideUntil || hideUntil < now;
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQueue(visible);
  }, [hydrated, notices]);

  if (queue.length === 0) return null;

  const current = queue[0];

  function handleClose() {
    if (dontShowToday) {
      localStorage.setItem(STORAGE_PREFIX + current.id, String(endOfToday()));
    }
    setDontShowToday(false);
    setQueue((prev) => prev.slice(1));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-base-deep/80 px-6">
      <div className="relative flex w-full max-w-md flex-col border border-line bg-base-elevated">
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-3 right-3 flex h-8 w-8 cursor-pointer items-center justify-center text-ink-muted hover:text-ink"
        >
          ✕
        </button>

        {current.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.imageUrl} alt="" className="h-48 w-full object-cover" />
        )}

        <div className="flex flex-col gap-4 p-6">
          <h2 className="pr-6 font-sans text-lg font-extrabold tracking-[0.01em]">
            {current.title}
          </h2>
          <div
            className="prose-content text-sm text-ink-muted"
            dangerouslySetInnerHTML={{ __html: current.content }}
          />
          {current.linkUrl && (
            <Link
              href={current.linkUrl}
              className="w-fit border border-line-strong px-4 py-2 text-xs tracking-[0.08em] uppercase hover:border-ink hover:text-ink"
            >
              Learn More
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-6 py-4">
          <label className="flex items-center gap-2 text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
            />
            Don&apos;t show again today
          </label>
          <button
            onClick={handleClose}
            className="cursor-pointer text-xs tracking-[0.08em] text-ink-muted uppercase hover:text-ink"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
