import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createRaceSession } from "@/lib/auth/race-session";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 10;

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string; pin?: string };
  const name = body.name?.trim() ?? "";
  const pin = body.pin?.trim() ?? "";

  if (!name || !/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "이름과 PIN 4자리를 입력해주세요." }, { status: 400 });
  }

  const member = await prisma.raceMember.findUnique({ where: { name } });
  if (!member) {
    return NextResponse.json({ error: "이름 또는 PIN이 맞지 않아요." }, { status: 401 });
  }

  if (member.lockedUntil && member.lockedUntil > new Date()) {
    const remainMin = Math.ceil((member.lockedUntil.getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { error: `너무 여러 번 틀렸어요. ${remainMin}분 후 다시 시도해주세요.` },
      { status: 423 },
    );
  }

  const valid = await verifyPassword(pin, member.pinHash);
  if (!valid) {
    const nextCount = member.failedLoginCount + 1;
    const lockedOut = nextCount >= MAX_FAILED_ATTEMPTS;
    await prisma.raceMember.update({
      where: { id: member.id },
      data: {
        failedLoginCount: lockedOut ? 0 : nextCount,
        lockedUntil: lockedOut ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null,
      },
    });
    if (lockedOut) {
      return NextResponse.json(
        { error: `너무 여러 번 틀렸어요. ${LOCKOUT_MINUTES}분 후 다시 시도해주세요.` },
        { status: 423 },
      );
    }
    return NextResponse.json({ error: "이름 또는 PIN이 맞지 않아요." }, { status: 401 });
  }

  if (member.failedLoginCount > 0 || member.lockedUntil) {
    await prisma.raceMember.update({
      where: { id: member.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  await createRaceSession({ sub: member.id, name: member.name });

  return NextResponse.json({ id: member.id, name: member.name });
}
