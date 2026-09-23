import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { RaceMemberManager } from "@/components/admin/race-member-manager";

export const dynamic = "force-dynamic";

export default async function AdminRaceMembersPage() {
  const members = await prisma.raceMember.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { logs: true } } },
  });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Race — Members</h1>
        <Link href="/admin/race" className="text-sm text-ink-muted hover:text-ink">
          ← 시즌 관리
        </Link>
      </div>
      <RaceMemberManager
        members={members.map((m) => ({
          id: m.id,
          name: m.name,
          igHandle: m.igHandle,
          excluded: m.excluded,
          failedLoginCount: m.failedLoginCount,
          lockedUntil: m.lockedUntil ? m.lockedUntil.toISOString() : null,
          logCount: m._count.logs,
        }))}
      />
    </div>
  );
}
