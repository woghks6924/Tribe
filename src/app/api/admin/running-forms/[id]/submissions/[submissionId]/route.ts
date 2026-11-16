import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { RunningFormField } from "@/lib/running";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; submissionId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id, submissionId } = await params;
  const body = (await request.json()) as {
    status?: "PENDING" | "WINNER" | "NOT_WINNER" | "CONFIRMED" | "CANCELLED" | "DECLINED";
    notified?: boolean;
    attended?: boolean;
    memo?: string;
    answers?: Record<string, unknown>;
  };

  // 설문 답변 수정(관리자). 이 폼의 질문 id만 받고, 값은 문자열 또는 문자열 목록으로 제한한다.
  let answers: Record<string, string | string[]> | undefined;
  if (body.answers !== undefined) {
    const form = await prisma.runningForm.findUnique({ where: { id }, select: { fields: true } });
    const fieldIds = new Set((Array.isArray(form?.fields) ? (form.fields as RunningFormField[]) : []).map((f) => f.id));
    answers = {};
    for (const [key, value] of Object.entries(body.answers ?? {})) {
      if (!fieldIds.has(key)) continue;
      if (typeof value === "string") {
        if (value.length > 2000) return NextResponse.json({ error: "답변이 너무 길어요." }, { status: 400 });
        if (value.trim()) answers[key] = value.trim();
      } else if (Array.isArray(value) && value.every((v) => typeof v === "string" && v.length <= 200) && value.length <= 50) {
        if (value.length) answers[key] = value as string[];
      } else {
        return NextResponse.json({ error: "잘못된 답변 형식이에요." }, { status: 400 });
      }
    }
  }

  const submission = await prisma.runningSubmission.update({
    where: { id: submissionId },
    data: {
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.notified !== undefined ? { notified: body.notified } : {}),
      ...(body.attended !== undefined ? { attended: body.attended } : {}),
      ...(body.memo !== undefined ? { memo: body.memo.trim() || null } : {}),
      ...(answers !== undefined ? { answers } : {}),
    },
  });

  return NextResponse.json({
    id: submission.id,
    status: submission.status,
    notified: submission.notified,
    attended: submission.attended,
    memo: submission.memo,
    answers: submission.answers,
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; submissionId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { submissionId } = await params;
  await prisma.runningSubmission.delete({ where: { id: submissionId } });
  return NextResponse.json({ ok: true });
}
