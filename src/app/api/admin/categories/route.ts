import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as {
    name: string;
    slug: string;
    imageUrl?: string;
    sortOrder?: number;
  };

  if (!body.name || !body.slug) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { slug: body.slug } });
  if (existing) {
    return NextResponse.json({ error: "A category with this slug already exists." }, { status: 409 });
  }

  const category = await prisma.category.create({
    data: {
      name: body.name,
      slug: body.slug,
      imageUrl: body.imageUrl || null,
      sortOrder: body.sortOrder ?? 0,
    },
  });

  return NextResponse.json(category);
}
