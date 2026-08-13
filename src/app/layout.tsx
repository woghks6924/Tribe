import type { Metadata } from "next";
import { Big_Shoulders } from "next/font/google";
import localFont from "next/font/local";
import { GrainFilterDefs } from "@/components/ui/grain-filter";
import { Header } from "@/components/layout/header";
import { SiteChrome } from "@/components/layout/site-chrome";
import { getActivePopupNotices } from "@/lib/notices";
import { getSiteTheme } from "@/lib/site-settings";
import "./globals.css";

// 로고 워드마크("Tri.be")와 영문 히어로 카피에만 쓰는 콘덴스드 디스플레이체.
const bigShoulders = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
});

// 한글 본문/헤드라인 전반에 쓰는 기본 서체. SIL OFL 1.1 라이선스로 상업적 사용이 자유롭다.
const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  variable: "--font-sans",
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
      className={`${bigShoulders.variable} ${pretendard.variable} h-full antialiased`}
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
