import { prisma } from "@/lib/prisma";

export type BannerSlideData = {
  id: string;
  mediaType: "VIDEO" | "IMAGE";
  mediaUrl: string;
  label: string | null;
  brightness: number;
};

export async function getActiveBannerSlides(): Promise<BannerSlideData[]> {
  const slides = await prisma.bannerSlide.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return slides.map((s) => ({
    id: s.id,
    mediaType: s.mediaType,
    mediaUrl: s.mediaUrl,
    label: s.label,
    brightness: s.brightness,
  }));
}
