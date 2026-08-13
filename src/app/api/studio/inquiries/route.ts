import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    brandName: string;
    contactName: string;
    contactInfo: string;
    packageInterest?: string;
    message: string;
  };

  if (!body.brandName || !body.contactName || !body.contactInfo || !body.message) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }

  await prisma.studioInquiry.create({
    data: {
      brandName: body.brandName,
      contactName: body.contactName,
      contactInfo: body.contactInfo,
      packageInterest: body.packageInterest || null,
      message: body.message,
    },
  });

  // TODO: Resend 연동 후 관리자에게 신규 문의 이메일 알림 발송
  return NextResponse.json({ ok: true });
}
