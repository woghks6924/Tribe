import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";
import { normalizeAndValidateIgHandle, validateAppearance } from "@/lib/race/validate";
import type { RaceAppearanceInput } from "@/lib/race/validate";

export async function PUT(request: Request) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const body = (await request.json()) as RaceAppearanceInput & { igHandle?: string };

  const appearance = validateAppearance(body);
  if (!appearance.ok) {
    return NextResponse.json({ error: appearance.error }, { status: 400 });
  }

  const ig = normalizeAndValidateIgHandle(body.igHandle ?? "");
  if (!ig.ok) {
    return NextResponse.json({ error: "인스타그램 아이디는 영문, 숫자, 마침표, 밑줄만 쓸 수 있어요." }, { status: 400 });
  }

  await prisma.raceMember.update({
    where: { id: session.sub },
    data: { ...appearance.value, igHandle: ig.value || null },
  });

  return NextResponse.json({ ok: true });
}
