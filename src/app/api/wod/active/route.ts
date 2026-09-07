import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { WodSessionData } from "@/lib/wod";

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
    createdAt: session.createdAt.toISOString(),
    rounds: session.rounds.map((r) => ({
      id: r.id,
      roundNumber: r.roundNumber,
      roundName: r.roundName,
      runDistance: r.runDistance,
      exercises: Array.isArray(r.exercises) ? (r.exercises as { name: string; reps: string }[]) : [],
      timeCapSec: r.timeCapSec,
      restTimeSec: r.restTimeSec,
      bonusExercise: r.bonusExercise,
    })),
  };

  return NextResponse.json({ session: data });
}
