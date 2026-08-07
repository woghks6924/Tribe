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
    caption?: string;
    active?: boolean;
    sortOrder?: number;
  };

  const photo = await prisma.lookbookPhoto.update({
    where: { id },
    data: {
      ...(body.caption !== undefined && { caption: body.caption }),
      ...(body.active !== undefined && { active: body.active }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });

  return NextResponse.json(photo);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  await prisma.lookbookPhoto.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
