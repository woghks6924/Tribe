import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RaceDailySummaryCard } from "@/components/admin/race-daily-summary-card";
import {
  addDaysToDateStr,
  buildSeasonFeed,
  checkpointOf,
  computeMemberStats,
  dayIndexOf,
  todayKstDateStr,
} from "@/lib/race/stats";

export const dynamic = "force-dynamic";

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "");
}

function dateLabel(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}월 ${d}일`;
}

export default async function AdminRaceSummaryPage() {
  const season = await prisma.raceSeason.findFirst({ where: { active: true } });

  if (!season) {
    return (
      <div className="flex flex-col gap-8 px-8 py-10">
        <div className="flex items-center justify-between">
          <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Race — 오늘의 요약</h1>
          <Link href="/admin/race" className="text-sm text-ink-muted hover:text-ink">
            ← 시즌 관리
          </Link>
        </div>
        <p className="text-sm text-ink-faint">진행 중인 시즌이 없어요.</p>
      </div>
    );
  }

  const [members, logs, influences] = await Promise.all([
    prisma.raceMember.findMany({ where: { excluded: false } }),
    prisma.raceLog.findMany({ where: { seasonId: season.id } }),
    prisma.raceInfluence.findMany({ where: { seasonId: season.id } }),
  ]);

  const startDateStr = season.startAt.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const today = todayKstDateStr();
  const todayDay = Math.min(dayIndexOf(today, startDateStr), season.durationDays);
  const uptoDateStr = todayDay <= 0 ? startDateStr : addDaysToDateStr(startDateStr, todayDay - 1);

  const cur = computeMemberStats(members, logs, startDateStr, uptoDateStr, influences);
  const todaysFeed = buildSeasonFeed(members, logs, startDateStr, uptoDateStr, season.goalKm, influences).filter(
    (f) => f.date === uptoDateStr,
  );
  const todaysLogs = logs.filter((l) => l.date === uptoDateStr);
  const participated = new Set(todaysLogs.map((l) => l.memberId)).size;
  const todaysKm = todaysLogs.reduce((sum, l) => sum + l.convertedKm, 0);
  const leader = cur[0];

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Race — 오늘의 요약</h1>
        <Link href="/admin/race" className="text-sm text-ink-muted hover:text-ink">
          ← 시즌 관리
        </Link>
      </div>
      <RaceDailySummaryCard
        input={{
          dayLabel: `DAY ${Math.max(1, todayDay)}/${season.durationDays}`,
          dateLabel: dateLabel(uptoDateStr),
          goalKm: season.goalKm,
          leader: leader ? { name: leader.member.name, color: leader.member.color, pts: leader.pts, checkpoint: checkpointOf(leader.pts) } : null,
          top5: cur.slice(0, 5).map((s) => ({ name: s.member.name, color: s.member.color, pts: s.pts })),
          participated,
          totalMembers: members.length,
          todaysKm,
          todaysEvents: todaysFeed.map((f) => stripHtml(f.text)),
        }}
      />
    </div>
  );
}
