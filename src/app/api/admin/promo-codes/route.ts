import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(codes);
}

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as {
    code: string;
    discountType: "PERCENTAGE" | "FIXED";
    discountValue: number;
    expiresAt?: string;
    minOrderAmount?: number;
    usageLimit?: number;
  };

  if (!body.code || !body.discountType || !body.discountValue) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }

  const code = body.code.trim().toUpperCase();
  const existing = await prisma.promoCode.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "This code already exists." }, { status: 409 });
  }

  const promo = await prisma.promoCode.create({
    data: {
      code,
      discountType: body.discountType,
      discountValue: body.discountValue,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      minOrderAmount: body.minOrderAmount || null,
      usageLimit: body.usageLimit || null,
    },
  });

  return NextResponse.json(promo);
}
