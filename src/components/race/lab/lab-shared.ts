import type { RaceBodyType, RaceEye, RaceExpr } from "@/lib/race/constants";
import type { RaceEquipment } from "@/lib/race/sprite";
import type { V4Look } from "@/lib/race/v4/sprite";

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
};

export { HAIR_NAMES, ITEM_NAMES, ANIM_NAMES, PALETTE, COLOR_NAMES } from "@/lib/race/v4/palette";
export { useCanvasLoop } from "../v4/canvas-loop";
