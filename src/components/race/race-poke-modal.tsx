"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 잠수 중이거나 기록이 0km일 때 크루원들이 찔러 깨우면, 다음 로그인 시 이 팝업으로 알려준다.
// "확인했어요"를 누르면 확인 처리(acknowledgedAt)돼서 이 팝업은 다시 안 뜬다.
export function RacePokeModal({ pokerNames }: { pokerNames: string[] }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (dismissed || pokerNames.length === 0) return null;

  async function ack() {
    setBusy(true);
    try {
      await fetch("/api/race/pokes/ack", { method: "POST" });
      setDismissed(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const names = pokerNames.length > 3 ? `${pokerNames.slice(0, 3).join(", ")} 외 ${pokerNames.length - 3}명` : pokerNames.join(", ");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded border border-[#3c3d43] bg-[#2a2b2e] p-5 text-center">
        <span className="text-3xl">👋</span>
        <h2 className="text-lg font-bold">{names}님이 깨웠어요</h2>
        <p className="text-sm text-[#a3a29a]">잠수 타지 말고 오늘 기록 하나 올려볼까요?</p>
        <button
          type="button"
          onClick={ack}
          disabled={busy}
          className="w-fit cursor-pointer self-center rounded border border-[#0e0f11] bg-[#f0b84a] px-4 py-2.5 text-sm font-bold text-[#2a1d05] disabled:opacity-40"
        >
          확인했어요
        </button>
      </div>
    </div>
  );
}
