"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RunningFormStatus } from "@/lib/running";

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

  if (forms.length === 0) {
    return <p className="border border-line px-4 py-6 text-sm text-ink-faint">No running forms yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {forms.map((f) => (
        <div key={f.id} className="flex flex-col gap-3 border border-line px-4 py-3 text-sm">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-line-strong bg-base-elevated">
              {f.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-semibold">{f.title}</span>
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
      ))}
    </div>
  );
}
