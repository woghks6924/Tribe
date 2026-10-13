import type { RaceAssets } from "@/lib/race/v4/sprite";

export const SLOT_ORDER = ["head", "face", "neck", "back", "waist"];


// 장비·펫 목록은 코드에 박지 않고 manifest에서 읽는다(에셋이 추가되면 자동으로 늘어난다).
export function itemsBySlot(A: RaceAssets): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [name, slot] of Object.entries(A.manifest.slots || {})) {
    if (slot === "hair" || !A.manifest.layers[name]) continue;
    (out[slot] ||= []).push(name);
  }
  return out;
}
export function petKeys(A: RaceAssets): string[] {
  return Object.keys(A.manifest.pets || {});
}

export const STATUS_ICON = { open: "🔓", pick: "🎁", locked: "🔒" } as const;
