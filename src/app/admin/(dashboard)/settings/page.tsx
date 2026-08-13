import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Settings</h1>
      <SettingsForm
        initial={{
          shippingReturnsContent: settings.shippingReturnsContent,
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
          showStudioTab: settings.showStudioTab,
          studioTheme: settings.studioTheme,
          studioHeroHeadline: settings.studioHeroHeadline,
          siteTheme: settings.siteTheme,
        }}
      />
    </div>
  );
}
