import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const photos = await prisma.lookbookPhoto.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(photos);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as {
    imageUrl: string;
    caption: string;
    sortOrder?: number;
  };

  if (!body.imageUrl || !body.caption) {
    return NextResponse.json({ error: "Please provide an image and caption." }, { status: 400 });
  }

  const maxOrder = await prisma.lookbookPhoto.aggregate({ _max: { sortOrder: true } });

  const photo = await prisma.lookbookPhoto.create({
    data: {
      imageUrl: body.imageUrl,
      caption: body.caption,
      sortOrder: body.sortOrder ?? (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(photo);
}
