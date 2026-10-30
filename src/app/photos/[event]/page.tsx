import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PhotoFinder } from "@/components/photos/photo-finder";
import { listRacePhotoSlugs, resolveRacePhotoSource } from "@/lib/race-photos-server";

// 정적 페이지: 빌드 때 폴더·등록된 대회마다 하나씩 만들고, 관리자가 새로 올린 대회는 처음 열릴 때 만들어진다.
// 관리자가 저장하거나 사진 데이터를 올리면 /photos 캐시를 비우고, 아니어도 5분마다 새로 만든다.
export const dynamic = "force-static";
export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await listRacePhotoSlugs()).map((e) => ({ event: e }));
}

export default async function PhotoEventPage({ params }: { params: Promise<{ event: string }> }) {
  const { event } = await params;
  const src = await resolveRacePhotoSource(event);
  if (!src) notFound();
  const o = src.override;
  return (
    <Suspense fallback={<p className="px-5 py-10 text-sm text-ink-muted">불러오는 중…</p>}>
      <PhotoFinder
        event={event}
        dataBase={src.dataBase}
        version={src.version}
        override={
          o ? { slug: o.slug, name: o.name, date: o.date, driveFolderUrl: o.driveFolderUrl, contact: o.contact } : null
        }
      />
    </Suspense>
  );
}
