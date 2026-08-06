"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/footer";

const NO_FOOTER = ["/login", "/signup"];

export function SiteChrome({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <div className="flex flex-1 flex-col">{children}</div>;
  }

  return (
    <>
      {header}
      <main className="flex flex-1 flex-col pt-20 md:pt-24">{children}</main>
      {!NO_FOOTER.includes(pathname) && <Footer />}
    </>
  );
}
