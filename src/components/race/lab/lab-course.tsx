"use client";

import { useMemo, useRef, useState } from "react";
import { COURSE, SEGMENTS, drawCourse, segmentAt, timeOfDay, type CourseSegment, type Tod } from "@/lib/race/v4/course";
import { TypeFX, drawTypeIcon, type Character } from "@/lib/race/v4/sprite";
import { useCanvasLoop, type LabMember } from "./lab-shared";

const S = 3;
const GROUND = 118;
const TODS: [Tod | "auto", string][] = [
  ["auto", "지금 시간"],
  ["dawn", "새벽"],
  ["day", "낮"],
  ["sunset", "노을"],
  ["night", "밤"],
];

function SegThumb({
  seg,
  tod,
  count,
  active,
  onClick,
}: {
  seg: CourseSegment;
  tod: Tod | "auto";
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const lastRef = useRef(0);
  useCanvasLoop(ref, (now) => {
    if (now - lastRef.current < 120) return;
    lastRef.current = now;
    const ctx = ref.current!.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    drawCourse(ctx, seg.key, now, { S: 1, tod: tod === "auto" ? timeOfDay() : tod });
  });
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col gap-1 rounded border p-1.5 text-left text-[11px] leading-snug ${
        active ? "border-[#f0b84a] bg-[#f0b84a]/10" : "border-[#3c3d43] bg-[#2a2b2e]"
      }`}
    >
      <canvas ref={ref} width={COURSE.W} height={COURSE.H} className="block w-full [image-rendering:pixelated]" />
      <span>
        <b>{seg.name}</b> {seg.to === Infinity ? `${seg.from}km 도착` : `${seg.from}–${seg.to}km`}
        <span className="text-[#a3a29a]"> · {count}명</span>
        <br />
        <span className="text-[#a3a29a]">{seg.desc}</span>
      </span>
    </button>
  );
}

export function LabCourse({ members, getChar }: { members: LabMember[]; getChar: (id: string) => Character }) {
  const leaderKm = members.reduce((m, x) => Math.max(m, x.km), 0);
  const [seg, setSeg] = useState(segmentAt(leaderKm).key);
  const [tod, setTod] = useState<Tod | "auto">("auto");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const countBySeg = useMemo(() => {
    const m = new Map<string, number>();
    for (const x of members) {
      const k = segmentAt(x.km).key;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [members]);

  const runners = useMemo(() => {
    const inSeg = members.filter((m) => segmentAt(m.km).key === seg).sort((a, b) => b.km - a.km);
    const cur = SEGMENTS.find((s) => s.key === seg)!;
    const maxKm = inSeg.reduce((mx, m) => Math.max(mx, m.km), 0);
    // 부산(도착)은 끝이 없어서, 가장 멀리 간 사람 기준으로 폭을 잡는다.
    const to = cur.to === Infinity ? Math.max(cur.from + 75, maxKm + 5) : cur.to;
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
        cx.fillStyle = "#f4f2ea";
        cx.fillText(text, bx + 30, by);
      });
  });

  return (
    <section className="flex flex-col gap-3 rounded border border-[#3c3d43] bg-[#2a2b2e] p-3 sm:p-4">
      <div>
        <h2 className="text-base font-bold">코스 장면</h2>
        <p className="text-xs text-[#a3a29a]">
          실제 시즌 참가자(총 {members.length}명)가 자기 구간 배경에서 달려요. 오늘 기록이 있으면 달리기, 없으면 숨쉬기 대기.
        </p>
      </div>
      <canvas
        ref={canvasRef}
        width={COURSE.W * S}
        height={COURSE.H * S}
        role="img"
        aria-label="선택한 구간 배경을 달리는 크루 캐릭터들"
        className="block w-full rounded [image-rendering:pixelated]"
      />
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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SEGMENTS.map((s) => (
          <SegThumb
            key={s.key}
            seg={s}
            tod={tod}
            count={countBySeg.get(s.key) ?? 0}
            active={s.key === seg}
            onClick={() => setSeg(s.key)}
          />
        ))}
      </div>
    </section>
  );
}
