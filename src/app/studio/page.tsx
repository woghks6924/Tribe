import type { Metadata } from "next";
import Link from "next/link";
import { getStudioSettings, getStudioPortfolio } from "@/lib/studio";
import { ScrollReveal } from "@/components/lookbook/scroll-reveal";
import { StudioSubNav } from "@/components/studio/studio-sub-nav";
import { GrainOverlay } from "@/components/ui/grain-filter";

export const metadata: Metadata = {
  title: "Studio — Tri.be",
  description: "Content production for brands, shot inside real running sessions.",
};

const USPS = [
  {
    title: "Real Sessions, Not Sets",
    body: "We shoot inside actual training sessions — no staged treadmill smiles.",
  },
  {
    title: "Athlete-Led Casting",
    body: "Real runners, real pace groups. Casting from our own run club and partner crews.",
  },
  {
    title: "Editorial Direction",
    body: "Documentary framing, natural light, minimal art direction — content that reads as real.",
  },
  {
    title: "Fast Turnaround",
    body: "Social-ready cuts within the week, full package delivered in 10 business days.",
  },
  {
    title: "Usage-Ready Licensing",
    body: "Clear usage rights scoped to your package — no surprise renewal fees.",
  },
];

const SESSION_TYPES = [
  { title: "Track WOD", desc: "Interval sessions on the track — high-energy, motion-heavy footage." },
  { title: "HYROX Style", desc: "Functional fitness circuits blended with running, for hybrid-training brands." },
  { title: "VO2max Testing", desc: "Lab and field performance testing — technical, credibility-driven content." },
  { title: "Run & Swim", desc: "Multi-discipline sessions for brands positioning across run and triathlon." },
];

export default async function StudioPage() {
  const [{ studioHeroHeadline }, portfolio] = await Promise.all([
    getStudioSettings(),
    getStudioPortfolio(),
  ]);
  const heroImage = portfolio[0]?.imageUrl ?? null;

  return (
    <>
      <StudioSubNav />

      <section className="relative flex h-[70vh] min-h-[480px] items-end overflow-hidden">
        {heroImage ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <GrainOverlay />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-studio-bg via-studio-bg/10 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-studio-fg/[0.04]">
            <GrainOverlay />
          </div>
        )}
        <div className="relative z-10 flex flex-col gap-4 px-6 pb-16 md:px-14 md:pb-20">
          <span className="text-xs tracking-[0.16em] text-studio-fg/60 uppercase">Tri.be Studio</span>
          <h1 className="max-w-3xl font-display text-[10vw] leading-[0.98] font-extrabold tracking-[0.01em] uppercase sm:text-6xl md:text-7xl">
            {studioHeroHeadline}
          </h1>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 px-6 py-20 sm:grid-cols-2 md:px-14 md:py-28 lg:grid-cols-5 lg:gap-6">
        {USPS.map((u, i) => (
          <ScrollReveal
            key={u.title}
            delay={i * 80}
            className="flex flex-col gap-3 border-t border-studio-line pt-5"
          >
            <span className="text-xs tracking-[0.1em] text-studio-fg/50">0{i + 1}</span>
            <span className="text-sm font-semibold tracking-[0.02em] uppercase">{u.title}</span>
            <p className="text-sm leading-relaxed text-studio-fg/70">{u.body}</p>
          </ScrollReveal>
        ))}
      </section>

      <section className="flex flex-col gap-10 border-t border-studio-line px-6 py-20 md:px-14 md:py-28">
        <h2 className="font-display text-2xl font-extrabold tracking-[0.02em] uppercase md:text-3xl">
          Session Types
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SESSION_TYPES.map((s, i) => (
            <ScrollReveal key={s.title} delay={i * 90} className="flex flex-col gap-4">
              <div className="relative aspect-[4/5] overflow-hidden bg-studio-fg/[0.06]">
                <GrainOverlay />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold tracking-[0.02em] uppercase">{s.title}</span>
                <p className="text-xs leading-relaxed text-studio-fg/60">{s.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-6 border-t border-studio-line px-6 py-20 text-center md:py-28">
        <span className="h-px w-8 bg-studio-fg/40" />
        <h2 className="max-w-lg font-display text-2xl font-extrabold tracking-[0.02em] uppercase md:text-3xl">
          Let&apos;s build the next campaign around a real run.
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/studio/portfolio"
            className="border border-studio-fg px-6 py-3 text-xs tracking-[0.1em] uppercase hover:bg-studio-fg hover:text-studio-bg"
          >
            View Portfolio
          </Link>
          <Link
            href="/studio/pricing"
            className="border border-studio-fg px-6 py-3 text-xs tracking-[0.1em] uppercase hover:bg-studio-fg hover:text-studio-bg"
          >
            See Pricing
          </Link>
          <Link
            href="/studio/contact"
            className="bg-studio-fg px-6 py-3 text-xs tracking-[0.1em] text-studio-bg uppercase hover:opacity-85"
          >
            Get in Touch
          </Link>
        </div>
      </section>
    </>
  );
}
