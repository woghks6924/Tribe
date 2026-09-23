import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { hashPassword } from "@/lib/auth/password";

const DEFAULT_RESET_PIN = "0000";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = (await request.json()) as { excluded?: boolean; resetPin?: boolean };

  const existing = await prisma.raceMember.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }

  const data: { excluded?: boolean; pinHash?: string; failedLoginCount?: number; lockedUntil?: null } = {};
  if (body.excluded !== undefined) data.excluded = body.excluded;
  if (body.resetPin) {
    data.pinHash = await hashPassword(DEFAULT_RESET_PIN);
    data.failedLoginCount = 0;
    data.lockedUntil = null;
  }

  await prisma.raceMember.update({ where: { id }, data });

  return NextResponse.json({ ok: true, resetPinTo: body.resetPin ? DEFAULT_RESET_PIN : undefined });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  await prisma.raceMember.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
