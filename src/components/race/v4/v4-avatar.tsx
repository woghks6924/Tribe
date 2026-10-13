"use client";

import { useEffect, useRef } from "react";
import type { V4Look } from "@/lib/race/v4/sprite";
import { useCanvasLoop } from "./canvas-loop";
import { characterFor, useRaceAssets } from "./assets";

// 프레임(최대 80x80)에서 몸 주변만 잘라 보여준다: 가로 BW, 세로 BH (원본 픽셀 기준).
const BW = 48;
const BH = 60;

/**
 * 새 캐릭터 아바타. 리더보드·시상처럼 목록에서는 정지 1프레임, 프로필처럼 크게 보여줄 때는 animated.
 * scale은 정수로(도트가 깨지지 않게). 화면 배율(dpr)은 안에서 정수로 곱해 선명하게 그린다.
 */
export function V4Avatar({
  look,
  anim = "breathing_idle",
  dir = "south",
  scale = 1,
  animated = false,
  once = false,
  className,
  label,
}: {
  look: V4Look;
  anim?: string;
  dir?: string;
  scale?: number;
  animated?: boolean;
  once?: boolean; // animated일 때 한 번만 재생하고 마지막 프레임에서 멈춘다(레벨업 점프·완주 백플립·넘어짐)
  className?: string;
  label?: string;
}) {
  const A = useRaceAssets();
  const ref = useRef<HTMLCanvasElement>(null);
  const startRef = useRef<number | null>(null);

  const draw = (now: number) => {
    const cv = ref.current;
    if (!cv || !A) return;
    const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    const k = scale * dpr;
    if (cv.width !== BW * k) {
      cv.width = BW * k;
      cv.height = BH * k;
    }
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const fps = anim === "breathing_idle" ? 6 : 10;
    const ch = characterFor(A, look);
    let t = now;
    if (once) {
      if (startRef.current == null) startRef.current = now;
      const last = ((ch.frames(anim, dir).length - 1) / fps) * 1000 + 1;
      t = Math.min(now - startRef.current, last);
    }
    const f = ch.frameAt(anim, dir, t, fps);
    const dx = Math.round(BW / 2 - f.cx);
    const dy = BH - (f.ground + 1);
    ctx.drawImage(f.canvas, dx * k, dy * k, f.canvas.width * k, f.canvas.height * k);
  };

  // 정지 모드: 에셋·외형이 바뀔 때 한 번만 그린다.
  const lookKey = JSON.stringify(look);
  useEffect(() => {
    startRef.current = null;
    if (!animated) draw(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [A, lookKey, anim, dir, scale, animated, once]);

  useCanvasLoop(ref, (now) => {
    if (animated) draw(now);
  });

  return (
    <canvas
      ref={ref}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`block [image-rendering:pixelated] ${className ?? ""}`}
      style={{ width: BW * scale, height: BH * scale }}
    />
  );
}
