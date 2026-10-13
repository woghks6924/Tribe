"use client";

import { useMemo, useRef, useState } from "react";
import type { RaceBodyType } from "@/lib/race/constants";
import { TYPES, TypeFX, drawTypeIcon, type Character, type V4Look } from "@/lib/race/v4/sprite";
import { ANIM_NAMES, COLOR_NAMES, HAIR_NAMES, ITEM_NAMES, PALETTE, useCanvasLoop, type LabMember, type LookPatch } from "./lab-shared";

const SIZE = 400;
const GROUND_Y = 320;
const SC = 5;

function Chips<T extends string | null>({
  label,
  entries,
  value,
  onPick,
}: {
  label: string;
  entries: [T, string][];
  value: T;
  onPick: (v: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-[#a3a29a]">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {entries.map(([k, text]) => (
          <button
            key={String(k)}
            type="button"
            aria-pressed={value === k}
            onClick={() => onPick(k)}
            className={`cursor-pointer rounded border px-2.5 py-1 text-xs ${
              value === k ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21]" : "border-[#3c3d43] text-[#a3a29a]"
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function LabStudio({
  members,
  selectedId,
  onSelect,
  look,
  onLookChange,
  onReset,
  getChar,
}: {
  members: LabMember[];
  selectedId: string;
  onSelect: (id: string) => void;
  look: V4Look;
  onLookChange: (patch: LookPatch) => void;
  onReset: () => void;
  getChar: (id: string) => Character;
}) {
  const member = members.find((m) => m.id === selectedId) ?? members[0];
  const [anim, setAnim] = useState("running");
  const [dir, setDir] = useState("east");
  // 유형은 실제 기록에서 계산된 값이 기본. 연출을 확인해 보려고 바꿔볼 수만 있다(저장 안 됨).
  const [typeOverride, setTypeOverride] = useState<Record<string, RaceBodyType>>({});
  const type = typeOverride[member.id] ?? member.type;
  const fx = useMemo(() => new TypeFX(type), [type]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useCanvasLoop(canvasRef, (now, dt) => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = "#2c3245";
    ctx.fillRect(0, GROUND_Y, cv.width, cv.height - GROUND_Y);
    const f = getChar(member.id).frameAt(anim, dir, now, anim === "breathing_idle" ? 6 : 10);
    const X = Math.round(cv.width / 2 - f.cx * SC);
    const Y = GROUND_Y - (f.ground + 1) * SC;
    fx.drawBehind(ctx, f, X, Y, SC, now, dt, GROUND_Y);
    ctx.drawImage(f.canvas, X, Y, f.canvas.width * SC, f.canvas.height * SC);
    fx.drawFront(ctx, f, X, Y, SC, now, dt);
  });

  const typeIconRef = useRef<HTMLCanvasElement>(null);
  useCanvasLoop(typeIconRef, () => {
    const ctx = typeIconRef.current!.getContext("2d")!;
    ctx.clearRect(0, 0, 16, 16);
    drawTypeIcon(ctx, type, 1, 1, 2, false);
  });

  return (
    <section className="flex flex-col gap-3 rounded border border-[#3c3d43] bg-[#2a2b2e] p-3 sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">꾸미기 패널</h2>
          <p className="text-xs text-[#a3a29a]">바꾼 외형은 이 브라우저(localStorage)에만 저장돼요. 서버에는 아무것도 안 써요.</p>
        </div>
        <select
          value={member.id}
          onChange={(e) => onSelect(e.target.value)}
          aria-label="멤버 선택"
          className="rounded border border-[#3c3d43] bg-[#17181b] px-2.5 py-1.5 text-sm"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} · {m.km.toFixed(1)}km
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-2">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            role="img"
            aria-label="꾸민 캐릭터 미리보기"
            className="block w-full rounded bg-[#17181b] [image-rendering:pixelated]"
          />
          <div className="flex items-center gap-2 text-xs text-[#a3a29a]">
            <canvas ref={typeIconRef} width={16} height={16} style={{ width: 16, height: 16, imageRendering: "pixelated" }} />
            <b className="text-[#f1f1ee]">{TYPES[type].name}</b>
            <span>{TYPES[type].desc}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Chips label="동작" entries={ANIM_NAMES} value={anim} onPick={setAnim} />
          <Chips
            label="방향"
            entries={[
              ["east", "옆"],
              ["south", "정면"],
            ]}
            value={dir}
            onPick={setDir}
          />
          <Chips label="헤어" entries={HAIR_NAMES} value={look.hair} onPick={(v) => onLookChange({ hair: v })} />
          <Chips label="장비" entries={ITEM_NAMES} value={look.item} onPick={(v) => onLookChange({ item: v })} />
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-[#a3a29a]">훈련 유형 연출 (기록에서 계산된 값 {TYPES[member.type].name}, 여기서 바꿔도 저장 안 됨)</span>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(TYPES) as RaceBodyType[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  aria-pressed={type === k}
                  onClick={() => setTypeOverride((p) => ({ ...p, [member.id]: k }))}
                  className={`cursor-pointer rounded border px-2.5 py-1 text-xs ${
                    type === k ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21]" : "border-[#3c3d43] text-[#a3a29a]"
                  }`}
                >
                  {TYPES[k].name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2">
            {(Object.keys(PALETTE) as (keyof typeof PALETTE)[]).map((part) => (
              <div key={part} className="flex flex-col gap-1.5">
                <span className="text-xs text-[#a3a29a]">{COLOR_NAMES[part]}</span>
                <div className="flex flex-wrap gap-1.5">
                  {PALETTE[part].map((col) => (
                    <button
                      key={col}
                      type="button"
                      aria-label={`${COLOR_NAMES[part]} ${col}`}
                      aria-pressed={look.colors[part] === col}
                      onClick={() => onLookChange({ colors: { [part]: col } })}
                      style={{ background: col }}
                      className={`h-7 w-7 cursor-pointer rounded border-2 ${
                        look.colors[part] === col ? "border-[#f1f1ee]" : "border-transparent"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-[#a3a29a]">
            배번 (비우면 없음, 정면에서만 보여요)
            <input
              type="number"
              min={0}
              max={99}
              value={look.bib ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                onLookChange({ bib: v === "" ? null : Math.max(0, Math.min(99, Number(v))) });
              }}
              className="w-20 rounded border border-[#3c3d43] bg-[#17181b] px-2 py-1 text-sm text-[#f1f1ee]"
            />
          </label>
          <button
            type="button"
            onClick={onReset}
            className="w-fit cursor-pointer rounded border border-[#3c3d43] px-3 py-1.5 text-xs text-[#a3a29a] hover:border-[#f0b84a] hover:text-[#f0b84a]"
          >
            이 멤버 초기값으로 되돌리기
          </button>
        </div>
      </div>
    </section>
  );
}
