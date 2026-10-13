import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";
import { loadV4Facts } from "@/lib/race/v4/facts";
import { V4_PET_KEYS } from "@/lib/race/v4/manifest-server";
import { petUnlock } from "@/lib/race/v4/unlock";

// 펫 고르기/교체 — 1마리만 데리고 다닌다. 열려 있는 펫(Lv.6+ 자유, 돌고래는 수영 누적 조건)만 고를 수 있다.
export async function POST(request: Request) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const body = (await request.json()) as { petKey?: string | null };
  const petKey = body.petKey ?? null;
  if (petKey !== null && !V4_PET_KEYS.includes(petKey)) {
    return NextResponse.json({ error: "잘못된 펫이에요." }, { status: 400 });
  }
  if (petKey !== null) {
    const { facts } = await loadV4Facts(session.sub);
    if (petUnlock(petKey, facts).status !== "open") {
      return NextResponse.json({ error: "아직 고를 수 없는 펫이에요." }, { status: 403 });
    }
  }
  await prisma.raceMember.update({ where: { id: session.sub }, data: { petKey } });
  return NextResponse.json({ ok: true, petKey });
}
