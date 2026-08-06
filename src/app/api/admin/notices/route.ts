import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const notices = await prisma.notice.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(notices);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as {
    title: string;
    content: string;
    imageUrl?: string;
    linkUrl?: string;
    popupEnabled?: boolean;
    active?: boolean;
    startAt?: string;
    endAt?: string;
    sortOrder?: number;
  };

  if (!body.title || !body.content) {
    return NextResponse.json({ error: "Please fill in title and content." }, { status: 400 });
  }

  const notice = await prisma.notice.create({
    data: {
      title: body.title,
      content: body.content,
      imageUrl: body.imageUrl || null,
      linkUrl: body.linkUrl || null,
      popupEnabled: body.popupEnabled ?? true,
      active: body.active ?? true,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json(notice);
}
