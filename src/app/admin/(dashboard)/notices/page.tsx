import { prisma } from "@/lib/prisma";
import { NoticeManager } from "@/components/admin/notice-manager";

export const dynamic = "force-dynamic";

export default async function AdminNoticesPage() {
  const notices = await prisma.notice.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Notices</h1>
      <NoticeManager
        notices={notices.map((n) => ({
          ...n,
          startAt: n.startAt?.toISOString() ?? null,
          endAt: n.endAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
