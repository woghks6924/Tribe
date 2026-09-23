import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";

const MAX_LEN = 140;

export async function POST(request: Request) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const body = (await request.json()) as { text?: string };
  const text = body.text?.trim() ?? "";
  if (!text) {
    return NextResponse.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }
  if (text.length > MAX_LEN) {
    return NextResponse.json({ error: `${MAX_LEN}자 이내로 적어주세요.` }, { status: 400 });
  }

  const season = await prisma.raceSeason.findFirst({ where: { active: true } });
  if (!season) {
    return NextResponse.json({ error: "진행 중인 시즌이 없어요." }, { status: 400 });
  }

  const entry = await prisma.raceGuestbookEntry.create({
    data: { seasonId: season.id, authorId: session.sub, body: text },
  });

  return NextResponse.json({ id: entry.id });
}
