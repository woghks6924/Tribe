import { NextResponse } from "next/server";
import { Webhook } from "@portone/server-sdk";
import { verifyAndCompletePayment } from "@/lib/payment-verify";

const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET;

// 포트원이 결제/취소 상태 변경 시 비동기로 호출하는 웹훅.
// 클라이언트가 이탈하거나 리다이렉트가 중간에 끊긴 경우에도 주문 상태를 동기화하기 위한 보조 경로다.
export async function POST(request: Request) {
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret is not configured." }, { status: 500 });
  }

  const payload = await request.text();
  const headers = {
    "webhook-id": request.headers.get("webhook-id") ?? "",
    "webhook-signature": request.headers.get("webhook-signature") ?? "",
    "webhook-timestamp": request.headers.get("webhook-timestamp") ?? "",
  };

  let webhook;
  try {
    webhook = await Webhook.verify(webhookSecret, payload, headers);
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 401 });
  }

  if (
    webhook.type === "Transaction.Paid" ||
    webhook.type === "Transaction.VirtualAccountIssued"
  ) {
    await verifyAndCompletePayment(webhook.data.paymentId);
  }

  return NextResponse.json({ received: true });
}
