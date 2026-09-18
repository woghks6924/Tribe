import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatKRW, formatBytes } from "@/lib/format";
import { getSupabaseUsage } from "@/lib/supabase-usage";

const LOW_STOCK_THRESHOLD = 5;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 29);

  const [paidOrders, recentOrders, lowStockOptions, supabaseUsage] = await Promise.all([
    prisma.order.findMany({
      where: { status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] }, createdAt: { gte: monthStart } },
      select: { totalAmount: true, createdAt: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: true },
    }),
    prisma.productOption.findMany({
      where: { stock: { lt: LOW_STOCK_THRESHOLD } },
      include: { product: { select: { name: true } } },
      orderBy: { stock: "asc" },
      take: 10,
    }),
    // Supabase Storage 조회가 실패해도(네트워크 문제 등) 대시보드 전체가 죽으면 안 되므로 방어.
    getSupabaseUsage().catch(() => null),
  ]);

  const sumSince = (since: Date) =>
    paidOrders
      .filter((o) => o.createdAt >= since)
      .reduce((sum, o) => sum + o.totalAmount, 0);

  const todayRevenue = sumSince(todayStart);
  const weekRevenue = sumSince(weekStart);
  const monthRevenue = sumSince(monthStart);

  return (
    <div className="flex flex-col gap-10 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Today" value={formatKRW(todayRevenue)} />
        <StatCard label="Last 7 Days" value={formatKRW(weekRevenue)} />
        <StatCard label="Last 30 Days" value={formatKRW(monthRevenue)} />
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-bold tracking-[0.02em] uppercase">Supabase 사용량 (Free 플랜)</h2>
        {supabaseUsage ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UsageBar
              label="Database"
              usedBytes={supabaseUsage.dbBytes}
              limitBytes={supabaseUsage.limits.dbBytes}
            />
            <UsageBar
              label={`Storage (파일 ${supabaseUsage.storageFileCount}개)`}
              usedBytes={supabaseUsage.storageBytes}
              limitBytes={supabaseUsage.limits.storageBytes}
            />
          </div>
        ) : (
          <p className="border border-line px-4 py-6 text-sm text-ink-faint">
            사용량을 불러오지 못했습니다.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-bold tracking-[0.02em] uppercase">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-ink-muted hover:text-ink">
              View all →
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-ink-faint">No orders yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.orderNumber}`}
                  className="flex items-center justify-between border border-line px-4 py-3 text-sm hover:border-ink-muted"
                >
                  <div className="flex flex-col">
                    <span>{order.orderNumber}</span>
                    <span className="text-xs text-ink-faint">{order.customerName}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span>{formatKRW(order.totalAmount)}</span>
                    <span className="text-xs text-ink-muted">{order.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-bold tracking-[0.02em] uppercase">Low Stock</h2>
          {lowStockOptions.length === 0 ? (
            <p className="text-sm text-ink-faint">Nothing below {LOW_STOCK_THRESHOLD} units.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {lowStockOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between border border-line px-4 py-3 text-sm"
                >
                  <span>
                    {option.product.name} ({option.size}/{option.color})
                  </span>
                  <span className={option.stock === 0 ? "text-red-400" : "text-ink-muted"}>
                    {option.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 border border-line p-6">
      <span className="text-xs tracking-[0.1em] text-ink-muted uppercase">{label}</span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}

function UsageBar({
  label,
  usedBytes,
  limitBytes,
}: {
  label: string;
  usedBytes: number;
  limitBytes: number;
}) {
  const pct = Math.min(100, (usedBytes / limitBytes) * 100);
  const barColor = pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-accent";
  return (
    <div className="flex flex-col gap-2 border border-line p-4">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-ink-muted">{label}</span>
        <span className="font-semibold">
          {formatBytes(usedBytes)} / {formatBytes(limitBytes)}
        </span>
      </div>
      <div className="h-1.5 w-full bg-base-elevated">
        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-ink-faint">{pct.toFixed(1)}% 사용 중</span>
    </div>
  );
}
