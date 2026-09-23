// 서울→부산 체크포인트 8개. 프로토타입과 동일하게 코드 상수로 고정한다(시즌별로 다르지 않음).
export const CHECKPOINTS = [
  { km: 0, name: "서울" },
  { km: 35, name: "수원" },
  { km: 90, name: "천안" },
  { km: 160, name: "대전" },
  { km: 235, name: "김천" },
  { km: 300, name: "대구" },
  { km: 370, name: "밀양" },
  { km: 425, name: "부산" },
] as const;

// 캐릭터 색상 12종.
export const PALETTE = [
  "#ef7b57",
  "#6aa7f0",
  "#7dcf8b",
  "#e8c655",
  "#c690e6",
  "#f294b6",
  "#58c9c0",
  "#d8d2c3",
  "#f3a347",
  "#95a2ff",
  "#b8d86a",
  "#ff8f8f",
] as const;

export type RaceEye = "dot" | "round" | "happy" | "wink";
export type RaceAcc = "none" | "cap" | "band" | "shades" | "bib";

export const EYE_OPTIONS: { value: RaceEye; label: string }[] = [
  { value: "dot", label: "점눈" },
  { value: "round", label: "동글눈" },
  { value: "happy", label: "웃는눈" },
  { value: "wink", label: "윙크" },
];

export const ACC_OPTIONS: { value: RaceAcc; label: string }[] = [
  { value: "none", label: "없음" },
  { value: "cap", label: "러닝캡" },
  { value: "band", label: "헤어밴드" },
  { value: "shades", label: "선글라스" },
  { value: "bib", label: "배번표" },
];

// 체형(캐릭터 타입). GYM은 WOD와 합쳐 "파워형" 풀로 취급한다.
export type RaceBodyType = "base" | "run" | "wod" | "swim" | "hybrid";

export const TYPE_LABEL: Record<RaceBodyType, string> = {
  base: "새내기",
  run: "러너형",
  wod: "파워형",
  swim: "스위머형",
  hybrid: "하이브리드",
};

// 기록 입력 종목.
export const KIND_LABEL: Record<"RUN" | "WOD" | "SWIM" | "GYM", string> = {
  RUN: "러닝",
  WOD: "WOD·하이록스",
  SWIM: "수영",
  GYM: "헬스",
};

export const KIND_UNIT: Record<"RUN" | "WOD" | "SWIM" | "GYM", string> = {
  RUN: "km",
  WOD: "분",
  SWIM: "km",
  GYM: "분",
};

// 1회 입력 상한.
export const KIND_CAP: Record<"RUN" | "WOD" | "SWIM" | "GYM", number> = {
  RUN: 50,
  WOD: 240,
  SWIM: 10,
  GYM: 240,
};

// 새내기 판정 기준(환산 누적 km).
export const BASE_TYPE_THRESHOLD_KM = 8;
// 하이브리드 판정 기준(각 풀이 전체의 이 비율을 넘어야 함).
export const HYBRID_RATIO_THRESHOLD = 0.2;
// 3일 이상 기록 없으면 잠든 캐릭터.
export const SLEEP_IDLE_DAYS = 3;
