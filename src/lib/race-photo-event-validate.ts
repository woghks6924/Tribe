// 대회 사진 대회 정보 입력 검증(관리자 API 공용).
export type PhotoEventInput = {
  slug: string;
  name: string;
  date: string;
  driveFolderUrl: string;
  contact: string;
  published: boolean;
};

const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,39}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 구글 드라이브 폴더 링크만 받는다(다른 주소를 사진 페이지에 걸어두지 않도록).
function isDriveUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && (u.hostname === "drive.google.com" || u.hostname === "docs.google.com");
  } catch {
    return false;
  }
}

export function validatePhotoEvent(
  body: Partial<Record<keyof PhotoEventInput, unknown>>,
  opts: { partial?: boolean } = {},
): { ok: true; value: Partial<PhotoEventInput> } | { ok: false; error: string } {
  const out: Partial<PhotoEventInput> = {};
  const has = (k: keyof PhotoEventInput) => body[k] !== undefined;

  if (!opts.partial || has("slug")) {
    const slug = String(body.slug ?? "").trim();
    if (!SLUG_RE.test(slug)) return { ok: false, error: "slug는 영문 소문자·숫자·하이픈 2~40자예요. 예: jtbc-2026" };
    out.slug = slug;
  }
  if (!opts.partial || has("name")) {
    const name = String(body.name ?? "").trim();
    if (!name || name.length > 80) return { ok: false, error: "대회 이름을 1~80자로 입력해 주세요." };
    out.name = name;
  }
  if (!opts.partial || has("date")) {
    const date = String(body.date ?? "").trim();
    if (!DATE_RE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00+09:00`))) {
      return { ok: false, error: "대회 날짜를 YYYY-MM-DD 형식으로 입력해 주세요." };
    }
    out.date = date;
  }
  if (!opts.partial || has("driveFolderUrl")) {
    const url = String(body.driveFolderUrl ?? "").trim();
    if (!isDriveUrl(url)) return { ok: false, error: "구글 드라이브 폴더 링크(https://drive.google.com/...)를 입력해 주세요." };
    out.driveFolderUrl = url;
  }
  if (!opts.partial || has("contact")) {
    const contact = String(body.contact ?? "").trim();
    if (!contact || contact.length > 80) return { ok: false, error: "삭제 요청 문의처를 1~80자로 입력해 주세요." };
    out.contact = contact;
  }
  if (has("published")) out.published = body.published === true;
  return { ok: true, value: out };
}
