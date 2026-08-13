"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const defaultBucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "product-images";

export const supabaseBrowser = createClient(url, anonKey);

// 용량이 큰 파일(영상 등)을 Vercel 서버를 거치지 않고 브라우저에서 Supabase Storage로
// 직접 업로드한다. 서명 URL은 /api/admin/upload/sign(관리자 전용)에서 발급받는다.
export async function uploadLargeFile(
  file: File,
  folder: string = "videos",
  bucket: string = defaultBucket,
): Promise<string> {
  const signRes = await fetch("/api/admin/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, folder, bucket }),
  });
  const signData = await signRes.json();
  if (!signRes.ok) {
    throw new Error(signData.error ?? "Failed to prepare upload.");
  }

  const { error } = await supabaseBrowser.storage
    .from(bucket)
    .uploadToSignedUrl(signData.path, signData.token, file);

  if (error) {
    throw new Error(error.message);
  }

  return signData.publicUrl as string;
}
