import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { RACE_PHOTO_BUCKET, type RacePhoto, type RacePhotoIndex } from "@/lib/race-photos";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const MAX_PHOTOS = 10000;
const ID_RE = /^p\d{4,6}$/;
const DRIVE_ID_RE = /^[A-Za-z0-9_-]{10,}$/;

// 올린 썸네일에 맞는 index.json을 저장소에 쓴다. 대회 정보(이름·날짜·링크·문의처)는 DB 값으로 채운다.
// 이 호출이 끝나는 순간부터 /photos에서 검색할 수 있다(배포 필요 없음).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const event = await prisma.racePhotoEvent.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "대회를 찾을 수 없어요." }, { status: 404 });

  const body = (await request.json()) as { photos?: unknown; spots?: unknown };
  if (!Array.isArray(body.photos) || body.photos.length === 0 || body.photos.length > MAX_PHOTOS) {
    return NextResponse.json({ error: `사진은 1~${MAX_PHOTOS}장이어야 해요.` }, { status: 400 });
  }
  const spots = Array.isArray(body.spots) ? body.spots.map((s) => String(s).trim()).filter(Boolean).slice(0, 20) : [];

  const photos: RacePhoto[] = [];
  const seen = new Set<string>();
  for (const raw of body.photos as Record<string, unknown>[]) {
    const pid = String(raw.id ?? "");
    const driveId = String(raw.driveId ?? "");
    const takenAt = String(raw.takenAt ?? "");
    const spot = String(raw.spot ?? "").trim();
    const bibs = Array.isArray(raw.bibs) ? raw.bibs.map((b) => String(b).trim()).filter(Boolean) : [];
    if (!ID_RE.test(pid) || seen.has(pid)) return NextResponse.json({ error: `잘못된 사진 ID: ${pid}` }, { status: 400 });
    if (driveId && !DRIVE_ID_RE.test(driveId)) return NextResponse.json({ error: `잘못된 드라이브 ID: ${pid}` }, { status: 400 });
    if (Number.isNaN(Date.parse(takenAt))) return NextResponse.json({ error: `잘못된 촬영 시각: ${pid}` }, { status: 400 });
    if (bibs.length > 10 || bibs.some((b) => b.length > 20)) return NextResponse.json({ error: `잘못된 배번: ${pid}` }, { status: 400 });
    seen.add(pid);
    photos.push({ id: pid, driveId, takenAt, spot, bibs });
  }

  const index: RacePhotoIndex = {
    event: { slug: event.slug, name: event.name, date: event.date, driveFolderUrl: event.driveFolderUrl, contact: event.contact },
    spots: spots.length ? spots : [...new Set(photos.map((p) => p.spot).filter(Boolean))],
    photos,
  };

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
  const bucket = supabase.storage.from(RACE_PHOTO_BUCKET);
  const up = await bucket.upload(`${event.slug}/index.json`, JSON.stringify(index), {
    contentType: "application/json",
    upsert: true,
    cacheControl: "60",
  });
  if (up.error) return NextResponse.json({ error: `index.json 저장 실패: ${up.error.message}` }, { status: 500 });

  // 이번에 쓰이지 않는 예전 썸네일은 지운다(사진을 다시 올릴 때 용량이 쌓이지 않게).
  const keep = new Set(photos.map((p) => `${p.id}.jpg`));
  const stale: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data } = await bucket.list(`${event.slug}/thumbs`, { limit: 1000, offset });
    if (!data || data.length === 0) break;
    for (const f of data) if (!keep.has(f.name)) stale.push(`${event.slug}/thumbs/${f.name}`);
    if (data.length < 1000) break;
  }
  if (stale.length) await bucket.remove(stale);

  // 대회 정보 행을 건드려서 version(updatedAt)을 바꾸고, /photos 캐시를 비운다.
  await prisma.racePhotoEvent.update({ where: { id }, data: { contact: event.contact } });
  revalidatePath("/photos", "layout");
  return NextResponse.json({ ok: true, count: photos.length, removedStale: stale.length });
}
