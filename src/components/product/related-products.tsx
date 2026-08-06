import { ProductCard } from "@/components/product/product-card";
import type { ProductCardData } from "@/types";

export function RelatedProducts({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <section className="flex flex-col gap-10 border-t border-line px-6 py-16 md:px-14 md:py-20">
      <h2 className="font-sans text-xl font-extrabold tracking-[0.02em] md:text-2xl">
        You Might Also Like
      </h2>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-7">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
