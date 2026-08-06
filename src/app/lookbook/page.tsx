import Link from "next/link";
import { LookbookHero } from "@/components/lookbook/lookbook-hero";
import { LookbookGrid } from "@/components/lookbook/lookbook-grid";
import { LookbookScroll } from "@/components/lookbook/lookbook-scroll";
import { LOOKBOOK_PHOTOS, FIELD_NOTE_NUMBERS } from "@/lib/lookbook-data";

export default function LookbookPage() {
  const fieldNotes = FIELD_NOTE_NUMBERS.map((n) =>
    LOOKBOOK_PHOTOS.find((p) => p.number === n),
  ).filter((p): p is (typeof LOOKBOOK_PHOTOS)[number] => !!p);

  return (
    <>
      <LookbookHero />
      <LookbookGrid photos={LOOKBOOK_PHOTOS} />
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
