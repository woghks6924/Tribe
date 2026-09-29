"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { getEffectiveRunningFormStatus, type RunningFormStatus } from "@/lib/running-status";

type FormSummary = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  eventDate: string;
  category: "RANDOM_DRAW" | "FIRST_COME";
  capacity: number | null;
  applicationStartAt: string | null;
  applicationEndAt: string | null;
  status: RunningFormStatus;
  isPublished: boolean;
  submissionCount: number;
  createdAt: string;
};

function formatApplicationPeriod(startAt: string | null, endAt: string | null): string | null {
  if (!startAt && !endAt) return null;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  if (startAt && endAt) return `신청 ${fmt(startAt)} ~ ${fmt(endAt)}`;
  if (endAt) return `신청 마감 ${fmt(endAt)}`;
  return `신청 시작 ${fmt(startAt!)}`;
}

const CATEGORY_LABEL: Record<FormSummary["category"], string> = {
  RANDOM_DRAW: "랜덤추첨",
  FIRST_COME: "선착순",
};

const STATUS_LABEL: Record<RunningFormStatus, string> = {
  UPCOMING: "예정",
  OPEN: "진행중",
  CLOSED: "마감",
};

const STATUS_COLOR: Record<RunningFormStatus, string> = {
  UPCOMING: "text-ink-muted",
  OPEN: "text-accent",
  CLOSED: "text-red-400",
};

export function RunningFormList({ forms }: { forms: FormSummary[] }) {
  const router = useRouter();

  async function togglePublished(f: FormSummary) {
    await fetch(`/api/admin/running-forms/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !f.isPublished }),
    });
    router.refresh();
  }

  async function changeStatus(id: string, status: RunningFormStatus) {
    await fetch(`/api/admin/running-forms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function duplicate(id: string) {
    const res = await fetch(`/api/admin/running-forms/${id}/duplicate`, { method: "POST" });
    const data = await res.json();
    if (data.id) router.push(`/admin/running-forms/${data.id}`);
  }

  async function deleteForm(id: string) {
    await fetch(`/api/admin/running-forms/${id}`, { method: "DELETE" });
    router.refresh();
  }

  // eslint-disable-next-line react-hooks/purity -- 지난 세션 흐리게 표시·자동 마감 판정용, 정확한 실시간 갱신은 필요 없다.
  const now = useMemo(() => Date.now(), []);
  // 신청기간이 지나면 status 필드를 안 건드려도 공개 페이지에서는 자동으로 마감 처리된다(getEffectiveRunningFormStatus).
  // 관리자 목록의 상태 드롭다운은 수동 오버라이드용 원본 값을 그대로 보여주므로, 여기서 계산한
  // "실제로는 마감된 상태"를 별도 배지로 알려준다.
  // eslint-disable-next-line react-hooks/purity -- 위와 같은 이유로 지금 시각 기준 계산이 필요하다.
  const effectiveStatusById = useMemo(() => {
    const map = new Map<string, RunningFormStatus>();
    for (const f of forms) map.set(f.id, getEffectiveRunningFormStatus(f, f.submissionCount));
    return map;
  }, [forms]);

  if (forms.length === 0) {
    return <p className="border border-line px-4 py-6 text-sm text-ink-faint">No running forms yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {forms.map((f) => {
        const past = new Date(f.eventDate).getTime() < now;
        const effectiveStatus = effectiveStatusById.get(f.id)!;
        const autoClosed = effectiveStatus === "CLOSED" && f.status !== "CLOSED";
        return (
        <div
          key={f.id}
          className={`flex flex-col gap-3 border border-line px-4 py-3 text-sm ${past ? "opacity-50 grayscale" : ""}`}
        >
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-line-strong bg-base-elevated">
              {f.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-semibold">
                {f.title}
                {past && (
                  <span className="ml-2 border border-line-strong px-1.5 py-0.5 text-[10px] font-bold text-ink-faint uppercase">
                    지난 세션
                  </span>
                )}
              </span>
              <span className="text-xs text-ink-faint">
                {CATEGORY_LABEL[f.category]} · {new Date(f.eventDate).toLocaleDateString()} ·{" "}
                {f.submissionCount}
                {f.capacity != null ? `/${f.capacity}` : ""}명 신청
              </span>
              {formatApplicationPeriod(f.applicationStartAt, f.applicationEndAt) && (
                <span className="text-xs text-ink-faint">
                  {formatApplicationPeriod(f.applicationStartAt, f.applicationEndAt)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className={`text-xs uppercase ${f.isPublished ? "text-accent" : "text-ink-faint"}`}>
              {f.isPublished ? "Published" : "Draft"}
            </span>
            <button
              onClick={() => togglePublished(f)}
              className="cursor-pointer text-xs text-ink-muted hover:text-ink"
            >
              {f.isPublished ? "Unpublish" : "Publish"}
            </button>

            <select
              value={f.status}
              onChange={(e) => changeStatus(f.id, e.target.value as RunningFormStatus)}
              className={`border border-line-strong bg-base px-2 py-1.5 text-xs uppercase outline-none ${STATUS_COLOR[f.status]}`}
            >
              {(["UPCOMING", "OPEN", "CLOSED"] as const).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            {autoClosed && (
              <span
                className="border border-red-400 px-2 py-1 text-xs text-red-400"
                title="신청기간이 지나서 공개 페이지에는 이미 마감으로 보여요. 위 드롭다운은 수동 설정 값이라 그대로 둬도 되고, 확정으로 바꾸고 싶으면 마감으로 바꿔주세요."
              >
                신청기간 지남 → 자동 마감
              </span>
            )}

            <Link
              href={`/admin/running-forms/${f.id}/submissions`}
              className="cursor-pointer text-xs text-ink-muted hover:text-ink"
            >
              Submissions
            </Link>
            <Link
              href={`/admin/running-forms/${f.id}`}
              className="cursor-pointer text-xs text-ink-muted hover:text-ink"
            >
              Edit
            </Link>
            <button onClick={() => duplicate(f.id)} className="cursor-pointer text-xs text-ink-muted hover:text-ink">
              Copy
            </button>
            <button
              onClick={() => deleteForm(f.id)}
              className="cursor-pointer text-xs text-ink-faint hover:text-red-400"
            >
              Delete
            </button>
          </div>
        </div>
        );
      })}
    </div>
  );
}
