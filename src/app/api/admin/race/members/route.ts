import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const members = await prisma.raceMember.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { logs: true } } },
  });

  return NextResponse.json(
    members.map((m) => ({
      id: m.id,
      name: m.name,
      color: m.color,
      eye: m.eye,
      acc: m.acc,
      igHandle: m.igHandle,
      excluded: m.excluded,
      failedLoginCount: m.failedLoginCount,
      lockedUntil: m.lockedUntil ? m.lockedUntil.toISOString() : null,
      logCount: m._count.logs,
      createdAt: m.createdAt.toISOString(),
    })),
  );
}
