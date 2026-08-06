"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatKRW } from "@/lib/format";
import { useCartStore } from "@/lib/cart-store";
import type { ProductDetailData } from "@/types";

export function ProductOptions({ product }: { product: ProductDetailData }) {
  const sizes = useMemo(
    () => [...new Set(product.options.map((o) => o.size))],
    [product.options],
  );
  const colors = useMemo(
    () => [...new Set(product.options.map((o) => o.color))],
    [product.options],
  );

  const [size, setSize] = useState<string | null>(sizes[0] ?? null);
  const [color, setColor] = useState<string | null>(colors[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const router = useRouter();

  const selectedOption = product.options.find(
    (o) => o.size === size && o.color === color,
  );
  const stock = selectedOption?.stock ?? 0;
  const unitPrice = product.price + (selectedOption?.priceDiff ?? 0);

  function handleAddToCart() {
    if (!selectedOption || stock <= 0) return;
    addItem(
      {
        productId: product.id,
        productOptionId: selectedOption.id,
        slug: product.slug,
        name: product.name,
        size: selectedOption.size,
        color: selectedOption.color,
        price: unitPrice,
        imageUrl: product.imageUrl ?? undefined,
        stock,
      },
      quantity,
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <span className="font-sans text-2xl font-extrabold tracking-[0.01em]">
          {product.name}
        </span>
        <span className="text-lg text-ink-muted">{formatKRW(unitPrice)}</span>
      </div>

      <p className="text-sm leading-relaxed text-ink-muted">
        {product.description}
      </p>

      <div className="flex flex-col gap-3">
        <span className="text-[11px] tracking-[0.1em] text-ink-faint uppercase">
          Color {color ? `— ${color}` : ""}
        </span>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`border px-4 py-2 text-xs uppercase tracking-[0.04em] cursor-pointer ${
                color === c
                  ? "border-ink bg-ink text-base"
                  : "border-line-strong text-ink-muted hover:border-ink hover:text-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[11px] tracking-[0.1em] text-ink-faint uppercase">
          Size {size ? `— ${size}` : ""}
        </span>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`h-11 w-11 border text-xs uppercase cursor-pointer ${
                size === s
                  ? "border-ink bg-ink text-base"
                  : "border-line-strong text-ink-muted hover:border-ink hover:text-ink"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[11px] tracking-[0.1em] text-ink-faint uppercase">
          Quantity {selectedOption ? `(${stock} in stock)` : "(no option selected)"}
        </span>
        <div className="flex w-fit items-center border border-line-strong">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="h-11 w-11 cursor-pointer text-ink-muted hover:text-ink"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-sm">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(stock || 1, q + 1))}
            className="h-11 w-11 cursor-pointer text-ink-muted hover:text-ink"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="primary"
          className="flex-1"
          disabled={!selectedOption || stock <= 0}
          onClick={handleAddToCart}
        >
          {!selectedOption
            ? "Select an option"
            : stock <= 0
              ? "Sold Out"
              : justAdded
                ? "Added to Bag"
                : "Add to Bag"}
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={!selectedOption || stock <= 0}
          onClick={() => {
            handleAddToCart();
            router.push("/cart");
          }}
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
