"use client";

import { useRef, useState } from "react";
import { CHECKPOINTS, destinationNameOf } from "@/lib/race/constants";
import { TypeFX, drawZz } from "@/lib/race/v4/sprite";
import { characterFor, useRaceAssets } from "./assets";
import { useCanvasLoop } from "./canvas-loop";
import type { V4Runner } from "./types";

const LH = 64;
const TOP = 34;

// 체크포인트 사이 구간마다 지형을 하나씩 배정 — 기존 RaceTrack과 같은 장식용 값.
const SEGMENT_TERRAIN = [
  "road",
  "field",
  "mountain",
  "mountain",
  "river",
  "field",
  "river",
  "river",
  "field",
  "road",
  "mountain",
  "mountain",
  "river",
  "field",
  "field",
  "road",
  "field",
  "road",
] as const;
type Terrain = (typeof SEGMENT_TERRAIN)[number];
const TERRAIN_SEGMENTS = CHECKPOINTS.slice(0, -1).map((cp, i) => ({
  from: cp.km,
  to: CHECKPOINTS[i + 1].km,
  kind: SEGMENT_TERRAIN[i],
}));
const TERRAIN_Y = 25;
const TERRAIN_STEP = 16;

function drawTerrainIcon(ctx: CanvasRenderingContext2D, kind: Terrain, cx: number, cy: number) {
  switch (kind) {
    case "mountain":
      ctx.fillStyle = "rgba(150,144,168,.55)";
      ctx.beginPath();
      ctx.moveTo(cx - 6, cy + 4);
      ctx.lineTo(cx - 1, cy - 5);
      ctx.lineTo(cx + 4, cy + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(150,144,168,.4)";
      ctx.beginPath();
      ctx.moveTo(cx + 1, cy + 4);
      ctx.lineTo(cx + 5, cy - 2);
      ctx.lineTo(cx + 8, cy + 4);
      ctx.closePath();
      ctx.fill();
      break;
    case "river":
      ctx.fillStyle = "rgba(110,176,224,.55)";
      [-6, -2, 2, 6].forEach((dx, i) => ctx.fillRect(cx + dx, cy + (i % 2 === 0 ? -1 : 1), 3, 2));
      break;
    case "road":
      ctx.fillStyle = "rgba(168,164,158,.4)";
      ctx.fillRect(cx - 4, cy, 7, 2);
      break;
    case "field":
      ctx.fillStyle = "rgba(140,190,140,.45)";
      ctx.fillRect(cx - 5, cy + 2, 2, 4);
      ctx.fillRect(cx - 1, cy, 2, 6);
      ctx.fillRect(cx + 3, cy + 2, 2, 4);
      break;
  }
}

// 새 캐릭터(v4)로 그리는 코스 현황. 기존 RaceTrack과 같은 줄 구성(1등 위, 이름·거리 표시, 선두 그룹/전체 코스).
export function V4Track({ runners, goalKm }: { runners: V4Runner[]; goalKm: number }) {
  const A = useRaceAssets();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispRef = useRef(new Map<string, number>());
  const fxRef = useRef(new Map<string, TypeFX>());
  const [zoom, setZoom] = useState<"near" | "full">("near");
  const entries = [...runners].sort((a, b) => b.km - a.km);
  const H = TOP + entries.length * LH + 8;

  useCanvasLoop(canvasRef, (now, dt) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const parent = canvas.parentElement;
    if (!parent) return;
    const dpr = window.devicePixelRatio || 1;
    const W = parent.clientWidth;
    if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(H * dpr)) {
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lead = entries[0]?.km ?? 0;
    const rg = zoom === "full" ? goalKm : Math.min(goalKm, Math.max(50, Math.ceil((lead * 1.2) / 10) * 10));
    const nameW = W < 520 ? 60 : 78;
    const x0 = nameW + 26;
    const x1 = W - 40;
    const X = (km: number) => x0 + (Math.min(km, rg) / rg) * (x1 - x0);
    const step = rg <= 60 ? 10 : rg <= 150 ? 25 : 50;

    ctx.fillStyle = "rgba(241,241,238,.05)";
    for (let k = step; k < rg; k += step) ctx.fillRect(Math.round(X(k)), TOP - 6, 1, H - TOP);

    TERRAIN_SEGMENTS.forEach((seg) => {
      if (seg.from >= rg) return;
      const xFrom = X(seg.from);
      const xTo = X(Math.min(seg.to, rg));
      for (let x = xFrom; x < xTo; x += TERRAIN_STEP) drawTerrainIcon(ctx, seg.kind, x, TERRAIN_Y);
    });

    ctx.font = '500 11px "IBM Plex Sans KR", system-ui, sans-serif';
    ctx.textBaseline = "middle";
    let lastRight = -1e9;
    CHECKPOINTS.forEach((cp) => {
      if (cp.km > rg) return;
      const x = Math.round(X(cp.km));
      ctx.fillStyle = "rgba(240,184,74,.35)";
      for (let y = TOP - 4; y < H; y += 6) ctx.fillRect(x, y, 1, 3);
      const txt = cp.km === 0 ? (W < 520 ? "서울" : "서울 출발") : `${cp.name} ${cp.km}`;
      const tw = ctx.measureText(txt).width;
      const left = cp.km === 0 ? x - 4 : cp.km >= rg ? x + 2 - tw : x - tw / 2;
      if (left < lastRight + 6) return;
      lastRight = left + tw;
      ctx.fillStyle = cp.km === goalKm ? "#f0b84a" : "#a3a29a";
      ctx.textAlign = "left";
      ctx.fillText(txt, left, 14);
    });
    if (rg < goalKm) {
      ctx.fillStyle = "#6f6f6a";
      ctx.textAlign = "right";
      ctx.fillText(`${destinationNameOf(goalKm)}까지 ${Math.round(goalKm - rg)}km →`, W - 8, H - 10);
    }

    entries.forEach((s, i) => {
      const y = TOP + i * LH;
      if (i % 2 === 0) {
        ctx.fillStyle = "rgba(255,255,255,.025)";
        ctx.fillRect(0, y, W, LH);
      }
      ctx.textAlign = "left";
      ctx.font = '9px "Press Start 2P", monospace';
      ctx.fillStyle = i === 0 ? "#f0b84a" : "#6f6f6a";
      ctx.fillText(String(i + 1), 10, y + LH / 2);

      ctx.font = '700 13px "IBM Plex Sans KR", system-ui, sans-serif';
      ctx.fillStyle = s.nameColor;
      ctx.fillText(s.name.length > 5 ? `${s.name.slice(0, 5)}…` : s.name, 30, y + LH / 2);

      let d = dispRef.current.get(s.id);
      if (d === undefined) d = s.km;
      d = reduce ? s.km : d + (s.km - d) * 0.08;
      if (Math.abs(s.km - d) < 0.05) d = s.km;
      dispRef.current.set(s.id, d);

      const cx = Math.round(X(d));
      const gy = y + LH - 6; // 발 밑
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(cx - 12, gy, 24, 2);

      if (A) {
        let fx = fxRef.current.get(s.id);
        if (!fx || fx.type !== s.type) fxRef.current.set(s.id, (fx = new TypeFX(s.type)));
        const anim = s.todayLogged && !reduce ? "running" : "breathing_idle";
        const f = characterFor(A, s.look).frameAt(anim, "east", now + i * 137, anim === "running" ? 11 : 6);
        const X0 = cx - f.cx;
        const Y0 = gy - (f.ground + 1);
        fx.drawBehind(ctx, f, X0, Y0, 1, now, dt, gy);
        ctx.drawImage(f.canvas, X0, Y0);
        fx.drawFront(ctx, f, X0, Y0, 1, now, dt);
        if (s.sleeping && !s.todayLogged) drawZz(ctx, cx + 3, Y0 + f.top - 8, 1, now + i * 137);
        if (i === 0 && s.km > 0) {
          // 1등 왕관
          const cy = Y0 + f.top - 9;
          ctx.fillStyle = "#f0b84a";
          ctx.fillRect(cx - 4, cy + 3, 9, 3);
          ctx.fillRect(cx - 4, cy, 2, 3);
          ctx.fillRect(cx, cy - 1, 2, 4);
          ctx.fillRect(cx + 3, cy, 2, 3);
        }
      }

      ctx.font = '500 11px "IBM Plex Sans KR", system-ui, sans-serif';
      ctx.fillStyle = "#a3a29a";
      const lbl = s.km.toFixed(1);
      const right = cx + 28;
      if (right + 34 < W) {
        ctx.textAlign = "left";
        ctx.fillText(lbl, right, y + LH / 2 + 2);
      } else {
        ctx.textAlign = "right";
        ctx.fillText(lbl, cx - 28, y + LH / 2 + 2);
      }
    });
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <div className="inline-flex overflow-hidden rounded border border-[#3c3d43]" role="group" aria-label="코스 보기">
          {(
            [
              ["near", "선두 그룹"],
              ["full", "전체 코스"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setZoom(k)}
              aria-pressed={zoom === k}
              className={`cursor-pointer px-3 py-1.5 text-sm ${zoom === k ? "bg-[#f1f1ee] font-medium text-[#1d1e21]" : "bg-transparent text-[#a3a29a]"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded border border-[#3c3d43] bg-[#17181b]">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="크루원 캐릭터들의 코스 위치"
          className="block w-full [image-rendering:pixelated]"
          style={{ height: H }}
        />
      </div>
    </div>
  );
}
