"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type FormSummary = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  eventDate: string;
  category: "RANDOM_DRAW" | "FIRST_COME";
  capacity: number | null;
  isClosed: boolean;
  isPublished: boolean;
  submissionCount: number;
  createdAt: string;
};

const CATEGORY_LABEL: Record<FormSummary["category"], string> = {
  RANDOM_DRAW: "랜덤추첨",
  FIRST_COME: "선착순",
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

  async function toggleClosed(f: FormSummary) {
    await fetch(`/api/admin/running-forms/${f.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isClosed: !f.isClosed }),
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
        <div key={f.id} className="flex items-center gap-4 border border-line px-4 py-3 text-sm">
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
          </div>

          <span className={`text-xs uppercase ${f.isPublished ? "text-accent" : "text-ink-faint"}`}>
            {f.isPublished ? "Published" : "Draft"}
          </span>
          <button
            onClick={() => togglePublished(f)}
            className="cursor-pointer text-xs text-ink-muted hover:text-ink"
          >
            {f.isPublished ? "Unpublish" : "Publish"}
          </button>

          <span className={`text-xs uppercase ${f.isClosed ? "text-red-400" : "text-ink-muted"}`}>
            {f.isClosed ? "Closed" : "Open"}
          </span>
          <button onClick={() => toggleClosed(f)} className="cursor-pointer text-xs text-ink-muted hover:text-ink">
            {f.isClosed ? "Reopen" : "Close"}
          </button>

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
      ))}
    </div>
  );
}
