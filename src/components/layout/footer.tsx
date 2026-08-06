import Link from "next/link";
import Image from "next/image";

const FOOTER_GROUPS = [
  {
    title: "SHOP",
    links: [
      { label: "T-Shirts", href: "/products?category=tshirts" },
      { label: "Shorts", href: "/products?category=shorts" },
      { label: "Outerwear", href: "/products?category=outer" },
      { label: "Accessories", href: "/products?category=accessories" },
    ],
  },
  {
    title: "BRAND",
    links: [
      { label: "Story", href: "/#story" },
      { label: "Instagram", href: "/instagram" },
      { label: "Crew", href: "/#crew" },
    ],
  },
  {
    title: "SUPPORT",
    links: [
      { label: "Shipping & Returns", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="flex flex-col gap-14 border-t border-line px-6 pt-16 pb-10 md:px-14">
      <div className="grid grid-cols-2 gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <Image
          src="/logo/tribe-logo-white.png"
          alt="Tri.be"
          width={2357}
          height={615}
          className="h-9 w-auto"
        />
        {FOOTER_GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-2.5 text-[13px] text-ink-muted">
            <div className="mb-1.5 text-[11px] tracking-[0.1em] text-ink-faint uppercase">
              {group.title}
            </div>
            {group.links.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-ink">
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t border-line pt-6 text-[11px] tracking-[0.05em] text-ink-faint sm:flex-row sm:justify-between">
        <span>© 2026 Tri.be. All rights reserved.</span>
        <span>ONE TRIBE, ENDLESS TRIES.</span>
      </div>
    </footer>
  );
}
