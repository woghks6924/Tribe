import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { computeMemberAppearances, getRaceLevelConfig } from "@/lib/race/appearance";
import { kmForLevel } from "@/lib/race/level";
import { computeMemberStats, todayKstDateStr } from "@/lib/race/stats";
import { V4_CLOSET_ITEMS, defaultV4Look } from "@/lib/race/v4/map";
import { RaceLab } from "@/components/race/lab/race-lab";
import type { LabMember, LevelRow } from "@/components/race/lab/lab-shared";
import type { RaceEye } from "@/lib/race/constants";

export const dynamic = "force-dynamic";

// 테스트 페이지 — 검색 노출·메뉴 링크 없음. 읽기 전용(DB 쓰기·마이그레이션 없음).
export const metadata: Metadata = {
  title: "Race Lab",
  robots: { index: false, follow: false },
};

function keyMatches(given: string | undefined, expected: string | undefined) {
  if (!given || !expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default async function RaceLabPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  // 관리자 로그인 상태이거나, ?key= 값이 환경변수 RACE_LAB_KEY와 같을 때만 열린다.
  const admin = await getCurrentAdmin();
  if (!admin && !keyMatches(key, process.env.RACE_LAB_KEY)) notFound();

  const season = await prisma.raceSeason.findFirst({ where: { active: true } });
  let members: LabMember[] = [];
  let levelRows: LevelRow[] = [];

  if (season) {
    const [dbMembers, logs, influences, allLogs, ownedItems, levelConfig] = await Promise.all([
      prisma.raceMember.findMany({ where: { excluded: false } }),
      prisma.raceLog.findMany({ where: { seasonId: season.id } }),
      prisma.raceInfluence.findMany({ where: { seasonId: season.id } }),
      // 해금 조건(수영 기록·3종 기록·수영 누적)은 전체 기간 기록으로 본다 — 읽기만.
      prisma.raceLog.findMany({ select: { memberId: true, kind: true, value: true, convertedKm: true } }),
      prisma.raceMemberItem.findMany({ select: { memberId: true, itemId: true } }),
      getRaceLevelConfig(),
    ]);
    levelRows = Array.from({ length: 11 }, (_, i) => ({ level: i + 2, km: kmForLevel(i + 2, levelConfig) }));
    const kindsBy = new Map<string, { run: boolean; wod: boolean; swim: boolean; swimCount: number; swimKm: number; totalKm: number }>();
    for (const l of allLogs) {
      const k = kindsBy.get(l.memberId) ?? { run: false, wod: false, swim: false, swimCount: 0, swimKm: 0, totalKm: 0 };
      k.totalKm += l.convertedKm;
      if (l.kind === "RUN") k.run = true;
      else if (l.kind === "WOD") k.wod = true;
      else if (l.kind === "SWIM") {
        k.swim = true;
        k.swimCount += 1;
        k.swimKm += l.value;
      }
      kindsBy.set(l.memberId, k);
    }
    const legacyKeyById = new Map(V4_CLOSET_ITEMS.map((it) => [it.legacyId, it.v4Key]));
    const ownedBy = new Map<string, string[]>();
    for (const it of ownedItems) {
      const key = legacyKeyById.get(it.itemId);
      if (key) ownedBy.set(it.memberId, [...(ownedBy.get(it.memberId) ?? []), key]);
    }
    const month = Number(todayKstDateStr().slice(5, 7));

    const startDateStr = season.startAt.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const today = todayKstDateStr();
    const stats = computeMemberStats(dbMembers, logs, startDateStr, today, influences);
    const appearances = await computeMemberAppearances(dbMembers, {
      seasonId: season.id,
      idleDaysByMember: new Map(stats.map((s) => [s.member.id, s.idleDays])),
    });
    const loggedToday = new Set(logs.filter((l) => l.date === today).map((l) => l.memberId));

    members = stats.map((s) => {
      const a = appearances.get(s.member.id) ?? { level: 0, gold: false, expr: "n" as const, eq: {} };
      const kinds = kindsBy.get(s.member.id) ?? { run: false, wod: false, swim: false, swimCount: 0, swimKm: 0, totalKm: 0 };
      const base = defaultV4Look(s.member.color, a.eq);
      return {
        id: s.member.id,
        name: s.member.name,
        km: s.pts,
        type: s.type,
        todayLogged: loggedToday.has(s.member.id),
        level: a.level,
        legacy: { color: s.member.color, eye: s.member.eye as RaceEye, type: s.type, expr: a.expr, eq: a.eq, gold: a.gold },
        // 새 형식: 부위별 items 배열(옛 단일 item은 여기로 옮긴다), 펫은 없음에서 시작.
        defaultLook: { ...base, item: null, items: base.item ? [base.item] : [], pet: null },
        facts: {
          level: a.level,
          totalKm: kinds.totalKm,
          seasonKm: s.pts,
          swimLogCount: kinds.swimCount,
          hasRun: kinds.run,
          hasWod: kinds.wod,
          hasSwim: kinds.swim,
          swimKm: kinds.swimKm,
          month,
          ownedLegacy: ownedBy.get(s.member.id) ?? [],
        },
      };
    });
  }

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-4 px-4 py-6 sm:px-6">
      <header className="flex flex-col gap-1">
        <span className="font-[family-name:var(--font-race-px)] text-[11px] text-[#f0b84a]">TRI.BE RACE · LAB</span>
        <h1 className="text-xl font-bold">새 캐릭터 테스트 페이지</h1>
        <p className="text-xs text-[#a3a29a]">
          실제 시즌 데이터는 읽기만 해요(DB 쓰기 없음). 꾸미기 값은 이 브라우저에만 저장돼요. /race의 기존 캐릭터는 그대로예요.
        </p>
      </header>
      <RaceLab members={members} levelRows={levelRows} />
    </div>
  );
}
