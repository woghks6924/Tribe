import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { WodSegment, WodSessionData } from "@/lib/wod";

export async function GET() {
  const session = await prisma.wodSession.findFirst({
    where: { isActive: true },
    include: { rounds: { orderBy: { roundNumber: "asc" } } },
  });

  if (!session) {
    return NextResponse.json({ session: null });
  }

  const data: WodSessionData = {
    id: session.id,
    name: session.name,
    isActive: session.isActive,
    teamSize: session.teamSize,
    createdAt: session.createdAt.toISOString(),
    rounds: session.rounds.map((r) => ({
      id: r.id,
      roundNumber: r.roundNumber,
      roundName: r.roundName,
      segments: Array.isArray(r.segments) ? (r.segments as unknown as WodSegment[]) : [],
      timeCapSec: r.timeCapSec,
      restTimeSec: r.restTimeSec,
      bonusExercise: r.bonusExercise,
    })),
  };

  return NextResponse.json({ session: data });
}
