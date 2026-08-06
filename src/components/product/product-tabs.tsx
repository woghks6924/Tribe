"use client";

import { useState } from "react";

type Tab = { label: string; html: string };

export function ProductTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);

  if (tabs.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 border-t border-line pt-10">
      <div className="flex gap-6 border-b border-line">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
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
      <div
        className="prose-content text-sm text-ink-muted"
        dangerouslySetInnerHTML={{ __html: tabs[active].html }}
      />
    </div>
  );
}
