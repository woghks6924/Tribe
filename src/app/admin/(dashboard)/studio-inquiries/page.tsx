import { prisma } from "@/lib/prisma";
import { StudioInquiriesList } from "@/components/admin/studio-inquiries-list";

export const dynamic = "force-dynamic";

export default async function AdminStudioInquiriesPage() {
  const inquiries = await prisma.studioInquiry.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Studio Inquiries</h1>
      <StudioInquiriesList
        inquiries={inquiries.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() }))}
      />
    </div>
  );
}
