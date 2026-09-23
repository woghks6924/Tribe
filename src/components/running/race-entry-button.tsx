"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PALETTE } from "@/lib/race/constants";
import { renderAvatarDataUrl } from "@/lib/race/sprite";

type Phase = "idle" | "hidden" | "shown" | "exit";

export function RaceEntryButton() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  function handleClick() {
    setAvatarSrc(
      renderAvatarDataUrl(PALETTE[Math.floor(Math.random() * PALETTE.length)], "happy", "none", "run", false, 8),
    );
    setPhase("hidden");
    requestAnimationFrame(() => requestAnimationFrame(() => setPhase("shown")));
    setTimeout(() => setPhase("exit"), 900);
    setTimeout(() => router.push("/race"), 1200);
  }

  const visible = phase === "shown";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="w-fit cursor-pointer border border-line-strong px-3 py-1.5 text-xs tracking-[0.06em] text-ink-muted uppercase hover:border-ink hover:text-ink"
      >
        Tri.be Race
      </button>

      {phase !== "idle" && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 bg-[#1d1e21] transition-opacity duration-300 ${
            phase === "exit" ? "opacity-0" : "opacity-100"
          }`}
        >
          <Image
            src="/logo/tribe-logo-white.png"
            alt="Tri.be"
            width={473}
            height={100}
            className={`h-7 w-auto transition-all duration-500 ${visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}
          />
          {avatarSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt=""
              className={`h-24 w-24 [image-rendering:pixelated] transition-all duration-500 ${
                visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-75 opacity-0"
              }`}
            />
          )}
          <span
            className={`text-xs font-bold tracking-[0.1em] text-[#f0b84a] uppercase transition-opacity delay-150 duration-500 ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          >
            Tri.be Race
          </span>
        </div>
      )}
    </>
  );
}
