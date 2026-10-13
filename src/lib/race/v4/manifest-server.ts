// 서버에서 장비·펫 키를 검증할 때 쓰는 manifest 요약. 에셋 목록은 manifest.json 하나가 기준이라
// 새 장비·펫이 추가돼도(manifest만 바뀌면) 여기 코드는 그대로다. DOM 의존성 없음.
import manifest from "../../../../public/race-assets/manifest.json";

type M = { slots?: Record<string, string>; layers: Record<string, unknown>; pets?: Record<string, unknown> };
const m = manifest as unknown as M;

// 장비 키 → 부위(head/face/neck/back/waist). 헤어는 제외.
export const V4_ITEM_SLOT: Record<string, string> = Object.fromEntries(
  Object.entries(m.slots ?? {}).filter(([k, slot]) => slot !== "hair" && k in m.layers),
);
export const V4_PET_KEYS: string[] = Object.keys(m.pets ?? {});
export const V4_SLOTS = ["head", "face", "neck", "back", "waist"] as const;
export type V4Slot = (typeof V4_SLOTS)[number];
