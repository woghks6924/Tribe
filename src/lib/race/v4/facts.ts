// 한 멤버의 해금 판정에 필요한 사실들을 DB에서 읽는다(읽기 전용, 서버 전용).
import { prisma } from "@/lib/prisma";
import { getRaceLevelConfig } from "@/lib/race/appearance";
import { levelFromKm, type RaceLevelConfig } from "@/lib/race/level";
import { computeMemberStats, todayKstDateStr } from "@/lib/race/stats";
import { V4_CLOSET_ITEMS } from "@/lib/race/v4/map";
import { V4_ITEM_SLOT } from "@/lib/race/v4/manifest-server";
import type { UnlockFacts } from "@/lib/race/v4/unlock";

const LEGACY_TO_V4 = new Map(V4_CLOSET_ITEMS.map((it) => [it.legacyId, it.v4Key]));

// RaceMemberItem.itemId → v4 키. 옛 아이템은 매핑해서, 새 장비는 키 그대로. 알 수 없으면 null.
export function v4KeyOfOwnedId(itemId: string): string | null {
  const mapped = LEGACY_TO_V4.get(itemId);
  if (mapped) return mapped;
  return V4_ITEM_SLOT[itemId] ? itemId : null;
}

export async function loadV4Facts(memberId: string): Promise<{ facts: UnlockFacts; config: RaceLevelConfig }> {
  const [config, logs, ownedRows, season] = await Promise.all([
    getRaceLevelConfig(),
    prisma.raceLog.findMany({ where: { memberId }, select: { kind: true, value: true, convertedKm: true } }),
    prisma.raceMemberItem.findMany({ where: { memberId }, select: { itemId: true, source: true, acquiredLevel: true } }),
    prisma.raceSeason.findFirst({ where: { active: true } }),
  ]);

  let totalKm = 0;
  let swimLogCount = 0;
  let swimKm = 0;
  let hasRun = false;
  let hasWod = false;
  for (const l of logs) {
    totalKm += l.convertedKm;
    if (l.kind === "RUN") hasRun = true;
    else if (l.kind === "WOD") hasWod = true;
    else if (l.kind === "SWIM") {
      swimLogCount += 1;
      swimKm += l.value;
    }
  }

  // 완주 메달은 이번 시즌 순위 기준 km(응원·공격 반영)로 판정한다.
  let seasonKm = 0;
  if (season) {
    const [members, seasonLogs, influences] = await Promise.all([
      prisma.raceMember.findMany({ where: { OR: [{ excluded: false }, { id: memberId }] } }),
      prisma.raceLog.findMany({ where: { seasonId: season.id } }),
      prisma.raceInfluence.findMany({ where: { seasonId: season.id } }),
    ]);
    const startDateStr = season.startAt.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const stats = computeMemberStats(members, seasonLogs, startDateStr, todayKstDateStr(), influences);
    seasonKm = stats.find((s) => s.member.id === memberId)?.pts ?? 0;
  }

  const owned = [...new Set(ownedRows.map((r) => v4KeyOfOwnedId(r.itemId)).filter((k): k is string => !!k))];
  const acquiredLevels = ownedRows
    .filter((r) => r.source === "levelup" && r.acquiredLevel != null)
    .map((r) => r.acquiredLevel as number);

  return {
    config,
    facts: {
      level: levelFromKm(totalKm, config),
      totalKm,
      seasonKm,
      swimLogCount,
      hasRun,
      hasWod,
      hasSwim: swimLogCount > 0,
      swimKm,
      month: Number(todayKstDateStr().slice(5, 7)),
      acquiredLevels,
      owned,
    },
  };
}
