"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PALETTE } from "@/lib/race/constants";
import { RaceCustomizer, type RaceCustomizeValue } from "@/components/race/race-customizer";

export function RaceJoinForm() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [custom, setCustom] = useState<RaceCustomizeValue>(() => ({
    color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    eye: "dot",
    acc: "none",
    igHandle: "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/race/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
          name: name.trim(),
          pin: pin.trim(),
          color: custom.color,
          eye: custom.eye,
          acc: custom.acc,
          igHandle: custom.igHandle,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "가입에 실패했어요.");
        return;
      }
      router.push("/race/me");
      router.refresh();
    } catch {
      setError("문제가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-[#a3a29a]">크루 초대코드</span>
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          autoComplete="off"
          className="rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2.5 text-[15px] text-[#f1f1ee] outline-none"
        />
      </label>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[#a3a29a]">캐릭터 이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={8}
            placeholder="러닝요정"
            autoComplete="off"
            className="rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2.5 text-[15px] text-[#f1f1ee] outline-none placeholder:text-[#6f6f6a]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[#a3a29a]">PIN 4자리</span>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            type="password"
            inputMode="numeric"
            maxLength={4}
            autoComplete="off"
            placeholder="휴대폰 뒷자리 추천"
            className="rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2.5 text-[15px] text-[#f1f1ee] outline-none placeholder:text-[#6f6f6a]"
          />
        </label>
      </div>

      <RaceCustomizer value={custom} onChange={setCustom} previewType="base" />

      <p className="text-xs text-[#6f6f6a]">
        체형은 모두 새내기로 시작해서 기록이 쌓이면 바뀌고, 색·눈·소품은 언제든 다시 꾸밀 수 있어요.
      </p>
      {error && <p className="text-sm text-[#f08068]">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-fit cursor-pointer rounded border border-[#0e0f11] bg-[#f0b84a] px-4 py-2.5 text-sm font-bold text-[#2a1d05] shadow-[3px_3px_0_#0e0f11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#0e0f11] disabled:opacity-40"
      >
        {saving ? "만드는 중..." : "캐릭터 만들기"}
      </button>
    </form>
  );
}
