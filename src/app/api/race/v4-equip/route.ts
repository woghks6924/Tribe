import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";
import { effectiveEquip, type V4Equip } from "@/lib/race/v4/equip";
import { loadV4Facts } from "@/lib/race/v4/facts";
import { V4_ITEM_SLOT, V4_SLOTS } from "@/lib/race/v4/manifest-server";
import { itemUnlock } from "@/lib/race/v4/unlock";

// 새 캐릭터 장비 착용 — 부위(head/face/neck/back/waist)마다 1개. 같은 부위에 새로 끼면 기존 것은 해제된다.
// 열려 있는 장비(보유·조건 달성·레벨 자유)만 착용할 수 있고, 서버가 다시 판정한다.
export async function POST(request: Request) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const body = (await request.json()) as { slot?: string; itemKey?: string | null };
  const slot = body.slot;
  if (!slot || !(V4_SLOTS as readonly string[]).includes(slot)) {
    return NextResponse.json({ error: "잘못된 부위예요." }, { status: 400 });
  }
  const itemKey = body.itemKey ?? null;
  if (itemKey !== null && V4_ITEM_SLOT[itemKey] !== slot) {
    return NextResponse.json({ error: "그 부위에 낄 수 없는 장비예요." }, { status: 400 });
  }

  const member = await prisma.raceMember.findUnique({ where: { id: session.sub } });
  if (!member) return NextResponse.json({ error: "캐릭터를 찾을 수 없어요." }, { status: 404 });

  if (itemKey !== null) {
    const { facts } = await loadV4Facts(member.id);
    if (itemUnlock(itemKey, facts).status !== "open") {
      return NextResponse.json({ error: "아직 열리지 않은 장비예요." }, { status: 403 });
    }
  }

  const current: V4Equip = effectiveEquip(member.equipV4, {
    head: member.eqHead,
    face: member.eqFace,
    neck: member.eqNeck,
  });
  const next: V4Equip = { ...current };
  if (itemKey === null) delete next[slot];
  else next[slot] = itemKey;

  await prisma.raceMember.update({ where: { id: member.id }, data: { equipV4: next } });
  return NextResponse.json({ ok: true, equip: next });
}
