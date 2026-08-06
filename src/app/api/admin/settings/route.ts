import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as { shippingReturnsContent: string };

  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: { shippingReturnsContent: body.shippingReturnsContent },
    create: { id: "singleton", shippingReturnsContent: body.shippingReturnsContent },
  });

  return NextResponse.json(settings);
}
