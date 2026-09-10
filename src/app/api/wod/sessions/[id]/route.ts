import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { WodRoundInput, WodSegment, WodSessionData } from "@/lib/wod";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await prisma.wodSession.findUnique({
    where: { id },
    include: { rounds: { orderBy: { roundNumber: "asc" } } },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
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
      segments: Array.isArray(r.segments) ? (r.segments as unknown as WodSegment[]) : [],
      timeCapSec: r.timeCapSec,
      restTimeSec: r.restTimeSec,
      bonusExercise: r.bonusExercise,
    })),
  };

  return NextResponse.json(data);
}

// 라운드 내용 전체 교체 — 세션은 유지한 채 기존 라운드를 지우고 새로 받은 라운드로 다시 만든다.
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { name: string; rounds: WodRoundInput[] };

  if (!body.name || !body.rounds || body.rounds.length === 0) {
    return NextResponse.json(
      { error: "Please provide a session name and at least one round." },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.wodRound.deleteMany({ where: { sessionId: id } }),
    prisma.wodSession.update({
      where: { id },
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
    }),
  ]);

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as { isActive?: boolean };

  if (body.isActive) {
    // 한 번에 하나의 세션만 활성화되도록, 활성화 전 다른 세션을 전부 끈다.
    await prisma.$transaction([
      prisma.wodSession.updateMany({ data: { isActive: false } }),
      prisma.wodSession.update({ where: { id }, data: { isActive: true } }),
    ]);
  } else {
    await prisma.wodSession.update({ where: { id }, data: { isActive: false } });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.wodSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
