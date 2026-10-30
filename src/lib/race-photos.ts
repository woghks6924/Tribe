// 대회 사진 찾기 — 공용 타입과 검색 도우미. DB·서버 함수 없이 정적 JSON(public/race-photos/[event]/index.json)만 쓴다.
// DOM/Node 의존성이 없어서 서버(이벤트 목록)와 클라이언트(검색)가 같이 쓴다.

export type RacePhotoEvent = {
  slug: string;
  name: string;
  date: string; // YYYY-MM-DD (KST)
  driveFolderUrl: string;
  contact: string;
};

export type RacePhoto = {
  id: string;
  driveId: string;
  takenAt: string; // ISO 8601 (+09:00)
  spot: string;
  bibs: string[];
};

export type RacePhotoIndex = {
  event: RacePhotoEvent;
  spots: string[];
  photos: RacePhoto[];
};

// 사진 데이터(index.json + thumbs)가 있는 곳. 두 가지가 있다.
//  - 정적: 사이트에 같이 배포되는 public/race-photos/<slug>/ (STATIC_DATA_BASE)
//  - 저장소: 관리자 화면에서 올린 Supabase Storage 공개 버킷 (storageDataBase())
export const STATIC_DATA_BASE = "/race-photos";
export const RACE_PHOTO_BUCKET = "race-photos";
export const storageDataBase = () =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${RACE_PHOTO_BUCKET}`;

// 썸네일은 환경변수로 base만 바꾸면 다른 저장소(R2 등)로 옮길 수 있다(설정하면 위 두 곳보다 우선).
const THUMB_BASE_ENV = process.env.NEXT_PUBLIC_RACE_PHOTO_THUMB_BASE;

export const thumbUrl = (event: string, id: string, dataBase: string = STATIC_DATA_BASE) =>
  `${(THUMB_BASE_ENV ?? dataBase).replace(/\/+$/, "")}/${event}/thumbs/${id}.jpg`;
export const driveViewUrl = (driveId: string) => `https://drive.google.com/file/d/${driveId}/view`;
export const driveDownloadUrl = (driveId: string) => `https://drive.google.com/uc?export=download&id=${driveId}`;
// version: 사진 데이터를 다시 올렸을 때 브라우저·CDN 캐시를 피하려고 붙이는 숫자(대회 정보가 바뀐 시각).
export const indexUrl = (event: string, dataBase: string = STATIC_DATA_BASE, version?: number) =>
  `${dataBase.replace(/\/+$/, "")}/${event}/index.json${version ? `?v=${version}` : ""}`;

// 배번 비교용 정규화: 공백 제거, 대문자, 앞의 0 제거("0123" == "123").
export function normalizeBib(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "").replace(/^0+(?=.)/, "");
}

export type BibMap = Map<string, RacePhoto[]>;

// 배번 → 사진 목록 맵. JSON을 불러올 때 한 번만 만든다(촬영 시각 순).
export function buildBibMap(photos: RacePhoto[]): BibMap {
  const map: BibMap = new Map();
  const sorted = [...photos].sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt));
  for (const p of sorted) {
    for (const bib of new Set(p.bibs.map(normalizeBib))) {
      if (!bib) continue;
      const list = map.get(bib);
      if (list) list.push(p);
      else map.set(bib, [p]);
    }
  }
  return map;
}

export function searchByBib(map: BibMap, raw: string): RacePhoto[] {
  const key = normalizeBib(raw);
  return key ? (map.get(key) ?? []) : [];
}

// "HH:MM"(KST) → 대회 날짜의 그 시각(ms). 형식이 틀리면 null.
export function targetTimeMs(eventDate: string, hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  const ms = Date.parse(`${eventDate}T${String(h).padStart(2, "0")}:${m[2]}:00+09:00`);
  return Number.isNaN(ms) ? null : ms;
}

// 지점(spot이 빈 문자열이면 전체) + 통과 시각 ±rangeMin분 안의 사진. 목표 시각에 가까운 순서가 아니라 촬영 순서로.
export function searchByTime(photos: RacePhoto[], spot: string, targetMs: number, rangeMin: number): RacePhoto[] {
  const span = rangeMin * 60_000;
  return photos
    .filter((p) => (!spot || p.spot === spot) && Math.abs(Date.parse(p.takenAt) - targetMs) <= span)
    .sort((a, b) => Date.parse(a.takenAt) - Date.parse(b.takenAt));
}

// 촬영 시각 표시용(KST, HH:MM:SS)
export function formatTakenAt(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
