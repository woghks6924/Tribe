"use client";

import { useEffect, useRef, useState } from "react";
import { GrainOverlay } from "@/components/ui/grain-filter";
import type { BannerSlideData } from "@/lib/banner";

const IMAGE_DURATION_MS = 5000;

export function BannerSlideshow({ slides }: { slides: BannerSlideData[] }) {
  const [active, setActive] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const current = slides[active];
    if (!current) return;

    if (current.mediaType === "VIDEO") {
      videoRefs.current[active]?.play().catch(() => {});
    } else {
      timerRef.current = setTimeout(() => {
        setActive((a) => (a + 1) % slides.length);
      }, IMAGE_DURATION_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, slides]);

  if (slides.length === 0) return null;

  function handleEnded() {
    setActive((a) => (a + 1) % slides.length);
  }

  return (
    <section className="relative h-[520px] overflow-hidden bg-base-elevated md:h-[640px]">
      {slides.map((slide, i) =>
        slide.mediaType === "VIDEO" ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            key={slide.id}
            ref={(el) => {
              videoRefs.current[i] = el;
            }}
            src={slide.mediaUrl}
            muted
            playsInline
            autoPlay={i === 0}
            onEnded={i === active ? handleEnded : undefined}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{
              opacity: i === active ? 1 : 0,
              filter: `brightness(${slide.brightness}) contrast(1.1) saturate(0.92)`,
              transform: "scale(1.3) translateZ(0)",
              willChange: "transform",
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={slide.id}
            src={slide.mediaUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{
              opacity: i === active ? 1 : 0,
              filter: `brightness(${slide.brightness}) contrast(1.1) saturate(0.92)`,
            }}
          />
        ),
      )}
      <GrainOverlay />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/80 via-transparent to-transparent" />

      <div className="absolute bottom-8 left-6 font-mono text-[11px] tracking-[0.1em] text-ink-muted uppercase md:left-14">
        {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        {slides[active].label ? ` — ${slides[active].label}` : ""}
      </div>

      <div className="absolute right-6 bottom-8 flex gap-2 md:right-14">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => setActive(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 cursor-pointer transition-all ${
              i === active ? "w-8 bg-ink" : "w-4 bg-ink/30 hover:bg-ink/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
