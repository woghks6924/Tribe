import { NextResponse } from "next/server";
import { verifyAndCompletePayment } from "@/lib/payment-verify";

export async function POST(request: Request) {
  const { paymentId } = (await request.json()) as { paymentId?: string };

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId is required." }, { status: 400 });
  }

  const result = await verifyAndCompletePayment(paymentId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.reason, orderNumber: result.orderNumber },
      { status: 402 },
    );
  }

  return NextResponse.json({ orderNumber: result.orderNumber });
}
