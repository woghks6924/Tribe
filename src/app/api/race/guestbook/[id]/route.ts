import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.raceGuestbookEntry.findUnique({ where: { id }, select: { authorId: true } });
  if (!existing || existing.authorId !== session.sub) {
    return NextResponse.json({ error: "글을 찾을 수 없어요." }, { status: 404 });
  }

  await prisma.raceGuestbookEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
