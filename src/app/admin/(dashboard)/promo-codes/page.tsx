import { prisma } from "@/lib/prisma";
import { PromoCodeManager } from "@/components/admin/promo-code-manager";

export const dynamic = "force-dynamic";

export default async function AdminPromoCodesPage() {
  const codes = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Promo Codes</h1>
      <PromoCodeManager
        codes={codes.map((c) => ({ ...c, expiresAt: c.expiresAt?.toISOString() ?? null }))}
      />
    </div>
  );
}
