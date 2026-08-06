"use client";

import Link from "next/link";
import { ImageSlot } from "@/components/ui/image-slot";
import { formatKRW } from "@/lib/format";
import { useCartStore, type CartItem } from "@/lib/cart-store";

export function CartItemRow({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-5 border-b border-line py-6">
      <Link href={`/products/${item.slug}`} className="relative h-28 w-24 shrink-0">
        <ImageSlot
          src={item.imageUrl}
          alt={item.name}
          placeholder="Product"
          className="h-full w-full"
        />
      </Link>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Link
              href={`/products/${item.slug}`}
              className="text-sm uppercase hover:text-ink-muted"
            >
              {item.name}
            </Link>
            <span className="text-xs text-ink-faint">
              {item.color} / {item.size}
            </span>
          </div>
          <button
            onClick={() => removeItem(item.productOptionId)}
            className="h-fit cursor-pointer text-xs text-ink-faint hover:text-ink"
          >
            Remove
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center border border-line-strong">
            <button
              onClick={() => updateQuantity(item.productOptionId, item.quantity - 1)}
              className="h-9 w-9 cursor-pointer text-ink-muted hover:text-ink"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-8 text-center text-sm">{item.quantity}</span>
            <button
              onClick={() =>
                updateQuantity(
                  item.productOptionId,
                  Math.min(item.stock, item.quantity + 1),
                )
              }
              className="h-9 w-9 cursor-pointer text-ink-muted hover:text-ink"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <span className="text-sm text-ink-muted">
            {formatKRW(item.price * item.quantity)}
          </span>
        </div>
      </div>
    </div>
  );
}
