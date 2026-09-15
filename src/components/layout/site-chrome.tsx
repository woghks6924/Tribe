"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { NoticePopup } from "@/components/notice/notice-popup";
import { SiteLoader } from "@/components/layout/site-loader";
import type { PopupNotice } from "@/lib/notices";

const NO_FOOTER = ["/login", "/signup"];

export function SiteChrome({
  header,
  notices,
  children,
}: {
  header: React.ReactNode;
  notices: PopupNotice[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isStandaloneTool = pathname.startsWith("/wod-admin") || pathname.startsWith("/wod-display");
  // 러닝 신청 공지는 쇼핑몰 내비게이션 없이 공지만 딱 보이는 독립 페이지로 노출한다.
  const isMinimalChrome = pathname.startsWith("/running");

  if (isAdmin || isStandaloneTool) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  if (isMinimalChrome) {
    return (
      <>
        <SiteLoader />
        <main className="flex flex-1 flex-col">{children}</main>
      </>
    );
  }

  return (
    <>
      <SiteLoader />
      {header}
      <main className="flex flex-1 flex-col pt-20 md:pt-24">{children}</main>
      {!NO_FOOTER.includes(pathname) && <Footer />}
      <NoticePopup notices={notices} />
    </>
  );
}
