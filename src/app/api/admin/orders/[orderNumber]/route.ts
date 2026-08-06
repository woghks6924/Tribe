import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, payment: true, customer: { select: { id: true, name: true, email: true } } },
  });

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { orderNumber } = await params;
  const body = (await request.json()) as {
    status?: string;
    trackingNumber?: string;
    carrier?: string;
  };

  const order = await prisma.order.update({
    where: { orderNumber },
    data: {
      status: body.status as never,
      trackingNumber: body.trackingNumber,
      carrier: body.carrier,
    },
  });

  return NextResponse.json(order);
}
