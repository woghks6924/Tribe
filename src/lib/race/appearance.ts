// 레이어드 픽셀아트 캐릭터 꾸미기 — public/race-parts/의 실제 이미지 에셋을 조합한다.
// 옷/머리 에셋은 중립색(흰색/연회색, 어두운 갈색)으로 만들어져 있고, 색상은 런타임에
// tint(곱연산 합성)로 입힌다 — 그래서 색상 값은 자유로운 hex고, 종류(타입)만 정해진 목록이다.

export type RaceGender = "male" | "female";
export type RaceSkinTone = "light" | "medium" | "dark";
export type RaceProp = "yoga-mat" | "kettlebell" | "dumbbells" | "gym-bag";

export const SKIN_TONE_OPTIONS: { value: RaceSkinTone; label: string }[] = [
  { value: "light", label: "밝은 톤" },
  { value: "medium", label: "중간 톤" },
  { value: "dark", label: "어두운 톤" },
];

export const HAIR_STYLES: Record<RaceGender, { value: string; label: string }[]> = {
  male: [
    { value: "male-short", label: "숏컷" },
    { value: "male-spiky", label: "스파이키" },
  ],
  female: [
    { value: "female-bob", label: "단발" },
    { value: "female-ponytail", label: "포니테일" },
  ],
};

export const TOP_TYPES: Record<RaceGender, { value: string; label: string }[]> = {
  male: [
    { value: "short-sleeve", label: "반팔" },
    { value: "tank-top", label: "나시" },
    { value: "long-sleeve", label: "긴팔" },
    { value: "hoodie", label: "후드" },
  ],
  female: [{ value: "bra-top", label: "브라탑" }],
};

export const BOTTOM_TYPES: Record<RaceGender, { value: string; label: string }[]> = {
  male: [
    { value: "shorts", label: "반바지" },
    { value: "sweatpants", label: "후드 하의" },
  ],
  female: [
    { value: "leggings", label: "레깅스" },
    { value: "bike-shorts", label: "반바지 레깅스" },
  ],
};

export const SHOE_TYPES: { value: string; label: string }[] = [
  { value: "sneakers", label: "운동화" },
  { value: "slippers", label: "슬리퍼" },
];

export const PROP_OPTIONS: { value: RaceProp | ""; label: string }[] = [
  { value: "", label: "없음" },
  { value: "yoga-mat", label: "요가매트" },
  { value: "kettlebell", label: "케틀벨" },
  { value: "dumbbells", label: "덤벨" },
  { value: "gym-bag", label: "짐백" },
];

// 꾸미기 색상 프리셋 — 옷/머리 색 고를 때 보여줄 기본 팔레트. 자유 입력도 허용할 거라
// "정해진 목록"이 아니라 그냥 빠른 선택용 프리셋이다.
export const APPAREL_COLOR_PRESETS = [
  "#2f3136",
  "#6aa7f0",
  "#ef7b57",
  "#7dcf8b",
  "#e8c655",
  "#c690e6",
  "#f294b6",
  "#58c9c0",
  "#ffffff",
  "#95a2ff",
];

export const HAIR_COLOR_PRESETS = ["#0e0e0e", "#2b1c12", "#4a2f23", "#7a4a2b", "#b5651d", "#d4a843", "#e8dcc8"];

export function defaultHairStyleFor(gender: RaceGender): string {
  return HAIR_STYLES[gender][0].value;
}
export function defaultTopTypeFor(gender: RaceGender): string {
  return TOP_TYPES[gender][0].value;
}
export function defaultBottomTypeFor(gender: RaceGender): string {
  return BOTTOM_TYPES[gender][0].value;
}

export function isValidHairStyle(gender: RaceGender, value: string): boolean {
  return HAIR_STYLES[gender].some((o) => o.value === value);
}
export function isValidTopType(gender: RaceGender, value: string): boolean {
  return TOP_TYPES[gender].some((o) => o.value === value);
}
export function isValidBottomType(gender: RaceGender, value: string): boolean {
  return BOTTOM_TYPES[gender].some((o) => o.value === value);
}
export function isValidShoeType(value: string): boolean {
  return SHOE_TYPES.some((o) => o.value === value);
}
export function isValidProp(value: string): boolean {
  return PROP_OPTIONS.some((o) => o.value === value);
}
export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export type RaceAppearance = {
  gender: RaceGender;
  skinTone: RaceSkinTone;
  hairStyle: string;
  hairColor: string;
  topType: string;
  topColor: string;
  bottomType: string;
  bottomColor: string;
  shoeType: string;
  prop: RaceProp | null;
};

// 각 에셋을 몸통 대비 얼마나 축소하고, 어디(몸통 높이 비율)에 배치할지 — 실제로 겹쳐보고
// 보정한 값이다. width는 "몸통 이미지의 실제 픽셀 너비 대비 배율"이 아니라 에셋 자체를
// 이 배율로 리사이즈한다는 뜻(에셋마다 원본 해상도가 달라서 절대값이 아니라 상대 배율로 둠).
export type LayerFit = { scale: number; topRatio: number };

const CLOTHING_SHEET_SCALE = 0.62; // male-clothes/female-clothes 시트에서 나온 옷들의 공통 보정 배율
const FEMALE_SHEET_SCALE = 0.57;

export const TOP_FIT: Record<string, LayerFit> = {
  // hoodie는 다른 시트(별도로 받은 이미지)에서 잘라내서 몸통 대비 픽셀 밀도가 달라 —
  // 공용 CLOTHING_SHEET_SCALE 대신 실측(반팔과 같은 세로 길이가 되도록) 보정값을 따로 둔다.
  hoodie: { scale: 0.73, topRatio: 0.12 },
  "long-sleeve": { scale: CLOTHING_SHEET_SCALE, topRatio: 0.14 },
  "short-sleeve": { scale: CLOTHING_SHEET_SCALE, topRatio: 0.14 },
  "tank-top": { scale: CLOTHING_SHEET_SCALE, topRatio: 0.15 },
  "bra-top": { scale: FEMALE_SHEET_SCALE, topRatio: 0.17 },
};

export const BOTTOM_FIT: Record<string, LayerFit> = {
  shorts: { scale: CLOTHING_SHEET_SCALE, topRatio: 0.5 },
  sweatpants: { scale: CLOTHING_SHEET_SCALE, topRatio: 0.5 },
  leggings: { scale: FEMALE_SHEET_SCALE + 0.03, topRatio: 0.42 },
  "bike-shorts": { scale: FEMALE_SHEET_SCALE, topRatio: 0.42 },
};

export const SHOE_FIT: Record<string, LayerFit> = {
  sneakers: { scale: 0.55, topRatio: 0.88 },
  slippers: { scale: 0.55, topRatio: 0.9 },
};

export const HAIR_FIT: Record<string, LayerFit> = {
  "male-short": { scale: 1.0, topRatio: -0.1 },
  "male-spiky": { scale: 1.0, topRatio: -0.12 },
  "female-bob": { scale: 1.0, topRatio: -0.1 },
  "female-ponytail": { scale: 1.0, topRatio: -0.12 },
};

// DB에서 읽은 느슨한 string 필드들을 RaceAppearance로 좁힌다 (렌더링 직전에 사용).
export function appearanceOf(m: {
  gender: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  topType: string;
  topColor: string;
  bottomType: string;
  bottomColor: string;
  shoeType: string;
  prop: string | null;
}): RaceAppearance {
  return {
    gender: m.gender === "female" ? "female" : "male",
    skinTone: m.skinTone === "medium" || m.skinTone === "dark" ? m.skinTone : "light",
    hairStyle: m.hairStyle,
    hairColor: m.hairColor,
    topType: m.topType,
    topColor: m.topColor,
    bottomType: m.bottomType,
    bottomColor: m.bottomColor,
    shoeType: m.shoeType,
    prop: (m.prop as RaceProp | null) ?? null,
  };
}

export function assetPath(kind: "body" | "hair" | "top" | "bottom" | "shoe" | "prop", value: string, gender?: RaceGender): string {
  if (kind === "body") return `/race-parts/body/${value}.png`;
  if (kind === "hair") return `/race-parts/hair/${value}.png`;
  if (kind === "shoe") return `/race-parts/shoes/${value}.png`;
  if (kind === "prop") return `/race-parts/props/${value}.png`;
  const folder = gender === "female" ? "female-clothes" : "male-clothes";
  return `/race-parts/${folder}/${value}.png`;
}
