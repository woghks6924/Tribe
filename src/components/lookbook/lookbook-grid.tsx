import Link from "next/link";
import { ImageSlot } from "@/components/ui/image-slot";
import { formatKRW } from "@/lib/format";
import type { ProductCardData } from "@/types";

const SPAN_PATTERNS = [
  "md:col-span-4 md:row-span-2",
  "md:col-span-2 md:row-span-1",
  "md:col-span-2 md:row-span-1",
  "md:col-span-3 md:row-span-1",
  "md:col-span-3 md:row-span-1",
  "md:col-span-6 md:row-span-1",
];

export function LookbookGrid({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <section className="flex flex-col gap-10 px-6 py-24 md:px-14 md:py-32">
      <div className="flex items-baseline justify-between border-b border-line pb-5">
        <h2 className="font-sans text-2xl font-extrabold tracking-[0.02em] md:text-3xl">
          The Looks
        </h2>
        <span className="text-xs tracking-[0.1em] text-ink-muted uppercase">
          Hover to reveal
        </span>
      </div>

      <div className="grid auto-rows-[220px] grid-cols-2 gap-3 md:auto-rows-[260px] md:grid-cols-6 md:gap-4">
        {products.map((product, i) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className={`group relative col-span-2 row-span-1 block overflow-hidden ${SPAN_PATTERNS[i % SPAN_PATTERNS.length]}`}
          >
            <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-110">
              <ImageSlot
                src={product.imageUrl}
                alt={product.name}
                placeholder="Look photo"
                className="h-full w-full"
              />
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-deep/90 via-base-deep/10 to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-100" />

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5">
              <span className="h-px w-5 bg-accent" />
              <span className="text-[10px] tracking-[0.1em] text-ink-muted uppercase">
                {product.categoryName}
              </span>
              <div className="overflow-hidden">
                <div className="flex translate-y-full flex-col gap-1 pt-1 transition-transform duration-500 ease-out group-hover:translate-y-0">
                  <span className="font-sans text-base font-extrabold tracking-[0.01em] uppercase">
                    {product.name}
                  </span>
                  <span className="text-xs text-ink-muted">
                    Shop the Look — {formatKRW(product.price)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
