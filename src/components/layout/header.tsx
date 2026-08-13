import Link from "next/link";
import Image from "next/image";
import { CartBadge } from "@/components/layout/cart-badge";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getStudioSettings } from "@/lib/studio";

const BASE_NAV_LINKS = [
  { href: "/products", label: "SHOP" },
  { href: "/sale", label: "SALE" },
  { href: "/lookbook", label: "LOOKBOOK" },
  { href: "/#story", label: "STORY" },
  { href: "/#crew", label: "CREW" },
  { href: "/instagram", label: "INSTAGRAM" },
];

export async function Header() {
  const [session, { showStudioTab }] = await Promise.all([
    getCurrentCustomer(),
    getStudioSettings(),
  ]);
  const accountHref = session ? "/account" : "/login";
  const accountLabel = session ? session.name.split(" ")[0] : "LOGIN";

  const navLinks = showStudioTab
    ? [...BASE_NAV_LINKS, { href: "/studio", label: "STUDIO" }]
    : BASE_NAV_LINKS;

  return (
    <header className="fixed top-0 inset-x-0 z-50 flex h-20 items-center justify-between px-6 md:h-24 md:px-14">
      <Link href="/" className="shrink-0">
        <Image
          src="/logo/tribe-logo-white.png"
          alt="Tri.be"
          width={2357}
          height={615}
          priority
          className="h-7 w-auto"
        />
      </Link>

      <nav className="hidden gap-8 text-[13px] tracking-[0.12em] text-ink-muted uppercase lg:flex xl:gap-10">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-ink">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-5 text-xs tracking-[0.1em] text-ink-muted uppercase xl:gap-7">
        <Link href="/products" className="hidden whitespace-nowrap hover:text-ink lg:inline">
          SEARCH
        </Link>
        <Link
          href={accountHref}
          className="hidden max-w-[100px] truncate whitespace-nowrap hover:text-ink lg:inline"
        >
          {accountLabel}
        </Link>
        <Link href="/cart" className="whitespace-nowrap hover:text-ink">
          <CartBadge />
        </Link>
        <MobileNav navLinks={navLinks} accountHref={accountHref} accountLabel={accountLabel} />
      </div>
    </header>
  );
}
