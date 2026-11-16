import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedRunningForm } from "@/lib/running";
import { RunningEditForm } from "@/components/running/running-edit-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "신청 내용 수정 — Tri.be Running",
  robots: { index: false, follow: false },
};

export default async function RunningEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await getPublishedRunningForm(id);
  if (!form) notFound();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-5 py-8 sm:px-6">
      <div className="flex flex-col gap-1">
        <Link href={`/running/${form.id}`} className="w-fit text-xs text-ink-faint underline hover:text-ink">
          ← 신청 페이지로
        </Link>
        <h1 className="font-display text-2xl font-extrabold tracking-[0.02em]">신청 내용 수정</h1>
        <p className="text-sm text-ink-muted">{form.title}</p>
      </div>
      <RunningEditForm formId={form.id} fields={form.fields} />
    </div>
  );
}
