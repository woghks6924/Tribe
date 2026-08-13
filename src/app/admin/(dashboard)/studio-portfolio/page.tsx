import { prisma } from "@/lib/prisma";
import { StudioPortfolioManager } from "@/components/admin/studio-portfolio-manager";

export const dynamic = "force-dynamic";

export default async function AdminStudioPortfolioPage() {
  const items = await prisma.studioPortfolioItem.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Studio Portfolio</h1>
      <StudioPortfolioManager items={items} />
    </div>
  );
}
