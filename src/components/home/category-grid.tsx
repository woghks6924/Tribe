import Link from "next/link";
import { ImageSlot } from "@/components/ui/image-slot";
import type { CategoryData } from "@/types";

export function CategoryGrid({ categories }: { categories: CategoryData[] }) {
  if (categories.length === 0) return null;

  return (
    <section className="flex flex-col gap-10 px-6 py-24 md:px-14 md:py-32">
      <h2 className="border-b border-line pb-5 font-sans text-2xl font-extrabold tracking-[0.02em] md:text-3xl">
        Categories
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/products?category=${category.slug}`}
            className="group relative block aspect-[3/4] overflow-hidden"
          >
            <ImageSlot
              src={category.imageUrl}
              alt={category.name}
              placeholder="Category photo"
              className="h-full w-full transition-opacity group-hover:opacity-90"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base-deep/70 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5">
              <span className="mb-2.5 block h-px w-5 bg-accent" />
              <span className="font-sans text-lg font-extrabold tracking-[0.02em]">
                {category.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
