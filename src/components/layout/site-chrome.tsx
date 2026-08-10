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

  if (isAdmin) {
    return <div className="flex flex-1 flex-col">{children}</div>;
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
