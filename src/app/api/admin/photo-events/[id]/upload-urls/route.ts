import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { RACE_PHOTO_BUCKET } from "@/lib/race-photos";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const THUMB_RE = /^p\d{4,6}\.jpg$/;
const MAX_PER_CALL = 100;

// 썸네일 업로드용 서명 URL 발급. 파일 자체는 브라우저가 Supabase로 직접 올린다(Vercel 요청 크기 제한을 피하려고).
// 올릴 수 있는 경로는 <slug>/thumbs/pNNNN.jpg 로만 제한한다.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;
  const { id } = await params;

  const event = await prisma.racePhotoEvent.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "대회를 찾을 수 없어요." }, { status: 404 });

  const body = (await request.json()) as { names?: string[] };
  const names = body.names ?? [];
  if (names.length === 0 || names.length > MAX_PER_CALL || names.some((n) => !THUMB_RE.test(n))) {
    return NextResponse.json({ error: "잘못된 요청이에요." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }

  // 공개 버킷이 없으면 만든다(이미 있으면 그대로 둔다).
  const bucket = await supabase.storage.getBucket(RACE_PHOTO_BUCKET);
  if (bucket.error) {
    const created = await supabase.storage.createBucket(RACE_PHOTO_BUCKET, { public: true });
    if (created.error && !/already exists/i.test(created.error.message)) {
      return NextResponse.json({ error: `저장 버킷을 만들지 못했어요: ${created.error.message}` }, { status: 500 });
    }
  }

  const results = await Promise.all(
    names.map(async (n) => {
      const path = `${event.slug}/thumbs/${n}`;
      const { data, error } = await supabase.storage.from(RACE_PHOTO_BUCKET).createSignedUploadUrl(path, { upsert: true });
      return error || !data ? { name: n, error: error?.message ?? "failed" } : { name: n, path: data.path, token: data.token };
    }),
  );
  return NextResponse.json({ results });
}
