import type { Metadata } from "next";
import localFont from "next/font/local";
import { GrainFilterDefs } from "@/components/ui/grain-filter";
import { Header } from "@/components/layout/header";
import { SiteChrome } from "@/components/layout/site-chrome";
import { getActivePopupNotices } from "@/lib/notices";
import { getSiteTheme } from "@/lib/site-settings";
import "./globals.css";

// 사이트 전체(본문+헤드라인+디스플레이) 기본 서체. 가변폰트(opsz/wdth/wght).
const bricolage = localFont({
  src: "../fonts/BricolageGrotesqueVariable.ttf",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});

// 브리콜라주는 라틴 전용이라 한글 글리프가 없음 — 한글 문자만 이 폴백으로 자동 대체됨.
// SIL OFL 1.1 라이선스로 상업적 사용이 자유롭다.
const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tri.be — One Tribe. Endless Tries.",
  description: "Not the perfect run. The endless next one. Tri.be running apparel.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [notices, siteTheme] = await Promise.all([getActivePopupNotices(), getSiteTheme()]);

  return (
    <html
      lang="ko"
      data-theme={siteTheme}
      className={`${bricolage.variable} ${pretendard.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-base text-ink">
        <GrainFilterDefs />
        <SiteChrome header={<Header />} notices={notices}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
