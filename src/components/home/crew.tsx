import { VideoSlot } from "@/components/ui/video-slot";

export function Crew() {
  return (
    <section id="crew" className="relative h-[520px] overflow-hidden md:h-[620px]">
      <div className="absolute inset-0">
        <VideoSlot src="/videos/crew-group-bw.mp4" className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/85 via-base/25 to-transparent" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="mb-1 block h-px w-8 bg-accent" />
        <span className="font-mono text-[11px] tracking-[0.14em] text-ink-muted uppercase">
          FIG. 02 — Crew
        </span>
        <h2 className="font-sans max-w-lg text-[26px] leading-[1.3] font-extrabold tracking-[0.01em] md:text-[32px]">
          Run alone, it&apos;s a jog.
          <br />
          Run together, it&apos;s a tribe.
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-ink-muted">
          Every Tuesday night, the Tri.be run club crosses the city. Every
          pace is different — the finish line is always together.
        </p>
      </div>
    </section>
  );
}
