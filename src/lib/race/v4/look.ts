// DB의 RaceMember 컬럼 → v4 외형. DOM 의존성 없음(서버에서 쓴다).
import type { RaceEquipment } from "@/lib/race/sprite";
import { effectiveEquip, equipItems } from "@/lib/race/v4/equip";
import type { V4Look } from "@/lib/race/v4/sprite";

export type V4LookColumns = {
  hairStyle: string | null;
  topColor: string;
  bottomColor: string;
  shoesColor: string;
  hairColor: string;
  bibNumber: number | null;
  petKey: string | null;
  equipV4: unknown;
};

export function v4LookOf(m: V4LookColumns, eq: RaceEquipment): V4Look {
  return {
    hair: m.hairStyle,
    item: null,
    items: equipItems(effectiveEquip(m.equipV4, eq)),
    pet: m.petKey,
    bib: m.bibNumber,
    colors: { top: m.topColor, bottom: m.bottomColor, shoes: m.shoesColor, hair: m.hairColor },
  };
}
