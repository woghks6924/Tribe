"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 잠수 중이거나 0km인 멤버 옆에 뜨는 "콕 찌르기" 버튼. 하루 한 번, 본인 제외.
// 서버가 대상 자격/중복 여부를 다시 검증하므로 에러 메시지는 그대로 보여준다.
export function RacePokeButton({ targetId }: { targetId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function poke() {
    setState("busy");
    setError(null);
    const res = await fetch("/api/race/pokes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setState("error");
      setError(data.error ?? "찌르기에 실패했어요.");
      return;
    }
    setState("done");
    router.refresh();
  }

  if (state === "done") {
    return <span className="text-[11px] font-medium text-[#f0b84a]">콕 찔렀어요!</span>;
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={poke}
        disabled={state === "busy"}
        className="cursor-pointer rounded border border-[#3c3d43] px-2 py-1 text-[11px] font-medium text-[#a3a29a] hover:border-[#f0b84a] hover:text-[#f0b84a] disabled:opacity-40"
      >
        👉 콕 찌르기
      </button>
      {error && <span className="text-[10px] text-[#f08068]">{error}</span>}
    </div>
  );
}
