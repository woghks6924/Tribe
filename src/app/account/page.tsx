import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatKRW } from "@/lib/format";
import { LogoutButton } from "@/components/account/logout-button";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getCurrentCustomer();
  if (!session) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { customerId: session.sub },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="flex flex-col gap-10 px-6 py-16 md:px-14 md:py-20">
      <div className="flex flex-col gap-2 border-b border-line pb-8 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">
            {session.name}
          </h1>
          <p className="text-sm text-ink-muted">{session.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="font-sans text-lg font-extrabold tracking-[0.02em]">Order History</h2>

        {orders.length === 0 ? (
          <p className="text-sm text-ink-faint">You haven&apos;t placed any orders yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order.id} className="flex flex-col gap-2 border border-line p-5">
                <div className="flex justify-between text-sm">
                  <span>{order.orderNumber}</span>
                  <span className="text-ink-muted">{order.status}</span>
                </div>
                <div className="flex flex-col gap-1 text-xs text-ink-muted">
                  {order.items.map((item) => (
                    <span key={item.id}>
                      {item.productName} ({item.optionLabel}) × {item.quantity}
                    </span>
                  ))}
                </div>
                <div className="text-sm">{formatKRW(order.totalAmount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
