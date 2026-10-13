import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { computeMemberAppearances } from "@/lib/race/appearance";
import { computeMemberStats, todayKstDateStr } from "@/lib/race/stats";
import { defaultV4Look } from "@/lib/race/v4/map";
import { RaceLab } from "@/components/race/lab/race-lab";
import type { LabMember } from "@/components/race/lab/lab-shared";
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

  if (season) {
    const [dbMembers, logs, influences] = await Promise.all([
      prisma.raceMember.findMany({ where: { excluded: false } }),
      prisma.raceLog.findMany({ where: { seasonId: season.id } }),
      prisma.raceInfluence.findMany({ where: { seasonId: season.id } }),
    ]);

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
      return {
        id: s.member.id,
        name: s.member.name,
        km: s.pts,
        type: s.type,
        todayLogged: loggedToday.has(s.member.id),
        level: a.level,
        legacy: { color: s.member.color, eye: s.member.eye as RaceEye, type: s.type, expr: a.expr, eq: a.eq, gold: a.gold },
        defaultLook: defaultV4Look(s.member.color, a.eq),
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
      <RaceLab members={members} />
    </div>
  );
}
