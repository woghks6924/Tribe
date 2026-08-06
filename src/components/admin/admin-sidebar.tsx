"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/promo-codes", label: "Promo Codes" },
  { href: "/admin/notices", label: "Notices" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-line px-6 py-8">
      <div className="flex flex-col gap-10">
        <div>
          <div className="font-display text-lg font-extrabold tracking-[0.01em]">
            Tri.be Admin
          </div>
          <div className="mt-1 text-xs text-ink-muted">{adminName}</div>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
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
  );
}
