import { VideoSlot } from "@/components/ui/video-slot";

export function BrandStory({
  label,
  headline,
  body,
}: {
  label: string;
  headline: string;
  body: string;
}) {
  return (
    <section id="story" className="grid grid-cols-1 bg-base-elevated md:grid-cols-2">
      <div className="relative aspect-square md:order-1">
        <VideoSlot src="/videos/brand-story-runner.mp4" className="h-full w-full" />
      </div>
      <div className="flex flex-col justify-center gap-6 px-6 py-16 md:order-2 md:px-20 md:py-0">
        <span className="font-mono text-[11px] tracking-[0.1em] text-ink-muted uppercase">
          {label}
        </span>
        <h2 className="font-sans text-[26px] leading-[1.3] font-extrabold tracking-[0.01em] md:text-[32px]">
          {headline.split("\n").map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-ink-muted">{body}</p>
      </div>
    </section>
  );
}
