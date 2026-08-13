import type { Metadata } from "next";
import Link from "next/link";
import { StudioSubNav } from "@/components/studio/studio-sub-nav";

export const metadata: Metadata = {
  title: "Pricing — Tri.be Studio",
  description: "Content production packages built around real running sessions.",
};

const PACKAGES = [
  {
    name: "Content Day",
    price: "₩1,500,000",
    duration: "Half-day (4 hours)",
    participants: "Up to 5 runners",
    deliverables: "20 photos, 3 short-form video cuts",
    usage: "Owned brand channels, 6 months",
    recommended: false,
  },
  {
    name: "Brand Content",
    price: "₩3,000,000",
    duration: "Full day (8 hours)",
    participants: "Up to 12 runners",
    deliverables: "50 photos, 6 short-form + 1 hero video",
    usage: "Owned + paid social, 12 months",
    recommended: true,
  },
  {
    name: "Mini Campaign",
    price: "₩5,000,000",
    duration: "2-day shoot",
    participants: "Up to 20 runners, multi-location",
    deliverables: "100+ photos, full video campaign package",
    usage: "Full commercial usage, unlimited channels, 12 months",
    recommended: false,
  },
];

export default function StudioPricingPage() {
  return (
    <>
      <StudioSubNav />
      <div className="flex flex-col gap-1 px-6 pt-16 md:px-14 md:pt-20">
        <h1 className="font-display text-3xl font-extrabold tracking-[0.02em] uppercase md:text-4xl">
          Pricing
        </h1>
        <p className="text-sm text-studio-fg/60">Starting packages — exact quotes depend on scope.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 px-6 py-16 md:grid-cols-3 md:px-14 md:py-20">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.name}
            className={`flex flex-col gap-6 border p-6 ${pkg.recommended ? "border-studio-fg" : "border-studio-line"}`}
          >
            {pkg.recommended && (
              <span className="w-fit border border-studio-fg px-2 py-0.5 text-[10px] tracking-[0.08em] uppercase">
                Recommended
              </span>
            )}
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-[0.1em] text-studio-fg/50 uppercase">{pkg.name}</span>
              <span className="font-display text-2xl font-extrabold">{pkg.price}</span>
            </div>
            <dl className="flex flex-col gap-3 border-t border-studio-line pt-4 text-sm">
              <Row label="Shoot Time" value={pkg.duration} />
              <Row label="Participants" value={pkg.participants} />
              <Row label="Deliverables" value={pkg.deliverables} />
              <Row label="Usage Rights" value={pkg.usage} />
            </dl>
            <Link
              href={`/studio/contact?package=${encodeURIComponent(pkg.name)}`}
              className="mt-auto border border-studio-fg px-5 py-3 text-center text-xs tracking-[0.1em] uppercase hover:bg-studio-fg hover:text-studio-bg"
            >
              Inquire
            </Link>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-studio-line px-6 py-16 text-center md:py-20">
        <p className="text-sm text-studio-fg/60">
          Need something outside these packages? Exact quotes depend on scope and location.
        </p>
        <Link
          href="/studio/contact"
          className="bg-studio-fg px-6 py-3 text-xs tracking-[0.1em] text-studio-bg uppercase hover:opacity-85"
        >
          Talk to Us
        </Link>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs tracking-[0.06em] text-studio-fg/50 uppercase">{label}</dt>
      <dd className="text-studio-fg">{value}</dd>
    </div>
  );
}
