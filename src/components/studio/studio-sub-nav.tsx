import Link from "next/link";

const LINKS = [
  { href: "/studio", label: "Overview" },
  { href: "/studio/portfolio", label: "Portfolio" },
  { href: "/studio/pricing", label: "Pricing" },
  { href: "/studio/contact", label: "Contact" },
];

export function StudioSubNav() {
  return (
    <nav className="flex gap-6 border-b border-studio-line px-6 py-5 text-xs tracking-[0.12em] text-studio-fg/60 uppercase md:px-14">
      {LINKS.map((link) => (
        <Link key={link.href} href={link.href} className="whitespace-nowrap hover:text-studio-fg">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
