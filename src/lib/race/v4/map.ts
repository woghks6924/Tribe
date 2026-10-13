// 기존 동글이 캐릭터 데이터 → v4(사람 캐릭터) 외형으로 옮기는 매핑. DOM 의존성 없음 — 서버에서도 쓸 수 있다.
import type { RaceEquipment } from "@/lib/race/sprite";
import { DEFAULT_COLORS, type V4Look } from "@/lib/race/v4/sprite";

// 기존 옷장 아이템 id → v4 장비 키. (cap/beanie/band/phones/shades/scarf 외에는 매핑 없음)
const ITEM_MAP: Record<string, string> = {
  cap: "item_cap",
  beanie: "item_beanie",
  band: "item_headband",
  headband: "item_headband",
  phones: "item_headphones",
  headphones: "item_headphones",
  shades: "item_sunglasses",
  sunglasses: "item_sunglasses",
  scarf: "item_scarf",
};

// v4는 장비가 1개라서, 여러 개 입고 있으면 머리 > 얼굴 > 목 순서로 하나만 쓴다.
export function v4ItemFromEquipment(eq: RaceEquipment): string | null {
  for (const id of [eq.head, eq.face, eq.neck]) {
    if (id && ITEM_MAP[id]) return ITEM_MAP[id];
  }
  return null;
}

// 초기값: 기존 color → 상의색, 장착 아이템 → 새 장비, 헤어는 기본(짧은 머리), 나머지는 기본색.
export function defaultV4Look(memberColor: string, eq: RaceEquipment): V4Look {
  return {
    hair: null,
    item: v4ItemFromEquipment(eq),
    bib: null,
    colors: { ...DEFAULT_COLORS, top: memberColor },
  };
}
