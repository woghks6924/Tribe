import { prisma } from "@/lib/prisma";
import { BannerSlideManager } from "@/components/admin/banner-slide-manager";

export const dynamic = "force-dynamic";

export default async function AdminBannerSlidesPage() {
  const slides = await prisma.bannerSlide.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <div className="flex flex-col gap-1">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Banner Slides</h1>
        <p className="text-sm text-ink-muted">
          All active slides rotate through the homepage hero banner, in order — video slides
          advance when they finish, photo slides advance after 5 seconds.
        </p>
      </div>
      <BannerSlideManager slides={slides} />
    </div>
  );
}
