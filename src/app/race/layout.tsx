import { IBM_Plex_Sans_KR, Press_Start_2P } from "next/font/google";

// /race 전용 폰트. 전역 폰트(Bricolage/Pretendard)와 분리해서 이 라우트 안에서만 로드한다.
const pressStart2p = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-race-px",
  display: "swap",
});

const ibmPlexSansKr = IBM_Plex_Sans_KR({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-race-sans",
  display: "swap",
});

export default function RaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${pressStart2p.variable} ${ibmPlexSansKr.variable} min-h-screen bg-[#1d1e21] text-[#f1f1ee]`}
      style={{ fontFamily: "var(--font-race-sans), system-ui, sans-serif" }}
    >
      {children}
    </div>
  );
}
