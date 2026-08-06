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
    content?: string;
    imageUrl?: string | null;
    linkUrl?: string | null;
    popupEnabled?: boolean;
    active?: boolean;
    startAt?: string | null;
    endAt?: string | null;
    sortOrder?: number;
  };

  const notice = await prisma.notice.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
      ...(body.linkUrl !== undefined && { linkUrl: body.linkUrl || null }),
      ...(body.popupEnabled !== undefined && { popupEnabled: body.popupEnabled }),
      ...(body.active !== undefined && { active: body.active }),
      ...(body.startAt !== undefined && { startAt: body.startAt ? new Date(body.startAt) : null }),
      ...(body.endAt !== undefined && { endAt: body.endAt ? new Date(body.endAt) : null }),
      ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
    },
  });

  return NextResponse.json(notice);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  await prisma.notice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
