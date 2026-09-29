"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ITEMS, type RaceBodyType, type RaceEye, type RaceItemSlot } from "@/lib/race/constants";
import { paint, SPRITE_GRID_SIZE, type RaceEquipment } from "@/lib/race/sprite";

const SCALE = 3;

// 옷장 미리보기 — 정지 이미지가 아니라 계속 달리는 애니메이션으로 보여준다(장비 착용 느낌이
// 훨씬 잘 드러나서). RaceAvatarImg는 정지 이미지 전용이라 여기서만 별도로 캔버스 루프를 돌린다.
function RaceClosetPreview({ color, eye, type, eq }: { color: string; eye: RaceEye; type: RaceBodyType; eq: RaceEquipment }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const eqRef = useRef(eq);
  useEffect(() => {
    eqRef.current = eq;
  }, [eq]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = SPRITE_GRID_SIZE * SCALE;
    canvas.width = size;
    canvas.height = size;
    ctx.imageSmoothingEnabled = false;
    let raf = 0;
    let cancelled = false;
    function draw(t: number) {
      if (cancelled) return;
      ctx!.clearRect(0, 0, size, size);
      const tick = Math.floor(t / 130);
      paint(ctx!, { type, expr: "happy", eye, eq: eqRef.current, color, scale: SCALE, frame: tick % 4, tick });
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [color, eye, type]);

  return <canvas ref={canvasRef} className="[image-rendering:pixelated]" />;
}

const SLOTS: { slot: RaceItemSlot; label: string }[] = [
  { slot: "head", label: "머리" },
  { slot: "face", label: "얼굴" },
  { slot: "neck", label: "목" },
  { slot: "body", label: "몸" },
  { slot: "wrist", label: "손목" },
  { slot: "feet", label: "발" },
];

export function RaceCloset({
  color,
  eye,
  type,
  ownedItemIds,
  eq,
  nextPickLevel,
  kmToNextPick,
}: {
  color: string;
  eye: RaceEye;
  type: RaceBodyType;
  ownedItemIds: string[];
  eq: RaceEquipment;
  nextPickLevel: number | null;
  kmToNextPick: number | null;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<RaceEquipment>(eq);
  const [busySlot, setBusySlot] = useState<RaceItemSlot | null>(null);

  // 서버에서 새 eq가 내려오면(예: 레벨업 모달이 자동 장착 후 router.refresh) 동기화한다.
  // 렌더 중 상태 조정 패턴 — effect를 안 쓰는 게 리액트 공식 권장 방식.
  const [syncedEq, setSyncedEq] = useState(eq);
  if (eq !== syncedEq) {
    setSyncedEq(eq);
    setCurrent(eq);
  }

  async function equip(slot: RaceItemSlot, itemId: string | null) {
    setBusySlot(slot);
    setCurrent((prev) => ({ ...prev, [slot]: itemId }));
    try {
      await fetch("/api/race/items/equip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, itemId }),
      });
      router.refresh();
    } finally {
      setBusySlot(null);
    }
  }

  // 아직 못 가진 장비도 캐릭터에 잠깐 입혀볼 수 있게 — 서버에는 저장 안 하고 로컬 미리보기만.
  function previewLocked(slot: RaceItemSlot, itemId: string) {
    setCurrent((prev) => ({ ...prev, [slot]: itemId }));
  }
  function resetPreview(slot: RaceItemSlot) {
    setCurrent((prev) => ({ ...prev, [slot]: eq[slot] ?? null }));
  }

  const anyPreviewing = SLOTS.some(({ slot }) => current[slot] !== (eq[slot] ?? null));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center rounded bg-[#17181b] py-4">
        <RaceClosetPreview color={color} eye={eye} type={type} eq={current} />
      </div>

      {nextPickLevel != null && (
        <p className="text-xs text-[#a3a29a]">
          다음 장비 선택: <b className="text-[#f0b84a]">Lv.{nextPickLevel}</b>
          {kmToNextPick != null && ` · ${kmToNextPick.toFixed(1)}km 남음`}
        </p>
      )}
      {anyPreviewing && (
        <p className="rounded border border-dashed border-[#f0b84a] px-2.5 py-1.5 text-xs text-[#f0b84a]">
          🔍 미리보기 중이에요 — 실제로 착용하려면 레벨업으로 먼저 획득해야 해요.
        </p>
      )}

      {SLOTS.map(({ slot, label }) => {
        const options = ITEMS.filter((it) => it.slot === slot);
        const slotPreviewing = current[slot] !== (eq[slot] ?? null);
        return (
          <div key={slot} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#a3a29a]">{label}</span>
              {slotPreviewing && (
                <button
                  type="button"
                  onClick={() => resetPreview(slot)}
                  className="cursor-pointer text-[11px] text-[#6f6f6a] underline"
                >
                  되돌리기
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => equip(slot, null)}
                disabled={busySlot === slot}
                className={`cursor-pointer rounded border px-2.5 py-1.5 text-[13px] disabled:opacity-40 ${
                  !current[slot] ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21]" : "border-[#3c3d43] text-[#a3a29a]"
                }`}
              >
                안 입음
              </button>
              {options.map((it) => {
                const owned = ownedItemIds.includes(it.id);
                const equipped = current[slot] === it.id;
                if (!owned) {
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => previewLocked(slot, it.id)}
                      title={nextPickLevel != null ? `Lv.${nextPickLevel}에서 선택 가능 · 클릭하면 미리보기` : "레벨업으로 획득 · 클릭하면 미리보기"}
                      className={`cursor-pointer rounded border border-dashed px-2.5 py-1.5 text-[13px] ${
                        equipped ? "border-[#f0b84a] text-[#f0b84a]" : "border-[#3c3d43] text-[#6f6f6a]"
                      }`}
                    >
                      🔒 {it.name}
                    </button>
                  );
                }
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => equip(slot, it.id)}
                    disabled={busySlot === slot}
                    className={`cursor-pointer rounded border px-2.5 py-1.5 text-[13px] disabled:opacity-40 ${
                      equipped ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21]" : "border-[#3c3d43] text-[#a3a29a]"
                    }`}
                  >
                    {it.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
