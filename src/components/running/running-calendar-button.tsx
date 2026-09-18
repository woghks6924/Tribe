"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type CalendarEvent = { id: string; title: string; eventDate: string };

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 이벤트 날짜를 KST 기준 YYYY-MM-DD 키로 변환 — 서버가 UTC로 도는 것과 무관하게
// 항상 한국 날짜로 달력에 표시되도록 한다.
function toKstDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export function RunningCalendarButton({ events }: { events: CalendarEvent[] }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = toKstDateKey(e.eventDate);
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function dateKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function changeMonth(delta: number) {
    setSelectedKey(null);
    setViewDate(new Date(year, month + delta, 1));
  }

  function closeModal() {
    setOpen(false);
    setSelectedKey(null);
  }

  const selectedEvents = selectedKey ? (eventsByDate.get(selectedKey) ?? []) : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-fit cursor-pointer border border-line-strong px-3 py-1.5 text-xs tracking-[0.06em] text-ink-muted uppercase hover:border-ink hover:text-ink"
      >
        캘린더 보기
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={closeModal}
        >
          <div
            className="flex w-full max-w-sm flex-col gap-4 border border-line bg-base p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="cursor-pointer px-2 py-1 text-ink-muted hover:text-ink"
                aria-label="이전 달"
              >
                ←
              </button>
              <span className="text-sm font-bold">
                {year}년 {month + 1}월
              </span>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="cursor-pointer px-2 py-1 text-ink-muted hover:text-ink"
                aria-label="다음 달"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-ink-faint">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day == null) return <span key={i} />;
                const key = dateKey(day);
                const hasEvents = eventsByDate.has(key);
                const isSelected = selectedKey === key;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={!hasEvents}
                    onClick={() => setSelectedKey(isSelected ? null : key)}
                    className={`flex aspect-square flex-col items-center justify-center gap-0.5 text-xs ${
                      hasEvents
                        ? isSelected
                          ? "cursor-pointer bg-ink text-[color:var(--color-base)]"
                          : "cursor-pointer text-ink hover:bg-base-elevated"
                        : "text-ink-faint"
                    }`}
                  >
                    {day}
                    {hasEvents && (
                      <span
                        className={`h-1 w-1 rounded-full ${
                          isSelected ? "bg-[color:var(--color-base)]" : "bg-accent"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedEvents.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-line pt-3">
                {selectedEvents.map((e) => (
                  <Link
                    key={e.id}
                    href={`/running/${e.id}`}
                    className="text-sm font-semibold text-ink hover:underline"
                  >
                    {e.title}
                  </Link>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={closeModal}
              className="cursor-pointer self-end text-xs text-ink-faint hover:text-ink"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
