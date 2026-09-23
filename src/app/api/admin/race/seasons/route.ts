import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const seasons = await prisma.raceSeason.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { logs: true } } },
  });

  return NextResponse.json(
    seasons.map((s) => ({
      id: s.id,
      name: s.name,
      startAt: s.startAt.toISOString(),
      durationDays: s.durationDays,
      goalKm: s.goalKm,
      inviteCode: s.inviteCode,
      active: s.active,
      runFactor: s.runFactor,
      wodMinutesPerKm: s.wodMinutesPerKm,
      swimMetersPerKm: s.swimMetersPerKm,
      logCount: s._count.logs,
      createdAt: s.createdAt.toISOString(),
    })),
  );
}

export type RaceSeasonInput = {
  name: string;
  startAt: string;
  durationDays?: number;
  goalKm?: number;
  inviteCode: string;
  active?: boolean;
  runFactor?: number;
  wodMinutesPerKm?: number;
  swimMetersPerKm?: number;
};

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as RaceSeasonInput;
  if (!body.name?.trim() || !body.startAt || !body.inviteCode?.trim()) {
    return NextResponse.json({ error: "이름, 시작일, 초대코드를 입력해주세요." }, { status: 400 });
  }

  if (body.active) {
    await prisma.raceSeason.updateMany({ where: { active: true }, data: { active: false } });
  }

  const season = await prisma.raceSeason.create({
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

  return NextResponse.json({ id: season.id });
}
