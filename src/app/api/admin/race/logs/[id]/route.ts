import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { toConvertedKm } from "@/lib/race/convert";
import { KIND_CAP } from "@/lib/race/constants";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { RACE_PROOFS_BUCKET } from "@/lib/race/storage";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = ["RUN", "WOD", "SWIM", "GYM"] as const;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = (await request.json()) as { date?: string; kind?: (typeof KINDS)[number]; value?: number };

  const existing = await prisma.raceLog.findUnique({ where: { id }, include: { season: true } });
  if (!existing) {
    return NextResponse.json({ error: "Log not found." }, { status: 404 });
  }

  const kind = body.kind ?? existing.kind;
  const value = body.value ?? existing.value;
  const date = body.date?.trim() || existing.date;

  if (!KINDS.includes(kind) || !(value > 0)) {
    return NextResponse.json({ error: "값이 올바르지 않아요." }, { status: 400 });
  }
  if (value > KIND_CAP[kind]) {
    return NextResponse.json({ error: `한 번에 ${KIND_CAP[kind]}까지만 입력할 수 있어요.` }, { status: 400 });
  }
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "날짜 형식이 올바르지 않아요 (YYYY-MM-DD)." }, { status: 400 });
  }

  const convertedKm = toConvertedKm(kind, value, existing.season);

  await prisma.raceLog.update({
    where: { id },
    data: { date, kind, value, convertedKm },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const existing = await prisma.raceLog.findUnique({ where: { id }, select: { proofPath: true } });
  if (existing?.proofPath) {
    try {
      await getSupabaseAdmin().storage.from(RACE_PROOFS_BUCKET).remove([existing.proofPath]);
    } catch {
      // 삭제 실패해도 기록 삭제 자체는 계속 진행한다.
    }
  }

  await prisma.raceLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
