import Link from "next/link";
import { listRacePhotoEvents } from "@/lib/race-photos-server";

// 정적 페이지: 빌드할 때 public/race-photos 폴더를 읽어서 만든다. 새 대회를 넣으면 다시 배포해야 목록에 뜬다.
export const dynamic = "force-static";

export default async function PhotosIndexPage() {
  const events = await listRacePhotoEvents();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-extrabold tracking-[0.02em] uppercase">Race Photos</h1>
        <p className="text-sm text-ink-muted">대회 사진 찾기 · 배번이나 통과 시각으로 내 사진을 찾아가세요.</p>
      </div>

      {events.length === 0 ? (
        <p className="border border-line px-4 py-6 text-sm text-ink-muted">아직 올라온 대회 사진이 없어요.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {events.map((e) => (
            <li key={e.slug}>
              <Link
                href={`/photos/${e.slug}`}
                className="flex h-full flex-col gap-2 border border-line bg-base-elevated px-4 py-4 transition-colors hover:border-ink"
              >
                <span className="text-xs tracking-[0.06em] text-ink-faint uppercase">{e.date}</span>
                <span className="text-lg leading-snug font-bold">{e.name}</span>
                <span className="mt-auto text-sm text-ink-muted">사진 {e.photoCount.toLocaleString("ko-KR")}장 →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs leading-relaxed text-ink-faint">
        사진은 무료로 배포돼요. 개인적인 기록·SNS 공유는 자유롭게 하시되, 상업적 이용은 금지돼요.
      </p>
    </div>
  );
}
