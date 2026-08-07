import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase-admin";

// 영상처럼 용량이 큰 파일은 Vercel 서버리스 함수의 요청 본문 크기 제한에 걸릴 수 있어,
// 여기서는 업로드용 서명 URL만 발급하고 실제 파일 전송은 브라우저에서 Supabase로 직접 한다.
export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = (await request.json()) as { filename: string; folder?: string };
  if (!body.filename) {
    return NextResponse.json({ error: "filename is required." }, { status: 400 });
  }

  const ext = body.filename.split(".").pop() ?? "mp4";
  const path = `${body.folder ?? "videos"}/${randomUUID()}.${ext}`;

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }

  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUploadUrl(path);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return NextResponse.json({ token: data.token, path: data.path, publicUrl: pub.publicUrl });
}
