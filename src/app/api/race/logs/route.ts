import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";
import { toConvertedKm } from "@/lib/race/convert";
import { computeMemberStats, todayKstDateStr } from "@/lib/race/stats";
import { KIND_CAP } from "@/lib/race/constants";
import { PROOF_RETENTION_HOURS } from "@/lib/race/storage";

const KINDS = ["RUN", "WOD", "SWIM", "GYM"] as const;

export async function POST(request: Request) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const body = (await request.json()) as {
    kind?: (typeof KINDS)[number];
    value?: number;
    proofPath?: string;
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

  const [members, existingLogs] = await Promise.all([
    prisma.raceMember.findMany({ where: { excluded: false } }),
    prisma.raceLog.findMany({ where: { seasonId: season.id } }),
  ]);
  const today = todayKstDateStr();
  const startDateStr = season.startAt.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const before = computeMemberStats(members, existingLogs, startDateStr, today);
  const prevRank = before.find((s) => s.member.id === session.sub)?.rank ?? null;

  const convertedKm = toConvertedKm(body.kind, value, season);
  const proofPath = body.proofPath?.trim() || null;

  const log = await prisma.raceLog.create({
    data: {
      seasonId: season.id,
      memberId: session.sub,
      date: today,
      kind: body.kind,
      value,
      convertedKm,
      proofPath,
      proofExpiresAt: proofPath ? new Date(Date.now() + PROOF_RETENTION_HOURS * 60 * 60 * 1000) : null,
    },
  });

  const after = computeMemberStats(members, [...existingLogs, { ...log }], startDateStr, today);
  const newRank = after.find((s) => s.member.id === session.sub)?.rank ?? null;

  return NextResponse.json({ ok: true, convertedKm, prevRank, rank: newRank });
}
