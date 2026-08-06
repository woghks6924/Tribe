import type { Metadata } from "next";
import { Big_Shoulders } from "next/font/google";
import localFont from "next/font/local";
import { GrainFilterDefs } from "@/components/ui/grain-filter";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${bigShoulders.variable} ${pretendard.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-base text-ink">
        <GrainFilterDefs />
        <Header />
        <main className="flex flex-1 flex-col pt-20 md:pt-24">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
