"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  productOptionId: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  stock: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  updateQuantity: (productOptionId: string, quantity: number) => void;
  removeItem: (productOptionId: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, quantity) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productOptionId === item.productOptionId,
          );
          if (existing) {
            const nextQuantity = Math.min(
              existing.quantity + quantity,
              existing.stock,
            );
            return {
              items: state.items.map((i) =>
                i.productOptionId === item.productOptionId
                  ? { ...i, quantity: nextQuantity }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, quantity: Math.min(quantity, item.stock) },
            ],
          };
        }),
      updateQuantity: (productOptionId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productOptionId !== productOptionId)
              : state.items.map((i) =>
                  i.productOptionId === productOptionId
                    ? { ...i, quantity: Math.min(quantity, i.stock) }
                    : i,
                ),
        })),
      removeItem: (productOptionId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productOptionId !== productOptionId),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "tribe-cart" },
  ),
);

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function cartTotalCount(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
