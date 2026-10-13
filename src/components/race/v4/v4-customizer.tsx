"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { V4Look } from "@/lib/race/v4/sprite";
import { COLOR_NAMES, HAIR_NAMES, PALETTE } from "@/lib/race/v4/palette";
import { V4Avatar } from "./v4-avatar";

type Parts = { hairStyle: string | null; colors: V4Look["colors"]; bib: number | null };

// 프로필 꾸미기: 헤어(전부 무료) · 상의/하의/신발/머리 색 · 배번 · 인스타 아이디. 저장은 서버(/api/race/v4-look).
// 장비는 옷장에서 따로 고르므로 미리보기에는 지금 입고 있는 장비가 그대로 보인다.
export function V4Customizer({
  initial,
  item,
  igHandle,
  todayLogged,
}: {
  initial: { hairStyle: string | null; colors: V4Look["colors"]; bib: number | null };
  item: string | null;
  igHandle: string;
  todayLogged: boolean;
}) {
  const router = useRouter();
  const [parts, setParts] = useState<Parts>(initial);
  const [ig, setIg] = useState(igHandle);
  const [dir, setDir] = useState<"south" | "east">("south");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const look: V4Look = { hair: parts.hairStyle, item, bib: parts.bib, colors: parts.colors };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setSaving(true);
    try {
      const res = await fetch("/api/race/v4-look", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hairStyle: parts.hairStyle,
          topColor: parts.colors.top,
          bottomColor: parts.colors.bottom,
          shoesColor: parts.colors.shoes,
          hairColor: parts.colors.hair,
          bibNumber: parts.bib,
          igHandle: ig,
        }),
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
    <form onSubmit={save} className="flex flex-col gap-4">
      <div className="flex items-end gap-3 rounded bg-[#17181b] p-3">
        <V4Avatar
          look={look}
          scale={3}
          animated
          dir={dir}
          anim={todayLogged ? "running" : "breathing_idle"}
          label="꾸민 캐릭터 미리보기"
        />
        <div className="flex gap-1.5">
          {(
            [
              ["south", "정면"],
              ["east", "옆"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              aria-pressed={dir === k}
              onClick={() => setDir(k)}
              className={`cursor-pointer rounded border px-2.5 py-1 text-xs ${
                dir === k ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21]" : "border-[#3c3d43] text-[#a3a29a]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-[#a3a29a]">헤어 (전부 무료)</span>
        <div className="flex flex-wrap gap-1.5">
          {HAIR_NAMES.map(([id, name]) => (
            <button
              key={String(id)}
              type="button"
              aria-pressed={parts.hairStyle === id}
              onClick={() => setParts((p) => ({ ...p, hairStyle: id }))}
              className={`cursor-pointer rounded border px-2.5 py-1.5 text-[13px] ${
                parts.hairStyle === id ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21]" : "border-[#3c3d43] text-[#a3a29a]"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
        {(Object.keys(PALETTE) as (keyof typeof PALETTE)[]).map((part) => (
          <div key={part} className="flex flex-col gap-1.5">
            <span className="text-sm text-[#a3a29a]">{COLOR_NAMES[part]}</span>
            <div className="flex flex-wrap gap-1.5">
              {PALETTE[part].map((col) => (
                <button
                  key={col}
                  type="button"
                  aria-label={`${COLOR_NAMES[part]} ${col}`}
                  aria-pressed={parts.colors[part] === col}
                  onClick={() => setParts((p) => ({ ...p, colors: { ...p.colors, [part]: col } }))}
                  style={{ background: col }}
                  className={`h-7 w-7 cursor-pointer rounded border-2 ${
                    parts.colors[part] === col ? "border-[#f1f1ee]" : "border-transparent"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-[#a3a29a]">
          배번 (비우면 없음 · 정면에서만 보여요)
          <input
            type="number"
            min={0}
            max={99}
            value={parts.bib ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setParts((p) => ({ ...p, bib: v === "" ? null : Math.max(0, Math.min(99, Number(v))) }));
            }}
            className="rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2 text-[15px] text-[#f1f1ee] outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-[#a3a29a]">
          인스타그램 아이디 (선택)
          <input
            value={ig}
            onChange={(e) => setIg(e.target.value)}
            placeholder="my.run"
            className="rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2 text-[15px] text-[#f1f1ee] outline-none placeholder:text-[#6f6f6a]"
          />
        </label>
      </div>

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
