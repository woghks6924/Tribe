"use client";

import { useRouter } from "next/navigation";

export function RaceLogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/race/logout", { method: "POST" });
        router.refresh();
      }}
      className="cursor-pointer text-sm text-[#f1f1ee] underline"
    >
      다른 캐릭터로
    </button>
  );
}
