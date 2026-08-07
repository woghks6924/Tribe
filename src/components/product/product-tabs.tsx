"use client";

import { useEffect, useRef, useState } from "react";

type Tab = { label: string; html: string };

export function ProductTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = sectionRefs.current.findIndex((el) => el === entry.target);
            if (index !== -1) setActive(index);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [tabs]);

  if (tabs.length === 0) return null;

  function scrollToSection(i: number) {
    sectionRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-10 border-t border-line pt-10">
      <div className="sticky top-20 z-10 flex gap-6 border-b border-line bg-base pb-px md:top-24">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => scrollToSection(i)}
            className={`cursor-pointer border-b-2 pb-3 text-xs tracking-[0.08em] uppercase ${
              active === i
                ? "border-accent text-ink"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-12">
        {tabs.map((tab, i) => (
          <div
            key={tab.label}
            ref={(el) => {
              sectionRefs.current[i] = el;
            }}
            className="flex scroll-mt-32 flex-col gap-4"
          >
            <h3 className="text-xs tracking-[0.08em] text-ink-muted uppercase">{tab.label}</h3>
            <div
              className="prose-content text-sm text-ink-muted"
              dangerouslySetInnerHTML={{ __html: tab.html }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
