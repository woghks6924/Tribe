"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RaceLevelConfig } from "@/lib/race/level";
import type { RaceInfluenceConfig } from "@/lib/race/appearance";

export type RaceConfigValue = RaceLevelConfig & RaceInfluenceConfig;

type FormState = {
  levelBaseKm: string;
  levelExponent: string;
  maxLevel: string;
  pickLevels: string;
  attackRatio: string;
  cheerRatio: string;
  nearbyRankRange: string;
};

function toForm(c: RaceConfigValue): FormState {
  return {
    levelBaseKm: String(c.levelBaseKm),
    levelExponent: String(c.levelExponent),
    maxLevel: String(c.maxLevel),
    pickLevels: c.pickLevels.join(", "),
    attackRatio: String(Math.round(c.attackRatio * 1000) / 10),
    cheerRatio: String(Math.round(c.cheerRatio * 1000) / 10),
    nearbyRankRange: String(c.nearbyRankRange),
  };
}

export function RaceConfigManager({ initial }: { initial: RaceConfigValue }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(toForm(initial));
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const previewLevel = Number(form.maxLevel) || 0;
  const previewKm =
    Number(form.levelBaseKm) > 0 && Number(form.levelExponent) > 0
      ? (Number(form.levelBaseKm) * Math.pow(previewLevel, Number(form.levelExponent))).toFixed(0)
      : "-";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const pickLevels = form.pickLevels
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0);

    setSaving(true);
    try {
      const res = await fetch("/api/admin/race/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelBaseKm: Number(form.levelBaseKm),
          levelExponent: Number(form.levelExponent),
          maxLevel: Number(form.maxLevel),
          pickLevels,
          attackRatio: Number(form.attackRatio) / 100,
          cheerRatio: Number(form.cheerRatio) / 100,
          nearbyRankRange: Number(form.nearbyRankRange),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했어요.");
        return;
      }
      setOk(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-3 border border-line p-4">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">레벨 공식</span>
        <p className="text-xs text-ink-faint">필요 누적 km = 기준km × 레벨^지수. 최대 레벨에서 필요 누적 {previewKm}km.</p>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-xs text-ink-faint">
            기준 km
            <input
              type="number"
              step="0.1"
              value={form.levelBaseKm}
              onChange={(e) => setForm({ ...form, levelBaseKm: e.target.value })}
              className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-faint">
            지수
            <input
              type="number"
              step="0.1"
              value={form.levelExponent}
              onChange={(e) => setForm({ ...form, levelExponent: e.target.value })}
              className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-faint">
            최대 레벨
            <input
              type="number"
              value={form.maxLevel}
              onChange={(e) => setForm({ ...form, maxLevel: e.target.value })}
              className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          장비 선택 레벨 (쉼표로 구분)
          <input
            value={form.pickLevels}
            onChange={(e) => setForm({ ...form, pickLevels: e.target.value })}
            placeholder="3, 5, 8, 10, 13, 15, 20, 25"
            className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 border border-line p-4">
        <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">공격 / 응원</span>
        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-xs text-ink-faint">
            공격 비율 (%)
            <input
              type="number"
              step="0.5"
              value={form.attackRatio}
              onChange={(e) => setForm({ ...form, attackRatio: e.target.value })}
              className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-faint">
            응원 비율 (%)
            <input
              type="number"
              step="0.5"
              value={form.cheerRatio}
              onChange={(e) => setForm({ ...form, cheerRatio: e.target.value })}
              className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-faint">
            공격 가능 순위 범위 (±)
            <input
              type="number"
              value={form.nearbyRankRange}
              onChange={(e) => setForm({ ...form, nearbyRankRange: e.target.value })}
              className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
            />
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {ok && <p className="text-sm text-accent">저장했어요.</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-fit cursor-pointer bg-ink px-4 py-2 text-xs font-semibold text-[color:var(--color-base)] disabled:opacity-40"
      >
        {saving ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}
