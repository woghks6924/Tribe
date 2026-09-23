"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RaceLoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/race/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "입장에 실패했어요.");
        return;
      }
      router.refresh();
    } catch {
      setError("문제가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[#a3a29a]">캐릭터 이름</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            className="rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2.5 text-[15px] text-[#f1f1ee] outline-none"
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
            placeholder="0000"
            className="rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2.5 text-[15px] text-[#f1f1ee] outline-none placeholder:text-[#6f6f6a]"
          />
        </label>
      </div>
      {error && <p className="text-sm text-[#f08068]">{error}</p>}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-fit cursor-pointer rounded border border-[#0e0f11] bg-[#f0b84a] px-4 py-2.5 text-sm font-bold text-[#2a1d05] shadow-[3px_3px_0_#0e0f11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#0e0f11] disabled:opacity-40"
        >
          {loading ? "입장 중..." : "입장하기"}
        </button>
      </div>
      <p className="text-sm text-[#a3a29a]">
        아직 캐릭터가 없나요?{" "}
        <Link href="/race/join" className="text-[#f0b84a] underline">
          새로 만들기
        </Link>
      </p>
    </form>
  );
}
