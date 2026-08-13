import { notFound } from "next/navigation";
import { getStudioSettings } from "@/lib/studio";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const { showStudioTab, studioTheme } = await getStudioSettings();

  // 방향이 아직 확정되지 않은 서비스라, 꺼져 있으면 라우트 자체를 완전히 숨긴다.
  if (!showStudioTab) notFound();

  return (
    <div data-theme={studioTheme} className="studio-root min-h-screen">
      {children}
    </div>
  );
}
