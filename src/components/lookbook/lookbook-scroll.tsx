import Link from "next/link";
import { ImageSlot } from "@/components/ui/image-slot";
import type { ProductCardData } from "@/types";

const TAGLINES = [
  "RUN THE CITY AFTER DARK",
  "THE REPEAT, NOT THE RECORD",
  "MIDNIGHT MILES",
  "SEOUL NIGHT LOOP",
  "BUILT BY RUNNERS",
];

export function LookbookScroll({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <section className="flex flex-col gap-6 py-24 md:py-32">
      <div className="flex items-baseline justify-between px-6 md:px-14">
        <h2 className="font-sans text-2xl font-extrabold tracking-[0.02em] md:text-3xl">
          Field Notes
        </h2>
        <span className="text-xs tracking-[0.1em] text-ink-muted uppercase">
          Scroll →
        </span>
      </div>

      <div className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 md:px-14">
        {products.map((product, i) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group relative block h-[70vh] w-[85vw] shrink-0 snap-center overflow-hidden md:h-[80vh] md:w-[60vw]"
          >
            <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
              <ImageSlot
                src={product.imageUrl}
                alt={product.name}
                placeholder="Look photo"
                className="h-full w-full"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-deep/85 via-transparent to-transparent" />

            <div className="absolute top-8 left-6 md:top-10 md:left-10">
              <span className="font-display text-2xl leading-none font-extrabold tracking-[0.02em] uppercase md:text-4xl">
                {TAGLINES[i % TAGLINES.length]}
              </span>
            </div>

            <div className="absolute bottom-6 left-6 flex flex-col gap-1.5 md:bottom-8 md:left-10">
              <span className="h-px w-5 bg-accent" />
              <span className="text-[10px] tracking-[0.1em] text-ink-muted uppercase">
                {product.categoryName}
              </span>
              <span className="text-sm font-semibold tracking-[0.01em] uppercase">
                {product.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
