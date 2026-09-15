// 브라우저 번들에도 안전하게 들어갈 수 있는 순수 유틸 — prisma 등 서버 전용 의존성을 절대 들이지 않는다.

// 관리자가 "www.instagram.com/..."처럼 프로토콜 없이 입력해도 상대경로로 취급되지
// 않도록 https://를 보장한다 (없으면 /running/[id] 경로 뒤에 붙어버리는 문제 방지).
export function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
