import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cancelPortonePayment } from "@/lib/portone";

type CancelBody = {
  orderNumber: string;
  reason: string;
  requester?: "CUSTOMER" | "ADMIN";
  amount?: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as CancelBody;

  if (!body.orderNumber || !body.reason) {
    return NextResponse.json({ error: "orderNumber and reason are required." }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { paymentId: body.orderNumber },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  }

  if (payment.status !== "PAID" && payment.status !== "PARTIALLY_CANCELLED") {
    return NextResponse.json({ error: "This payment cannot be cancelled in its current state." }, { status: 409 });
  }

  // 네이버페이 등 일부 PG는 취소 요청 주체(구매자/관리자 구분)가 없으면 취소가 거부된다.
  const requester = body.requester ?? "ADMIN";

  const result = await cancelPortonePayment({
    paymentId: body.orderNumber,
    reason: body.reason,
    requester,
    amount: body.amount,
  });

  if (result.cancellation.status !== "SUCCEEDED") {
    return NextResponse.json({ error: "The cancellation request was received but has not completed yet." }, { status: 202 });
  }

  const cancelledAmount = payment.cancelledAmount + result.cancellation.totalAmount;
  const isFullCancel = cancelledAmount >= payment.requestedAmount;

  await prisma.$transaction([
    prisma.payment.update({
      where: { paymentId: body.orderNumber },
      data: {
        status: isFullCancel ? "CANCELLED" : "PARTIALLY_CANCELLED",
        cancelledAmount,
        cancelReason: body.reason,
        cancelRequester: requester,
        cancelledAt: new Date(),
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: isFullCancel ? "CANCELLED" : "PARTIALLY_CANCELLED" },
    }),
  ]);

  return NextResponse.json({ cancelledAmount, status: isFullCancel ? "CANCELLED" : "PARTIALLY_CANCELLED" });
}
