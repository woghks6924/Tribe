// 신청폼의 "협찬 품목" 질문: 품목 이름(링크 포함) + 사이즈 + 색상을 한 번에 받는다.
// 브라우저 번들에도 들어가는 순수 유틸 — prisma 등 서버 전용 의존성을 들이지 않는다.

export const ITEM_SIZE_PREFIX = "사이즈: ";
export const ITEM_COLOR_PREFIX = "색상: ";

export type ItemFieldConfig = {
  askSize?: boolean; // 사이즈 받기(기본 true)
  askColor?: boolean; // 색상 받기(기본 true)
  sizeOptions?: string[]; // 비어 있으면 직접 입력
  colorOptions?: string[]; // 비어 있으면 직접 입력
};

export const asksSize = (f: ItemFieldConfig) => f.askSize !== false;
export const asksColor = (f: ItemFieldConfig) => f.askColor !== false;

// 답변은 기존 질문과 같은 형식(string[])으로 저장한다 → ["사이즈: M", "색상: 블랙"].
// 관리자 화면·CSV는 배열을 ", "로 이어 붙여서 그대로 보여주므로 별도 처리가 필요 없다.
export function buildItemAnswer(size: string, color: string): string[] {
  const out: string[] = [];
  if (size.trim()) out.push(`${ITEM_SIZE_PREFIX}${size.trim()}`);
  if (color.trim()) out.push(`${ITEM_COLOR_PREFIX}${color.trim()}`);
  return out;
}

export function parseItemAnswer(value: unknown): { size: string; color: string } {
  const arr = Array.isArray(value) ? value.map(String) : [];
  const pick = (prefix: string) => arr.find((v) => v.startsWith(prefix))?.slice(prefix.length) ?? "";
  return { size: pick(ITEM_SIZE_PREFIX), color: pick(ITEM_COLOR_PREFIX) };
}

// 링크는 http(s)만 쓴다(관리자가 잘못 넣은 javascript: 같은 주소가 화면에 걸리지 않게).
export function safeHttpUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}
