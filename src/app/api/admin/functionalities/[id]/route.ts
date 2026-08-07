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
    title?: string;
    description?: string;
    icon?: string | null;
  };

  const functionality = await prisma.functionality.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.icon !== undefined && { icon: body.icon || null }),
    },
  });

  return NextResponse.json(functionality);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  await prisma.functionality.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
