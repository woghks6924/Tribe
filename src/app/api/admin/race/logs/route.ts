import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { toConvertedKm } from "@/lib/race/convert";
import { todayKstDateStr } from "@/lib/race/stats";
import { KIND_CAP } from "@/lib/race/constants";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const KINDS = ["RUN", "WOD", "SWIM", "GYM"] as const;

export async function GET(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const seasonId = searchParams.get("seasonId");
  if (!seasonId) {
    return NextResponse.json({ error: "seasonId is required." }, { status: 400 });
  }

  const logs = await prisma.raceLog.findMany({
    where: { seasonId },
    orderBy: { createdAt: "desc" },
    include: { member: { select: { name: true } } },
  });

  return NextResponse.json(
    logs.map((l) => ({
      id: l.id,
      memberId: l.memberId,
      memberName: l.member.name,
      date: l.date,
      kind: l.kind,
      value: l.value,
      convertedKm: l.convertedKm,
      proofPath: l.proofPath,
      createdAt: l.createdAt.toISOString(),
    })),
  );
}

export type AdminRaceLogInput = {
  seasonId: string;
  memberId: string;
  date?: string;
  kind: (typeof KINDS)[number];
  value: number;
};

// admin이 특정 멤버의 기록을 직접 추가한다 — 오프라인으로 확인된 기록을 대신 반영하거나
// 오입력을 바로잡을 때 쓴다("거리 설정"은 이 방식으로 처리한다).
export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as AdminRaceLogInput;

  if (!body.seasonId || !body.memberId || !KINDS.includes(body.kind) || !(body.value > 0)) {
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  }
  if (body.value > KIND_CAP[body.kind]) {
    return NextResponse.json({ error: `한 번에 ${KIND_CAP[body.kind]}까지만 입력할 수 있어요.` }, { status: 400 });
  }
  const date = body.date?.trim() || todayKstDateStr();
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "날짜 형식이 올바르지 않아요 (YYYY-MM-DD)." }, { status: 400 });
  }

  const season = await prisma.raceSeason.findUnique({ where: { id: body.seasonId } });
  if (!season) {
    return NextResponse.json({ error: "Season not found." }, { status: 404 });
  }

  const convertedKm = toConvertedKm(body.kind, body.value, season);

  const log = await prisma.raceLog.create({
    data: {
      seasonId: body.seasonId,
      memberId: body.memberId,
      date,
      kind: body.kind,
      value: body.value,
      convertedKm,
    },
  });

  return NextResponse.json({ id: log.id });
}
