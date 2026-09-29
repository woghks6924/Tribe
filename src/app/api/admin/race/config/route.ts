import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getRaceLevelConfig, getRaceInfluenceConfig } from "@/lib/race/appearance";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const [level, influence] = await Promise.all([getRaceLevelConfig(), getRaceInfluenceConfig()]);
  return NextResponse.json({ ...level, ...influence });
}

export type RaceConfigInput = {
  levelBaseKm?: number;
  levelExponent?: number;
  maxLevel?: number;
  pickLevels?: number[];
  attackRatio?: number;
  cheerRatio?: number;
  nearbyRankRange?: number;
};

export async function PUT(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as RaceConfigInput;
  if (
    !(body.levelBaseKm! > 0) ||
    !(body.levelExponent! > 0) ||
    !(Number.isInteger(body.maxLevel) && body.maxLevel! > 0) ||
    !Array.isArray(body.pickLevels) ||
    body.pickLevels.some((l) => !Number.isInteger(l) || l <= 0) ||
    !(body.attackRatio! >= 0 && body.attackRatio! <= 1) ||
    !(body.cheerRatio! >= 0 && body.cheerRatio! <= 1) ||
    !(Number.isInteger(body.nearbyRankRange) && body.nearbyRankRange! >= 0)
  ) {
    return NextResponse.json({ error: "값이 올바르지 않아요." }, { status: 400 });
  }

  const pickLevels = [...new Set(body.pickLevels)].sort((a, b) => a - b);

  await prisma.raceConfig.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      levelBaseKm: body.levelBaseKm!,
      levelExponent: body.levelExponent!,
      maxLevel: body.maxLevel!,
      pickLevels,
      attackRatio: body.attackRatio!,
      cheerRatio: body.cheerRatio!,
      nearbyRankRange: body.nearbyRankRange!,
    },
    update: {
      levelBaseKm: body.levelBaseKm!,
      levelExponent: body.levelExponent!,
      maxLevel: body.maxLevel!,
      pickLevels,
      attackRatio: body.attackRatio!,
      cheerRatio: body.cheerRatio!,
      nearbyRankRange: body.nearbyRankRange!,
    },
  });

  return NextResponse.json({ ok: true });
}
