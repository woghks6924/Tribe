import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";
import { toConvertedKm } from "@/lib/race/convert";
import { KIND_CAP } from "@/lib/race/constants";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { RACE_PROOFS_BUCKET } from "@/lib/race/storage";

const KINDS = ["RUN", "WOD", "SWIM", "GYM"] as const;

// 날짜는 여기서 고치지 못하게 막는다 — 제출 시점 서버 날짜가 원칙이라 (RaceLog.date 주석 참고),
// 본인 수정으로 과거/미래 날짜를 골라 스트릭·체크포인트를 조작하지 못하게 한다.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.raceLog.findUnique({ where: { id }, include: { season: true } });
  if (!existing || existing.memberId !== session.sub) {
    return NextResponse.json({ error: "기록을 찾을 수 없어요." }, { status: 404 });
  }

  const body = (await request.json()) as { kind?: (typeof KINDS)[number]; value?: number };
  const kind = body.kind ?? existing.kind;
  const value = Number(body.value ?? existing.value);

  if (!KINDS.includes(kind) || !(value > 0)) {
    return NextResponse.json({ error: "값이 올바르지 않아요." }, { status: 400 });
  }
  if (value > KIND_CAP[kind]) {
    return NextResponse.json({ error: `한 번에 ${KIND_CAP[kind]}까지만 입력할 수 있어요.` }, { status: 400 });
  }

  const convertedKm = toConvertedKm(kind, value, existing.season);

  await prisma.raceLog.update({
    where: { id },
    data: { kind, value, convertedKm },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.raceLog.findUnique({ where: { id }, select: { memberId: true, proofPath: true } });
  if (!existing || existing.memberId !== session.sub) {
    return NextResponse.json({ error: "기록을 찾을 수 없어요." }, { status: 404 });
  }

  if (existing.proofPath) {
    try {
      await getSupabaseAdmin().storage.from(RACE_PROOFS_BUCKET).remove([existing.proofPath]);
    } catch {
      // 삭제 실패해도 기록 삭제 자체는 계속 진행한다.
    }
  }

  await prisma.raceLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
