import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { RACE_PROOFS_BUCKET } from "@/lib/race/storage";

// 인증샷은 업로드 24시간 후 만료된다 — 만료된 파일을 Storage에서 지우고 경로를 null 처리한다.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const expired = await prisma.raceLog.findMany({
    where: { proofPath: { not: null }, proofExpiresAt: { lte: now } },
    select: { id: true, proofPath: true },
  });

  if (expired.length === 0) {
    return NextResponse.json({ ok: true, purgedCount: 0, checkedAt: now.toISOString() });
  }

  const paths = expired.map((l) => l.proofPath!).filter(Boolean);
  try {
    await getSupabaseAdmin().storage.from(RACE_PROOFS_BUCKET).remove(paths);
  } catch {
    // Storage 삭제가 실패해도 DB는 정리한다 — 다음 실행에서 재시도할 근거(경로)가 사라지는 대신
    // 화면 노출은 어차피 만료시각 기준으로 막혀 있어 사용자에게 보이진 않는다.
  }

  await prisma.raceLog.updateMany({
    where: { id: { in: expired.map((l) => l.id) } },
    data: { proofPath: null, proofExpiresAt: null },
  });

  return NextResponse.json({ ok: true, purgedCount: expired.length, checkedAt: now.toISOString() });
}
