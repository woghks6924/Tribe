import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const { response } = await requireAdmin();
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  const bucket = (formData.get("bucket") as string) || STORAGE_BUCKET;
  const folder = (formData.get("folder") as string) || "products";

  let supabase;
  try {
    supabase = getSupabaseAdmin();
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${folder}/${randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
