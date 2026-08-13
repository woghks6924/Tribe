"use client";

import { useRouter } from "next/navigation";

type Inquiry = {
  id: string;
  brandName: string;
  contactName: string;
  contactInfo: string;
  packageInterest: string | null;
  message: string;
  status: "NEW" | "CONTACTED" | "CLOSED";
  createdAt: string;
};

const STATUSES = ["NEW", "CONTACTED", "CLOSED"] as const;

export function StudioInquiriesList({ inquiries }: { inquiries: Inquiry[] }) {
  const router = useRouter();

  async function updateStatus(id: string, status: (typeof STATUSES)[number]) {
    await fetch(`/api/admin/studio-inquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  if (inquiries.length === 0) {
    return (
      <p className="border border-line px-4 py-6 text-sm text-ink-faint">No inquiries yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {inquiries.map((inquiry) => (
        <div key={inquiry.id} className="flex flex-col gap-2 border border-line p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="font-semibold">{inquiry.brandName}</span>
              <span className="text-xs text-ink-muted">
                {inquiry.contactName} · {inquiry.contactInfo}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-ink-faint">
                {new Date(inquiry.createdAt).toLocaleString()}
              </span>
              <select
                value={inquiry.status}
                onChange={(e) =>
                  updateStatus(inquiry.id, e.target.value as (typeof STATUSES)[number])
                }
                className="border border-line-strong bg-base px-2 py-1.5 text-xs outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {inquiry.packageInterest && (
            <span className="text-xs text-ink-muted">Interested in: {inquiry.packageInterest}</span>
          )}
          <p className="text-ink-muted">{inquiry.message}</p>
        </div>
      ))}
    </div>
  );
}
