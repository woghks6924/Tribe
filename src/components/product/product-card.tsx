import Link from "next/link";
import { ImageSlot } from "@/components/ui/image-slot";
import { formatKRW } from "@/lib/format";
import type { ProductCardData } from "@/types";

export function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <Link href={`/products/${product.slug}`} className="group flex flex-col gap-4">
      <div className="relative aspect-[4/5] w-full">
        <ImageSlot
          src={product.imageUrl}
          alt={product.name}
          placeholder="Product photo"
          className="h-full w-full transition-opacity group-hover:opacity-90"
        />
        <span className="absolute top-3 left-3 border border-line-strong bg-base/80 px-2.5 py-1 text-[10px] tracking-[0.06em] text-ink-muted uppercase">
          {product.categoryName}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="uppercase">{product.name}</span>
          <span className="text-ink-muted">{formatKRW(product.price)}</span>
        </div>
        {product.compareAtPrice && (
          <span className="text-[11px] text-ink-faint line-through">
            {formatKRW(product.compareAtPrice)}
          </span>
        )}
      </div>
    </Link>
  );
}
