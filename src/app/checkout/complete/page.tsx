import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatKRW } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { verifyAndCompletePayment } from "@/lib/payment-verify";

export default async function CheckoutCompletePage({
  searchParams,
}: PageProps<"/checkout/complete">) {
  const params = await searchParams;
  const paymentId =
    (Array.isArray(params.orderNumber) ? params.orderNumber[0] : params.orderNumber) ??
    (Array.isArray(params.paymentId) ? params.paymentId[0] : params.paymentId);
  const redirectCode = Array.isArray(params.code) ? params.code[0] : params.code;
  const redirectMessage = Array.isArray(params.message)
    ? params.message[0]
    : params.message;

  if (!paymentId) {
    return <StatusScreen title="Order not found" />;
  }

  if (redirectCode) {
    return (
      <StatusScreen
        title="Payment failed"
        message={redirectMessage ?? "The payment was cancelled or an error occurred."}
      />
    );
  }

  const result = await verifyAndCompletePayment(paymentId);

  if (!result.ok) {
    return <StatusScreen title="Could not confirm payment" message={result.reason} />;
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber: result.orderNumber },
    include: { items: true },
  });

  if (!order) {
    return <StatusScreen title="Order not found" />;
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-10 px-6 py-24 text-center">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em] md:text-3xl">
        Order Confirmed
      </h1>
      <p className="text-sm text-ink-muted">Order No. {order.orderNumber}</p>

      <div className="flex w-full max-w-md flex-col gap-3 border border-line p-6 text-left">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm text-ink-muted">
            <span>
              {item.productName} ({item.optionLabel}) × {item.quantity}
            </span>
            <span>{formatKRW(item.lineTotal)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-3 text-sm">
          <span>Total</span>
          <span>{formatKRW(order.totalAmount)}</span>
        </div>
      </div>

      <Link href="/products">
        <Button variant="outline">Continue Shopping</Button>
      </Link>
    </div>
  );
}

function StatusScreen({ title, message }: { title: string; message?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-32 text-center">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">
        {title}
      </h1>
      {message && <p className="max-w-md text-sm text-ink-muted">{message}</p>}
      <Link href="/checkout">
        <Button variant="outline">Try Again</Button>
      </Link>
    </div>
  );
}
