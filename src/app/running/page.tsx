import type { Metadata } from "next";
import Link from "next/link";
import { getEffectiveRunningFormStatus, getPublishedRunningForms } from "@/lib/running";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "러닝 이벤트 — Tri.be",
  description: "Tri.be와 함께 달릴 러닝 이벤트에 신청하세요.",
};

const CATEGORY_LABEL = { RANDOM_DRAW: "랜덤추첨", FIRST_COME: "선착순" } as const;
const STATUS_LABEL = { UPCOMING: "예정", OPEN: "진행중", CLOSED: "마감" } as const;
const STATUS_BADGE = {
  UPCOMING: "bg-white/90 text-ink",
  OPEN: "bg-accent text-accent-ink",
  CLOSED: "bg-black/70 text-white",
} as const;

export default async function RunningEventsPage() {
  const forms = await getPublishedRunningForms();

  return (
    <div className="flex flex-col gap-8 px-5 py-10 sm:px-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-extrabold tracking-[0.02em] uppercase">Running</h1>
        <p className="text-sm text-ink-muted">Tri.be와 함께 달릴 러닝 이벤트</p>
      </div>

      {forms.length === 0 ? (
        <p className="border border-line px-4 py-8 text-center text-sm text-ink-faint">
          현재 모집 중인 이벤트가 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((f) => {
            const status = getEffectiveRunningFormStatus(f, f.submissionCount);
            return (
              <Link
                key={f.id}
                href={`/running/${f.id}`}
                className="group flex flex-col overflow-hidden border border-line"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-base-elevated">
                  {f.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.thumbnailUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-ink-faint">
                      TRI.BE
                    </div>
                  )}
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] uppercase ${STATUS_BADGE[status]}`}
                  >
                    {STATUS_LABEL[status]}
                  </span>
                  <span className="absolute top-3 right-3 bg-black/60 px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-white uppercase">
                    {CATEGORY_LABEL[f.category]}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 px-4 py-4">
                  <span className="font-display text-lg font-extrabold tracking-[0.01em] uppercase">
                    {f.title}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {new Date(f.eventDate).toLocaleString("ko-KR", {
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Seoul",
                    })}
                  </span>
                  {f.capacity != null && (
                    <span className="text-xs text-ink-faint">정원 {f.capacity}명</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
