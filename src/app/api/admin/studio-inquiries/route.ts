import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const inquiries = await prisma.studioInquiry.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(inquiries);
}
