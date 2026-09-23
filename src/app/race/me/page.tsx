import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentRaceMember } from "@/lib/auth/race-session";
import { CHECKPOINTS, TYPE_LABEL } from "@/lib/race/constants";
import { computeMemberStats, dayIndexOf, formatBreakdown, isSleeping, todayKstDateStr } from "@/lib/race/stats";
import { RaceLoginForm } from "@/components/race/race-login-form";
import { RaceLogoutButton } from "@/components/race/race-logout-button";
import { RaceAvatarImg } from "@/components/race/race-avatar";
import { RaceRecordForm } from "@/components/race/race-record-form";
import { RaceEditForm } from "@/components/race/race-edit-form";
import { RaceStoryCard, type RaceStoryInput } from "@/components/race/race-story-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "내 캐릭터 — Tri.be Race",
};

export default async function RaceMePage() {
  const session = await getCurrentRaceMember();

  if (!session) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-10">
        <div className="flex flex-col gap-1">
          <span className="font-[family-name:var(--font-race-px)] text-[11px] text-[#f0b84a]">TRI.BE RACE</span>
          <h1 className="text-2xl font-bold">캐릭터로 입장하기</h1>
        </div>
        <RaceLoginForm />
        <Link href="/race" className="text-sm text-[#6f6f6a] underline">
          ← 레이스 현황으로
        </Link>
      </div>
    );
  }

  const member = await prisma.raceMember.findUnique({ where: { id: session.sub } });
  const season = await prisma.raceSeason.findFirst({ where: { active: true } });

  if (!member) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-5 py-10 text-center">
        <p className="text-[#a3a29a]">캐릭터를 찾을 수 없어요. 다시 로그인해주세요.</p>
        <RaceLoginForm />
      </div>
    );
  }

  if (!season) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-5 py-10 text-center">
        <p className="text-[#a3a29a]">지금은 진행 중인 시즌이 없어요.</p>
      </div>
    );
  }

  const members = await prisma.raceMember.findMany({ where: { OR: [{ excluded: false }, { id: member.id }] } });
  const logs = await prisma.raceLog.findMany({ where: { seasonId: season.id } });

  const startDateStr = season.startAt.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const today = todayKstDateStr();
  const stats = computeMemberStats(members, logs, startDateStr, today);
  const my = stats.find((s) => s.member.id === member.id)!;
  const sleep = isSleeping(my.idleDays);
  const nextCp = CHECKPOINTS.find((cp) => cp.km > my.pts);
  const dayNum = Math.max(1, Math.min(season.durationDays, dayIndexOf(today, startDateStr)));

  const total = my.runPool + my.wodPool + my.swimPool || 1;
  const bars = [
    { label: "러닝", pct: Math.round((my.runPool / total) * 100), color: "#9cc7ff" },
    { label: "WOD·헬스", pct: Math.round((my.wodPool / total) * 100), color: "#9ee0aa" },
    { label: "수영", pct: Math.round((my.swimPool / total) * 100), color: "#86ddd5" },
  ];

  const todayLogs = logs.filter((l) => l.memberId === member.id && l.date === today);
  let todaySummary: string;
  if (todayLogs.length > 0) {
    const sums = new Map<string, number>();
    todayLogs.forEach((l) => sums.set(l.kind, (sums.get(l.kind) ?? 0) + l.value));
    const labelOf: Record<string, (v: number) => string> = {
      RUN: (v) => `러닝 ${v.toFixed(1)}km`,
      WOD: (v) => `WOD ${Math.round(v)}분`,
      SWIM: (v) => `수영 ${v.toFixed(1)}km`,
      GYM: (v) => `헬스 ${Math.round(v)}분`,
    };
    todaySummary = `오늘  ${[...sums.entries()].map(([k, v]) => labelOf[k](v)).join(" · ")}`;
  } else {
    todaySummary = `최근 7일  +${my.l7.toFixed(1)}km`;
  }

  const storyInput: RaceStoryInput = {
    memberId: member.id,
    name: member.name,
    color: member.color,
    eye: member.eye as RaceStoryInput["eye"],
    acc: member.acc as RaceStoryInput["acc"],
    igHandle: member.igHandle,
    type: my.type,
    rank: my.rank,
    totalCount: stats.length,
    pts: my.pts,
    goalKm: season.goalKm,
    todaySummary,
    dayLabel: `SEASON · DAY ${dayNum}/${season.durationDays}`,
  };

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-5 py-8 sm:px-8">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-[family-name:var(--font-race-px)] text-[11px] text-[#f0b84a]">TRI.BE RACE</span>
          <h1 className="text-xl font-bold">
            {member.name}(으)로 입장 중 · DAY {dayNum}
          </h1>
        </div>
        <RaceLogoutButton />
      </div>

      <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3.5 rounded bg-[#323338] p-3">
        <RaceAvatarImg
          color={member.color}
          eye={member.eye as RaceStoryInput["eye"]}
          acc={member.acc as RaceStoryInput["acc"]}
          type={my.type}
          sleep={sleep}
          scale={4}
          className="[image-rendering:pixelated]"
          alt={`${member.name} 캐릭터`}
        />
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[17px] font-bold">{member.name}</span>
            <span className="rounded bg-[#f0b84a] px-1.5 py-px text-[11px] font-bold text-[#2a1d05]">
              {TYPE_LABEL[my.type]}
            </span>
            {member.igHandle && <span className="text-xs text-[#a3a29a]">@{member.igHandle}</span>}
          </div>
          <p className="mt-1 text-sm text-[#a3a29a]">
            {my.rank}위 · {my.pts.toFixed(1)}km ·{" "}
            {nextCp ? `${nextCp.name}까지 ${(nextCp.km - my.pts).toFixed(1)}km` : "부산 완주!"}
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {bars.map((b) => (
              <div key={b.label} className="grid grid-cols-[36px_minmax(0,1fr)_34px] items-center gap-1.5 text-[11px] text-[#a3a29a]">
                <span>{b.label}</span>
                <div className="h-1.5 bg-[#17181b]">
                  <div className="h-1.5" style={{ width: `${b.pct}%`, background: b.color }} />
                </div>
                <span>{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <details className="rounded border border-[#3c3d43] p-3">
        <summary className="cursor-pointer text-[15px] font-bold">캐릭터 꾸미기</summary>
        <div className="mt-3">
          <RaceEditForm
            initial={{
              color: member.color,
              eye: member.eye as RaceStoryInput["eye"],
              acc: member.acc as RaceStoryInput["acc"],
              igHandle: member.igHandle ?? "",
            }}
            type={my.type}
          />
        </div>
      </details>

      <div className="rounded border border-[#3c3d43] bg-[#2a2b2e] p-4">
        <h2 className="text-base font-bold">기록 올리기</h2>
        <p className="mt-1 mb-3 text-xs text-[#6f6f6a]">{formatBreakdown(my)}</p>
        <RaceRecordForm />
      </div>

      <RaceStoryCard input={storyInput} />

      <Link href="/race" className="text-sm text-[#6f6f6a] underline">
        ← 레이스 현황으로
      </Link>
    </div>
  );
}
