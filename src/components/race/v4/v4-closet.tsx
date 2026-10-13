"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ITEM_LABELS, PET_NAMES, SLOT_LABELS } from "@/lib/race/v4/palette";
import type { V4Look } from "@/lib/race/v4/sprite";
import {
  PET_UNLOCK_LEVEL,
  UNLOCK_ALL_LEVEL,
  itemUnlock,
  petUnlock,
  type UnlockFacts,
  type UnlockState,
} from "@/lib/race/v4/unlock";
import { useRaceAssets } from "./assets";
import { SLOT_ORDER, STATUS_ICON, itemsBySlot, petKeys } from "./catalog";
import { V4Avatar } from "./v4-avatar";

export type V4ClosetProgress = {
  nextPickLevel: number | null; // 지금 대기 중이거나 곧 도달할 선택 레벨
  pickPending: boolean; // true면 이미 도달했는데 아직 안 고른 선택권
  kmToNextPick: number | null;
  kmToPet: number | null; // Lv6까지 남은 km (이미 넘었으면 null)
  kmToAll: number | null; // Lv10까지 남은 km
};

// 새 캐릭터 옷장: 장비는 부위(머리·얼굴·목·등·허리)마다 1개, 펫은 1마리. 열린 것만 서버에 저장되고,
// 잠긴 것과 레벨업 선택권으로 얻을 것은 눌러서 미리보기만 한다. 목록은 manifest에서 읽는다.
export function V4Closet({
  look,
  facts,
  progress,
  todayLogged,
}: {
  look: V4Look; // 지금 저장된 외형(미리보기 바탕)
  facts: UnlockFacts;
  progress: V4ClosetProgress;
  todayLogged: boolean;
}) {
  const router = useRouter();
  const A = useRaceAssets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 미리보기: 부위별로 입어본 장비(null = 벗기), 펫(undefined = 그대로)
  const [previewItems, setPreviewItems] = useState<Record<string, string | null>>({});
  const [previewPet, setPreviewPet] = useState<string | null | undefined>(undefined);

  if (!A) return <p className="text-sm text-[#6f6f6a]">옷장 불러오는 중…</p>;

  const bySlot = itemsBySlot(A);
  const slotOf = (k: string) => A.manifest.slots?.[k] ?? "head";
  const savedBySlot: Record<string, string> = {};
  for (const k of look.items ?? []) savedBySlot[slotOf(k)] = k;

  const shownBySlot: Record<string, string | null> = { ...savedBySlot, ...previewItems };
  const shownItems = Object.values(shownBySlot).filter((k): k is string => !!k);
  const shownPet = previewPet === undefined ? (look.pet ?? null) : previewPet;
  const previewing = Object.keys(previewItems).length > 0 || previewPet !== undefined;

  async function post(url: string, body: unknown) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "저장에 실패했어요.");
        return;
      }
      setPreviewItems({});
      setPreviewPet(undefined);
      router.refresh();
    } catch {
      setError("문제가 발생했어요.");
    } finally {
      setBusy(false);
    }
  }

  function chipClass(active: boolean, st?: UnlockState) {
    if (active) return "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21]";
    if (st && st.status !== "open") return "border-dashed border-[#3c3d43] text-[#8a8982]";
    return "border-[#3c3d43] text-[#a3a29a]";
  }

  const levelText = (
    <ul className="flex flex-col gap-0.5 text-xs text-[#a3a29a]">
      <li>
        현재 <b className="text-[#f0b84a]">Lv.{facts.level}</b>
        {progress.nextPickLevel != null &&
          (progress.pickPending ? (
            <> · 장비 선택권이 있어요 — 레벨업 팝업에서 골라요</>
          ) : (
            <>
              {" "}
              · 다음 장비 선택: <b className="text-[#f0b84a]">Lv.{progress.nextPickLevel}</b>
              {progress.kmToNextPick != null && ` (앞으로 ${progress.kmToNextPick.toFixed(1)}km)`}
            </>
          ))}
      </li>
      <li>
        펫:{" "}
        {facts.level >= PET_UNLOCK_LEVEL ? (
          <b className="text-[#86d494]">전부 자유 선택</b>
        ) : (
          <>
            Lv.{PET_UNLOCK_LEVEL}이 되면 펫을 고를 수 있어요
            {progress.kmToPet != null && ` (앞으로 ${progress.kmToPet.toFixed(1)}km)`}
          </>
        )}
      </li>
      <li>
        장비:{" "}
        {facts.level >= UNLOCK_ALL_LEVEL ? (
          <b className="text-[#86d494]">조건부 장비 외 전부 자유 선택</b>
        ) : (
          <>
            Lv.{UNLOCK_ALL_LEVEL}이 되면 장비를 전부 고를 수 있어요
            {progress.kmToAll != null && ` (앞으로 ${progress.kmToAll.toFixed(1)}km)`}
          </>
        )}
      </li>
    </ul>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center rounded bg-[#17181b] py-4">
        <V4Avatar
          look={{ ...look, items: shownItems, item: null, pet: shownPet }}
          scale={3}
          animated
          dir="south"
          anim={todayLogged ? "running" : "breathing_idle"}
          label="옷장 미리보기"
        />
      </div>

      {levelText}

      {previewing && (
        <p className="rounded border border-dashed border-[#f0b84a] px-2.5 py-1.5 text-xs text-[#f0b84a]">
          🔍 미리보기 중이에요 — 실제로 바꾸려면 🔓 열린 것을 눌러요.
          <button
            type="button"
            onClick={() => {
              setPreviewItems({});
              setPreviewPet(undefined);
            }}
            className="ml-2 cursor-pointer text-[#a3a29a] underline"
          >
            되돌리기
          </button>
        </p>
      )}
      {error && <p className="text-sm text-[#f08068]">{error}</p>}

      {SLOT_ORDER.filter((slot) => bySlot[slot]?.length).map((slot) => (
        <div key={slot} className="flex flex-col gap-1.5">
          <span className="text-xs text-[#a3a29a]">{SLOT_LABELS[slot] ?? slot}</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => post("/api/race/v4-equip", { slot, itemKey: null })}
              className={`cursor-pointer rounded border px-2.5 py-1.5 text-[13px] disabled:opacity-40 ${chipClass(shownBySlot[slot] == null)}`}
            >
              안 입음
            </button>
            {bySlot[slot].map((key) => {
              const st = itemUnlock(key, facts);
              const active = shownBySlot[slot] === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={busy}
                  title={st.detail}
                  onClick={() => {
                    if (st.status === "open") void post("/api/race/v4-equip", { slot, itemKey: key });
                    else setPreviewItems((p) => ({ ...p, [slot]: key }));
                  }}
                  className={`cursor-pointer rounded border px-2.5 py-1.5 text-[13px] disabled:opacity-40 ${chipClass(active, st)}`}
                >
                  {STATUS_ICON[st.status]} {ITEM_LABELS[key] ?? key}
                  {st.status !== "open" && <span className="ml-1 text-[11px] opacity-70">· {st.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-[#a3a29a]">펫 (1마리만 데리고 다녀요)</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => post("/api/race/v4-pet", { petKey: null })}
            className={`cursor-pointer rounded border px-2.5 py-1.5 text-[13px] disabled:opacity-40 ${chipClass(shownPet == null)}`}
          >
            없음
          </button>
          {petKeys(A).map((key) => {
            const st = petUnlock(key, facts);
            return (
              <button
                key={key}
                type="button"
                disabled={busy}
                title={st.detail}
                onClick={() => {
                  if (st.status === "open") void post("/api/race/v4-pet", { petKey: key });
                  else setPreviewPet(key);
                }}
                className={`cursor-pointer rounded border px-2.5 py-1.5 text-[13px] disabled:opacity-40 ${chipClass(shownPet === key, st)}`}
              >
                {STATUS_ICON[st.status]} {PET_NAMES[key] ?? key}
                {st.status !== "open" && <span className="ml-1 text-[11px] opacity-70">· {st.label}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
