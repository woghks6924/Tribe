import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RunningSubmissionsManager } from "@/components/admin/running-submissions-manager";

export const dynamic = "force-dynamic";

export default async function RunningFormSubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const form = await prisma.runningForm.findUnique({ where: { id } });
  if (!form) notFound();

  const submissions = await prisma.runningSubmission.findMany({
    where: { formId: id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">{form.title}</h1>
        <p className="text-sm text-ink-muted">
          {submissions.length}
          {form.capacity != null ? `/${form.capacity}` : ""}명 신청
        </p>
      </div>
      <RunningSubmissionsManager
        formId={id}
        fields={Array.isArray(form.fields) ? (form.fields as { id: string; label: string }[]) : []}
        submissions={submissions.map((s) => ({
          id: s.id,
          name: s.name,
          gender: s.gender,
          phone: s.phone,
          email: s.email,
          instagramId: s.instagramId,
          marketingConsent: s.marketingConsent,
          answers: (s.answers ?? {}) as Record<string, string | string[]>,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
