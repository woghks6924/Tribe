// 새 캐릭터(v4) 레벨업 장비 선택 — Lv2~5 기본 장비, Lv6~9 레어 장비를 레벨업마다 1개 고른다.
// 서버 전용. 후보는 그 레벨의 풀에서 아직 안 가진 것 전부(무작위 3개가 아니다).
import { prisma } from "@/lib/prisma";
import { itemById } from "@/lib/race/constants";
import { effectiveEquip, type V4Equip } from "@/lib/race/v4/equip";
import { loadV4Facts } from "@/lib/race/v4/facts";
import { V4_ITEM_SLOT } from "@/lib/race/v4/manifest-server";
import { ITEM_LABELS } from "@/lib/race/v4/palette";
import { pendingV4PickLevel, pickPoolFor } from "@/lib/race/v4/unlock";

export type V4PickCandidate = { id: string; name: string; slot: string };

async function state(memberId: string) {
  const { facts } = await loadV4Facts(memberId);
  const pendingLevel = pendingV4PickLevel(facts.level, facts.acquiredLevels ?? []);
  const candidates: V4PickCandidate[] =
    pendingLevel == null
      ? []
      : pickPoolFor(pendingLevel)
          .filter((k) => V4_ITEM_SLOT[k] && !facts.owned.includes(k))
          .map((k) => ({ id: k, name: ITEM_LABELS[k] ?? itemById(k)?.name ?? k, slot: V4_ITEM_SLOT[k] }));
  return { facts, pendingLevel, candidates };
}

export async function v4PickState(memberId: string) {
  const { pendingLevel, candidates } = await state(memberId);
  return { pendingLevel, candidates };
}

// 반환: ok면 새로 대기 중인 다음 선택 레벨, 아니면 에러 문구.
export async function v4Pick(memberId: string, itemId: string): Promise<{ ok: true; nextPendingLevel: number | null } | { error: string }> {
  const { facts, pendingLevel, candidates } = await state(memberId);
  if (pendingLevel == null) return { error: "지금은 고를 수 있는 장비가 없어요." };
  if (!candidates.some((c) => c.id === itemId)) return { error: "지금 고를 수 있는 후보가 아니에요." };

  const slot = V4_ITEM_SLOT[itemId];
  const member = await prisma.raceMember.findUnique({ where: { id: memberId } });
  if (!member) return { error: "캐릭터를 찾을 수 없어요." };
  const current: V4Equip = effectiveEquip(member.equipV4, { head: member.eqHead, face: member.eqFace, neck: member.eqNeck });

  // 고른 장비는 바로 착용(그 부위의 기존 장비는 해제). 소유 기록과 착용 변경을 한 번에.
  await prisma.$transaction([
    prisma.raceMemberItem.create({ data: { memberId, itemId, source: "levelup", acquiredLevel: pendingLevel } }),
    prisma.raceMember.update({ where: { id: memberId }, data: { equipV4: { ...current, [slot]: itemId } } }),
  ]);

  const next = pendingV4PickLevel(facts.level, [...(facts.acquiredLevels ?? []), pendingLevel]);
  return { ok: true, nextPendingLevel: next };
}
