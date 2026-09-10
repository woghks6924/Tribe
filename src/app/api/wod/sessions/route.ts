import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { WodRoundInput } from "@/lib/wod";

// /wod-admin, /wod-display 모두 별도 로그인 없이 URL 비공개로만 보호되는 독립 도구라
// 이 라우트들도 쇼핑몰 admin 인증(requireAdmin)을 쓰지 않는다.

export async function GET() {
  const sessions = await prisma.wodSession.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { rounds: true } } },
  });

  return NextResponse.json(
    sessions.map((s) => ({
      id: s.id,
      name: s.name,
      isActive: s.isActive,
      createdAt: s.createdAt.toISOString(),
      roundCount: s._count.rounds,
    })),
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as { name: string; rounds: WodRoundInput[] };

  if (!body.name || !body.rounds || body.rounds.length === 0) {
    return NextResponse.json(
      { error: "Please provide a session name and at least one round." },
      { status: 400 },
    );
  }

  const session = await prisma.wodSession.create({
    data: {
      name: body.name,
      rounds: {
        create: body.rounds.map((r) => ({
          roundNumber: r.roundNumber,
          roundName: r.roundName || null,
          segments: r.segments ?? [],
          timeCapSec: r.timeCapSec ?? null,
          restTimeSec: r.restTimeSec ?? null,
          bonusExercise: r.bonusExercise || null,
        })),
      },
    },
  });

  return NextResponse.json({ id: session.id });
}
