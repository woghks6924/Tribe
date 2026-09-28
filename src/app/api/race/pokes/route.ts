import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";
import { computeMemberStats, isSleeping, todayKstDateStr } from "@/lib/race/stats";

export async function POST(request: Request) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const body = (await request.json()) as { targetId?: string };
  const targetId = body.targetId ?? "";
  if (!targetId) {
    return NextResponse.json({ error: "대상을 찾을 수 없어요." }, { status: 400 });
  }
  if (targetId === session.sub) {
    return NextResponse.json({ error: "본인은 찌를 수 없어요." }, { status: 400 });
  }

  const season = await prisma.raceSeason.findFirst({ where: { active: true } });
  if (!season) {
    return NextResponse.json({ error: "진행 중인 시즌이 없어요." }, { status: 400 });
  }

  const target = await prisma.raceMember.findUnique({ where: { id: targetId } });
  if (!target) {
    return NextResponse.json({ error: "대상을 찾을 수 없어요." }, { status: 404 });
  }

  const [members, logs] = await Promise.all([
    prisma.raceMember.findMany({ where: { excluded: false } }),
    prisma.raceLog.findMany({ where: { seasonId: season.id } }),
  ]);
  const startDateStr = season.startAt.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const today = todayKstDateStr();
  const stats = computeMemberStats(members, logs, startDateStr, today);
  const targetStats = stats.find((s) => s.member.id === targetId);
  const eligible = targetStats && (isSleeping(targetStats.idleDays) || targetStats.pts === 0);
  if (!eligible) {
    return NextResponse.json({ error: "잠수 중이거나 아직 기록이 없는 사람만 찌를 수 있어요." }, { status: 400 });
  }

  const todayStart = new Date(`${today}T00:00:00+09:00`);
  const alreadyPokedToday = await prisma.racePoke.findFirst({
    where: { seasonId: season.id, pokerId: session.sub, targetId, createdAt: { gte: todayStart } },
  });
  if (alreadyPokedToday) {
    return NextResponse.json({ error: "오늘은 이미 이 사람을 찔렀어요." }, { status: 400 });
  }

  await prisma.racePoke.create({ data: { seasonId: season.id, pokerId: session.sub, targetId } });

  return NextResponse.json({ ok: true });
}
