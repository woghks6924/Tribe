import { Badge } from "@/components/ui/badge";
import { VideoSlot } from "@/components/ui/video-slot";

export function LookbookHero() {
  return (
    <section className="relative -mt-20 h-[520px] overflow-hidden md:-mt-24 md:h-[640px]">
      <div className="absolute inset-0">
        <VideoSlot
          src="/videos/hero-night-run-alt.mp4"
          className="h-full w-full"
          brightness={1.7}
          contrast={1.1}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/95 via-base/10 to-transparent" />

      <div className="absolute bottom-14 left-6 flex max-w-xl flex-col gap-5 md:bottom-16 md:left-14">
        <Badge>FW26 CAMPAIGN</Badge>
        <h1 className="font-display text-[15vw] leading-[0.95] font-extrabold tracking-[0.02em] uppercase sm:text-6xl md:text-7xl">
          Lookbook
        </h1>
        <p className="max-w-md text-sm leading-relaxed tracking-[0.01em] text-ink-muted">
          Not product shots — situations. What it looks like to run the city
          at night, in the gear built for it.
        </p>
      </div>
    </section>
  );
}
