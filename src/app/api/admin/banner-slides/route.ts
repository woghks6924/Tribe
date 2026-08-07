import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const slides = await prisma.bannerSlide.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(slides);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as {
    mediaType: "VIDEO" | "IMAGE";
    mediaUrl: string;
    label?: string;
    brightness?: number;
  };

  if (!body.mediaType || !body.mediaUrl) {
    return NextResponse.json({ error: "Please provide media type and a file." }, { status: 400 });
  }

  const maxOrder = await prisma.bannerSlide.aggregate({ _max: { sortOrder: true } });

  const slide = await prisma.bannerSlide.create({
    data: {
      mediaType: body.mediaType,
      mediaUrl: body.mediaUrl,
      label: body.label || null,
      brightness: body.brightness ?? 1.3,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(slide);
}
