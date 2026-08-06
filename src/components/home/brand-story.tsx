import { VideoSlot } from "@/components/ui/video-slot";

export function BrandStory() {
  return (
    <section id="story" className="grid grid-cols-1 bg-base-elevated md:grid-cols-2">
      <div className="relative aspect-square md:order-1">
        <VideoSlot src="/videos/brand-story-runner.mp4" className="h-full w-full" />
      </div>
      <div className="flex flex-col justify-center gap-6 px-6 py-16 md:order-2 md:px-20 md:py-0">
        <span className="font-mono text-[11px] tracking-[0.1em] text-ink-muted uppercase">
          FIG. 01 — Philosophy
        </span>
        <h2 className="font-sans text-[26px] leading-[1.3] font-extrabold tracking-[0.01em] md:text-[32px]">
          Not the perfect run.
          <br />
          The endless next one.
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-ink-muted">
          Runners forged by repetition, not perfection, on the street. Tri.be
          was built for runners who believe in the repeat over the record —
          one tribe, running the same pace together.
        </p>
      </div>
    </section>
  );
}
