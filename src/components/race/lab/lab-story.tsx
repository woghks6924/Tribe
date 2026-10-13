"use client";

import { useMemo, useRef } from "react";
import { COURSE, drawCourse, segmentAt, skyTopColor, timeOfDay } from "@/lib/race/v4/course";
import { TYPES, TypeFX, drawTypeIcon, type Character } from "@/lib/race/v4/sprite";
import { useCanvasLoop, type LabMember } from "./lab-shared";

// 9:16 스토리 카드 미리보기 (실제 공유 이미지를 만들지는 않는다 — 1단계는 보기 전용).
const W = 640;
const H = 1138;
const S = 4;
const SCENE_Y = 330;
const FEET_Y = SCENE_Y + 128 * S;

export function LabStory({ member, getChar }: { member: LabMember; getChar: (id: string) => Character }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const fx = useMemo(() => new TypeFX(member.type), [member.type]);
  const seg = segmentAt(member.km);

  useCanvasLoop(ref, (now, dt) => {
    const ctx = ref.current!.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const tod = timeOfDay();
    ctx.fillStyle = skyTopColor(tod);
    ctx.fillRect(0, 0, W, SCENE_Y + 2);
    ctx.fillStyle = "#1d1e21";
    ctx.fillRect(0, SCENE_Y + COURSE.H * S - 1, W, H);
    // 배경은 가운데 640px만 보이게 잘라서 쓴다(원본 320px * S=4 = 1280px)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, SCENE_Y, W, COURSE.H * S);
    ctx.clip();
    ctx.translate(-(COURSE.W * S - W) / 2, SCENE_Y);
    drawCourse(ctx, seg.key, now, { S, tod, speed: 0.3 });
    ctx.restore();
    ctx.imageSmoothingEnabled = false;

    const anim = member.todayLogged ? "running" : "breathing_idle";
    const f = getChar(member.id).frameAt(anim, "south", now, member.todayLogged ? 11 : 6);
    const X = Math.round(W / 2 - f.cx * S);
    const Y = FEET_Y - (f.ground + 1) * S;
    fx.drawBehind(ctx, f, X, Y, S, now, dt, FEET_Y);
    ctx.drawImage(f.canvas, X, Y, f.canvas.width * S, f.canvas.height * S);
    fx.drawFront(ctx, f, X, Y, S, now, dt);

    const FONT = '"IBM Plex Sans KR", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f1f1ee";
    ctx.font = `700 34px ${FONT}`;
    ctx.fillText("TRI.BE RACE", W / 2, 110);
    ctx.fillStyle = "#f0b84a";
    ctx.font = `600 26px ${FONT}`;
    ctx.fillText(`${seg.name} 구간 · ${seg.desc}`, W / 2, 156);

    ctx.fillStyle = "#f1f1ee";
    ctx.font = `700 64px ${FONT}`;
    ctx.fillText(member.name, W / 2, 980);
    ctx.fillStyle = "#a3a29a";
    ctx.font = `500 28px ${FONT}`;
    ctx.fillText(`Lv.${member.level} · ${TYPES[member.type].name}`, W / 2, 1026);
    ctx.fillStyle = "#f0b84a";
    ctx.font = `700 52px ${FONT}`;
    ctx.fillText(`${member.km.toFixed(1)}km`, W / 2, 1096);
    drawTypeIcon(ctx, member.type, W / 2 - 150, 1046, 6, true);
  });

  return (
    <section className="flex flex-col gap-3 rounded border border-[#3c3d43] bg-[#2a2b2e] p-3 sm:p-4">
      <div>
        <h2 className="text-base font-bold">스토리 카드 미리보기 (9:16)</h2>
        <p className="text-xs text-[#a3a29a]">꾸미기 패널에서 고른 멤버의 구간 배경 + 정면 캐릭터 + 유형 아이콘.</p>
      </div>
      <canvas
        ref={ref}
        width={W}
        height={H}
        role="img"
        aria-label={`${member.name}의 스토리 카드 미리보기`}
        className="block w-full max-w-[270px] rounded border border-[#3c3d43] [image-rendering:pixelated]"
      />
    </section>
  );
}
