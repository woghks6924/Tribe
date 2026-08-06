import { prisma } from "@/lib/prisma";
import { getPortonePayment, MIN_NAVERPAY_AMOUNT } from "@/lib/portone";
import type { PaymentMethod as PortonePaymentMethod } from "@portone/server-sdk/payment";
import type { PaymentMethod as PrismaPaymentMethod } from "@/generated/prisma/enums";

export type VerifyResult =
  | { ok: true; orderNumber: string }
  | { ok: false; orderNumber: string; reason: string };

function mapPaymentMethod(
  method: PortonePaymentMethod | undefined,
): PrismaPaymentMethod | undefined {
  if (!method) return undefined;
  switch (method.type) {
    case "PaymentMethodCard":
      return "CARD";
    case "PaymentMethodVirtualAccount":
      return "VIRTUAL_ACCOUNT";
    case "PaymentMethodTransfer":
      return "TRANSFER";
    case "PaymentMethodEasyPay":
      return method.provider === "NAVERPAY" ? "NAVER_PAY" : "EASY_PAY";
    default:
      return undefined;
  }
}

/**
 * 포트원 결제내역 조회 API로 실제 결제금액과 주문금액이 일치하는지 검증하고,
 * 결과에 따라 Order/Payment 상태를 갱신한다. 이미 처리된 결제는 재조회 없이 현재 상태를 반환한다(멱등).
 */
export async function verifyAndCompletePayment(
  paymentId: string,
): Promise<VerifyResult> {
  const payment = await prisma.payment.findUnique({
    where: { paymentId },
    include: { order: { include: { items: true } } },
  });

  if (!payment) {
    return { ok: false, orderNumber: paymentId, reason: "Order not found." };
  }

  if (payment.status === "PAID") {
    return { ok: true, orderNumber: payment.order.orderNumber };
  }

  const portonePayment = await getPortonePayment(paymentId);

  if (portonePayment.status !== "PAID") {
    const reason =
      portonePayment.status === "FAILED"
        ? (portonePayment.failure.reason ?? "Payment failed.")
        : `Payment was not completed (status: ${String(portonePayment.status)}).`;

    await prisma.$transaction([
      prisma.payment.update({
        where: { paymentId },
        data: { status: "FAILED", failReason: reason },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "FAILED" },
      }),
    ]);

    return { ok: false, orderNumber: payment.order.orderNumber, reason };
  }

  const paidAmount = portonePayment.amount.paid;

  if (paidAmount !== payment.requestedAmount) {
    const reason = `Payment amount mismatch (order: ${payment.requestedAmount}, paid: ${paidAmount}).`;
    await prisma.$transaction([
      prisma.payment.update({
        where: { paymentId },
        data: { status: "FAILED", failReason: reason, paidAmount },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "FAILED" },
      }),
    ]);
    return { ok: false, orderNumber: payment.order.orderNumber, reason };
  }

  if (
    payment.pgProvider === "NAVERPAY" &&
    paidAmount < MIN_NAVERPAY_AMOUNT
  ) {
    const reason = `Naver Pay requires a minimum payment of ₩${MIN_NAVERPAY_AMOUNT}.`;
    await prisma.$transaction([
      prisma.payment.update({
        where: { paymentId },
        data: { status: "FAILED", failReason: reason, paidAmount },
      }),
      prisma.order.update({
        where: { id: payment.orderId },
        data: { status: "FAILED" },
      }),
    ]);
    return { ok: false, orderNumber: payment.order.orderNumber, reason };
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { paymentId },
      data: {
        status: "PAID",
        paidAmount,
        method: mapPaymentMethod(portonePayment.method),
        pgTxId: portonePayment.pgTxId,
        receiptUrl: portonePayment.receiptUrl,
        approvedAt: new Date(portonePayment.paidAt),
        raw: portonePayment as unknown as object,
      },
    }),
    prisma.order.update({
      where: { id: payment.orderId },
      data: { status: "PAID" },
    }),
    ...payment.order.items.map((item) =>
      prisma.productOption.update({
        where: { id: item.productOptionId },
        data: { stock: { decrement: item.quantity } },
      }),
    ),
  ]);

  return { ok: true, orderNumber: payment.order.orderNumber };
}
