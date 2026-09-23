import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { RACE_PROOFS_BUCKET } from "@/lib/race/storage";

// 시즌 초기화 — 해당 시즌의 기록(RaceLog)을 전부 삭제한다. 멤버 계정 자체는 유지된다.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  const proofPaths = (
    await prisma.raceLog.findMany({
      where: { seasonId: id, proofPath: { not: null } },
      select: { proofPath: true },
    })
  )
    .map((l) => l.proofPath)
    .filter((p): p is string => !!p);

  if (proofPaths.length > 0) {
    try {
      await getSupabaseAdmin().storage.from(RACE_PROOFS_BUCKET).remove(proofPaths);
    } catch {
      // 인증샷 삭제가 실패해도 초기화 자체는 계속 진행한다 — 드물게 파일이 남을 수 있지만
      // 용량에 미치는 영향이 미미해 초기화를 막을 정도는 아니다.
    }
  }

  const result = await prisma.raceLog.deleteMany({ where: { seasonId: id } });
  return NextResponse.json({ ok: true, deletedCount: result.count });
}
