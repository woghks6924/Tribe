import Image from "next/image";
import { ScrollReveal } from "@/components/lookbook/scroll-reveal";
import { GrainOverlay } from "@/components/ui/grain-filter";
import type { LookbookPhotoData } from "@/lib/lookbook";

const SPAN_PATTERNS = [
  "md:col-span-4 md:row-span-2",
  "md:col-span-2 md:row-span-1",
  "md:col-span-2 md:row-span-1",
  "md:col-span-3 md:row-span-1",
  "md:col-span-3 md:row-span-1",
  "md:col-span-6 md:row-span-1",
];

export function LookbookGrid({ photos }: { photos: LookbookPhotoData[] }) {
  if (photos.length === 0) return null;

  return (
    <section className="flex flex-col gap-10 px-6 py-24 md:px-14 md:py-32">
      <div className="flex items-baseline justify-between border-b border-line pb-5">
        <h2 className="font-sans text-2xl font-extrabold tracking-[0.02em] md:text-3xl">
          The Looks
        </h2>
        <span className="text-xs tracking-[0.1em] text-ink-muted uppercase">
          {photos.length} Looks
        </span>
      </div>

      <div className="grid auto-rows-[220px] grid-cols-2 gap-3 md:auto-rows-[260px] md:grid-cols-6 md:gap-4">
        {photos.map((photo, i) => (
          <ScrollReveal
            key={photo.id}
            delay={(i % 6) * 90}
            className={`group relative col-span-2 row-span-1 overflow-hidden ${SPAN_PATTERNS[i % SPAN_PATTERNS.length]}`}
          >
            <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
              <Image
                src={photo.imageUrl}
                alt={photo.caption}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
              <GrainOverlay />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-deep/85 via-base-deep/5 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
              <span className="max-w-[70%] text-sm font-medium tracking-[0.01em] text-ink-muted">
                {photo.caption}
              </span>
              <span className="font-display shrink-0 text-lg font-extrabold tracking-[0.04em] text-ink">
                LOOK {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
