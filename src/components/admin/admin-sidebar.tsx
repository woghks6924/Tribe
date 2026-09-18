"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/functionalities", label: "Functionality Library" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/promo-codes", label: "Promo Codes" },
  { href: "/admin/notices", label: "Notices" },
  { href: "/admin/running-forms", label: "Running Forms" },
  { href: "/admin/banner-slides", label: "Banner Slides" },
  { href: "/admin/lookbook", label: "Lookbook" },
  { href: "/admin/studio-portfolio", label: "Studio Portfolio" },
  { href: "/admin/studio-inquiries", label: "Studio Inquiries" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      {/* 모바일 전용 상단 바 — 사이드바가 항상 보이면 좁은 화면에서 콘텐츠가 심하게 눌리므로,
          작은 화면에서는 기본적으로 숨기고 이 바의 메뉴 버튼으로 열고 닫는다. */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-base px-4 py-3 md:hidden">
        <div className="font-display text-sm font-extrabold tracking-[0.01em]">Tri.be Admin</div>
        <button
          onClick={() => setOpen(true)}
          className="cursor-pointer px-2 py-1 text-sm text-ink-muted hover:text-ink"
          aria-label="메뉴 열기"
        >
          ☰ Menu
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col justify-between border-r border-line bg-base px-6 py-8 transition-transform duration-200 md:static md:z-auto md:w-56 md:shrink-0 md:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
      >
        <div className="flex flex-col gap-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-lg font-extrabold tracking-[0.01em]">
                Tri.be Admin
              </div>
              <div className="mt-1 text-xs text-ink-muted">{adminName}</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="cursor-pointer px-2 text-lg text-ink-faint hover:text-ink md:hidden"
              aria-label="메뉴 닫기"
            >
              ×
            </button>
          </div>
          <nav className="flex flex-col gap-1 text-sm">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2 ${
                    active ? "bg-base-elevated text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="cursor-pointer px-3 py-2 text-left text-xs text-ink-faint hover:text-ink"
        >
          Log Out
        </button>
      </aside>
    </>
  );
}
