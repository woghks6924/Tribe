"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RaceBodyType, RaceEye, RaceItem } from "@/lib/race/constants";
import { paint, SPRITE_GRID_SIZE } from "@/lib/race/sprite";
import { V4_CLOSET_ITEMS } from "@/lib/race/v4/map";
import type { V4Look } from "@/lib/race/v4/sprite";
import { V4Avatar } from "@/components/race/v4/v4-avatar";

const SCALE = 2.5;

function ItemPreview({ color, eye, type, itemId, slot }: { color: string; eye: RaceEye; type: RaceBodyType; itemId: string; slot: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = SPRITE_GRID_SIZE * SCALE;
    canvas.width = size;
    canvas.height = size;
    ctx.imageSmoothingEnabled = false;
    paint(ctx, { type, expr: "happy", eye, eq: { [slot]: itemId }, color, scale: SCALE });
  }, [color, eye, type, itemId, slot]);
  return <canvas ref={canvasRef} className="[image-rendering:pixelated]" />;
}

// 로그인 시 아직 고르지 않은 레벨업 장비가 있으면 뜨는 팝업 — 선물 상자를 여는 느낌으로
// 하나 고르면 다음 밀린 레벨이 있는지 다시 확인해서 연달아 띄운다.
// v4Look이 있으면(새 캐릭터 플래그) 새 캐릭터로 미리보기·레벨업 점프를 보여준다.
export function RaceLevelupModal({
  color,
  eye,
  type,
  v4Look,
}: {
  color: string;
  eye: RaceEye;
  type: RaceBodyType;
  v4Look?: V4Look;
}) {
  const router = useRouter();
  const [pendingLevel, setPendingLevel] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<RaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/race/items/pick");
      const data = await res.json();
      setPendingLevel(data.pendingLevel ?? null);
      setCandidates(data.candidates ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pick(itemId: string) {
    setPicking(true);
    try {
      await fetch("/api/race/items/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      router.refresh();
      await load();
    } finally {
      setPicking(false);
    }
  }

  if (loading || pendingLevel == null) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded border border-[#3c3d43] bg-[#2a2b2e] p-5">
        <div className="text-center">
          <span className="font-[family-name:var(--font-race-px)] text-[11px] text-[#f0b84a]">LEVEL UP</span>
          {v4Look && (
            <div className="mt-2 flex justify-center">
              <V4Avatar key={pendingLevel} look={v4Look} anim="jumping" dir="south" scale={2} animated once label="레벨업!" />
            </div>
          )}
          <h2 className="mt-1.5 text-lg font-bold">Lv.{pendingLevel} 달성! 장비를 하나 골라요</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {candidates.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => pick(it.id)}
              disabled={picking}
              className="flex flex-col items-center gap-1.5 rounded border border-[#3c3d43] bg-[#17181b] p-2 hover:border-[#f0b84a] disabled:opacity-40"
            >
              {v4Look && V4_CLOSET_ITEMS.some((v) => v.legacyId === it.id) ? (
                <V4Avatar
                  look={{ ...v4Look, item: V4_CLOSET_ITEMS.find((v) => v.legacyId === it.id)!.v4Key }}
                  scale={1}
                  label={it.name}
                />
              ) : (
                <ItemPreview color={color} eye={eye} type={type} itemId={it.id} slot={it.slot} />
              )}
              <span className="text-xs font-medium">{it.name}</span>
            </button>
          ))}
        </div>
        {candidates.length === 0 && <p className="text-center text-sm text-[#6f6f6a]">고를 수 있는 새 장비가 없어요.</p>}
      </div>
    </div>
  );
}
