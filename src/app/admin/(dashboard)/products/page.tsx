import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatKRW } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: { select: { name: true } } },
  });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Products</h1>
        <Link
          href="/admin/products/new"
          className="bg-ink px-5 py-2.5 text-xs font-semibold tracking-[0.08em] text-base uppercase hover:bg-ink/85"
        >
          New Product
        </Link>
      </div>

      <div className="flex flex-col border border-line">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-line bg-base-elevated px-4 py-3 text-xs tracking-[0.08em] text-ink-muted uppercase">
          <span>Name</span>
          <span>Category</span>
          <span>Price</span>
          <span>Status</span>
        </div>
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/admin/products/${p.id}/edit`}
            className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-line px-4 py-3 text-sm last:border-b-0 hover:bg-base-elevated"
          >
            <span>{p.name}</span>
            <span className="text-ink-muted">{p.category.name}</span>
            <span className="text-ink-muted">{formatKRW(p.price)}</span>
            <span className="text-ink-muted">{p.status}</span>
          </Link>
        ))}
        {products.length === 0 && (
          <p className="px-4 py-6 text-sm text-ink-faint">No products yet.</p>
        )}
      </div>
    </div>
  );
}
