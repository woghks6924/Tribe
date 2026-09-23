"use client";

import { useEffect, useRef, useState } from "react";
import { CHECKPOINTS, type RaceBodyType } from "@/lib/race/constants";
import type { RaceAppearance } from "@/lib/race/appearance";
import { drawRaceCharacter, preloadRaceAppearance } from "@/lib/race/layer-render";
import { isSleeping } from "@/lib/race/stats";

export type RaceTrackEntry = {
  memberId: string;
  name: string;
  appearance: RaceAppearance;
  pts: number;
  type: RaceBodyType;
  idleDays: number;
};

const CHAR_H = 44; // 캔버스에 그릴 캐릭터 높이(px)
const LH = 52;
const TOP = 34;

export function RaceTrack({ entries, goalKm }: { entries: RaceTrackEntry[]; goalKm: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispRef = useRef<Map<string, number>>(new Map());
  const [zoom, setZoom] = useState<"near" | "full">("near");
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // 새 크루원/외형이 생기면 미리 로드해둔다 — 그려질 때 딱 맞춰 캐시가 준비돼 있게.
  useEffect(() => {
    entries.forEach((e) => {
      preloadRaceAppearance(e.appearance).catch(() => {});
    });
  }, [entries]);

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
    }

    function range() {
      if (zoomRef.current === "full") return goalKm;
      const lead = entries[0]?.pts ?? 0;
      return Math.min(goalKm, Math.max(50, Math.ceil((lead * 1.2) / 10) * 10));
    }

    function draw(t: number) {
      if (cancelled) return;
      const tick = reduce ? 0 : Math.floor(t / 170);
      ctx!.imageSmoothingEnabled = false;
      ctx!.clearRect(0, 0, W, H);
      const nameW = W < 520 ? 60 : 78;
      const rg = range();
      const x0 = nameW + 26;
      const x1 = W - 40;
      const X = (km: number) => x0 + (Math.min(km, rg) / rg) * (x1 - x0);
      const step = rg <= 60 ? 10 : rg <= 150 ? 25 : 50;

      ctx!.fillStyle = "rgba(241,241,238,.05)";
      for (let k = step; k < rg; k += step) ctx!.fillRect(Math.round(X(k)), TOP - 6, 1, H - TOP);

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
        ctx!.fillStyle = s.appearance.topColor;
        ctx!.fillText(s.name.length > 5 ? `${s.name.slice(0, 5)}…` : s.name, 30, y + LH / 2);

        let d = dispRef.current.get(s.memberId);
        if (d === undefined) d = s.pts;
        d = reduce ? s.pts : d + (s.pts - d) * 0.08;
        if (Math.abs(s.pts - d) < 0.05) d = s.pts;
        dispRef.current.set(s.memberId, d);

        const moving = Math.abs(s.pts - d) > 0.3;
        const sleep = isSleeping(s.idleDays);
        const bob = !sleep && moving && !reduce ? Math.sin(t / 150 + i) * 2 : 0;
        const cx = X(d);
        const cy = y + LH - CHAR_H - 4 + bob;

        ctx!.fillStyle = "rgba(0,0,0,.35)";
        ctx!.fillRect(cx - CHAR_H * 0.3, y + LH - 5, CHAR_H * 0.6, 2);

        ctx!.globalAlpha = sleep ? 0.55 : 1;
        drawRaceCharacter(ctx!, s.appearance, cx, cy, CHAR_H);
        ctx!.globalAlpha = 1;

        if (i === 0 && s.pts > 0) {
          ctx!.fillStyle = "#f0b84a";
          const crownY = cy - 8;
          [-4, 0, 4].forEach((dx) => ctx!.fillRect(cx + dx - 1, crownY, 2, 5));
          ctx!.fillRect(cx - 5, crownY + 3, 11, 2);
        }

        if (sleep) {
          ctx!.font = '8px "Press Start 2P", monospace';
          ctx!.fillStyle = "#a3a8d6";
          const zz = tick % 3;
          ctx!.fillText("z", cx + CHAR_H * 0.3, cy + 10 - zz * 2);
          if (zz > 0) ctx!.fillText("Z", cx + CHAR_H * 0.3 + 8, cy + 2 - zz * 2);
        }
        if (s.type === "hybrid" && !sleep) {
          ctx!.fillStyle = "#f0b84a";
          const a = tick % 4;
          const pts: [number, number][] = [
            [-18, -10],
            [18, -14],
            [-20, 6],
            [20, 2],
          ];
          const p = pts[a];
          ctx!.fillRect(cx + p[0], cy + p[1] + CHAR_H / 2, 2, 2);
        }

        ctx!.font = '500 11px "IBM Plex Sans KR", system-ui, sans-serif';
        ctx!.fillStyle = "#a3a29a";
        const lbl = s.pts.toFixed(1);
        const right = cx + CHAR_H * 0.5 + 4;
        if (right + 34 < W) {
          ctx!.textAlign = "left";
          ctx!.fillText(lbl, right, y + LH / 2 + 2);
        } else {
          ctx!.textAlign = "right";
          ctx!.fillText(lbl, cx - CHAR_H * 0.5 - 2, y + LH / 2 + 2);
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
