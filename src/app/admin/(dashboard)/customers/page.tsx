import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Customers</h1>

      <div className="flex flex-col border border-line">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 border-b border-line bg-base-elevated px-4 py-3 text-xs tracking-[0.08em] text-ink-muted uppercase">
          <span>Name</span>
          <span>Email</span>
          <span>Orders</span>
          <span>Joined</span>
        </div>
        {customers.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 border-b border-line px-4 py-3 text-sm last:border-b-0"
          >
            <span>{c.name}</span>
            <span className="text-ink-muted">{c.email}</span>
            <span className="text-ink-muted">{c._count.orders}</span>
            <span className="text-ink-faint">{c.createdAt.toLocaleDateString()}</span>
          </div>
        ))}
        {customers.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-faint">No customers yet.</p>
        )}
      </div>
    </div>
  );
}
