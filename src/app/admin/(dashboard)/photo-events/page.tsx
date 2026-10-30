import { prisma } from "@/lib/prisma";
import { PhotoEventManager } from "@/components/admin/photo-event-manager";

export const dynamic = "force-dynamic";

export default async function AdminPhotoEventsPage() {
  const events = await prisma.racePhotoEvent.findMany({ orderBy: { date: "desc" } });

  return (
    <div className="flex flex-col gap-6 px-8 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Race Photos</h1>
        <p className="text-sm text-ink-muted">
          대회 사진 찾기(/photos)에 보일 대회 정보를 관리해요. 사진 목록(index.json)과 썸네일은{" "}
          <code className="text-ink">public/race-photos/&lt;slug&gt;/</code> 폴더에 넣고 배포하면 돼요.
        </p>
      </div>
      <PhotoEventManager
        events={events.map((e) => ({
          id: e.id,
          slug: e.slug,
          name: e.name,
          date: e.date,
          driveFolderUrl: e.driveFolderUrl,
          contact: e.contact,
          published: e.published,
        }))}
      />
    </div>
  );
}
