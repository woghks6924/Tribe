import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Supabase 무료 플랜은 7일간 DB 요청이 없으면 프로젝트를 자동 일시정지한다.
// Vercel Cron이 매일 이 엔드포인트를 호출해 가벼운 쿼리를 날려 활성 상태를 유지한다.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.siteSettings.findUnique({ where: { id: "singleton" } });

  return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
}
