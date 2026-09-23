"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RaceAcc, RaceBodyType, RaceEye } from "@/lib/race/constants";
import { RaceCustomizer, type RaceCustomizeValue } from "@/components/race/race-customizer";

export function RaceEditForm({
  initial,
  type,
}: {
  initial: { color: string; eye: RaceEye; acc: RaceAcc; igHandle: string };
  type: RaceBodyType;
}) {
  const router = useRouter();
  const [value, setValue] = useState<RaceCustomizeValue>(initial);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setSaving(true);
    try {
      const res = await fetch("/api/race/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했어요.");
        return;
      }
      setOk(true);
      router.refresh();
    } catch {
      setError("문제가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <RaceCustomizer value={value} onChange={setValue} previewType={type} />
      {error && <p className="text-sm text-[#f08068]">{error}</p>}
      {ok && <p className="text-sm text-[#86d494]">저장했어요. 코스와 리더보드에 바로 반영돼요.</p>}
      <div>
        <button
          type="submit"
          disabled={saving}
          className="w-fit cursor-pointer rounded border border-[#0e0f11] bg-[#f0b84a] px-4 py-2.5 text-sm font-bold text-[#2a1d05] shadow-[3px_3px_0_#0e0f11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#0e0f11] disabled:opacity-40"
        >
          {saving ? "저장 중..." : "저장하기"}
        </button>
      </div>
    </form>
  );
}
