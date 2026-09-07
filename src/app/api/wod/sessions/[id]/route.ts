import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as { isActive?: boolean };

  if (body.isActive) {
    // 한 번에 하나의 세션만 활성화되도록, 활성화 전 다른 세션을 전부 끈다.
    await prisma.$transaction([
      prisma.wodSession.updateMany({ data: { isActive: false } }),
      prisma.wodSession.update({ where: { id }, data: { isActive: true } }),
    ]);
  } else {
    await prisma.wodSession.update({ where: { id }, data: { isActive: false } });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.wodSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
