import { ACC_OPTIONS, EYE_OPTIONS, PALETTE, type RaceAcc, type RaceEye } from "@/lib/race/constants";

export function isValidName(name: string): boolean {
  return name.length >= 2 && name.length <= 8;
}

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export function isValidColor(color: string): color is (typeof PALETTE)[number] {
  return (PALETTE as readonly string[]).includes(color);
}

export function isValidEye(eye: string): eye is RaceEye {
  return EYE_OPTIONS.some((o) => o.value === eye);
}

export function isValidAcc(acc: string): acc is RaceAcc {
  return ACC_OPTIONS.some((o) => o.value === acc);
}

// 인스타그램 아이디: 선택 입력, 앞의 @는 제거하고 영문/숫자/./_만 허용(최대 30자).
export function normalizeAndValidateIgHandle(raw: string): { ok: boolean; value: string } {
  const value = raw.trim().replace(/^@/, "");
  if (value === "") return { ok: true, value: "" };
  return { ok: /^[A-Za-z0-9._]{1,30}$/.test(value), value };
}
