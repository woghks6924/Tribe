"use client";

import { useMemo, useRef } from "react";
import { RaceAvatarImg } from "@/components/race/race-avatar";
import { TYPES, TypeFX, type Character } from "@/lib/race/v4/sprite";
import { useCanvasLoop, type LabMember } from "./lab-shared";

const W = 160;
const H = 168;
const GROUND_Y = H - 12;
const SC = 2;

function NewChar({ m, getChar }: { m: LabMember; getChar: (id: string) => Character }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fx = useMemo(() => new TypeFX(m.type), [m.type]);
  useCanvasLoop(ref, (now, dt) => {
    const ctx = ref.current!.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,255,255,.06)";
    ctx.fillRect(0, GROUND_Y, W, 2);
    const anim = m.todayLogged ? "running" : "breathing_idle";
    const f = getChar(m.id).frameAt(anim, "east", now, m.todayLogged ? 11 : 6);
    const X = Math.round(W / 2 - f.cx * SC);
    const Y = GROUND_Y - (f.ground + 1) * SC;
    fx.drawBehind(ctx, f, X, Y, SC, now, dt, GROUND_Y);
    ctx.drawImage(f.canvas, X, Y, f.canvas.width * SC, f.canvas.height * SC);
    fx.drawFront(ctx, f, X, Y, SC, now, dt);
  });
  return <canvas ref={ref} width={W} height={H} className="block w-full max-w-[160px] [image-rendering:pixelated]" />;
}

export function LabCompare({ members, getChar }: { members: LabMember[]; getChar: (id: string) => Character }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2 lg:grid-cols-3">
      {members.map((m) => (
        <div key={m.id} className="flex flex-col gap-2 rounded border border-[#3c3d43] bg-[#2a2b2e] p-3">
          <div className="flex items-baseline justify-between gap-2">
            <b className="truncate text-sm">{m.name}</b>
            <span className="shrink-0 text-xs text-[#a3a29a]">
              Lv.{m.level} · {m.km.toFixed(1)}km · {TYPES[m.type].name}
            </span>
          </div>
          <div className="grid grid-cols-[88px_minmax(0,1fr)] items-end gap-2">
            <div className="flex flex-col items-center gap-1">
              <div className="flex h-[84px] items-end">
                <RaceAvatarImg appearance={m.legacy} scale={2.5} className="[image-rendering:pixelated]" alt={`${m.name} 기존 캐릭터`} />
              </div>
              <span className="text-[10px] text-[#6f6f6a]">기존</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <NewChar m={m} getChar={getChar} />
              <span className="text-[10px] text-[#6f6f6a]">새 캐릭터 · {m.todayLogged ? "오늘 기록 있음" : "오늘 기록 없음"}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
