import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RETENTION_DAYS = 30;

// 러닝 신청폼이 마감(CLOSED)된 지 30일이 지나면 신청자의 이름/연락처/성별을 실제로 파기한다.
// 개인정보 동의 카드의 "보유 및 이용기간" 정책을 실제로 집행하는 크론.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const result = await prisma.runningSubmission.updateMany({
    where: {
      personalDataPurgedAt: null,
      form: { status: "CLOSED", closedAt: { lte: cutoff } },
    },
    data: {
      name: "(파기됨)",
      phone: "(파기됨)",
      gender: null,
      personalDataPurgedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, purgedCount: result.count, checkedAt: new Date().toISOString() });
}
