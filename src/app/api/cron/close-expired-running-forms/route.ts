import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 신청 마감일시(applicationEndAt)가 지난 진행중 폼을 실제로 CLOSED로 바꾸고 closedAt을 찍는다.
// getEffectiveRunningFormStatus가 화면/신청 차단은 즉시 처리해주지만, status 필드 자체는
// 이 크론이 따라잡아야 개인정보 30일 자동 파기 타이머(closedAt 기준)가 시작된다.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const result = await prisma.runningForm.updateMany({
    where: { status: "OPEN", applicationEndAt: { lte: now } },
    data: { status: "CLOSED", closedAt: now },
  });

  return NextResponse.json({ ok: true, closedCount: result.count, checkedAt: now.toISOString() });
}
