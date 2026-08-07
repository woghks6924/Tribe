import { prisma } from "@/lib/prisma";
import { BannerSlideManager } from "@/components/admin/banner-slide-manager";

export const dynamic = "force-dynamic";

export default async function AdminBannerSlidesPage() {
  const slides = await prisma.bannerSlide.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <div className="flex flex-col gap-3">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Banner Slides</h1>
        <p className="text-sm text-ink-muted">
          All active slides rotate through the homepage hero banner, in order — video slides
          advance when they finish, photo slides advance after 5 seconds.
        </p>
        <div className="flex flex-col gap-1 border border-line-strong bg-base-elevated px-4 py-3 text-xs text-ink-muted">
          <span className="tracking-[0.08em] text-ink uppercase">Recommended: 16:9 landscape, 1920×1080px or larger</span>
          <span>
            The banner is full-width but only 720px tall on mobile / 876px on desktop, so on wide
            screens the sides get cropped and on narrow screens the top/bottom get cropped —
            center the main subject and keep it away from the edges.
          </span>
        </div>
      </div>
      <BannerSlideManager slides={slides} />
    </div>
  );
}
