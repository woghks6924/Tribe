// 이벤트 목록 읽기(빌드 시점). public/race-photos 아래 폴더마다 index.json을 읽어서 목록을 만든다.
// DB·API는 쓰지 않는다. /photos 페이지는 정적으로 만들어져서 런타임에는 파일을 읽지 않는다.
import { promises as fs } from "node:fs";
import path from "node:path";
import type { RacePhotoIndex } from "@/lib/race-photos";

const ROOT = path.join(process.cwd(), "public", "race-photos");

export type RacePhotoEventSummary = {
  slug: string;
  name: string;
  date: string;
  photoCount: number;
};

export async function listRacePhotoEvents(): Promise<RacePhotoEventSummary[]> {
  let dirs: string[] = [];
  try {
    dirs = (await fs.readdir(ROOT, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return [];
  }
  const events: RacePhotoEventSummary[] = [];
  for (const slug of dirs) {
    try {
      const idx = JSON.parse(await fs.readFile(path.join(ROOT, slug, "index.json"), "utf8")) as RacePhotoIndex;
      events.push({
        slug,
        name: idx.event?.name ?? slug,
        date: idx.event?.date ?? "",
        photoCount: Array.isArray(idx.photos) ? idx.photos.length : 0,
      });
    } catch {
      // index.json이 없거나 깨진 폴더는 목록에서 뺀다.
    }
  }
  return events.sort((a, b) => b.date.localeCompare(a.date));
}
