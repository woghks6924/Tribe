import { ProductCard } from "@/components/product/product-card";
import { getSaleProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function SalePage() {
  const products = await getSaleProducts();

  return (
    <div className="flex flex-col gap-10 px-6 py-16 md:px-14 md:py-20">
      <div className="flex flex-col gap-2 border-b border-line pb-8">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em] text-red-500 md:text-3xl">
          Sale
        </h1>
        <p className="text-sm text-ink-muted">Season-off picks at a discount, while supplies last.</p>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-ink-faint">No items on sale right now.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-7">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
