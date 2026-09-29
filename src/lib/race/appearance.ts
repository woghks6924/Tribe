import { prisma } from "@/lib/prisma";
import {
  DEFAULT_ATTACK_RATIO,
  DEFAULT_CHEER_RATIO,
  DEFAULT_LEVEL_BASE_KM,
  DEFAULT_LEVEL_EXPONENT,
  DEFAULT_MAX_LEVEL,
  DEFAULT_NEARBY_RANK_RANGE,
  DEFAULT_PICK_LEVELS,
  itemById,
  type RaceExpr,
} from "@/lib/race/constants";
import { computeExpression } from "@/lib/race/expression";
import { levelFromKm, type RaceLevelConfig } from "@/lib/race/level";
import { addDaysToDateStr, dayIndexOf, escapeHtml, type RaceFeedEvent } from "@/lib/race/stats";
import type { RaceEquipment } from "@/lib/race/sprite";

export type RaceMemberAppearance = {
  level: number;
  gold: boolean;
  expr: RaceExpr;
  eq: RaceEquipment;
};

export async function getRaceLevelConfig(): Promise<RaceLevelConfig> {
  const row = await prisma.raceConfig.findUnique({ where: { id: "singleton" } });
  if (!row) {
    return {
      levelBaseKm: DEFAULT_LEVEL_BASE_KM,
      levelExponent: DEFAULT_LEVEL_EXPONENT,
      maxLevel: DEFAULT_MAX_LEVEL,
      pickLevels: DEFAULT_PICK_LEVELS,
    };
  }
  const pickLevels = Array.isArray(row.pickLevels) ? (row.pickLevels as number[]) : DEFAULT_PICK_LEVELS;
  return { levelBaseKm: row.levelBaseKm, levelExponent: row.levelExponent, maxLevel: row.maxLevel, pickLevels };
}

export type RaceInfluenceConfig = {
  attackRatio: number;
  cheerRatio: number;
  nearbyRankRange: number;
};

export async function getRaceInfluenceConfig(): Promise<RaceInfluenceConfig> {
  const row = await prisma.raceConfig.findUnique({ where: { id: "singleton" } });
  if (!row) {
    return { attackRatio: DEFAULT_ATTACK_RATIO, cheerRatio: DEFAULT_CHEER_RATIO, nearbyRankRange: DEFAULT_NEARBY_RANK_RANGE };
  }
  return { attackRatio: row.attackRatio, cheerRatio: row.cheerRatio, nearbyRankRange: row.nearbyRankRange };
}

type MemberForAppearance = {
  id: string;
  eqHead: string | null;
  eqFace: string | null;
  eqNeck: string | null;
  eqBody: string | null;
  eqWrist: string | null;
  eqFeet: string | null;
};

// 여러 멤버의 "레벨/금테/표정/장비"를 한 번에 계산한다 — 페이지마다 개별 쿼리를 반복하지
// 않도록 배치로 묶었다. rankDroppedByMember는 호출부에 이미 있는(어제 대비 순위) 데이터를
// 그대로 재사용한다(다시 계산하지 않음).
export async function computeMemberAppearances(
  members: MemberForAppearance[],
  opts: {
    seasonId: string;
    idleDaysByMember: Map<string, number>;
    rankDroppedByMember?: Map<string, boolean>;
  },
): Promise<Map<string, RaceMemberAppearance>> {
  const ids = members.map((m) => m.id);
  if (ids.length === 0) return new Map();

  const config = await getRaceLevelConfig();
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [allTimeLogs, recentLogs, pendingPokes, recentReactions] = await Promise.all([
    // 레벨은 시즌 무관 전체 누적이라 seasonId 필터 없이 모두 합산한다.
    prisma.raceLog.groupBy({ by: ["memberId"], where: { memberId: { in: ids } }, _sum: { convertedKm: true } }),
    prisma.raceLog.findMany({
      where: { memberId: { in: ids }, createdAt: { gte: dayAgo } },
      select: { memberId: true, kind: true, value: true, createdAt: true },
    }),
    prisma.racePoke.groupBy({
      by: ["targetId"],
      where: { seasonId: opts.seasonId, targetId: { in: ids }, acknowledgedAt: null },
      _count: { _all: true },
    }),
    prisma.raceReaction.findMany({
      where: { targetMemberId: { in: ids }, createdAt: { gte: dayAgo } },
      select: { targetMemberId: true },
    }),
  ]);

  const totalKmByMember = new Map(allTimeLogs.map((r) => [r.memberId, r._sum.convertedKm ?? 0]));
  const pokeCountByMember = new Map(pendingPokes.map((r) => [r.targetId, r._count._all]));
  const hifiveMembers = new Set(recentReactions.map((r) => r.targetMemberId));

  const lastLogAtByMember = new Map<string, Date>();
  const bigEffortByMember = new Set<string>();
  for (const log of recentLogs) {
    const prev = lastLogAtByMember.get(log.memberId);
    if (!prev || log.createdAt > prev) lastLogAtByMember.set(log.memberId, log.createdAt);
    if ((log.kind === "RUN" && log.value >= 15) || (log.kind === "WOD" && log.value >= 90)) {
      bigEffortByMember.add(log.memberId);
    }
  }

  const result = new Map<string, RaceMemberAppearance>();
  for (const m of members) {
    const level = levelFromKm(totalKmByMember.get(m.id) ?? 0, config);
    const expr = computeExpression({
      idleDays: opts.idleDaysByMember.get(m.id) ?? 0,
      unacknowledgedPokes: pokeCountByMember.get(m.id) ?? 0,
      lastLogAt: lastLogAtByMember.get(m.id) ?? null,
      receivedHifiveWithin24h: hifiveMembers.has(m.id),
      bigEffortWithin24h: bigEffortByMember.has(m.id),
      rankDroppedFromYesterday: opts.rankDroppedByMember?.get(m.id) ?? false,
    });
    result.set(m.id, {
      level,
      gold: level >= config.maxLevel,
      expr,
      eq: { head: m.eqHead, face: m.eqFace, neck: m.eqNeck, body: m.eqBody, wrist: m.eqWrist, feet: m.eqFeet },
    });
  }
  return result;
}

// 크루 소식에 "OO Lv.N 달성! [아이템] 획득" 메시지를 넣기 위해 하루 단위로 레벨업을 재현한다.
// 레벨은 시즌 무관 전체 누적이라 allTimeLogs는 시즌 필터 없이 넘겨야 한다.
export function buildLevelUpFeed(
  members: { id: string; name: string }[],
  allTimeLogs: { memberId: string; date: string; convertedKm: number }[],
  itemsByMemberLevel: Map<string, string>,
  config: RaceLevelConfig,
  seasonStartDateStr: string,
  todayDateStr: string,
): RaceFeedEvent[] {
  const todayDay = dayIndexOf(todayDateStr, seasonStartDateStr);
  const logsByMember = new Map<string, { date: string; convertedKm: number }[]>();
  for (const log of allTimeLogs) {
    const arr = logsByMember.get(log.memberId);
    if (arr) arr.push(log);
    else logsByMember.set(log.memberId, [log]);
  }

  const events: RaceFeedEvent[] = [];
  for (const m of members) {
    const logs = logsByMember.get(m.id);
    if (!logs || logs.length === 0) continue;
    const totalAsOf = (dateStr: string) => logs.reduce((sum, l) => (l.date <= dateStr ? sum + l.convertedKm : sum), 0);

    for (let d = 2; d <= todayDay; d++) {
      const dateStr = addDaysToDateStr(seasonStartDateStr, d - 1);
      const prevDateStr = addDaysToDateStr(seasonStartDateStr, d - 2);
      const levelBefore = levelFromKm(totalAsOf(prevDateStr), config);
      const levelAfter = levelFromKm(totalAsOf(dateStr), config);
      for (let lvl = levelBefore + 1; lvl <= levelAfter; lvl++) {
        const itemId = itemsByMemberLevel.get(`${m.id}:${lvl}`);
        const item = itemId ? itemById(itemId) : undefined;
        events.push({
          date: dateStr,
          memberId: m.id,
          text: `<b>${escapeHtml(m.name)}</b> Lv.${lvl} 달성!${item ? ` · [${escapeHtml(item.name)}] 획득` : ""}`,
        });
      }
    }
  }
  return events;
}
