"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "PARTIALLY_CANCELLED",
  "FAILED",
] as const;

export function OrderActions({
  orderNumber,
  initialStatus,
  initialTrackingNumber,
  initialCarrier,
  canCancel,
}: {
  orderNumber: string;
  initialStatus: string;
  initialTrackingNumber: string;
  initialCarrier: string;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [carrier, setCarrier] = useState(initialCarrier);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/orders/${orderNumber}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, trackingNumber, carrier }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Failed to save.");
      return;
    }
    setMessage("Saved.");
    router.refresh();
  }

  async function handleCancel() {
    const reason = window.prompt("Reason for cancellation:");
    if (!reason) return;
    setCancelling(true);
    setMessage(null);
    const res = await fetch("/api/payment/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderNumber, reason, requester: "ADMIN" }),
    });
    const data = await res.json();
    setCancelling(false);
    if (!res.ok) {
      setMessage(data.error ?? "Failed to cancel.");
      return;
    }
    setMessage("Cancelled.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 border border-line p-6">
      <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">Fulfillment</span>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border border-line-strong bg-base px-4 py-3 text-sm outline-none"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <input
        placeholder="Tracking number"
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
      />
      <input
        placeholder="Carrier"
        value={carrier}
        onChange={(e) => setCarrier(e.target.value)}
        className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
      />

      {message && <p className="text-xs text-ink-muted">{message}</p>}

      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        {canCancel && (
          <Button variant="outline" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? "Cancelling..." : "Cancel & Refund"}
          </Button>
        )}
      </div>
    </div>
  );
}
