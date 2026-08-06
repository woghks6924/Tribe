import { PaymentClient } from "@portone/server-sdk";

const apiSecret = process.env.PORTONE_API_SECRET;

let client: ReturnType<typeof PaymentClient> | undefined;

function getPaymentClient() {
  if (!apiSecret) {
    throw new Error("The PORTONE_API_SECRET environment variable is not set.");
  }
  client ??= PaymentClient({ secret: apiSecret });
  return client;
}

// 네이버페이는 최소 10원 이상만 결제 가능하다.
export const MIN_NAVERPAY_AMOUNT = 10;

export async function getPortonePayment(paymentId: string) {
  return getPaymentClient().getPayment({ paymentId });
}

export async function cancelPortonePayment(options: {
  paymentId: string;
  reason: string;
  requester: "CUSTOMER" | "ADMIN";
  amount?: number;
}) {
  return getPaymentClient().cancelPayment({
    paymentId: options.paymentId,
    reason: options.reason,
    // 취소 요청 주체 — 네이버페이 등 일부 PG는 이 값이 없으면 취소가 거부된다.
    requester: options.requester,
    amount: options.amount,
  });
}
