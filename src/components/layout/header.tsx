import Link from "next/link";
import Image from "next/image";
import { CartBadge } from "@/components/layout/cart-badge";
import { getCurrentCustomer } from "@/lib/auth/session";

const NAV_LINKS = [
  { href: "/products", label: "SHOP" },
  { href: "/#story", label: "STORY" },
  { href: "/#crew", label: "CREW" },
  { href: "/instagram", label: "INSTAGRAM" },
];

export async function Header() {
  const session = await getCurrentCustomer();

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

      <nav className="hidden gap-10 text-[13px] tracking-[0.12em] text-ink-muted uppercase md:flex">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="hover:text-ink">
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-7 text-xs tracking-[0.1em] text-ink-muted uppercase">
        <Link href="/products" className="hidden hover:text-ink sm:inline">
          SEARCH
        </Link>
        <Link href={session ? "/account" : "/login"} className="hidden hover:text-ink sm:inline">
          {session ? session.name.split(" ")[0] : "LOGIN"}
        </Link>
        <Link href="/cart" className="hover:text-ink">
          <CartBadge />
        </Link>
      </div>
    </header>
  );
}
