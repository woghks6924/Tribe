import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRaceMember } from "@/lib/auth/require-race";
import { getRaceLevelConfig } from "@/lib/race/appearance";
import { levelFromKm, nextPendingPickLevel, pickCandidates } from "@/lib/race/level";
import { itemById } from "@/lib/race/constants";
import { RACE_CHAR_V4 } from "@/lib/race/v4/flag";
import { V4_CLOSET_ITEMS } from "@/lib/race/v4/map";

// 새 캐릭터 플래그가 켜져 있으면 화면에 보이는 6종 안에서 후보를 뽑는다(꺼져 있으면 undefined = 기존 그대로).
const PREFER_IDS = RACE_CHAR_V4 ? V4_CLOSET_ITEMS.map((it) => it.legacyId) : undefined;

const SLOT_TO_COLUMN = {
  head: "eqHead",
  face: "eqFace",
  neck: "eqNeck",
  body: "eqBody",
  wrist: "eqWrist",
  feet: "eqFeet",
} as const;

// 지금 뜰 레벨업 팝업이 있는지 + 후보 3개를 계산해서 돌려준다.
export async function GET() {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const [config, sumRow, ownedItems] = await Promise.all([
    getRaceLevelConfig(),
    prisma.raceLog.aggregate({ where: { memberId: session.sub }, _sum: { convertedKm: true } }),
    prisma.raceMemberItem.findMany({ where: { memberId: session.sub } }),
  ]);
  const level = levelFromKm(sumRow._sum.convertedKm ?? 0, config);
  const levelupCount = ownedItems.filter((it) => it.source === "levelup").length;
  const pendingLevel = nextPendingPickLevel(level, levelupCount, config);
  if (pendingLevel == null) {
    return NextResponse.json({ pendingLevel: null, candidates: [] });
  }
  const candidates = pickCandidates(session.sub, pendingLevel, ownedItems.map((it) => it.itemId), 3, PREFER_IDS);
  return NextResponse.json({ pendingLevel, candidates });
}

// 레벨업 장비 선택 — 대기 중인 선택 레벨에 맞는지, 후보 안에 있는 아이템인지 서버에서
// 다시 계산해서 검증한다(클라이언트가 보낸 값을 그대로 믿지 않는다).
export async function POST(request: Request) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const body = (await request.json()) as { itemId?: string };
  const item = body.itemId ? itemById(body.itemId) : undefined;
  if (!item) {
    return NextResponse.json({ error: "잘못된 아이템이에요." }, { status: 400 });
  }

  const [config, sumRow, ownedItems] = await Promise.all([
    getRaceLevelConfig(),
    prisma.raceLog.aggregate({ where: { memberId: session.sub }, _sum: { convertedKm: true } }),
    prisma.raceMemberItem.findMany({ where: { memberId: session.sub } }),
  ]);
  const level = levelFromKm(sumRow._sum.convertedKm ?? 0, config);
  const levelupCount = ownedItems.filter((it) => it.source === "levelup").length;
  const pendingLevel = nextPendingPickLevel(level, levelupCount, config);
  if (pendingLevel == null) {
    return NextResponse.json({ error: "지금은 고를 수 있는 장비가 없어요." }, { status: 400 });
  }

  const ownedIds = ownedItems.map((it) => it.itemId);
  if (ownedIds.includes(item.id)) {
    return NextResponse.json({ error: "이미 가지고 있는 장비예요." }, { status: 400 });
  }
  const candidates = pickCandidates(session.sub, pendingLevel, ownedIds, 3, PREFER_IDS);
  if (!candidates.some((c) => c.id === item.id)) {
    return NextResponse.json({ error: "지금 고를 수 있는 후보가 아니에요." }, { status: 400 });
  }

  const column = SLOT_TO_COLUMN[item.slot];
  // 새 캐릭터는 장비가 1개라서, 보이는 장비를 새로 고르면 머리/얼굴/목의 다른 슬롯은 비운다(아이템 소유는 그대로).
  const v4Single = RACE_CHAR_V4 && V4_CLOSET_ITEMS.some((it) => it.legacyId === item.id);
  const slotData: Record<string, string | null> = v4Single ? { eqHead: null, eqFace: null, eqNeck: null } : {};
  await prisma.$transaction([
    prisma.raceMemberItem.create({
      data: { memberId: session.sub, itemId: item.id, source: "levelup", acquiredLevel: pendingLevel },
    }),
    prisma.raceMember.update({ where: { id: session.sub }, data: { ...slotData, [column]: item.id } }),
  ]);

  // 아직 선택 못 한 레벨이 더 있으면(여러 레벨이 한꺼번에 밀린 경우) 다음 것도 알려준다 —
  // 클라이언트가 팝업을 연달아 띄우는 데 쓴다.
  const nextPending = nextPendingPickLevel(level, levelupCount + 1, config);

  return NextResponse.json({ ok: true, equipped: item.id, nextPendingLevel: nextPending });
}
