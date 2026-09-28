import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";
import { toConvertedKm } from "@/lib/race/convert";
import { computeMemberStats, todayKstDateStr } from "@/lib/race/stats";
import { KIND_CAP } from "@/lib/race/constants";
import { PROOF_RETENTION_HOURS } from "@/lib/race/storage";
import { getRaceInfluenceConfig } from "@/lib/race/appearance";

const KINDS = ["RUN", "WOD", "SWIM", "GYM"] as const;

export async function POST(request: Request) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const body = (await request.json()) as {
    kind?: (typeof KINDS)[number];
    value?: number;
    proofPath?: string;
    durationSec?: number;
    influence?: { targetId?: string; mode?: "ATTACK" | "CHEER" };
  };

  if (!body.kind || !KINDS.includes(body.kind) || !(Number(body.value) > 0)) {
    return NextResponse.json({ error: "기록을 입력해주세요." }, { status: 400 });
  }
  const value = Number(body.value);
  if (value > KIND_CAP[body.kind]) {
    return NextResponse.json(
      { error: `한 번에 ${KIND_CAP[body.kind]}${body.kind === "RUN" || body.kind === "SWIM" ? "km" : "분"}까지 올릴 수 있어요. 나눠서 올려주세요.` },
      { status: 400 },
    );
  }

  const season = await prisma.raceSeason.findFirst({ where: { active: true } });
  if (!season) {
    return NextResponse.json({ error: "진행 중인 시즌이 없어요." }, { status: 400 });
  }

  const [members, existingLogs, existingInfluences] = await Promise.all([
    prisma.raceMember.findMany({ where: { excluded: false } }),
    prisma.raceLog.findMany({ where: { seasonId: season.id } }),
    prisma.raceInfluence.findMany({ where: { seasonId: season.id } }),
  ]);
  const today = todayKstDateStr();
  const startDateStr = season.startAt.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const before = computeMemberStats(members, existingLogs, startDateStr, today, existingInfluences);
  const prevRank = before.find((s) => s.member.id === session.sub)?.rank ?? null;

  const convertedKm = toConvertedKm(body.kind, value, season);
  const proofPath = body.proofPath?.trim() || null;
  const durationSec =
    body.kind === "RUN" && body.durationSec != null && body.durationSec > 0 ? Math.round(body.durationSec) : null;

  // 공격/응원 대상 검증은 기록 생성 "전" 순위(before, 클라이언트가 고를 당시 보여준 순위와 동일 기준)로
  // 판단한다 — 방금 올린 기록 때문에 내 순위가 확 바뀌어서 방금 고른 대상이 갑자기 범위 밖으로
  // 밀려나는 걸 막기 위함. 검증에 실패하면 기록 자체를 만들지 않는다(로그만 남고 공격/응원은
  // 실패하는 상황을 방지 — 트랜잭션으로 묶는다).
  let influenceTarget: { id: string; name: string; mode: "ATTACK" | "CHEER" } | null = null;
  if (body.influence?.targetId && body.influence.mode) {
    const { targetId, mode } = body.influence;
    if (mode !== "ATTACK" && mode !== "CHEER") {
      return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
    }
    if (targetId === session.sub) {
      return NextResponse.json({ error: "본인은 대상으로 고를 수 없어요." }, { status: 400 });
    }
    const target = members.find((m) => m.id === targetId);
    if (!target) {
      return NextResponse.json({ error: "대상을 찾을 수 없어요." }, { status: 404 });
    }
    if (mode === "ATTACK") {
      const actorRank = before.find((s) => s.member.id === session.sub)?.rank ?? null;
      const targetRank = before.find((s) => s.member.id === targetId)?.rank ?? null;
      const influenceConfig = await getRaceInfluenceConfig();
      if (actorRank == null || targetRank == null || Math.abs(actorRank - targetRank) > influenceConfig.nearbyRankRange) {
        return NextResponse.json({ error: "순위가 가까운 크루원만 공격할 수 있어요." }, { status: 400 });
      }
    }
    influenceTarget = { id: target.id, name: target.name, mode };
  }

  const influenceConfig = influenceTarget ? await getRaceInfluenceConfig() : null;
  const influenceKm = influenceTarget
    ? convertedKm * (influenceTarget.mode === "ATTACK" ? influenceConfig!.attackRatio : influenceConfig!.cheerRatio)
    : null;

  const log = await prisma.$transaction(async (tx) => {
    const created = await tx.raceLog.create({
      data: {
        seasonId: season.id,
        memberId: session.sub,
        date: today,
        kind: body.kind!,
        value,
        convertedKm,
        proofPath,
        proofExpiresAt: proofPath ? new Date(Date.now() + PROOF_RETENTION_HOURS * 60 * 60 * 1000) : null,
        durationSec,
      },
    });
    if (influenceTarget && influenceKm != null) {
      await tx.raceInfluence.create({
        data: {
          seasonId: season.id,
          logId: created.id,
          actorId: session.sub,
          targetId: influenceTarget.id,
          mode: influenceTarget.mode,
          km: influenceKm,
          date: today,
        },
      });
    }
    return created;
  });

  const finalInfluences =
    influenceTarget && influenceKm != null
      ? [...existingInfluences, { actorId: session.sub, targetId: influenceTarget.id, mode: influenceTarget.mode, km: influenceKm, date: today }]
      : existingInfluences;
  const after = computeMemberStats(members, [...existingLogs, { ...log }], startDateStr, today, finalInfluences);
  const newRank = after.find((s) => s.member.id === session.sub)?.rank ?? null;

  const influenceResult =
    influenceTarget && influenceKm != null
      ? { mode: influenceTarget.mode, km: influenceKm, targetName: influenceTarget.name }
      : null;

  return NextResponse.json({ ok: true, convertedKm, prevRank, rank: newRank, influence: influenceResult });
}
