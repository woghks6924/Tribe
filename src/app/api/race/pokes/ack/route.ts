import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";

// 로그인 후 "OO님이 깨웠어요" 팝업을 확인했을 때 호출 — 현재 시즌에서 나에게 온 미확인 콕을
// 전부 확인 처리한다.
export async function POST() {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const season = await prisma.raceSeason.findFirst({ where: { active: true } });
  if (!season) return NextResponse.json({ ok: true });

  await prisma.racePoke.updateMany({
    where: { seasonId: season.id, targetId: session.sub, acknowledgedAt: null },
    data: { acknowledgedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
