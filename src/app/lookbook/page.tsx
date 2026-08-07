import Link from "next/link";
import { LookbookHero } from "@/components/lookbook/lookbook-hero";
import { LookbookGrid } from "@/components/lookbook/lookbook-grid";
import { LookbookScroll } from "@/components/lookbook/lookbook-scroll";
import { getActiveLookbookPhotos } from "@/lib/lookbook";

export const dynamic = "force-dynamic";

export default async function LookbookPage() {
  const photos = await getActiveLookbookPhotos();
  const fieldNotes = photos.slice(0, 6);

  return (
    <>
      <LookbookHero />
      <LookbookGrid photos={photos} />
      <LookbookScroll photos={fieldNotes} />

      <div className="flex flex-col items-center gap-5 px-6 py-24 text-center md:py-32">
        <span className="h-px w-8 bg-accent" />
        <h2 className="font-sans text-xl font-extrabold tracking-[0.02em] md:text-2xl">
          Gear Up for the Next One
        </h2>
        <Link
          href="/products"
          className="border border-line-strong px-6 py-3 text-xs tracking-[0.1em] uppercase hover:border-ink hover:text-ink"
        >
          Shop the Collection
        </Link>
      </div>
    </>
  );
}
