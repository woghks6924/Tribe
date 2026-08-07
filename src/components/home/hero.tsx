"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { GrainOverlay } from "@/components/ui/grain-filter";
import type { BannerSlideData } from "@/lib/banner";

const DEFAULT_IMAGE_DURATION_SEC = 5;
const FALLBACK_VIDEO = "/videos/hero-night-run.mp4";

export function Hero({
  slides,
  badgeText,
  headline,
  subtext,
}: {
  slides: BannerSlideData[];
  badgeText: string;
  headline: string;
  subtext: string;
}) {
  const [active, setActive] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const current = slides[active];
    if (!current) return;

    videoRefs.current.forEach((video, i) => {
      if (video && i !== active) video.pause();
    });

    if (current.mediaType === "VIDEO") {
      videoRefs.current[active]?.play().catch(() => {});
    }

    const duration =
      current.durationSec ?? (current.mediaType === "IMAGE" ? DEFAULT_IMAGE_DURATION_SEC : null);
    if (duration != null) {
      timerRef.current = setTimeout(() => {
        setActive((a) => (a + 1) % slides.length);
      }, duration * 1000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, slides]);

  function handleEnded() {
    setActive((a) => (a + 1) % slides.length);
  }

  return (
    <section className="relative -mt-20 h-[720px] overflow-hidden md:-mt-24 md:h-[876px]">
      <div className="absolute inset-0 bg-base-elevated">
        {slides.length > 0 ? (
          slides.map((slide, i) =>
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
                onEnded={i === active && slide.durationSec == null ? handleEnded : undefined}
                className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                style={{
                  opacity: i === active ? 1 : 0,
                  filter: `brightness(${slide.brightness}) contrast(1.15) saturate(0.92)`,
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
                  filter: `brightness(${slide.brightness}) contrast(1.15) saturate(0.92)`,
                }}
              />
            ),
          )
        ) : (
          <video
            src={FALLBACK_VIDEO}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              filter: "brightness(2.1) contrast(1.15) saturate(0.92)",
              transform: "scale(1.3) translateZ(0)",
              willChange: "transform",
            }}
          />
        )}
        <GrainOverlay />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/90 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-base/55 via-transparent to-transparent" />

      <div className="absolute top-28 left-6 flex gap-2.5 md:top-32 md:left-14">
        <Badge>{badgeText}</Badge>
        {slides[active]?.label && <Badge>{slides[active].label}</Badge>}
      </div>

      <div className="absolute bottom-14 left-6 flex max-w-xl flex-col gap-7 md:bottom-16 md:left-14">
        <h1 className="font-display text-[13vw] leading-[0.98] font-extrabold tracking-[0.02em] uppercase sm:text-6xl md:text-7xl">
          {headline.split("\n").map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h1>
        <p className="max-w-md text-sm leading-relaxed tracking-[0.01em] text-ink-muted">
          {subtext}
        </p>
      </div>

      {slides.length > 1 && (
        <div className="absolute right-6 bottom-6 flex gap-2 md:right-14">
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
      )}
    </section>
  );
}
