import {
  isValidBottomType,
  isValidHairStyle,
  isValidHexColor,
  isValidProp,
  isValidShoeType,
  isValidTopType,
  type RaceAppearance,
  type RaceGender,
  type RaceSkinTone,
} from "@/lib/race/appearance";

export function isValidName(name: string): boolean {
  return name.length >= 2 && name.length <= 8;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

// 인스타그램 아이디: 선택 입력, 앞의 @는 제거하고 영문/숫자/./_만 허용(최대 30자).
export function normalizeAndValidateIgHandle(raw: string): { ok: boolean; value: string } {
  const value = raw.trim().replace(/^@/, "");
  if (value === "") return { ok: true, value: "" };
  return { ok: /^[A-Za-z0-9._]{1,30}$/.test(value), value };
}

export type RaceAppearanceInput = {
  gender?: string;
  skinTone?: string;
  hairStyle?: string;
  hairColor?: string;
  topType?: string;
  topColor?: string;
  bottomType?: string;
  bottomColor?: string;
  shoeType?: string;
  prop?: string;
};

// 성별에 따라 머리/상의/하의 종류가 갈리기 때문에, gender를 먼저 확정한 뒤 나머지를 검증한다.
export function validateAppearance(input: RaceAppearanceInput): { ok: true; value: RaceAppearance } | { ok: false; error: string } {
  const gender = input.gender === "female" ? "female" : input.gender === "male" ? "male" : null;
  if (!gender) return { ok: false, error: "성별을 선택해주세요." };
  const g = gender as RaceGender;

  const skinTone = input.skinTone;
  if (skinTone !== "light" && skinTone !== "medium" && skinTone !== "dark") {
    return { ok: false, error: "피부 톤을 선택해주세요." };
  }

  const hairStyle = input.hairStyle ?? "";
  if (!isValidHairStyle(g, hairStyle)) return { ok: false, error: "헤어스타일이 올바르지 않아요." };
  const topType = input.topType ?? "";
  if (!isValidTopType(g, topType)) return { ok: false, error: "상의 종류가 올바르지 않아요." };
  const bottomType = input.bottomType ?? "";
  if (!isValidBottomType(g, bottomType)) return { ok: false, error: "하의 종류가 올바르지 않아요." };
  const shoeType = input.shoeType ?? "";
  if (!isValidShoeType(shoeType)) return { ok: false, error: "신발 종류가 올바르지 않아요." };

  const hairColor = input.hairColor ?? "";
  const topColor = input.topColor ?? "";
  const bottomColor = input.bottomColor ?? "";
  if (!isValidHexColor(hairColor) || !isValidHexColor(topColor) || !isValidHexColor(bottomColor)) {
    return { ok: false, error: "색상 값이 올바르지 않아요." };
  }

  const propRaw = input.prop ?? "";
  if (propRaw && !isValidProp(propRaw)) return { ok: false, error: "소지품이 올바르지 않아요." };

  return {
    ok: true,
    value: {
      gender: g,
      skinTone: skinTone as RaceSkinTone,
      hairStyle,
      hairColor,
      topType,
      topColor,
      bottomType,
      bottomColor,
      shoeType,
      prop: propRaw ? (propRaw as RaceAppearance["prop"]) : null,
    },
  };
}
