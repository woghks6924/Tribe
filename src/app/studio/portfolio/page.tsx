import type { Metadata } from "next";
import { getStudioPortfolio } from "@/lib/studio";
import { StudioSubNav } from "@/components/studio/studio-sub-nav";
import { StudioPortfolioGallery } from "@/components/studio/portfolio-lightbox";

export const metadata: Metadata = {
  title: "Portfolio — Tri.be Studio",
  description: "Selected content shot for brand partners inside real running sessions.",
};

export default async function StudioPortfolioPage() {
  const items = await getStudioPortfolio();

  return (
    <>
      <StudioSubNav />
      <div className="flex flex-col gap-1 px-6 pt-16 md:px-14 md:pt-20">
        <h1 className="font-display text-3xl font-extrabold tracking-[0.02em] uppercase md:text-4xl">
          Portfolio
        </h1>
        <p className="text-sm text-studio-fg/60">Selected work from brand partners.</p>
      </div>
      <StudioPortfolioGallery items={items} />
    </>
  );
}
