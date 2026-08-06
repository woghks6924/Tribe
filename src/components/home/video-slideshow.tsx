"use client";

import { useRef, useState } from "react";
import { GrainOverlay } from "@/components/ui/grain-filter";

const SLIDES = [
  { src: "/videos/hero-night-run.mp4", label: "SEOUL NIGHT LOOP", brightness: 2.0 },
  { src: "/videos/hero-night-run-alt.mp4", label: "SEOUL NIGHT LOOP · ALT", brightness: 2.0 },
  { src: "/videos/brand-story-runner.mp4", label: "SPRINT", brightness: 1.3 },
  { src: "/videos/crew-group-bw.mp4", label: "TRIBE RUN CLUB", brightness: 1.3 },
  { src: "/videos/crew-group-color.mp4", label: "TRIBE RUN CLUB · COLOR", brightness: 1.55 },
];

export function VideoSlideshow() {
  const [active, setActive] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  function goTo(index: number) {
    setActive(index);
    videoRefs.current[index]?.play();
  }

  function handleEnded() {
    goTo((active + 1) % SLIDES.length);
  }

  return (
    <section className="relative h-[520px] overflow-hidden bg-base-elevated md:h-[640px]">
      {SLIDES.map((slide, i) => (
        <video
          key={slide.src}
          ref={(el) => {
            videoRefs.current[i] = el;
          }}
          src={slide.src}
          muted
          playsInline
          autoPlay={i === 0}
          onEnded={i === active ? handleEnded : undefined}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{
            opacity: i === active ? 1 : 0,
            filter: `brightness(${slide.brightness}) contrast(1.1) saturate(0.92)`,
          }}
        />
      ))}
      <GrainOverlay />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/80 via-transparent to-transparent" />

      <div className="absolute bottom-8 left-6 font-mono text-[11px] tracking-[0.1em] text-ink-muted uppercase md:left-14">
        {String(active + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")} —{" "}
        {SLIDES[active].label}
      </div>

      <div className="absolute right-6 bottom-8 flex gap-2 md:right-14">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            onClick={() => goTo(i)}
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
