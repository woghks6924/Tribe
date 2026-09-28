import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; submissionId: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { submissionId } = await params;
  const body = (await request.json()) as {
    status?: "PENDING" | "WINNER" | "NOT_WINNER" | "CONFIRMED" | "CANCELLED" | "DECLINED";
    notified?: boolean;
    memo?: string;
  };

  const submission = await prisma.runningSubmission.update({
    where: { id: submissionId },
    data: {
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.notified !== undefined ? { notified: body.notified } : {}),
      ...(body.memo !== undefined ? { memo: body.memo.trim() || null } : {}),
    },
  });

  return NextResponse.json({
    id: submission.id,
    status: submission.status,
    notified: submission.notified,
    memo: submission.memo,
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
