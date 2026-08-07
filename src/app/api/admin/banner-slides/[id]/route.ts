import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = (await request.json()) as {
    label?: string | null;
    brightness?: number;
    active?: boolean;
    sortOrder?: number;
  };

  const slide = await prisma.bannerSlide.update({
    where: { id },
    data: {
      ...(body.label !== undefined && { label: body.label || null }),
      ...(body.brightness !== undefined && { brightness: body.brightness }),
      ...(body.active !== undefined && { active: body.active }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });

  return NextResponse.json(slide);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  await prisma.bannerSlide.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
