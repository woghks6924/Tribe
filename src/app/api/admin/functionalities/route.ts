import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const functionalities = await prisma.functionality.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(functionalities);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as { title: string; description: string; icon?: string };

  if (!body.title || !body.description) {
    return NextResponse.json({ error: "Please provide a title and description." }, { status: 400 });
  }

  const functionality = await prisma.functionality.create({
    data: { title: body.title, description: body.description, icon: body.icon || null },
  });

  return NextResponse.json(functionality);
}
