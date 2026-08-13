"use client";

import { useState } from "react";
import { GrainOverlay } from "@/components/ui/grain-filter";
import type { StudioPortfolioItemData } from "@/lib/studio";

export function StudioPortfolioGallery({ items }: { items: StudioPortfolioItemData[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex != null ? items[activeIndex] : null;

  function close() {
    setActiveIndex(null);
  }
  function next() {
    setActiveIndex((i) => (i == null ? null : (i + 1) % items.length));
  }
  function prev() {
    setActiveIndex((i) => (i == null ? null : (i - 1 + items.length) % items.length));
  }

  if (items.length === 0) {
    return (
      <p className="px-6 py-24 text-center text-sm text-studio-fg/50 md:px-14">
        Portfolio coming soon.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 px-6 py-16 md:grid-cols-3 md:gap-4 md:px-14 md:py-20">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setActiveIndex(i)}
            className="group relative aspect-[4/5] cursor-pointer overflow-hidden text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <GrainOverlay />
            {item.videoUrl && (
              <span className="absolute top-3 right-3 bg-studio-fg/70 px-2 py-1 text-[10px] tracking-[0.08em] text-studio-bg uppercase">
                Video
              </span>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-studio-fg/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="text-[10px] tracking-[0.08em] text-studio-bg/70 uppercase">
                {item.category}
              </span>
              <span className="text-sm font-semibold text-studio-bg">{item.title}</span>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-studio-fg/90 px-6 py-10"
          onClick={close}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              close();
            }}
            aria-label="Close"
            className="absolute top-6 right-6 cursor-pointer text-2xl text-studio-bg"
          >
            ×
          </button>
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous"
                className="absolute top-1/2 left-4 -translate-y-1/2 cursor-pointer text-3xl text-studio-bg md:left-8"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next"
                className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-3xl text-studio-bg md:right-8"
              >
                ›
              </button>
            </>
          )}
          <div
            className="flex max-h-full max-w-4xl flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {active.videoUrl ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={active.videoUrl} controls autoPlay className="max-h-[75vh] w-auto" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={active.imageUrl}
                alt={active.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            )}
            <div className="flex flex-col gap-0.5 text-studio-bg">
              <span className="text-[10px] tracking-[0.08em] text-studio-bg/60 uppercase">
                {active.category}
              </span>
              <span className="text-sm font-semibold">{active.title}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
