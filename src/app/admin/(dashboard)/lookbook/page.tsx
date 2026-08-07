import { prisma } from "@/lib/prisma";
import { LookbookPhotoManager } from "@/components/admin/lookbook-photo-manager";

export const dynamic = "force-dynamic";

export default async function AdminLookbookPage() {
  const photos = await prisma.lookbookPhoto.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Lookbook Photos</h1>
      <LookbookPhotoManager photos={photos} />
    </div>
  );
}
