import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { getCategories, getProducts } from "@/lib/products";

export default async function ProductsPage({
  searchParams,
}: PageProps<"/products">) {
  const { category } = await searchParams;
  const categorySlug = Array.isArray(category) ? category[0] : category;

  const [products, categories] = await Promise.all([
    getProducts({ categorySlug }),
    getCategories(),
  ]);

  return (
    <div className="flex flex-col gap-10 px-6 py-16 md:px-14 md:py-20">
      <div className="flex flex-col gap-6 border-b border-line pb-8">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em] md:text-3xl">
          All Products
        </h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/products"
            className={`border px-4 py-2 text-[11px] tracking-[0.08em] uppercase ${
              !categorySlug
                ? "border-ink bg-ink text-base"
                : "border-line-strong text-ink-muted hover:border-ink hover:text-ink"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className={`border px-4 py-2 text-[11px] tracking-[0.08em] uppercase ${
                categorySlug === c.slug
                  ? "border-ink bg-ink text-base"
                  : "border-line-strong text-ink-muted hover:border-ink hover:text-ink"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-ink-faint">No products in this category.</p>
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
