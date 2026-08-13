"use client";

import Link from "next/link";
import { useState } from "react";

export function MobileNav({
  navLinks,
  accountHref,
  accountLabel,
}: {
  navLinks: { href: string; label: string }[];
  accountHref: string;
  accountLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="flex h-8 w-8 shrink-0 flex-col items-center justify-center gap-1.5 lg:hidden"
      >
        <span
          className={`h-px w-5 bg-ink transition-transform ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
        />
        <span
          className={`h-px w-5 bg-ink transition-transform ${open ? "-translate-y-[3.5px] -rotate-45" : ""}`}
        />
      </button>

      {open && (
        <div className="fixed inset-x-0 top-20 bottom-0 z-40 flex flex-col gap-1 overflow-y-auto bg-base px-6 py-8 md:top-24 lg:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-line py-4 text-sm tracking-[0.12em] text-ink-muted uppercase hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/products"
            onClick={() => setOpen(false)}
            className="border-b border-line py-4 text-sm tracking-[0.12em] text-ink-muted uppercase hover:text-ink"
          >
            Search
          </Link>
          <Link
            href={accountHref}
            onClick={() => setOpen(false)}
            className="border-b border-line py-4 text-sm tracking-[0.12em] text-ink-muted uppercase hover:text-ink"
          >
            {accountLabel}
          </Link>
        </div>
      )}
    </>
  );
}
