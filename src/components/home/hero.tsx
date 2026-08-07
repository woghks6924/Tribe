import { Badge } from "@/components/ui/badge";
import { VideoSlot } from "@/components/ui/video-slot";
import { ImageSlot } from "@/components/ui/image-slot";
import type { BannerSlideData } from "@/lib/banner";

export function Hero({ slide }: { slide: BannerSlideData | null }) {
  return (
    <section className="relative -mt-20 h-[720px] overflow-hidden md:-mt-24 md:h-[876px]">
      <div className="absolute inset-0">
        {slide?.mediaType === "IMAGE" ? (
          <ImageSlot src={slide.mediaUrl} alt="" className="h-full w-full" />
        ) : (
          <VideoSlot
            src={slide?.mediaUrl ?? "/videos/hero-night-run.mp4"}
            className="h-full w-full"
            brightness={slide?.brightness ?? 2.1}
            contrast={1.15}
          />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/90 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-base/55 via-transparent to-transparent" />

      <div className="absolute top-28 left-6 flex gap-2.5 md:top-32 md:left-14">
        <Badge>#TRIBERUN</Badge>
        <Badge>{slide?.label ?? "SEOUL NIGHT LOOP"}</Badge>
      </div>

      <div className="absolute bottom-14 left-6 flex max-w-xl flex-col gap-7 md:bottom-16 md:left-14">
        <h1 className="font-display text-[13vw] leading-[0.98] font-extrabold tracking-[0.02em] uppercase sm:text-6xl md:text-7xl">
          One Tribe.
          <br />
          Endless Tries.
        </h1>
        <p className="max-w-md text-sm leading-relaxed tracking-[0.01em] text-ink-muted">
          Runningwear for those who run the city at night. Tri.be — one
          tribe, built by runners who believe in the repeat, not the record.
        </p>
      </div>
    </section>
  );
}
