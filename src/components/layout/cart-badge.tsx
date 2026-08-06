"use client";

import { useCartStore, cartTotalCount } from "@/lib/cart-store";
import { useHasMounted } from "@/lib/use-has-mounted";

export function CartBadge() {
  const items = useCartStore((s) => s.items);
  const hydrated = useHasMounted();

  return <>BAG ({hydrated ? cartTotalCount(items) : 0})</>;
}
