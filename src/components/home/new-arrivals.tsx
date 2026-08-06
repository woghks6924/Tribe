import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import type { ProductCardData } from "@/types";

export function NewArrivals({ products }: { products: ProductCardData[] }) {
  return (
    <section className="flex flex-col gap-10 px-6 py-24 md:px-14 md:py-32">
      <div className="flex items-baseline justify-between border-b border-line pb-5">
        <h2 className="font-sans text-2xl font-extrabold tracking-[0.02em] md:text-3xl">
          New Arrivals
        </h2>
        <Link
          href="/products"
          className="text-xs tracking-[0.1em] text-ink-muted uppercase hover:text-ink"
        >
          View All →
        </Link>
      </div>
      {products.length === 0 ? (
        <p className="text-sm text-ink-faint">
          No products yet. Run the Prisma seed to populate demo products.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-7">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
