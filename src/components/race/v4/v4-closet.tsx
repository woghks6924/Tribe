"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { itemById, type RaceItemSlot } from "@/lib/race/constants";
import { V4_CLOSET_ITEMS } from "@/lib/race/v4/map";
import type { V4Look } from "@/lib/race/v4/sprite";
import { V4Avatar } from "./v4-avatar";

const SLOTS: RaceItemSlot[] = ["head", "face", "neck"];

// 새 캐릭터 옷장: 옛 아이템 중 새 캐릭터에 있는 6종만 보이고(나머지는 숨김), 장착은 1개.
// 가진 건 누르면 착용(서버 저장), 아직 못 가진 건 눌러서 미리보기만 한다.
export function V4Closet({
  look,
  equippedLegacyIds,
  ownedItemIds,
  nextPickLevel,
  kmToNextPick,
  todayLogged,
}: {
  look: V4Look; // 지금 저장된 외형(미리보기 바탕)
  equippedLegacyIds: Partial<Record<RaceItemSlot, string | null>>;
  ownedItemIds: string[];
  nextPickLevel: number | null;
  kmToNextPick: number | null;
  todayLogged: boolean;
}) {
  const router = useRouter();
  const equippedKey =
    V4_CLOSET_ITEMS.find((it) => equippedLegacyIds[it.slot] === it.legacyId)?.v4Key ?? null;
  const [preview, setPreview] = useState<{ base: string | null; key: string | null } | null>(null);
  const [busy, setBusy] = useState(false);

  // 서버에서 새 장착값이 내려오면(저장·새로고침 후) 미리보기 상태를 지운다.
  const shownKey = preview && preview.base === equippedKey ? preview.key : equippedKey;
  const previewing = shownKey !== equippedKey;

  async function equip(legacyId: string | null) {
    setBusy(true);
    try {
      const target = V4_CLOSET_ITEMS.find((it) => it.legacyId === legacyId) ?? null;
      // 장착은 1개: 목표 슬롯만 채우고, 나머지 슬롯(머리/얼굴/목)에 걸려 있는 것은 전부 벗긴다.
      for (const slot of SLOTS) {
        const next = target && target.slot === slot ? target.legacyId : null;
        if ((equippedLegacyIds[slot] ?? null) === next) continue;
        await fetch("/api/race/items/equip", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot, itemId: next }),
        });
      }
      setPreview(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center rounded bg-[#17181b] py-4">
        <V4Avatar
          look={{ ...look, item: shownKey }}
          scale={3}
          animated
          dir="south"
          anim={todayLogged ? "running" : "breathing_idle"}
          label="옷장 미리보기"
        />
      </div>

      {nextPickLevel != null && (
        <p className="text-xs text-[#a3a29a]">
          다음 장비 선택: <b className="text-[#f0b84a]">Lv.{nextPickLevel}</b>
          {kmToNextPick != null && ` · ${kmToNextPick.toFixed(1)}km 남음`}
        </p>
      )}
      {previewing && (
        <p className="rounded border border-dashed border-[#f0b84a] px-2.5 py-1.5 text-xs text-[#f0b84a]">
          🔍 미리보기 중이에요 — 실제로 착용하려면 가진 장비를 눌러야 해요.
          <button type="button" onClick={() => setPreview(null)} className="ml-2 cursor-pointer text-[#a3a29a] underline">
            되돌리기
          </button>
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => equip(null)}
          className={`cursor-pointer rounded border px-2.5 py-1.5 text-[13px] disabled:opacity-40 ${
            shownKey === null ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21]" : "border-[#3c3d43] text-[#a3a29a]"
          }`}
        >
          안 입음
        </button>
        {V4_CLOSET_ITEMS.map((it) => {
          const owned = ownedItemIds.includes(it.legacyId);
          const name = itemById(it.legacyId)?.name ?? it.legacyId;
          if (!owned) {
            return (
              <button
                key={it.legacyId}
                type="button"
                onClick={() => setPreview({ base: equippedKey, key: it.v4Key })}
                title={nextPickLevel != null ? `Lv.${nextPickLevel}에서 선택 가능 · 클릭하면 미리보기` : "레벨업으로 획득 · 클릭하면 미리보기"}
                className={`cursor-pointer rounded border border-dashed px-2.5 py-1.5 text-[13px] ${
                  shownKey === it.v4Key ? "border-[#f0b84a] text-[#f0b84a]" : "border-[#3c3d43] text-[#6f6f6a]"
                }`}
              >
                🔒 {name}
              </button>
            );
          }
          return (
            <button
              key={it.legacyId}
              type="button"
              disabled={busy}
              onClick={() => equip(it.legacyId)}
              className={`cursor-pointer rounded border px-2.5 py-1.5 text-[13px] disabled:opacity-40 ${
                shownKey === it.v4Key ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21]" : "border-[#3c3d43] text-[#a3a29a]"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
