import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { itemById, type RaceItemSlot } from "@/lib/race/constants";

const SLOT_TO_COLUMN: Record<RaceItemSlot, "eqHead" | "eqFace" | "eqNeck" | "eqBody" | "eqWrist" | "eqFeet"> = {
  head: "eqHead",
  face: "eqFace",
  neck: "eqNeck",
  body: "eqBody",
  wrist: "eqWrist",
  feet: "eqFeet",
};

// 관리자가 특정 멤버에게 아이템을 지급한다(시상/이벤트용). 지급과 동시에 바로 착용시킨다.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = (await request.json()) as { itemId?: string; source?: "award" | "event" };
  const item = body.itemId ? itemById(body.itemId) : undefined;
  if (!item) {
    return NextResponse.json({ error: "잘못된 아이템이에요." }, { status: 400 });
  }
  const source = body.source === "event" ? "event" : "award";

  const column = SLOT_TO_COLUMN[item.slot];
  await prisma.$transaction([
    prisma.raceMemberItem.upsert({
      where: { memberId_itemId: { memberId: id, itemId: item.id } },
      create: { memberId: id, itemId: item.id, source },
      update: { source },
    }),
    prisma.raceMember.update({ where: { id }, data: { [column]: item.id } }),
  ]);

  return NextResponse.json({ ok: true });
}

// 회수 — 보유 기록을 지우고, 착용 중이었다면 벗긴다.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const url = new URL(request.url);
  const itemId = url.searchParams.get("itemId") ?? "";
  const item = itemById(itemId);
  if (!item) {
    return NextResponse.json({ error: "잘못된 아이템이에요." }, { status: 400 });
  }

  const member = await prisma.raceMember.findUnique({ where: { id } });
  if (!member) return NextResponse.json({ error: "멤버를 찾을 수 없어요." }, { status: 404 });

  const column = SLOT_TO_COLUMN[item.slot];
  await prisma.raceMemberItem.deleteMany({ where: { memberId: id, itemId } });
  if (member[column] === itemId) {
    await prisma.raceMember.update({ where: { id }, data: { [column]: null } });
  }

  return NextResponse.json({ ok: true });
}
