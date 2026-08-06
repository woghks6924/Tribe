"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type PromoCode = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  active: boolean;
  expiresAt: string | null;
  minOrderAmount: number | null;
  usageLimit: number | null;
  usedCount: number;
};

export function PromoCodeManager({ codes }: { codes: PromoCode[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue: Number(discountValue),
          minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
          usageLimit: usageLimit ? Number(usageLimit) : undefined,
          expiresAt: expiresAt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create code.");
        return;
      }
      setCode("");
      setDiscountValue("");
      setMinOrderAmount("");
      setUsageLimit("");
      setExpiresAt("");
      router.refresh();
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/promo-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/promo-codes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col border border-line">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto_auto] gap-4 border-b border-line bg-base-elevated px-4 py-3 text-xs tracking-[0.08em] text-ink-muted uppercase">
          <span>Code</span>
          <span>Discount</span>
          <span>Used</span>
          <span>Expires</span>
          <span>Status</span>
          <span></span>
        </div>
        {codes.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-[1fr_1fr_1fr_1fr_auto_auto] items-center gap-4 border-b border-line px-4 py-3 text-sm last:border-b-0"
          >
            <span>{c.code}</span>
            <span className="text-ink-muted">
              {c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `₩${c.discountValue.toLocaleString("en-US")}`}
            </span>
            <span className="text-ink-muted">
              {c.usedCount}
              {c.usageLimit ? ` / ${c.usageLimit}` : ""}
            </span>
            <span className="text-ink-faint">
              {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}
            </span>
            <button
              onClick={() => toggleActive(c.id, c.active)}
              className={`cursor-pointer text-xs ${c.active ? "text-ink" : "text-ink-faint"}`}
            >
              {c.active ? "Active" : "Inactive"}
            </button>
            <button
              onClick={() => handleDelete(c.id)}
              className="cursor-pointer text-xs text-ink-faint hover:text-red-400"
            >
              Delete
            </button>
          </div>
        ))}
        {codes.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-faint">No promo codes yet.</p>
        )}
      </div>

      <form onSubmit={handleCreate} className="flex max-w-md flex-col gap-4">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">New Promo Code</span>
        <input
          required
          placeholder="CODE (e.g. WELCOME10)"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />
        <div className="grid grid-cols-2 gap-4">
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")}
            className="border border-line-strong bg-base px-4 py-3 text-sm outline-none"
          >
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed Amount (₩)</option>
          </select>
          <input
            required
            type="number"
            placeholder={discountType === "PERCENTAGE" ? "e.g. 10" : "e.g. 5000"}
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Min order (optional)"
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
          <input
            type="number"
            placeholder="Usage limit (optional)"
            value={usageLimit}
            onChange={(e) => setUsageLimit(e.target.value)}
            className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
          />
        </div>
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="border border-line-strong bg-base px-4 py-3 text-sm outline-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <Button type="submit" variant="outline" disabled={loading} className="w-fit">
          {loading ? "Adding..." : "Add Code"}
        </Button>
      </form>
    </div>
  );
}
