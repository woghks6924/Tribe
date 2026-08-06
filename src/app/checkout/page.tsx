"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import * as PortOne from "@portone/browser-sdk/v2";
import { Button } from "@/components/ui/button";
import {
  PaymentMethodSelector,
  type PgProvider,
} from "@/components/checkout/payment-method-selector";
import { formatKRW } from "@/lib/format";
import { useCartStore, cartSubtotal } from "@/lib/cart-store";
import { calcShippingFee } from "@/lib/shipping";
import { useHasMounted } from "@/lib/use-has-mounted";

const STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID!;
const CHANNEL_KEYS: Record<PgProvider, string> = {
  TOSSPAYMENTS: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_TOSS!,
  NAVERPAY: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY_NAVERPAY!,
};

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clear);
  const router = useRouter();

  const hydrated = useHasMounted();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    zipCode: "",
    address1: "",
    address2: "",
    memo: "",
  });
  const [pgProvider, setPgProvider] = useState<PgProvider>("TOSSPAYMENTS");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  const subtotal = hydrated ? cartSubtotal(items) : 0;
  const shippingFee = calcShippingFee(subtotal);
  const total = Math.max(subtotal + shippingFee - discount, 0);

  async function handleApplyPromo() {
    setPromoError(null);
    setApplyingPromo(true);
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoInput, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error ?? "Invalid promo code.");
        setPromoCode(null);
        setDiscount(0);
        return;
      }
      setPromoCode(promoInput.trim().toUpperCase());
      setDiscount(data.discountAmount);
    } catch {
      setPromoError("Something went wrong.");
    } finally {
      setApplyingPromo(false);
    }
  }

  function handleRemovePromo() {
    setPromoCode(null);
    setDiscount(0);
    setPromoInput("");
    setPromoError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: form.name, email: form.email, phone: form.phone },
          shipping: {
            zipCode: form.zipCode,
            address1: form.address1,
            address2: form.address2 || undefined,
            memo: form.memo || undefined,
          },
          items: items.map((i) => ({
            productOptionId: i.productOptionId,
            quantity: i.quantity,
          })),
          pgProvider,
          promoCode: promoCode || undefined,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error ?? "Failed to create order.");
        setLoading(false);
        return;
      }

      const { orderNumber, totalAmount } = orderData as {
        orderNumber: string;
        totalAmount: number;
      };

      const response = await PortOne.requestPayment({
        storeId: STORE_ID,
        channelKey: CHANNEL_KEYS[pgProvider],
        paymentId: orderNumber,
        orderName: `Tri.be Order (${items.length} item${items.length > 1 ? "s" : ""})`,
        totalAmount,
        currency: "CURRENCY_KRW",
        payMethod: pgProvider === "NAVERPAY" ? "EASY_PAY" : "CARD",
        customer: {
          fullName: form.name,
          email: form.email,
          phoneNumber: form.phone,
        },
        redirectUrl: `${window.location.origin}/checkout/complete`,
      });

      if (!response) {
        // Switched to a redirect-based flow; this page no longer continues.
        return;
      }

      if (response.code) {
        setError(response.message ?? "Payment failed.");
        setLoading(false);
        return;
      }

      const completeRes = await fetch("/api/payment/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId: orderNumber }),
      });

      if (!completeRes.ok) {
        const completeData = await completeRes.json();
        setError(completeData.error ?? "Failed to verify payment.");
        setLoading(false);
        return;
      }

      clearCart();
      router.push(`/checkout/complete?orderNumber=${orderNumber}`);
    } catch {
      setError("Something went wrong while processing payment. Please try again.");
      setLoading(false);
    }
  }

  if (!hydrated) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-32 text-center">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">
          Your bag is empty
        </h1>
        <Button variant="outline" onClick={() => router.push("/products")}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-12 px-6 py-16 md:grid-cols-[1fr_360px] md:px-14 md:py-20"
    >
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-5">
          <h1 className="border-b border-line pb-5 font-sans text-2xl font-extrabold tracking-[0.02em]">
            Contact Information
          </h1>
          <input
            required
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
          <input
            required
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="border-b border-line pb-5 font-sans text-lg font-extrabold tracking-[0.02em]">
            Shipping Address
          </h2>
          <input
            required
            placeholder="ZIP code"
            value={form.zipCode}
            onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
          <input
            required
            placeholder="Address"
            value={form.address1}
            onChange={(e) => setForm((f) => ({ ...f, address1: e.target.value }))}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
          <input
            placeholder="Apt, suite, etc. (optional)"
            value={form.address2}
            onChange={(e) => setForm((f) => ({ ...f, address2: e.target.value }))}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
          <input
            placeholder="Delivery notes (optional)"
            value={form.memo}
            onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
        </div>

        <div className="flex flex-col gap-5">
          <h2 className="border-b border-line pb-5 font-sans text-lg font-extrabold tracking-[0.02em]">
            Payment Method
          </h2>
          <PaymentMethodSelector value={pgProvider} onChange={setPgProvider} />
        </div>
      </div>

      <div className="flex h-fit flex-col gap-5 border border-line p-6 md:sticky md:top-28">
        <div className="flex flex-col gap-2 border-b border-line pb-5 text-sm text-ink-muted">
          {items.map((item) => (
            <div key={item.productOptionId} className="flex justify-between">
              <span>
                {item.name} ({item.color}/{item.size}) × {item.quantity}
              </span>
              <span>{formatKRW(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm text-ink-muted">
          <span>Subtotal</span>
          <span>{formatKRW(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-ink-muted">
          <span>Shipping</span>
          <span>{shippingFee === 0 ? "Free" : formatKRW(shippingFee)}</span>
        </div>

        {promoCode ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">
              Promo <span className="text-ink">{promoCode}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-red-500">-{formatKRW(discount)}</span>
              <button
                type="button"
                onClick={handleRemovePromo}
                className="cursor-pointer text-xs text-ink-faint hover:text-ink"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                placeholder="Promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                className="flex-1 border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyPromo}
                disabled={!promoInput || applyingPromo}
              >
                {applyingPromo ? "..." : "Apply"}
              </Button>
            </div>
            {promoError && <p className="text-xs text-red-400">{promoError}</p>}
          </div>
        )}

        <div className="flex justify-between border-t border-line pt-5 text-base">
          <span>Total</span>
          <span>{formatKRW(total)}</span>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Processing..." : `Pay ${formatKRW(total)}`}
        </Button>
      </div>
    </form>
  );
}
