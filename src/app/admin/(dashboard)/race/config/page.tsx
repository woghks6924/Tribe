import Link from "next/link";
import { getRaceLevelConfig, getRaceInfluenceConfig } from "@/lib/race/appearance";
import { RaceConfigManager } from "@/components/admin/race-config-manager";

export const dynamic = "force-dynamic";

export default async function AdminRaceConfigPage() {
  const [level, influence] = await Promise.all([getRaceLevelConfig(), getRaceInfluenceConfig()]);

  return (
    <div className="flex flex-col gap-8 px-8 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-sans text-2xl font-extrabold tracking-[0.02em]">Race — Settings</h1>
        <Link href="/admin/race" className="text-sm text-ink-muted hover:text-ink">
          ← 시즌 관리
        </Link>
      </div>
      <RaceConfigManager initial={{ ...level, ...influence }} />
    </div>
  );
}
