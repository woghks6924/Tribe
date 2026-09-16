"use client";

import Link from "next/link";
import Image from "next/image";
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
        <div className="px-6 py-5 md:px-10">
          <Link href="/running" className="inline-block">
            <Image
              src="/logo/tribe-logo-black.png"
              alt="Tri.be"
              width={473}
              height={100}
              className="h-6 w-auto"
            />
          </Link>
        </div>
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
