import Image from "next/image";
import { ScrollReveal } from "@/components/lookbook/scroll-reveal";
import { GrainOverlay } from "@/components/ui/grain-filter";
import type { LookbookPhotoData } from "@/lib/lookbook";

export function LookbookScroll({ photos }: { photos: LookbookPhotoData[] }) {
  if (photos.length === 0) return null;

  return (
    <section className="flex flex-col gap-6 py-24 md:py-32">
      <div className="flex items-baseline justify-between px-6 md:px-14">
        <h2 className="font-sans text-2xl font-extrabold tracking-[0.02em] md:text-3xl">
          Field Notes
        </h2>
        <span className="text-xs tracking-[0.1em] text-ink-muted uppercase">
          Scroll →
        </span>
      </div>

      <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:px-14">
        {photos.map((photo, i) => (
          <ScrollReveal
            key={photo.id}
            delay={i * 80}
            className="relative block h-[70vh] w-[85vw] shrink-0 snap-center overflow-hidden md:h-[80vh] md:w-[60vw]"
          >
            <Image
              src={photo.imageUrl}
              alt={photo.caption}
              fill
              sizes="(min-width: 768px) 60vw, 85vw"
              className="object-cover"
            />
            <GrainOverlay />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-deep/80 via-transparent to-transparent" />

            <div className="absolute top-8 left-6 md:top-10 md:left-10">
              <span className="font-display text-3xl leading-none font-extrabold tracking-[0.04em] uppercase md:text-5xl">
                LOOK {String(i + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="absolute bottom-6 left-6 flex flex-col gap-1.5 md:bottom-8 md:left-10">
              <span className="h-px w-5 bg-accent" />
              <span className="max-w-xs text-sm font-medium tracking-[0.01em] text-ink-muted">
                {photo.caption}
              </span>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
