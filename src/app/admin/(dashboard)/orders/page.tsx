import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatKRW } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Orders</h1>

      <div className="flex flex-col border border-line">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 border-b border-line bg-base-elevated px-4 py-3 text-xs tracking-[0.08em] text-ink-muted uppercase">
          <span>Order No.</span>
          <span>Customer</span>
          <span>Total</span>
          <span>Status</span>
          <span>Date</span>
        </div>
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/admin/orders/${order.orderNumber}`}
            className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-4 border-b border-line px-4 py-3 text-sm last:border-b-0 hover:bg-base-elevated"
          >
            <span>{order.orderNumber}</span>
            <span className="text-ink-muted">{order.customerName}</span>
            <span className="text-ink-muted">{formatKRW(order.totalAmount)}</span>
            <span className="text-ink-muted">{order.status}</span>
            <span className="text-ink-faint">{order.createdAt.toLocaleDateString()}</span>
          </Link>
        ))}
        {orders.length === 0 && <p className="px-4 py-6 text-sm text-ink-faint">No orders yet.</p>}
      </div>
    </div>
  );
}
