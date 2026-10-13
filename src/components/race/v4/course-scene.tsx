"use client";

import { useMemo, useRef, useState } from "react";
import { COURSE, SEGMENTS, drawCourse, segmentAt, timeOfDay, type Tod } from "@/lib/race/v4/course";
import type { RaceBodyType } from "@/lib/race/constants";
import { TypeFX, drawTypeIcon, type Character, type Pet } from "@/lib/race/v4/sprite";
import { useCanvasLoop } from "./canvas-loop";

const S = 3;
const GROUND = 118;
const TODS: [Tod | "auto", string][] = [
  ["auto", "지금 시간"],
  ["dawn", "새벽"],
  ["day", "낮"],
  ["sunset", "노을"],
  ["night", "밤"],
];

// 구간 안에서의 상대 위치(0~1). 부산(도착)은 끝이 없어서 가장 멀리 간 사람 기준으로 폭을 잡는다.
function segmentSpanTo(seg: { from: number; to: number }, maxKm: number) {
  return seg.to === Infinity ? Math.max(seg.from + 75, maxKm + 5) : seg.to;
}

export type SceneMember = {
  id: string;
  name: string;
  km: number;
  type: RaceBodyType;
  todayLogged: boolean;
  dotColor: string; // 진행바에 찍는 점 색
  isMe?: boolean; // 이름표를 강조한다
};

/**
 * 구간 배경 + 그 구간에 있는 사람들이 달리는 장면. 화살표·스와이프·진행바로 구간을 옮긴다.
 * defaultSegKey가 없으면 1등이 있는 구간에서 시작한다.
 */
export function CourseScene({
  members,
  getChar,
  getPet,
  defaultSegKey,
  description,
}: {
  members: SceneMember[];
  getChar: (id: string) => Character;
  getPet?: (id: string) => Pet | null; // 펫을 그리는 화면(/race/lab)만 넘긴다
  defaultSegKey?: string;
  description?: string;
}) {
  const leaderKm = members.reduce((m, x) => Math.max(m, x.km), 0);
  const [seg, setSeg] = useState(defaultSegKey ?? segmentAt(leaderKm).key);
  const [tod, setTod] = useState<Tod | "auto">("auto");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const segIndex = SEGMENTS.findIndex((x) => x.key === seg);
  const curSeg = SEGMENTS[segIndex];
  function go(delta: number) {
    const next = SEGMENTS[Math.max(0, Math.min(SEGMENTS.length - 1, segIndex + delta))];
    setSeg(next.key);
  }

  const countBySeg = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of members) {
      const k = segmentAt(x.km).key;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [members]);

  // 코스 전체 진행바: 구간 8칸을 같은 폭으로 나누고, 멤버를 자기 구간 안의 상대 위치에 점으로 찍는다.
  const routeDots = useMemo(() => {
    const maxKmBy = new Map<string, number>();
    for (const m of members) {
      const k = segmentAt(m.km).key;
      maxKmBy.set(k, Math.max(maxKmBy.get(k) ?? 0, m.km));
    }
    return members.map((m) => {
      const sg = segmentAt(m.km);
      const u = (m.km - sg.from) / (segmentSpanTo(sg, maxKmBy.get(sg.key) ?? m.km) - sg.from);
      return { id: m.id, name: m.name, color: m.dotColor, seg: sg.key, u: Math.max(0, Math.min(1, u)) };
    });
  }, [members]);

  const runners = useMemo(() => {
    const inSeg = members.filter((m) => segmentAt(m.km).key === seg).sort((a, b) => b.km - a.km);
    const cur = SEGMENTS.find((s) => s.key === seg)!;
    const maxKm = inSeg.reduce((mx, m) => Math.max(mx, m.km), 0);
    const to = segmentSpanTo(cur, maxKm);
    return inSeg.map((m, i) => ({
      m,
      fx: new TypeFX(m.type),
      phase: i * 137,
      lane: i % 3,
      u: (m.km - cur.from) / (to - cur.from),
    }));
  }, [members, seg]);

  useCanvasLoop(canvasRef, (now, dt) => {
    const cv = canvasRef.current!;
    const cx = cv.getContext("2d")!;
    cx.imageSmoothingEnabled = false;
    drawCourse(cx, seg, now, { S, tod: tod === "auto" ? timeOfDay() : tod });

    // 거리가 먼 사람일수록 오른쪽. 뒤쪽 줄이 먼저 그려짐
    const drawList = runners
      .map((r) => ({
        r,
        x: 30 + r.u * 230 + Math.sin(now / 1400 + r.phase) * 4,
        y: GROUND + 4 + r.lane * 6, // 발 밑 y
      }))
      .sort((a, b) => a.r.lane - b.r.lane);
    const labels: { r: (typeof runners)[number]; hx: number; hy: number }[] = [];
    for (const { r, x, y } of drawList) {
      const anim = r.m.todayLogged ? "running" : "breathing_idle";
      const f = getChar(r.m.id).frameAt(anim, "east", now + r.phase, r.m.todayLogged ? 11 : 6);
      const X = Math.round(x) * S;
      const Y = (Math.round(y) - f.ground - 1) * S;
      // 펫: 캐릭터 바로 뒤(왼쪽 15px)에서 같은 땅을 달린다
      const pet = getPet?.(r.m.id);
      if (pet) pet.draw(cx, X + (f.cx - 15) * S, Math.round(y) * S, S, now + r.phase, { moving: r.m.todayLogged });
      r.fx.drawBehind(cx, f, X, Y, S, now, dt);
      cx.drawImage(f.canvas, X, Y, f.canvas.width * S, f.canvas.height * S);
      r.fx.drawFront(cx, f, X, Y, S, now, dt);
      labels.push({ r, hx: X + f.cx * S, hy: (Math.round(y) - 50) * S });
    }

    if (runners.length === 0) {
      cx.font = '600 24px "IBM Plex Sans KR", system-ui, sans-serif';
      cx.textAlign = "center";
      cx.fillStyle = "rgba(20,22,28,.7)";
      cx.fillRect(cv.width / 2 - 200, 150, 400, 44);
      cx.fillStyle = "#f4f2ea";
      cx.textBaseline = "middle";
      cx.fillText("이 구간에는 아직 아무도 없어요", cv.width / 2, 172);
      cx.textAlign = "left";
      return;
    }

    // 이름표: 앞사람부터 놓고, 겹치면 한 줄 위로
    cx.font = '600 21px "IBM Plex Sans KR", system-ui, sans-serif';
    cx.textBaseline = "middle";
    cx.textAlign = "left";
    const placed: { x: number; y: number; w: number }[] = [];
    labels
      .sort((a, b) => b.r.m.km - a.r.m.km)
      .forEach((L) => {
        const text = `${L.r.m.name} ${L.r.m.km.toFixed(1)}km`;
        const w = cx.measureText(text).width + 34;
        const bx = Math.max(4, Math.min(cv.width - w - 4, L.hx - w / 2));
        let by = L.hy;
        let guard = 0;
        while (placed.some((p) => bx < p.x + p.w + 4 && p.x < bx + w + 4 && Math.abs(p.y - by) < 30) && guard++ < 12) by -= 32;
        by = Math.max(18, by);
        placed.push({ x: bx, y: by, w });
        cx.strokeStyle = "rgba(20,22,28,.5)";
        cx.lineWidth = 2;
        cx.beginPath();
        cx.moveTo(L.hx, by + 6);
        cx.lineTo(L.hx, L.hy + 14);
        cx.stroke();
        cx.fillStyle = "rgba(20,22,28,.8)";
        cx.fillRect(bx, by - 14, w, 28);
        drawTypeIcon(cx, L.r.m.type, bx + 6, by - 10, 4, false);
        cx.fillStyle = L.r.m.isMe ? "#f0b84a" : "#f4f2ea";
        cx.fillText(text, bx + 30, by);
      });
  });

  return (
    <section className="flex flex-col gap-3 rounded border border-[#3c3d43] bg-[#2a2b2e] p-3 sm:p-4">
      <div>
        <h2 className="text-base font-bold">코스 장면</h2>
        <p className="text-xs text-[#a3a29a]">
          {description ?? "좌우 화살표·스와이프·아래 진행바로 구간을 옮겨요."}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={segIndex === 0}
          aria-label="이전 구간"
          className="h-9 w-9 shrink-0 cursor-pointer rounded border border-[#3c3d43] text-lg leading-none text-[#f1f1ee] hover:border-[#f0b84a] disabled:cursor-default disabled:opacity-30"
        >
          ◀
        </button>
        <div className="min-w-0 text-center">
          <b className="text-sm">{curSeg.name}</b>{" "}
          <span className="text-xs text-[#a3a29a]">
            {curSeg.to === Infinity ? `${curSeg.from}km 도착` : `${curSeg.from}–${curSeg.to}km`} · {curSeg.desc} ·{" "}
            {countBySeg.get(seg) ?? 0}명
          </span>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={segIndex === SEGMENTS.length - 1}
          aria-label="다음 구간"
          className="h-9 w-9 shrink-0 cursor-pointer rounded border border-[#3c3d43] text-lg leading-none text-[#f1f1ee] hover:border-[#f0b84a] disabled:cursor-default disabled:opacity-30"
        >
          ▶
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={COURSE.W * S}
        height={COURSE.H * S}
        role="img"
        aria-label="선택한 구간 배경을 달리는 크루 캐릭터들"
        onPointerDown={(e) => {
          swipeRef.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          const st = swipeRef.current;
          swipeRef.current = null;
          if (!st) return;
          const dx = e.clientX - st.x;
          const dy = e.clientY - st.y;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          swipeRef.current = null;
        }}
        className="block w-full touch-pan-y rounded [image-rendering:pixelated]"
      />

      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-8 gap-0.5" role="group" aria-label="코스 전체 진행바">
          {SEGMENTS.map((sg, i) => (
            <button
              key={sg.key}
              type="button"
              onClick={() => setSeg(sg.key)}
              aria-pressed={sg.key === seg}
              aria-label={`${sg.name} 구간으로 이동, ${countBySeg.get(sg.key) ?? 0}명`}
              className={`relative h-7 cursor-pointer border-y border-[#3c3d43] ${i === 0 ? "rounded-l border-l" : ""} ${
                i === SEGMENTS.length - 1 ? "rounded-r border-r" : ""
              } ${sg.key === seg ? "bg-[#f0b84a]/25 outline outline-1 outline-[#f0b84a]" : "bg-[#17181b] hover:bg-[#323338]"}`}
            >
              {routeDots
                .filter((d) => d.seg === sg.key)
                .map((d) => (
                  <span
                    key={d.id}
                    aria-hidden
                    title={d.name}
                    className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/50"
                    style={{ left: `${6 + d.u * 88}%`, background: d.color }}
                  />
                ))}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-8 gap-0.5 text-center text-[10px] text-[#a3a29a]">
          {SEGMENTS.map((sg) => (
            <span key={sg.key} className={sg.key === seg ? "font-bold text-[#f0b84a]" : ""}>
              {sg.name}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TODS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            aria-pressed={tod === k}
            onClick={() => setTod(k)}
            className={`cursor-pointer rounded border px-2.5 py-1 text-xs ${
              tod === k ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21]" : "border-[#3c3d43] text-[#a3a29a]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
