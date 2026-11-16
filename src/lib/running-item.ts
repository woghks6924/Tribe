// 신청폼의 "협찬 품목" 질문: 품목 이름(링크 포함) + 사이즈 + 기장 + 색상을 한 번에 받는다.
// 브라우저 번들에도 들어가는 순수 유틸 — prisma 등 서버 전용 의존성을 들이지 않는다.

export type ItemAttrKey = "size" | "length" | "color";

export const ITEM_ATTRS: { key: ItemAttrKey; label: string; prefix: string; placeholder: string }[] = [
  { key: "size", label: "사이즈", prefix: "사이즈: ", placeholder: "예: M, 270" },
  { key: "length", label: "기장", prefix: "기장: ", placeholder: "예: 크롭, 롱" },
  { key: "color", label: "색상", prefix: "색상: ", placeholder: "예: 블랙" },
];

export type ItemFieldConfig = {
  askSize?: boolean; // 사이즈 받기(기본 true)
  askColor?: boolean; // 색상 받기(기본 true)
  askLength?: boolean; // 기장 받기(기본 false — 필요한 품목만 켠다)
  sizeOptions?: string[]; // 비어 있으면 직접 입력
  colorOptions?: string[];
  lengthOptions?: string[];
  // 선택지가 있어도 "직접 입력"을 허용할지(색상이 너무 많을 때 대표 색상만 선택지로 주고 나머지는 직접 적게 할 때)
  customSize?: boolean;
  customColor?: boolean;
  customLength?: boolean;
};

export type ItemAttrSpec = {
  key: ItemAttrKey;
  label: string;
  prefix: string;
  placeholder: string;
  options: string[]; // 비어 있으면 직접 입력만
  allowCustom: boolean; // 선택지가 있을 때 직접 입력도 허용
};

// 이 품목에서 받는 항목들(순서: 사이즈 → 기장 → 색상).
export function itemAttrs(f: ItemFieldConfig): ItemAttrSpec[] {
  const on: Record<ItemAttrKey, boolean> = { size: f.askSize !== false, length: f.askLength === true, color: f.askColor !== false };
  const options: Record<ItemAttrKey, string[]> = {
    size: f.sizeOptions ?? [],
    length: f.lengthOptions ?? [],
    color: f.colorOptions ?? [],
  };
  const custom: Record<ItemAttrKey, boolean> = {
    size: f.customSize === true,
    length: f.customLength === true,
    color: f.customColor === true,
  };
  return ITEM_ATTRS.filter((a) => on[a.key]).map((a) => ({ ...a, options: options[a.key], allowCustom: custom[a.key] }));
}

export type ItemValues = Record<ItemAttrKey, string>;

// 답변은 기존 질문과 같은 형식(string[])으로 저장한다 → ["사이즈: M", "기장: 롱", "색상: 블랙"].
// 관리자 화면·CSV는 배열을 ", "로 이어 붙여서 그대로 보여주므로 별도 처리가 필요 없다.
export function buildItemAnswer(values: Partial<ItemValues>): string[] {
  return ITEM_ATTRS.flatMap((a) => {
    const v = (values[a.key] ?? "").trim();
    return v ? [`${a.prefix}${v}`] : [];
  });
}

export function parseItemAnswer(value: unknown): ItemValues {
  const arr = Array.isArray(value) ? value.map(String) : [];
  const pick = (prefix: string) => arr.find((v) => v.startsWith(prefix))?.slice(prefix.length) ?? "";
  return { size: pick(ITEM_ATTRS[0].prefix), length: pick(ITEM_ATTRS[1].prefix), color: pick(ITEM_ATTRS[2].prefix) };
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
