"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";

const SESSION_KEY = "tribe-intro-shown";

type Phase = "in" | "hold" | "out" | "done";

export function SiteLoader() {
  const [phase, setPhase] = useState<Phase>("in");

  // 레이아웃 페인트 전에 동기적으로 확인해, 같은 세션에서 재방문 시
  // 스플래시가 한 프레임이라도 번쩍이지 않도록 한다.
  useLayoutEffect(() => {
    // sessionStorage(외부 시스템)를 페인트 전에 동기 확인하는 용도 — 파생 상태로 대체 불가.
    if (sessionStorage.getItem(SESSION_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhase("done");
    }
  }, []);

  useEffect(() => {
    if (phase === "done") return;
    sessionStorage.setItem(SESSION_KEY, "1");

    const toHold = setTimeout(() => setPhase("hold"), 700);
    const toOut = setTimeout(() => setPhase("out"), 1900);
    const toDone = setTimeout(() => setPhase("done"), 2500);
    return () => {
      clearTimeout(toHold);
      clearTimeout(toOut);
      clearTimeout(toDone);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.body.style.overflow = phase === "done" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center bg-base-deep transition-opacity duration-500 ${
        phase === "out" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className={`glitch-wrap ${phase === "in" ? "glitch-in" : ""} ${phase === "out" ? "glitch-out" : ""}`}>
        <Image
          src="/logo/tribe-logo-white.png"
          alt="Tri.be"
          width={2357}
          height={615}
          priority
          className="glitch-base h-9 w-auto sm:h-12"
        />
        <Image
          src="/logo/tribe-logo-white.png"
          alt=""
          aria-hidden
          width={2357}
          height={615}
          className="glitch-layer glitch-red h-9 w-auto sm:h-12"
        />
        <Image
          src="/logo/tribe-logo-white.png"
          alt=""
          aria-hidden
          width={2357}
          height={615}
          className="glitch-layer glitch-cyan h-9 w-auto sm:h-12"
        />
      </div>
    </div>
  );
}
