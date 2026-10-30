import type { Metadata } from "next";

// 러너 사진이 검색엔진에 노출되지 않도록 /photos 하위 전체에 noindex.
export const metadata: Metadata = {
  title: "대회 사진 찾기 — Tri.be",
  robots: { index: false, follow: false, nocache: true },
};

// 쇼핑몰 상단 메뉴·푸터 없이 보여주는 독립 페이지(SiteChrome에서 /photos는 크롬을 뺀다).
// 브랜드만 알아보도록 로고를 링크 없이 작게 둔다. 로고 색은 사이트 테마(라이트/다크)에 맞춰 바뀐다.
export default function PhotosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-base text-ink">
      <div className="px-5 pt-6 sm:px-8">
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image 최적화를 쓰지 않는 정적 로고 */}
        <img src="/logo/tribe-logo-black.png" alt="Tri.be" width={473} height={100} className="hidden h-5 w-auto [[data-theme=light]_&]:block" />
        {/* eslint-disable-next-line @next/next/no-img-element -- next/image 최적화를 쓰지 않는 정적 로고 */}
        <img src="/logo/tribe-logo-white.png" alt="Tri.be" width={473} height={100} className="block h-5 w-auto [[data-theme=light]_&]:hidden" />
      </div>
      {children}
    </div>
  );
}
