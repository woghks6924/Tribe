import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";
import { itemById, type RaceItemSlot } from "@/lib/race/constants";

const SLOT_TO_COLUMN: Record<RaceItemSlot, "eqHead" | "eqFace" | "eqNeck" | "eqBody" | "eqWrist" | "eqFeet"> = {
  head: "eqHead",
  face: "eqFace",
  neck: "eqNeck",
  body: "eqBody",
  wrist: "eqWrist",
  feet: "eqFeet",
};

// 옷장에서 갈아입기 — itemId가 null이면 그 슬롯을 벗는다. 이미 가지고 있는 장비만 착용 가능.
export async function POST(request: Request) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const body = (await request.json()) as { slot?: RaceItemSlot; itemId?: string | null };
  const slot = body.slot;
  if (!slot || !(slot in SLOT_TO_COLUMN)) {
    return NextResponse.json({ error: "잘못된 부위예요." }, { status: 400 });
  }

  if (body.itemId) {
    const item = itemById(body.itemId);
    if (!item || item.slot !== slot) {
      return NextResponse.json({ error: "잘못된 장비예요." }, { status: 400 });
    }
    const owned = await prisma.raceMemberItem.findUnique({
      where: { memberId_itemId: { memberId: session.sub, itemId: body.itemId } },
    });
    if (!owned) {
      return NextResponse.json({ error: "가지고 있지 않은 장비예요." }, { status: 400 });
    }
  }

  const column = SLOT_TO_COLUMN[slot];
  await prisma.raceMember.update({ where: { id: session.sub }, data: { [column]: body.itemId ?? null } });

  return NextResponse.json({ ok: true });
}
