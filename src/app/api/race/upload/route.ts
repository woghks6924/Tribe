import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireRaceMember } from "@/lib/auth/require-race";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { RACE_PROOFS_BUCKET } from "@/lib/race/storage";

export async function POST(request: Request) {
  const { session, response } = await requireRaceMember();
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없어요." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "파일이 너무 커요 (5MB 이하)." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }

  const path = `${session.sub}/${randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from(RACE_PROOFS_BUCKET)
    .upload(path, file, { contentType: file.type || "image/webp" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ path });
}
