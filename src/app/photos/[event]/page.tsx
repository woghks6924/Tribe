import { Suspense } from "react";
import { PhotoFinder } from "@/components/photos/photo-finder";
import { listRacePhotoEvents } from "@/lib/race-photos-server";

// 정적 페이지: 빌드 때 이벤트 폴더마다 하나씩 만든다. 사진 데이터(index.json)는 브라우저가 직접 불러와서 검색한다.
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listRacePhotoEvents()).map((e) => ({ event: e.slug }));
}

export default async function PhotoEventPage({ params }: { params: Promise<{ event: string }> }) {
  const { event } = await params;
  return (
    <Suspense fallback={<p className="px-5 py-10 text-sm text-ink-muted">불러오는 중…</p>}>
      <PhotoFinder event={event} />
    </Suspense>
  );
}
