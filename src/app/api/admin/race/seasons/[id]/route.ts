import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { RaceSeasonInput } from "../route";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = (await request.json()) as RaceSeasonInput;
  if (!body.name?.trim() || !body.startAt || !body.inviteCode?.trim()) {
    return NextResponse.json({ error: "이름, 시작일, 초대코드를 입력해주세요." }, { status: 400 });
  }

  const existing = await prisma.raceSeason.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Season not found." }, { status: 404 });
  }

  if (body.active && !existing.active) {
    await prisma.raceSeason.updateMany({ where: { active: true }, data: { active: false } });
  }

  await prisma.raceSeason.update({
    where: { id },
    data: {
      name: body.name.trim(),
      startAt: new Date(body.startAt),
      durationDays: body.durationDays ?? 50,
      goalKm: body.goalKm ?? 425,
      inviteCode: body.inviteCode.trim().toUpperCase(),
      active: body.active ?? false,
      runFactor: body.runFactor ?? 1,
      wodMinutesPerKm: body.wodMinutesPerKm ?? 6,
      swimMetersPerKm: body.swimMetersPerKm ?? 250,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  await prisma.raceSeason.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
