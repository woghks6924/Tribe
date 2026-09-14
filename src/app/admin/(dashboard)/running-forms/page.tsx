import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RunningFormList } from "@/components/admin/running-form-list";

export const dynamic = "force-dynamic";

export default async function AdminRunningFormsPage() {
  const forms = await prisma.runningForm.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { submissions: true } } },
  });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Running Forms</h1>
        <Link
          href="/admin/running-forms/new"
          className="cursor-pointer bg-ink px-4 py-2 text-xs font-semibold tracking-[0.08em] text-base uppercase hover:bg-ink/85"
        >
          + New Form
        </Link>
      </div>
      <RunningFormList
        forms={forms.map((f) => ({
          id: f.id,
          title: f.title,
          thumbnailUrl: f.thumbnailUrl,
          eventDate: f.eventDate.toISOString(),
          category: f.category,
          capacity: f.capacity,
          isClosed: f.isClosed,
          isPublished: f.isPublished,
          submissionCount: f._count.submissions,
          createdAt: f.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
