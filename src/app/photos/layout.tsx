import type { Metadata } from "next";

// 러너 사진이 검색엔진에 노출되지 않도록 /photos 하위 전체에 noindex.
export const metadata: Metadata = {
  title: "대회 사진 찾기 — Tri.be",
  robots: { index: false, follow: false, nocache: true },
};

export default function PhotosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
