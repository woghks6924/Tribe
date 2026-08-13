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
  const body = (await request.json()) as { status: "NEW" | "CONTACTED" | "CLOSED" };

  const inquiry = await prisma.studioInquiry.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json(inquiry);
}
