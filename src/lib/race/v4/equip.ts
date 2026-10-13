// 새 캐릭터 착용 장비: 부위(head/face/neck/back/waist)마다 v4 키 1개. DOM 의존성 없음.
import type { RaceEquipment } from "@/lib/race/sprite";
import { v4ItemFromEquipment } from "@/lib/race/v4/map";
import { V4_ITEM_SLOT, V4_SLOTS } from "@/lib/race/v4/manifest-server";

export type V4Equip = Partial<Record<string, string>>; // 부위 → v4 키

// DB의 equipV4(JSON)를 안전하게 읽는다. 모르는 키·부위는 버린다.
export function parseEquipV4(raw: unknown): V4Equip | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: V4Equip = {};
  for (const slot of V4_SLOTS) {
    const key = (raw as Record<string, unknown>)[slot];
    if (typeof key === "string" && V4_ITEM_SLOT[key] === slot) out[slot] = key;
  }
  return out;
}

// 실제로 보여줄 착용 장비: equipV4가 있으면 그것, 없으면(새 옷장을 아직 안 씀) 옛 장착에서 하나.
export function effectiveEquip(equipV4: unknown, legacyEq: RaceEquipment): V4Equip {
  const parsed = parseEquipV4(equipV4);
  if (parsed) return parsed;
  const legacy = v4ItemFromEquipment(legacyEq);
  return legacy && V4_ITEM_SLOT[legacy] ? { [V4_ITEM_SLOT[legacy]]: legacy } : {};
}

export function equipItems(eq: V4Equip): string[] {
  return V4_SLOTS.map((s) => eq[s]).filter((k): k is string => !!k);
}
