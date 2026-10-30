// 대회 사진 이벤트 읽기(빌드·재검증 시점). 사진 데이터는 두 곳 중 한 곳에 있다.
//  - 정적: public/race-photos/<slug>/index.json (사이트와 함께 배포)
//  - 저장소: 관리자 화면에서 올린 Supabase Storage 공개 버킷의 <slug>/index.json (배포 필요 없음)
// 사진 검색은 브라우저에서 index.json을 직접 받아서 한다. 여기서는 목록과 어느 쪽에 있는지만 정한다.
import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { STATIC_DATA_BASE, storageDataBase, type RacePhotoEvent, type RacePhotoIndex } from "@/lib/race-photos";

const ROOT = path.join(process.cwd(), "public", "race-photos");

export type RacePhotoEventSummary = {
  slug: string;
  name: string;
  date: string;
  photoCount: number;
};

export type RacePhotoEventOverride = RacePhotoEvent & { published: boolean; version: number };

// 관리자가 등록한 대회 정보(드라이브 링크·문의처·공개 여부). /photos는 정적 페이지라 빌드·재검증할 때만 읽는다.
// DB를 못 읽으면(빌드 환경 등) 빈 목록으로 두고 index.json의 event 값을 그대로 쓴다.
export async function getRacePhotoOverrides(): Promise<Map<string, RacePhotoEventOverride>> {
  try {
    const rows = await prisma.racePhotoEvent.findMany();
    return new Map(rows.map((r) => [r.slug, { ...r, version: r.updatedAt.getTime() }]));
  } catch {
    return new Map();
  }
}

// 폴더에 있는 대회 slug 전부(공개 여부와 무관).
async function listStaticSlugs(): Promise<string[]> {
  try {
    return (await fs.readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return [];
  }
}

async function readStaticIndex(slug: string): Promise<RacePhotoIndex | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(ROOT, slug, "index.json"), "utf8")) as RacePhotoIndex;
  } catch {
    return null;
  }
}

// 저장소에 올라간 index.json. 없으면 null. 5분 재검증이라 목록 페이지가 요청마다 저장소를 치지 않는다.
async function readStorageIndex(slug: string, version?: number): Promise<RacePhotoIndex | null> {
  try {
    const res = await fetch(`${storageDataBase()}/${slug}/index.json${version ? `?v=${version}` : ""}`, {
      next: { revalidate: 300 },
    });
    return res.ok ? ((await res.json()) as RacePhotoIndex) : null;
  } catch {
    return null;
  }
}

export type RacePhotoSource = {
  slug: string;
  dataBase: string; // 브라우저가 index.json·썸네일을 받는 곳
  version?: number;
  override: RacePhotoEventOverride | null;
  index: RacePhotoIndex;
};

// 이 대회의 사진 데이터가 어디 있는지. 공개 안 한 대회거나 데이터가 없으면 null(=404).
// 저장소(관리자 업로드)에 있으면 그쪽을 우선하고, 없으면 정적 폴더를 본다.
export async function resolveRacePhotoSource(
  slug: string,
  overrides?: Map<string, RacePhotoEventOverride>,
): Promise<RacePhotoSource | null> {
  const override = (overrides ?? (await getRacePhotoOverrides())).get(slug) ?? null;
  if (override && !override.published) return null;
  if (override) {
    const index = await readStorageIndex(slug, override.version);
    if (index) return { slug, dataBase: storageDataBase(), version: override.version, override, index };
  }
  const index = await readStaticIndex(slug);
  return index ? { slug, dataBase: STATIC_DATA_BASE, override, index } : null;
}

// generateStaticParams용: 정적 폴더와 등록된 공개 대회 slug.
export async function listRacePhotoSlugs(): Promise<string[]> {
  const set = new Set(await listStaticSlugs());
  for (const [slug, o] of await getRacePhotoOverrides()) if (o.published) set.add(slug);
  return [...set];
}

export async function listRacePhotoEvents(): Promise<RacePhotoEventSummary[]> {
  const overrides = await getRacePhotoOverrides();
  const set = new Set(await listStaticSlugs());
  for (const [slug, o] of overrides) if (o.published) set.add(slug);
  const sources = await Promise.all([...set].map((s) => resolveRacePhotoSource(s, overrides)));
  const events: RacePhotoEventSummary[] = [];
  for (const src of sources) {
    if (!src) continue;
    const { override: o, index: idx, slug } = src;
    events.push({
      slug,
      name: o?.name ?? idx.event?.name ?? slug,
      date: o?.date ?? idx.event?.date ?? "",
      photoCount: Array.isArray(idx.photos) ? idx.photos.length : 0,
    });
  }
  return events.sort((a, b) => b.date.localeCompare(a.date));
}
