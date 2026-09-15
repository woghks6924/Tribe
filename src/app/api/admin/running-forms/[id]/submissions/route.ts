import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "대기",
  WINNER: "당첨",
  NOT_WINNER: "미당첨",
  CONFIRMED: "참여확정",
  CANCELLED: "취소",
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const form = await prisma.runningForm.findUnique({ where: { id } });
  if (!form) {
    return NextResponse.json({ error: "Form not found." }, { status: 404 });
  }

  const submissions = await prisma.runningSubmission.findMany({
    where: { formId: id },
    orderBy: { createdAt: "desc" },
  });

  const url = new URL(request.url);
  if (url.searchParams.get("export") === "csv") {
    const fields = Array.isArray(form.fields) ? (form.fields as { id: string; label: string }[]) : [];
    const header = [
      "이름",
      "성별",
      "연락처",
      "이메일",
      "인스타",
      "마케팅동의",
      "상태",
      "신청일시",
      ...fields.map((f) => f.label),
    ];
    const rows = submissions.map((s) => {
      const answers = (s.answers ?? {}) as Record<string, string | string[]>;
      return [
        s.name,
        s.gender ?? "",
        s.phone,
        s.email ?? "",
        s.instagramId ?? "",
        s.marketingConsent ? "Y" : "N",
        STATUS_LABEL[s.status] ?? s.status,
        s.createdAt.toISOString(),
        ...fields.map((f) => {
          const v = answers[f.id];
          return Array.isArray(v) ? v.join(", ") : (v ?? "");
        }),
      ];
    });
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    // Content-Disposition 헤더는 ASCII만 허용되므로, 한글 파일명은 filename*(RFC 5987)로 넘기고
    // filename= 자리에는 ASCII로만 이뤄진 폴백 이름을 둔다.
    const asciiFallback = form.title.replace(/[^\w-]/g, "_") || "form";
    const encodedTitle = encodeURIComponent(`${form.title}_submissions.csv`);
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${asciiFallback}_submissions.csv"; filename*=UTF-8''${encodedTitle}`,
      },
    });
  }

  return NextResponse.json(
    submissions.map((s) => ({
      id: s.id,
      name: s.name,
      gender: s.gender,
      phone: s.phone,
      email: s.email,
      instagramId: s.instagramId,
      marketingConsent: s.marketingConsent,
      privacyConsent: s.privacyConsent,
      answers: s.answers ?? {},
      status: s.status,
      createdAt: s.createdAt.toISOString(),
      personalDataPurgedAt: s.personalDataPurgedAt?.toISOString() ?? null,
    })),
  );
}
