"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 인증샷/크루 소식 항목에 붙는 하이파이브(👏) 토글. 로그인 안 했으면 숫자만 보여주고 누를 수
// 없다. 낙관적으로 먼저 바꾸고 실패하면 롤백한다.
export function RaceHifiveButton({
  targetType,
  targetId,
  targetMemberId,
  initialCount,
  initialActive,
  loggedIn,
  variant = "default",
  className,
}: {
  targetType: "PROOF" | "FEED";
  targetId: string;
  targetMemberId: string;
  initialCount: number;
  initialActive: boolean;
  loggedIn: boolean;
  variant?: "default" | "overlay";
  className?: string;
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (!loggedIn || busy) return;
    setBusy(true);
    const nextActive = !active;
    setActive(nextActive);
    setCount((c) => c + (nextActive ? 1 : -1));
    try {
      const res = await fetch("/api/race/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, targetMemberId }),
      });
      if (!res.ok) {
        setActive(!nextActive);
        setCount((c) => c + (nextActive ? -1 : 1));
      } else {
        router.refresh();
      }
    } catch {
      setActive(!nextActive);
      setCount((c) => c + (nextActive ? -1 : 1));
    } finally {
      setBusy(false);
    }
  }

  const toneClass =
    variant === "overlay"
      ? active
        ? "bg-black/60 text-[#f0b84a]"
        : "bg-black/45 text-white/85"
      : active
        ? "border border-[#f0b84a] bg-[#f0b84a]/15 text-[#f0b84a]"
        : "border border-[#3c3d43] text-[#a3a29a]";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!loggedIn || busy}
      aria-pressed={active}
      title={loggedIn ? "하이파이브" : "로그인하면 하이파이브를 보낼 수 있어요"}
      className={`flex shrink-0 cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium backdrop-blur-sm transition-colors disabled:cursor-default ${toneClass} ${
        loggedIn ? "hover:text-[#f0b84a]" : ""
      } ${className ?? ""}`}
    >
      👏{count > 0 ? ` ${count}` : ""}
    </button>
  );
}
