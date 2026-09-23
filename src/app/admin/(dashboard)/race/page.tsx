import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RaceSeasonManager } from "@/components/admin/race-season-manager";

export const dynamic = "force-dynamic";

export default async function AdminRacePage() {
  const seasons = await prisma.raceSeason.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { logs: true } } },
  });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Race</h1>
        <div className="flex gap-4">
          <Link href="/admin/race/members" className="text-sm text-ink-muted hover:text-ink">
            멤버 관리 →
          </Link>
          <Link href="/admin/race/logs" className="text-sm text-ink-muted hover:text-ink">
            기록 관리 →
          </Link>
        </div>
      </div>
      <RaceSeasonManager
        seasons={seasons.map((s) => ({
          id: s.id,
          name: s.name,
          startAt: s.startAt.toISOString(),
          durationDays: s.durationDays,
          goalKm: s.goalKm,
          inviteCode: s.inviteCode,
          active: s.active,
          runFactor: s.runFactor,
          wodMinutesPerKm: s.wodMinutesPerKm,
          swimMetersPerKm: s.swimMetersPerKm,
          logCount: s._count.logs,
        }))}
      />
    </div>
  );
}
