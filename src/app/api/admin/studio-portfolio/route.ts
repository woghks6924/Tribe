import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const items = await prisma.studioPortfolioItem.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as {
    title: string;
    imageUrl: string;
    videoUrl?: string;
    category: string;
  };

  if (!body.title || !body.imageUrl || !body.category) {
    return NextResponse.json(
      { error: "Please provide a title, image, and category." },
      { status: 400 },
    );
  }

  const maxOrder = await prisma.studioPortfolioItem.aggregate({ _max: { sortOrder: true } });

  const item = await prisma.studioPortfolioItem.create({
    data: {
      title: body.title,
      imageUrl: body.imageUrl,
      videoUrl: body.videoUrl || null,
      category: body.category,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(item);
}
