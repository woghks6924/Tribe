import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 신청 마감일시(applicationEndAt)가 지난 진행중 폼을 실제로 CLOSED로 바꾸고 closedAt을 찍는다.
// getEffectiveRunningFormStatus가 화면/신청 차단은 즉시 처리해주지만, status 필드 자체는
// 이 크론이 따라잡아야 관리자 화면에 정확한 진행 상태(마감)가 반영된다.
// (개인정보 자동 파기는 closedAt이 아니라 행사일 기준이라 이 값과는 무관하다.)
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
