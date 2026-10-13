// 새 캐릭터 장비·펫 해금 규칙. 상수는 여기 한 곳에만 둔다. DOM 의존성 없음(서버·클라이언트 공용).
// 1단계(/race/lab)에서는 "지금 레벨이면 뭐가 열리는지" 미리보기에만 쓴다. 실제 적용(선택권 소비 등)은 B단계.

export const PET_UNLOCK_LEVEL = 6; // 이 레벨부터 펫 전부 자유 선택·교체
export const UNLOCK_ALL_LEVEL = 10; // 이 레벨부터 장비 전부(조건부 제외) 자유 선택
export const BASIC_PICK_LEVELS = [2, 3, 4, 5]; // 레벨업마다 기본 장비 1개 선택
export const RARE_PICK_LEVELS = [6, 7, 8, 9]; // 레벨업마다 레어 장비 1개 선택

export const BASIC_ITEMS = ["head_bucket", "head_visor", "neck_towel", "neck_gaiter", "waist_belt"];
export const RARE_ITEMS = [
  "head_earmuffs",
  "back_pack",
  "back_vest",
  "waist_jacket",
  "back_flag",
  "back_cape",
  "back_wings",
  "head_crown",
];
// 예전 옷장 아이템 중 새 캐릭터에 있는 6종(이미 가진 사람은 그대로 보유, Lv10부터는 누구나)
export const LEGACY_ITEMS = ["item_cap", "item_beanie", "item_headband", "item_headphones", "item_sunglasses", "item_scarf"];

export const GOAL_KM = 425; // 완주 메달: 부산 도착
export const SWIM_PET_KM = 3; // 돌고래 펫: 수영 누적 km
export const SANTA_MONTH = 12;
export const SWIM_PETS = ["pet_dolphin"]; // 나중에 상어가 추가되면 여기에 pet_shark

export type UnlockFacts = {
  level: number;
  totalKm: number; // 전체 기간 누적 환산 km (레벨 계산 기준)
  seasonKm: number; // 이번 시즌 환산 km (완주 판정)
  swimLogCount: number; // 수영 기록 수 (전체 기간)
  hasRun: boolean;
  hasWod: boolean;
  hasSwim: boolean;
  swimKm: number; // 수영 누적 km (전체 기간)
  month: number; // KST 월(1~12)
  acquiredLevels?: number[]; // 레벨업으로 이미 장비를 받은 레벨들(있으면 남은 선택권을 정확히 센다)
  owned: string[]; // 이미 가진 장비의 새 키 — 옛 옷장 아이템(item_cap 등)과 레벨업으로 고른 장비 모두
};

export type UnlockState = {
  status: "open" | "pick" | "locked";
  label: string; // 배지 글자
  detail: string; // 설명(툴팁·안내)
};

const open = (label: string, detail = label): UnlockState => ({ status: "open", label, detail });
const pick = (label: string, detail: string): UnlockState => ({ status: "pick", label, detail });
const locked = (label: string, detail = label): UnlockState => ({ status: "locked", label, detail });

// 선택권이 생기는 레벨(Lv2~9)과 그 레벨에서 고를 수 있는 장비 풀.
export const V4_PICK_LEVELS = [...BASIC_PICK_LEVELS, ...RARE_PICK_LEVELS];
export function pickPoolFor(pickLevel: number): string[] {
  return BASIC_PICK_LEVELS.includes(pickLevel) ? BASIC_ITEMS : RARE_PICK_LEVELS.includes(pickLevel) ? RARE_ITEMS : [];
}
// 아직 안 고른 선택 레벨 중 가장 낮은 것. acquiredLevels = 레벨업으로 이미 장비를 받은 레벨들(옛 선택 포함).
export function pendingV4PickLevel(level: number, acquiredLevels: number[]): number | null {
  return V4_PICK_LEVELS.find((l) => l <= level && !acquiredLevels.includes(l)) ?? null;
}
// 아직 도달 못 한 가장 가까운 선택 레벨(진행 표시용).
export function nextUpcomingV4PickLevel(level: number): number | null {
  return V4_PICK_LEVELS.find((l) => l > level) ?? null;
}

// 아직 안 쓴 선택권 수. acquiredLevels를 모르면 도달한 레벨 수로 센다(미리보기용).
function remainingPicks(levels: number[], f: UnlockFacts) {
  const reached = levels.filter((l) => l <= f.level);
  return f.acquiredLevels ? reached.filter((l) => !f.acquiredLevels!.includes(l)).length : reached.length;
}

// 선택권을 다 쓴 뒤 안내 문구: 다음 선택 레벨이 남아 있으면 그걸, 없으면 Lv.10 자유 선택을.
function nextOpen(levels: number[], level: number) {
  const next = levels.find((l) => l > level);
  return next != null ? `다음 선택권은 Lv.${next}, Lv.${UNLOCK_ALL_LEVEL}에는 전부 열려요` : `Lv.${UNLOCK_ALL_LEVEL}에 전부 열려요`;
}

export function basicPicks(level: number) {
  return BASIC_PICK_LEVELS.filter((l) => l <= level).length;
}
export function rarePicks(level: number) {
  return RARE_PICK_LEVELS.filter((l) => l <= level).length;
}

export function itemUnlock(key: string, f: UnlockFacts): UnlockState {
  // 조건부(레벨 무관)
  if (key === "head_swimcap") {
    return f.swimLogCount >= 1 ? open("조건 달성", "수영 기록 1회 달성") : locked("수영 1회", "수영 기록 1회 필요");
  }
  if (key === "head_helmet") {
    const done = f.hasRun && f.hasWod && f.hasSwim;
    return done ? open("조건 달성", "러닝·WOD·수영 모두 기록") : locked("3종 기록", "러닝·WOD·수영을 모두 기록해야 해요");
  }
  if (key === "neck_medal") {
    return f.seasonKm >= GOAL_KM ? open("완주", `${GOAL_KM}km 도착`) : locked(`${GOAL_KM}km 도착`, `${GOAL_KM}km 도착 시 획득`);
  }
  if (key === "head_santa") {
    return f.month === SANTA_MONTH ? open("12월 한정", "12월에 열려요") : locked("12월 한정", "12월에만 열려요");
  }
  if (f.owned.includes(key)) return open("보유", "이미 가지고 있어요");
  if (f.level >= UNLOCK_ALL_LEVEL) return open(`Lv.${UNLOCK_ALL_LEVEL}+ 자유`, `Lv.${UNLOCK_ALL_LEVEL} 이상은 전부 자유 선택`);
  if (BASIC_ITEMS.includes(key)) {
    const n = remainingPicks(BASIC_PICK_LEVELS, f);
    if (n === 0 && basicPicks(f.level) > 0) return locked("선택권 사용", `기본 장비 선택권을 다 썼어요 — ${nextOpen(BASIC_PICK_LEVELS, f.level)}`);
    return n > 0
      ? pick("선택 가능", `기본 장비 선택권 ${n}개(Lv.${BASIC_PICK_LEVELS[0]}~${BASIC_PICK_LEVELS[BASIC_PICK_LEVELS.length - 1]} 레벨업마다 1개)`)
      : locked(`Lv.${BASIC_PICK_LEVELS[0]}~`, `Lv.${BASIC_PICK_LEVELS[0]}부터 레벨업마다 1개 선택`);
  }
  if (RARE_ITEMS.includes(key)) {
    const n = remainingPicks(RARE_PICK_LEVELS, f);
    if (n === 0 && rarePicks(f.level) > 0) return locked("선택권 사용", `레어 장비 선택권을 다 썼어요 — ${nextOpen(RARE_PICK_LEVELS, f.level)}`);
    return n > 0
      ? pick("선택 가능", `레어 장비 선택권 ${n}개(Lv.${RARE_PICK_LEVELS[0]}~${RARE_PICK_LEVELS[RARE_PICK_LEVELS.length - 1]} 레벨업마다 1개)`)
      : locked(`Lv.${RARE_PICK_LEVELS[0]}~`, `Lv.${RARE_PICK_LEVELS[0]}부터 레벨업마다 1개 선택`);
  }
  if (LEGACY_ITEMS.includes(key)) {
    return locked(`Lv.${UNLOCK_ALL_LEVEL}`, `예전 레벨업 장비 — 가진 사람만, 또는 Lv.${UNLOCK_ALL_LEVEL}부터 자유`);
  }
  return locked("미정", "아직 해금 규칙이 없는 장비");
}

export function petUnlock(key: string, f: UnlockFacts): UnlockState {
  if (SWIM_PETS.includes(key) && f.swimKm >= SWIM_PET_KM) return open("조건 달성", `수영 누적 ${SWIM_PET_KM}km 달성`);
  if (f.level >= PET_UNLOCK_LEVEL) return open(`Lv.${PET_UNLOCK_LEVEL}+ 자유`, `Lv.${PET_UNLOCK_LEVEL} 이상은 펫을 자유롭게 고르고 바꿔요`);
  if (SWIM_PETS.includes(key)) return locked(`수영 ${SWIM_PET_KM}km`, `수영 누적 ${SWIM_PET_KM}km 또는 Lv.${PET_UNLOCK_LEVEL}`);
  return locked(`Lv.${PET_UNLOCK_LEVEL}`, `Lv.${PET_UNLOCK_LEVEL}이 되면 펫을 고를 수 있어요`);
}
