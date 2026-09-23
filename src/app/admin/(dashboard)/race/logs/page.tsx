import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RaceLogManager } from "@/components/admin/race-log-manager";

export const dynamic = "force-dynamic";

export default async function AdminRaceLogsPage() {
  const [seasons, members, activeSeason] = await Promise.all([
    prisma.raceSeason.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true } }),
    prisma.raceMember.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.raceSeason.findFirst({ where: { active: true }, select: { id: true } }),
  ]);

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Race — Logs</h1>
        <Link href="/admin/race" className="text-sm text-ink-muted hover:text-ink">
          ← 시즌 관리
        </Link>
      </div>
      {seasons.length === 0 ? (
        <p className="border border-line px-4 py-6 text-sm text-ink-faint">아직 시즌이 없어요.</p>
      ) : (
        <RaceLogManager seasons={seasons} members={members} initialSeasonId={activeSeason?.id ?? null} />
      )}
    </div>
  );
}
