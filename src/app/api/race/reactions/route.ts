import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";

const TARGET_TYPES = ["PROOF", "FEED"] as const;

// 하이파이브 토글 — 같은 대상에 같은 사람이 다시 누르면 취소된다.
export async function POST(request: Request) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const body = (await request.json()) as {
    targetType?: (typeof TARGET_TYPES)[number];
    targetId?: string;
    targetMemberId?: string;
  };
  if (!body.targetType || !TARGET_TYPES.includes(body.targetType) || !body.targetId) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  let targetMemberId = body.targetMemberId ?? "";
  if (body.targetType === "PROOF") {
    // 인증샷은 실제 기록이 있으니 클라이언트 값을 믿지 않고 서버에서 다시 확인한다.
    const log = await prisma.raceLog.findUnique({ where: { id: body.targetId }, select: { memberId: true } });
    if (!log) return NextResponse.json({ error: "기록을 찾을 수 없어요." }, { status: 404 });
    targetMemberId = log.memberId;
  }
  if (!targetMemberId) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  const existing = await prisma.raceReaction.findUnique({
    where: { targetType_targetId_memberId: { targetType: body.targetType, targetId: body.targetId, memberId: session.sub } },
  });

  if (existing) {
    await prisma.raceReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ ok: true, active: false });
  }

  await prisma.raceReaction.create({
    data: { targetType: body.targetType, targetId: body.targetId, targetMemberId, memberId: session.sub },
  });
  return NextResponse.json({ ok: true, active: true });
}
