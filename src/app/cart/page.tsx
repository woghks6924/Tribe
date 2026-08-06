"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { Button } from "@/components/ui/button";
import { formatKRW } from "@/lib/format";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { calcShippingFee, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import { useHasMounted } from "@/lib/use-has-mounted";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const router = useRouter();
  const hydrated = useHasMounted();

  const subtotal = hydrated ? cartSubtotal(items) : 0;
  const shippingFee = calcShippingFee(subtotal);
  const total = subtotal + shippingFee;

  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-32 text-center">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">
          Your bag is empty
        </h1>
        <Link href="/products">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-12 px-6 py-16 md:grid-cols-[1fr_360px] md:px-14 md:py-20">
      <div>
        <h1 className="mb-6 border-b border-line pb-5 font-sans text-2xl font-extrabold tracking-[0.02em]">
          Shopping Bag
        </h1>
        {items.map((item) => (
          <CartItemRow key={item.productOptionId} item={item} />
        ))}
      </div>

      <div className="flex h-fit flex-col gap-5 border border-line p-6 md:sticky md:top-28">
        <div className="flex justify-between text-sm text-ink-muted">
          <span>Subtotal</span>
          <span>{formatKRW(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-ink-muted">
          <span>Shipping</span>
          <span>{shippingFee === 0 ? "Free" : formatKRW(shippingFee)}</span>
        </div>
        {shippingFee > 0 && (
          <p className="text-[11px] text-ink-faint">
            Free shipping on orders over {formatKRW(FREE_SHIPPING_THRESHOLD)}
          </p>
        )}
        <div className="flex justify-between border-t border-line pt-5 text-base">
          <span>Total</span>
          <span>{formatKRW(total)}</span>
        </div>
        <Button variant="primary" onClick={() => router.push("/checkout")}>
          Checkout
        </Button>
      </div>
    </div>
  );
}
