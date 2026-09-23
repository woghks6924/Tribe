import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createRaceSession } from "@/lib/auth/race-session";
import {
  isValidAcc,
  isValidColor,
  isValidEye,
  isValidName,
  isValidPin,
  normalizeAndValidateIgHandle,
} from "@/lib/race/validate";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    inviteCode?: string;
    name?: string;
    pin?: string;
    color?: string;
    eye?: string;
    acc?: string;
    igHandle?: string;
  };

  const season = await prisma.raceSeason.findFirst({ where: { active: true } });
  if (!season) {
    return NextResponse.json({ error: "진행 중인 시즌이 없어요." }, { status: 400 });
  }

  const inviteCode = body.inviteCode?.trim().toUpperCase() ?? "";
  if (inviteCode !== season.inviteCode) {
    return NextResponse.json(
      { error: "초대코드가 맞지 않아요. 크루 공지방에서 코드를 확인해주세요." },
      { status: 400 },
    );
  }

  const name = body.name?.trim() ?? "";
  if (!isValidName(name)) {
    return NextResponse.json({ error: "캐릭터 이름은 2~8자로 정해주세요." }, { status: 400 });
  }

  const pin = body.pin?.trim() ?? "";
  if (!isValidPin(pin)) {
    return NextResponse.json({ error: "PIN은 숫자 4자리로 정해주세요." }, { status: 400 });
  }

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

  const existing = await prisma.raceMember.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: `'${name}'은(는) 이미 있는 이름이에요. 다른 이름을 골라주세요.` }, { status: 400 });
  }

  const pinHash = await hashPassword(pin);
  const member = await prisma.raceMember.create({
    data: { name, pinHash, color, eye, acc, igHandle: ig.value || null },
  });

  await createRaceSession({ sub: member.id, name: member.name });

  return NextResponse.json({ id: member.id, name: member.name });
}
