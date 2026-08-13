import { prisma } from "@/lib/prisma";

export type HomeContent = {
  heroBadgeText: string;
  heroHeadline: string;
  heroSubtext: string;
  storyLabel: string;
  storyHeadline: string;
  storyBody: string;
  crewLabel: string;
  crewHeadline: string;
  crewBody: string;
  crewCta: string;
  newsletterHeadline: string;
  newsletterBody: string;
};

export async function getShippingReturnsContent(): Promise<string> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
  return settings?.shippingReturnsContent ?? "";
}

export async function getSiteTheme(): Promise<"light" | "dark"> {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  return settings.siteTheme === "LIGHT" ? "light" : "dark";
}

export async function getHomeContent(): Promise<HomeContent> {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return {
    heroBadgeText: settings.heroBadgeText,
    heroHeadline: settings.heroHeadline,
    heroSubtext: settings.heroSubtext,
    storyLabel: settings.storyLabel,
    storyHeadline: settings.storyHeadline,
    storyBody: settings.storyBody,
    crewLabel: settings.crewLabel,
    crewHeadline: settings.crewHeadline,
    crewBody: settings.crewBody,
    crewCta: settings.crewCta,
    newsletterHeadline: settings.newsletterHeadline,
    newsletterBody: settings.newsletterBody,
  };
}
