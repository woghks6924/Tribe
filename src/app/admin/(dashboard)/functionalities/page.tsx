import { prisma } from "@/lib/prisma";
import { FunctionalityManager } from "@/components/admin/functionality-manager";

export const dynamic = "force-dynamic";

export default async function AdminFunctionalitiesPage() {
  const functionalities = await prisma.functionality.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Functionality Library</h1>
        <p className="text-sm text-ink-muted">
          Reusable feature cards (icon, title, description) — pick which ones apply when editing
          a product.
        </p>
      </div>
      <FunctionalityManager functionalities={functionalities} />
    </div>
  );
}
