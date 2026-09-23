"use client";

import { useEffect, useRef, useState } from "react";
import { CHECKPOINTS } from "@/lib/race/constants";
import type { RaceAcc, RaceBodyType, RaceEye } from "@/lib/race/constants";
import { drawCrown, drawSprite, grid, SPRITE_GRID_SIZE } from "@/lib/race/sprite";
import { isSleeping } from "@/lib/race/stats";

export type RaceTrackEntry = {
  memberId: string;
  name: string;
  color: string;
  eye: RaceEye;
  acc: RaceAcc;
  pts: number;
  type: RaceBodyType;
  idleDays: number;
};

const N = SPRITE_GRID_SIZE;
const S = 2; // 한 픽셀당 캔버스 픽셀 수
const LH = 52;
const TOP = 34;

// 체크포인트 사이 7구간에 지형을 하나씩 배정 — 실제 지리와 무관하게 코스에 변화를 주는 장식용.
const SEGMENT_TERRAIN = ["road", "field", "mountain", "mountain", "river", "field", "river"] as const;
type Terrain = (typeof SEGMENT_TERRAIN)[number];
const TERRAIN_SEGMENTS = CHECKPOINTS.slice(0, -1).map((cp, i) => ({
  from: cp.km,
  to: CHECKPOINTS[i + 1].km,
  kind: SEGMENT_TERRAIN[i],
}));
const TERRAIN_Y = 25; // 헤더(체크포인트 이름)와 코스 눈금 사이 여백에 그리는 장식 띠의 중심 y
const TERRAIN_STEP = 16; // 아이콘 간격(px)

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
      [-6, -2, 2, 6].forEach((dx, i) => {
        ctx.fillRect(cx + dx, cy + (i % 2 === 0 ? -1 : 1), 3, 2);
      });
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

export function RaceTrack({ entries, goalKm }: { entries: RaceTrackEntry[]; goalKm: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispRef = useRef<Map<string, number>>(new Map());
  const [zoom, setZoom] = useState<"near" | "full">("near");
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let raf = 0;
    let cancelled = false;

    function size() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      W = parent.clientWidth;
      H = TOP + entries.length * LH + 8;
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.imageSmoothingEnabled = false;
    }

    function range() {
      if (zoomRef.current === "full") return goalKm;
      const lead = entries[0]?.pts ?? 0;
      return Math.min(goalKm, Math.max(50, Math.ceil((lead * 1.2) / 10) * 10));
    }

    function draw(t: number) {
      if (cancelled) return;
      const tick = reduce ? 0 : Math.floor(t / 170);
      ctx!.clearRect(0, 0, W, H);
      const nameW = W < 520 ? 60 : 78;
      const rg = range();
      const x0 = nameW + 26;
      const x1 = W - 40;
      const X = (km: number) => x0 + (Math.min(km, rg) / rg) * (x1 - x0);
      const step = rg <= 60 ? 10 : rg <= 150 ? 25 : 50;

      ctx!.fillStyle = "rgba(241,241,238,.05)";
      for (let k = step; k < rg; k += step) ctx!.fillRect(Math.round(X(k)), TOP - 6, 1, H - TOP);

      TERRAIN_SEGMENTS.forEach((seg) => {
        if (seg.from >= rg) return;
        const segToVisible = Math.min(seg.to, rg);
        const xFrom = X(seg.from);
        const xTo = X(segToVisible);
        for (let x = xFrom; x < xTo; x += TERRAIN_STEP) drawTerrainIcon(ctx!, seg.kind, x, TERRAIN_Y);
      });

      ctx!.font = '500 11px "IBM Plex Sans KR", system-ui, sans-serif';
      ctx!.textBaseline = "middle";
      let lastRight = -1e9;
      CHECKPOINTS.forEach((cp) => {
        if (cp.km > rg) return;
        const x = Math.round(X(cp.km));
        ctx!.fillStyle = "rgba(240,184,74,.35)";
        for (let y = TOP - 4; y < H; y += 6) ctx!.fillRect(x, y, 1, 3);
        const txt = cp.km === 0 ? (W < 520 ? "서울" : "서울 출발") : `${cp.name} ${cp.km}`;
        const tw = ctx!.measureText(txt).width;
        const left = cp.km === 0 ? x - 4 : cp.km >= rg ? x + 2 - tw : x - tw / 2;
        if (left < lastRight + 6) return;
        lastRight = left + tw;
        ctx!.fillStyle = cp.km === goalKm ? "#f0b84a" : "#a3a29a";
        ctx!.textAlign = "left";
        ctx!.fillText(txt, left, 14);
      });
      if (rg < goalKm) {
        ctx!.fillStyle = "#6f6f6a";
        ctx!.textAlign = "right";
        ctx!.fillText(`부산까지 ${Math.round(goalKm - rg)}km →`, W - 8, H - 10);
      }

      entries.forEach((s, i) => {
        const y = TOP + i * LH;
        if (i % 2 === 0) {
          ctx!.fillStyle = "rgba(255,255,255,.025)";
          ctx!.fillRect(0, y, W, LH);
        }
        ctx!.textAlign = "left";
        ctx!.font = '9px "Press Start 2P", monospace';
        ctx!.fillStyle = i === 0 ? "#f0b84a" : "#6f6f6a";
        ctx!.fillText(String(i + 1), 10, y + LH / 2);

        ctx!.font = '700 13px "IBM Plex Sans KR", system-ui, sans-serif';
        ctx!.fillStyle = s.color;
        ctx!.fillText(s.name.length > 5 ? `${s.name.slice(0, 5)}…` : s.name, 30, y + LH / 2);

        let d = dispRef.current.get(s.memberId);
        if (d === undefined) d = s.pts;
        d = reduce ? s.pts : d + (s.pts - d) * 0.08;
        if (Math.abs(s.pts - d) < 0.05) d = s.pts;
        dispRef.current.set(s.memberId, d);

        const moving = Math.abs(s.pts - d) > 0.3;
        const sleep = isSleeping(s.idleDays);
        const fr = sleep ? 2 : moving ? tick % 2 : (Math.floor(tick / 2) + i) % 2;
        const g = grid(s.type, fr, sleep, s.eye, s.acc);
        const bob = !sleep && fr === 1 && !reduce ? -S : 0;
        const sx = Math.round(X(d) - (N * S) / 2);
        const sy = y + LH - N * S - 4 + bob;

        ctx!.fillStyle = "rgba(0,0,0,.35)";
        ctx!.fillRect(sx + 12, y + LH - 5, N * S - 24, 2);
        drawSprite(ctx!, g, s.color, sx, sy, S);
        if (i === 0 && s.pts > 0) drawCrown(ctx!, sx, sy + (g.top - 3) * S, S);

        if (sleep) {
          ctx!.font = '8px "Press Start 2P", monospace';
          ctx!.fillStyle = "#a3a8d6";
          const zz = tick % 3;
          ctx!.fillText("z", sx + N * S - 4, sy + 10 - zz * 2);
          if (zz > 0) ctx!.fillText("Z", sx + N * S + 4, sy + 2 - zz * 2);
        }
        if (s.type === "hybrid" && !sleep) {
          ctx!.fillStyle = "#f0b84a";
          const a = tick % 4;
          const pts: [number, number][] = [
            [2, 6],
            [19, 4],
            [1, 14],
            [20, 12],
          ];
          const p = pts[a];
          ctx!.fillRect(sx + p[0] * S, sy + p[1] * S, S, S);
        }

        ctx!.font = '500 11px "IBM Plex Sans KR", system-ui, sans-serif';
        ctx!.fillStyle = "#a3a29a";
        const lbl = s.pts.toFixed(1);
        const right = sx + N * S + 4;
        if (right + 34 < W) {
          ctx!.textAlign = "left";
          ctx!.fillText(lbl, right, y + LH / 2 + 2);
        } else {
          ctx!.textAlign = "right";
          ctx!.fillText(lbl, sx - 2, y + LH / 2 + 2);
        }
      });

      raf = requestAnimationFrame(draw);
    }

    size();
    window.addEventListener("resize", size);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", size);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, goalKm]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <div className="inline-flex overflow-hidden rounded border border-[#3c3d43]" role="group" aria-label="코스 보기">
          <button
            type="button"
            onClick={() => setZoom("near")}
            aria-pressed={zoom === "near"}
            className={`cursor-pointer px-3 py-1.5 text-sm ${zoom === "near" ? "bg-[#f1f1ee] font-medium text-[#1d1e21]" : "bg-transparent text-[#a3a29a]"}`}
          >
            선두 그룹
          </button>
          <button
            type="button"
            onClick={() => setZoom("full")}
            aria-pressed={zoom === "full"}
            className={`cursor-pointer px-3 py-1.5 text-sm ${zoom === "full" ? "bg-[#f1f1ee] font-medium text-[#1d1e21]" : "bg-transparent text-[#a3a29a]"}`}
          >
            전체 코스
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded border border-[#3c3d43] bg-[#17181b]">
        <canvas ref={canvasRef} role="img" aria-label="크루원 캐릭터들의 코스 위치" className="block w-full [image-rendering:pixelated]" />
      </div>
    </div>
  );
}
