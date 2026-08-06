import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatKRW } from "@/lib/format";
import { OrderActions } from "@/components/admin/order-actions";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true, payment: true },
  });

  if (!order) notFound();

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">{order.orderNumber}</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3 border border-line p-6">
            <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">Customer</span>
            <p className="text-sm">{order.customerName}</p>
            <p className="text-sm text-ink-muted">{order.customerEmail}</p>
            <p className="text-sm text-ink-muted">{order.customerPhone}</p>
            <div className="mt-2 border-t border-line pt-3 text-sm text-ink-muted">
              {order.zipCode} {order.address1} {order.address2}
              {order.shippingMemo && <p className="mt-1 text-xs">Memo: {order.shippingMemo}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-3 border border-line p-6">
            <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">Items</span>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.productName} ({item.optionLabel}) × {item.quantity}
                </span>
                <span className="text-ink-muted">{formatKRW(item.lineTotal)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-line pt-3 text-sm">
              <span>Subtotal</span>
              <span>{formatKRW(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span>{formatKRW(order.shippingFee)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatKRW(order.totalAmount)}</span>
            </div>
          </div>

          {order.payment && (
            <div className="flex flex-col gap-2 border border-line p-6 text-sm">
              <span className="mb-1 text-xs tracking-[0.08em] text-ink-muted uppercase">Payment</span>
              <div className="flex justify-between">
                <span className="text-ink-muted">PG</span>
                <span>{order.payment.pgProvider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Status</span>
                <span>{order.payment.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Paid Amount</span>
                <span>{order.payment.paidAmount ? formatKRW(order.payment.paidAmount) : "—"}</span>
              </div>
              {order.payment.receiptUrl && (
                <a
                  href={order.payment.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-muted underline hover:text-ink"
                >
                  View Receipt
                </a>
              )}
            </div>
          )}
        </div>

        <OrderActions
          orderNumber={order.orderNumber}
          initialStatus={order.status}
          initialTrackingNumber={order.trackingNumber ?? ""}
          initialCarrier={order.carrier ?? ""}
          canCancel={order.payment?.status === "PAID" || order.payment?.status === "PARTIALLY_CANCELLED"}
        />
      </div>
    </div>
  );
}
