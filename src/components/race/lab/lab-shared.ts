import type { RaceBodyType, RaceEye, RaceExpr } from "@/lib/race/constants";
import type { RaceEquipment } from "@/lib/race/sprite";
import type { V4Look } from "@/lib/race/v4/sprite";
import type { UnlockFacts } from "@/lib/race/v4/unlock";

export type LookPatch = Partial<Omit<V4Look, "colors">> & { colors?: Partial<V4Look["colors"]> };

export type LabMember = {
  id: string;
  name: string;
  km: number;
  type: RaceBodyType;
  todayLogged: boolean;
  level: number;
  legacy: { color: string; eye: RaceEye; type: RaceBodyType; expr: RaceExpr; eq: RaceEquipment; gold: boolean };
  defaultLook: V4Look;
  facts: UnlockFacts;
};

export type LevelRow = { level: number; km: number };

export { HAIR_NAMES, ITEM_NAMES, ANIM_NAMES, PALETTE, COLOR_NAMES, SLOT_LABELS, ITEM_LABELS, PET_NAMES } from "@/lib/race/v4/palette";
export { useCanvasLoop } from "../v4/canvas-loop";

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
