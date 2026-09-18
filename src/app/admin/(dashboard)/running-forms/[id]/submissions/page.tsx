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
        <p className="text-xs text-ink-faint">
          행사일 {new Date(form.eventDate).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })} · 30일 후(
          {new Date(form.eventDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("ko-KR", {
            timeZone: "Asia/Seoul",
          })}) 이름/연락처/성별 자동 파기 예정
        </p>
      </div>
      <RunningSubmissionsManager
        formId={id}
        form={{
          title: form.title,
          eventDate: form.eventDate.toISOString(),
          entryFee: form.entryFee,
          bankName: form.bankName,
          bankAccountNumber: form.bankAccountNumber,
          bankAccountHolder: form.bankAccountHolder,
          capacity: form.capacity,
          providedItems: form.providedItems,
          noticeContent: form.noticeContent,
          collabBrands: Array.isArray(form.collabBrands)
            ? (form.collabBrands as { name: string; url: string }[])
            : [],
        }}
        fields={Array.isArray(form.fields) ? (form.fields as { id: string; label: string }[]) : []}
        submissions={submissions.map((s) => ({
          id: s.id,
          name: s.name,
          gender: s.gender,
          phone: s.phone,
          email: s.email,
          instagramId: s.instagramId,
          previousParticipant: s.previousParticipant,
          marketingConsent: s.marketingConsent,
          answers: (s.answers ?? {}) as Record<string, string | string[]>,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          personalDataPurgedAt: s.personalDataPurgedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
