import { prisma } from "@/lib/prisma";

export type StudioSettings = {
  showStudioTab: boolean;
  studioTheme: "light" | "dark";
  studioHeroHeadline: string;
};

export async function getStudioSettings(): Promise<StudioSettings> {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return {
    showStudioTab: settings.showStudioTab,
    studioTheme: settings.studioTheme === "DARK" ? "dark" : "light",
    studioHeroHeadline: settings.studioHeroHeadline,
  };
}

export type StudioPortfolioItemData = {
  id: string;
  title: string;
  imageUrl: string;
  videoUrl: string | null;
  category: string;
};

export async function getStudioPortfolio(): Promise<StudioPortfolioItemData[]> {
  const items = await prisma.studioPortfolioItem.findMany({ orderBy: { sortOrder: "asc" } });
  return items.map((i) => ({
    id: i.id,
    title: i.title,
    imageUrl: i.imageUrl,
    videoUrl: i.videoUrl,
    category: i.category,
  }));
}
