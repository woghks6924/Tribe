// 서울에서 시작해 부산을 지나 유럽까지 이어지는 체크포인트 목록. 실제 항로/철도 거리와는
// 무관하게 기존 서울→부산 구간 페이스에 맞춰 임의로 늘린 값 — 시즌 목표(goalKm)는 이 중
// 하나의 km 값과 항상 일치하도록 관리자가 도시를 골라서 정한다 (RaceSeasonManager 참고).
export const CHECKPOINTS = [
  { km: 0, name: "서울" },
  { km: 35, name: "수원" },
  { km: 90, name: "천안" },
  { km: 160, name: "대전" },
  { km: 235, name: "김천" },
  { km: 300, name: "대구" },
  { km: 370, name: "밀양" },
  { km: 425, name: "부산" },
  { km: 475, name: "후쿠오카" },
  { km: 620, name: "오사카" },
  { km: 720, name: "나고야" },
  { km: 850, name: "도쿄" },
  { km: 1200, name: "삿포로" },
  { km: 1600, name: "블라디보스토크" },
  { km: 2200, name: "베이징" },
  { km: 2600, name: "울란바토르" },
  { km: 4500, name: "모스크바" },
  { km: 5300, name: "베를린" },
  { km: 5600, name: "파리" },
] as const;

// 시즌 목표로 고를 수 있는 도시(= CHECKPOINTS 그대로, 서울 출발점 제외).
export const GOAL_CITY_OPTIONS = CHECKPOINTS.slice(1);

export function destinationNameOf(goalKm: number): string {
  return CHECKPOINTS.find((cp) => cp.km === goalKm)?.name ?? CHECKPOINTS[CHECKPOINTS.length - 1].name;
}

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
