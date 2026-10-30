// 이벤트 목록 읽기(빌드 시점). public/race-photos 아래 폴더마다 index.json을 읽어서 목록을 만든다.
// DB·API는 쓰지 않는다. /photos 페이지는 정적으로 만들어져서 런타임에는 파일을 읽지 않는다.
import { promises as fs } from "node:fs";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import type { RacePhotoEvent, RacePhotoIndex } from "@/lib/race-photos";

const ROOT = path.join(process.cwd(), "public", "race-photos");

export type RacePhotoEventSummary = {
  slug: string;
  name: string;
  date: string;
  photoCount: number;
};

export type RacePhotoEventOverride = RacePhotoEvent & { published: boolean };

// 관리자가 등록한 대회 정보(드라이브 링크·문의처·공개 여부). /photos는 정적 페이지라 빌드·재검증할 때만 읽는다.
// DB를 못 읽으면(빌드 환경 등) 빈 목록으로 두고 index.json의 event 값을 그대로 쓴다.
export async function getRacePhotoOverrides(): Promise<Map<string, RacePhotoEventOverride>> {
  try {
    const rows = await prisma.racePhotoEvent.findMany();
    return new Map(rows.map((r) => [r.slug, { ...r }]));
  } catch {
    return new Map();
  }
}

// 폴더에 있는 대회 slug 전부(공개 여부와 무관) — generateStaticParams용.
export async function listRacePhotoSlugs(): Promise<string[]> {
  try {
    return (await fs.readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return [];
  }
}

export async function listRacePhotoEvents(): Promise<RacePhotoEventSummary[]> {
  let dirs: string[] = [];
  try {
    dirs = (await fs.readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return [];
  }
  const overrides = await getRacePhotoOverrides();
  const events: RacePhotoEventSummary[] = [];
  for (const slug of dirs) {
    const o = overrides.get(slug);
    if (o && !o.published) continue; // 관리자가 숨긴 대회
    try {
      const idx = JSON.parse(await fs.readFile(path.join(ROOT, slug, "index.json"), "utf8")) as RacePhotoIndex;
      events.push({
        slug,
        name: o?.name ?? idx.event?.name ?? slug,
        date: o?.date ?? idx.event?.date ?? "",
        photoCount: Array.isArray(idx.photos) ? idx.photos.length : 0,
      });
    } catch {
      // index.json이 없거나 깨진 폴더는 목록에서 뺀다.
    }
  }
  return events.sort((a, b) => b.date.localeCompare(a.date));
}
