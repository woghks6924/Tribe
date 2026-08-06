"use client";

export type PgProvider = "TOSSPAYMENTS" | "NAVERPAY";

export function PaymentMethodSelector({
  value,
  onChange,
}: {
  value: PgProvider;
  onChange: (value: PgProvider) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => onChange("TOSSPAYMENTS")}
        className={`flex items-center justify-between border px-5 py-4 text-left text-sm cursor-pointer ${
          value === "TOSSPAYMENTS"
            ? "border-ink"
            : "border-line-strong text-ink-muted hover:border-ink hover:text-ink"
        }`}
      >
        <span>Credit/Debit Card · Toss Payments</span>
        <span
          className={`h-3 w-3 rounded-full border ${
            value === "TOSSPAYMENTS" ? "border-accent bg-accent" : "border-line-strong"
          }`}
        />
      </button>

      {/* 네이버페이는 결제형 채널로 별도 버튼을 노출한다 */}
      <button
        type="button"
        onClick={() => onChange("NAVERPAY")}
        className={`flex items-center justify-between border px-5 py-4 text-left text-sm cursor-pointer ${
          value === "NAVERPAY"
            ? "border-ink"
            : "border-line-strong text-ink-muted hover:border-ink hover:text-ink"
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="inline-flex h-5 items-center bg-[#03C75A] px-2 text-[11px] font-bold text-white">
            N
          </span>
          Pay with Naver Pay
        </span>
        <span
          className={`h-3 w-3 rounded-full border ${
            value === "NAVERPAY" ? "border-accent bg-accent" : "border-line-strong"
          }`}
        />
      </button>
    </div>
  );
}
