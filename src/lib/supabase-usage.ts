import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase-admin";

// Supabase Free 플랜 한도(2026년 기준) — 대시보드 없이도 얼마나 남았는지 가늠하기 위한 참고값.
export const FREE_TIER_LIMITS = {
  dbBytes: 500 * 1024 * 1024, // 500MB
  storageBytes: 1024 * 1024 * 1024, // 1GB
};

async function listAllFilesRecursive(
  bucket: string,
  prefix = "",
): Promise<{ totalBytes: number; fileCount: number }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });
  if (error) throw error;

  let totalBytes = 0;
  let fileCount = 0;
  for (const item of data ?? []) {
    // Supabase Storage는 진짜 폴더 개념이 없어서, id가 없는 항목을 "폴더"로 취급해 재귀 탐색한다.
    if (item.id === null) {
      const subPath = prefix ? `${prefix}/${item.name}` : item.name;
      const sub = await listAllFilesRecursive(bucket, subPath);
      totalBytes += sub.totalBytes;
      fileCount += sub.fileCount;
    } else {
      totalBytes += item.metadata?.size ?? 0;
      fileCount += 1;
    }
  }
  return { totalBytes, fileCount };
}

export async function getSupabaseUsage(): Promise<{
  dbBytes: number;
  storageBytes: number;
  storageFileCount: number;
  limits: typeof FREE_TIER_LIMITS;
}> {
  const [dbResult, storageResult] = await Promise.all([
    prisma.$queryRaw<{ bytes: bigint }[]>`SELECT pg_database_size(current_database()) AS bytes`,
    listAllFilesRecursive(STORAGE_BUCKET),
  ]);

  return {
    dbBytes: Number(dbResult[0]?.bytes ?? 0),
    storageBytes: storageResult.totalBytes,
    storageFileCount: storageResult.fileCount,
    limits: FREE_TIER_LIMITS,
  };
}
