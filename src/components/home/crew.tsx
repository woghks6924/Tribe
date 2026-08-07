import Link from "next/link";
import { VideoSlot } from "@/components/ui/video-slot";

export function Crew({
  label,
  headline,
  body,
  cta,
}: {
  label: string;
  headline: string;
  body: string;
  cta: string;
}) {
  return (
    <section id="crew" className="relative h-[520px] overflow-hidden md:h-[620px]">
      <div className="absolute inset-0">
        <VideoSlot src="/videos/crew-group-bw.mp4" className="h-full w-full" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/85 via-base/25 to-transparent" />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center">
        <span className="mb-1 block h-px w-8 bg-accent" />
        <span className="font-mono text-[11px] tracking-[0.14em] text-ink-muted uppercase">
          {label}
        </span>
        <h2 className="font-sans max-w-lg text-[26px] leading-[1.3] font-extrabold tracking-[0.01em] md:text-[32px]">
          {headline.split("\n").map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-ink-muted">{body}</p>
        {cta && (
          <Link
            href="/signup"
            className="border border-line-strong px-6 py-3 text-xs tracking-[0.1em] uppercase hover:border-ink hover:text-ink"
          >
            {cta}
          </Link>
        )}
      </div>
    </section>
  );
}
