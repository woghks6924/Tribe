// 러닝 신청폼 답변 검증·본인 확인 도우미(서버 전용). 신청과 "신청 내용 수정"이 같은 규칙을 쓴다.
import type { RunningFormField } from "@/lib/running";
import { itemAttrs, parseItemAnswer } from "@/lib/running-item";

export function normalizePhone(v: string): string {
  return v.replace(/\D/g, "");
}

export function normalizeInstagram(v: string): string {
  return v.trim().replace(/^@/, "").toLowerCase();
}

// 답변이 이 폼의 질문 규칙(필수, 협찬 품목 선택지·길이)을 지키는지 본다. 문제가 있으면 안내 문구를, 없으면 null.
export function validateAnswers(fields: RunningFormField[], answers: Record<string, string | string[]>): string | null {
  for (const field of fields) {
    // 협찬 품목: 사이즈·기장·색상이 선택지에 있는 값인지(직접 입력을 허용한 항목은 자유 입력), 필수일 때는 빠진 게 없는지.
    if (field.type === "item") {
      const values = parseItemAnswer(answers[field.id]);
      for (const attr of itemAttrs(field)) {
        const value = values[attr.key];
        const particle = attr.label === "사이즈" ? "를" : "을"; // 받침 없는 말(사이즈)은 를, 나머지(기장·색상)는 을
        if (!value) {
          if (field.required) return `${field.label}의 ${attr.label}${particle} 입력해주세요.`;
          continue;
        }
        if (attr.options.length > 0 && !attr.allowCustom && !attr.options.includes(value)) {
          return `${field.label}의 ${attr.label} 선택이 올바르지 않아요.`;
        }
        if (value.length > 40) return `${field.label}의 ${attr.label}${attr.label === "사이즈" ? "가" : "이"} 너무 길어요.`;
      }
      continue;
    }
    if (!field.required) continue;
    const value = answers[field.id];
    const isEmpty =
      value == null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && value.length === 0);
    if (isEmpty) return `${field.label}을(를) 입력해주세요.`;
  }
  return null;
}

// 클라이언트가 보낸 answers에서 이 폼의 질문 id만, 문자열/문자열 목록 형태로만 남긴다(빈 값은 뺀다).
export function sanitizeAnswers(
  fields: RunningFormField[],
  raw: unknown,
): { ok: true; answers: Record<string, string | string[]> } | { ok: false; error: string } {
  const ids = new Set(fields.map((f) => f.id));
  const out: Record<string, string | string[]> = {};
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "잘못된 답변 형식이에요." };
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!ids.has(key)) continue;
    if (typeof value === "string") {
      if (value.length > 2000) return { ok: false, error: "답변이 너무 길어요." };
      if (value.trim()) out[key] = value.trim();
    } else if (Array.isArray(value) && value.length <= 50 && value.every((v) => typeof v === "string" && v.length <= 200)) {
      if (value.length) out[key] = value as string[];
    } else {
      return { ok: false, error: "잘못된 답변 형식이에요." };
    }
  }
  return { ok: true, answers: out };
}
