import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";
import { isValidAcc, isValidColor, isValidEye, normalizeAndValidateIgHandle } from "@/lib/race/validate";

export async function PUT(request: Request) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const body = (await request.json()) as { color?: string; eye?: string; acc?: string; igHandle?: string };

  const color = body.color ?? "";
  const eye = body.eye ?? "";
  const acc = body.acc ?? "";
  if (!isValidColor(color) || !isValidEye(eye) || !isValidAcc(acc)) {
    return NextResponse.json({ error: "꾸미기 옵션이 올바르지 않아요." }, { status: 400 });
  }

  const ig = normalizeAndValidateIgHandle(body.igHandle ?? "");
  if (!ig.ok) {
    return NextResponse.json({ error: "인스타그램 아이디는 영문, 숫자, 마침표, 밑줄만 쓸 수 있어요." }, { status: 400 });
  }

  await prisma.raceMember.update({
    where: { id: session.sub },
    data: { color, eye, acc, igHandle: ig.value || null },
  });

  return NextResponse.json({ ok: true });
}
