import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PhotoFinder } from "@/components/photos/photo-finder";
import { getRacePhotoOverrides, listRacePhotoSlugs } from "@/lib/race-photos-server";

// 정적 페이지: 빌드 때 이벤트 폴더마다 하나씩 만든다. 사진 데이터(index.json)는 브라우저가 직접 불러와서 검색한다.
// 관리자가 대회 정보를 저장하면 /photos 캐시를 비우고, 아니어도 5분마다 새로 만든다.
export const dynamic = "force-static";
export const revalidate = 300;
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listRacePhotoSlugs()).map((e) => ({ event: e }));
}

export default async function PhotoEventPage({ params }: { params: Promise<{ event: string }> }) {
  const { event } = await params;
  const override = (await getRacePhotoOverrides()).get(event);
  if (override && !override.published) notFound();
  return (
    <Suspense fallback={<p className="px-5 py-10 text-sm text-ink-muted">불러오는 중…</p>}>
      <PhotoFinder
        event={event}
        override={
          override
            ? { slug: override.slug, name: override.name, date: override.date, driveFolderUrl: override.driveFolderUrl, contact: override.contact }
            : null
        }
      />
    </Suspense>
  );
}
