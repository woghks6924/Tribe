export const RACE_PROOFS_BUCKET = "race-proofs";
export const PROOF_RETENTION_HOURS = 24;

// 버킷이 public이라 Supabase 클라이언트 없이도 결정적으로 조립 가능한 공개 URL.
export function raceProofPublicUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${RACE_PROOFS_BUCKET}/${path}`;
}
