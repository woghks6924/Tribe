"use client";

import {
  BASIC_PICK_LEVELS,
  PET_UNLOCK_LEVEL,
  RARE_PICK_LEVELS,
  UNLOCK_ALL_LEVEL,
  basicPicks,
  itemUnlock,
  petUnlock,
  rarePicks,
  type UnlockState,
} from "@/lib/race/v4/unlock";
import type { RaceAssets } from "@/lib/race/v4/sprite";
import { ITEM_LABELS, PET_NAMES, SLOT_LABELS, SLOT_ORDER, STATUS_ICON, itemsBySlot, petKeys, type LabMember, type LevelRow } from "./lab-shared";

const TONE: Record<UnlockState["status"], string> = {
  open: "border-[#2f6b46] bg-[#2f6b46]/20 text-[#86d494]",
  pick: "border-[#f0b84a]/60 bg-[#f0b84a]/10 text-[#f0b84a]",
  locked: "border-[#3c3d43] bg-[#17181b] text-[#6f6f6a]",
};

function Badge({ name, state }: { name: string; state: UnlockState }) {
  return (
    <span title={state.detail} className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs ${TONE[state.status]}`}>
      <span aria-hidden>{STATUS_ICON[state.status]}</span>
      <b className="font-medium">{name}</b>
      <span className="opacity-80">· {state.label}</span>
    </span>
  );
}

// 해금 미리보기: 그 멤버의 실제 레벨·기록 기준으로 새 해금 규칙을 적용하면 무엇이 열리는지 보여준다(실제 적용은 B단계).
export function LabUnlock({ member, levelRows, A }: { member: LabMember; levelRows: LevelRow[]; A: RaceAssets }) {
  const f = member.facts;
  const bySlot = itemsBySlot(A);
  const kmOf = (lv: number) => levelRows.find((r) => r.level === lv)?.km;
  const toPet = kmOf(PET_UNLOCK_LEVEL);
  const toAll = kmOf(UNLOCK_ALL_LEVEL);

  return (
    <section className="flex flex-col gap-3 rounded border border-[#3c3d43] bg-[#2a2b2e] p-3 sm:p-4">
      <div>
        <h2 className="text-base font-bold">해금 미리보기 — {member.name}</h2>
        <p className="text-xs text-[#a3a29a]">
          지금 레벨·기록에 새 해금 규칙을 적용하면 뭐가 열려 있는지 보여줘요. 실제 적용은 B단계고, 아래 꾸미기 패널에서는 테스트라서 전부 착용해 볼 수 있어요.
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-1 text-xs text-[#a3a29a] min-[560px]:grid-cols-2">
        <li>
          현재 <b className="text-[#f0b84a]">Lv.{f.level}</b> · 전체 누적 {f.totalKm.toFixed(1)}km · 시즌 {member.km.toFixed(1)}km
        </li>
        <li>
          기본 장비 선택권 <b className="text-[#f1f1ee]">{basicPicks(f.level)}</b>/{BASIC_PICK_LEVELS.length} (Lv.{BASIC_PICK_LEVELS[0]}~
          {BASIC_PICK_LEVELS[BASIC_PICK_LEVELS.length - 1]}) · 레어 선택권 <b className="text-[#f1f1ee]">{rarePicks(f.level)}</b>/{RARE_PICK_LEVELS.length} (Lv.
          {RARE_PICK_LEVELS[0]}~{RARE_PICK_LEVELS[RARE_PICK_LEVELS.length - 1]})
        </li>
        <li>
          펫: {f.level >= PET_UNLOCK_LEVEL ? <b className="text-[#86d494]">전부 자유</b> : `Lv.${PET_UNLOCK_LEVEL}이 되면 고를 수 있어요`}
          {f.level < PET_UNLOCK_LEVEL && toPet != null && <> (앞으로 {Math.max(0, toPet - f.totalKm).toFixed(1)}km)</>}
        </li>
        <li>
          장비: {f.level >= UNLOCK_ALL_LEVEL ? <b className="text-[#86d494]">전부 자유</b> : `Lv.${UNLOCK_ALL_LEVEL}이 되면 조건부 외 전부 자유`}
          {f.level < UNLOCK_ALL_LEVEL && toAll != null && <> (앞으로 {Math.max(0, toAll - f.totalKm).toFixed(1)}km)</>}
        </li>
        <li>
          수영 기록 {f.swimLogCount}회 · 수영 누적 {f.swimKm.toFixed(1)}km · 기록한 종목{" "}
          {[f.hasRun && "러닝", f.hasWod && "WOD", f.hasSwim && "수영"].filter(Boolean).join("·") || "없음"}
        </li>
        <li>예전 옷장에서 가진 새 캐릭터용 장비: {f.ownedLegacy.length ? f.ownedLegacy.map((k) => ITEM_LABELS[k] ?? k).join(", ") : "없음"}</li>
      </ul>

      <div className="flex flex-wrap gap-3 text-[11px] text-[#a3a29a]">
        <span>
          {STATUS_ICON.open} 열려 있음(보유·조건 달성·자유)
        </span>
        <span>
          {STATUS_ICON.pick} 레벨업 선택권으로 고를 수 있음
        </span>
        <span>
          {STATUS_ICON.locked} 잠김
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {SLOT_ORDER.filter((s) => bySlot[s]?.length).map((slot) => (
          <div key={slot} className="flex flex-col gap-1.5">
            <span className="text-xs text-[#a3a29a]">{SLOT_LABELS[slot] ?? slot}</span>
            <div className="flex flex-wrap gap-1.5">
              {bySlot[slot].map((key) => (
                <Badge key={key} name={ITEM_LABELS[key] ?? key} state={itemUnlock(key, f)} />
              ))}
            </div>
          </div>
        ))}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-[#a3a29a]">펫 (1마리만 데리고 다녀요)</span>
          <div className="flex flex-wrap gap-1.5">
            {petKeys(A).map((key) => (
              <Badge key={key} name={PET_NAMES[key] ?? key} state={petUnlock(key, f)} />
            ))}
          </div>
        </div>
      </div>

      <details className="text-xs text-[#a3a29a]">
        <summary className="cursor-pointer text-[#f1f1ee]">레벨별 필요 누적 km (Lv.2~12)</summary>
        <p className="mt-1.5">현재 공식: 레벨 N에 필요한 누적 환산 km (전체 기간 합). 시즌 km가 아니라 전체 기록 기준이에요.</p>
        <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 min-[480px]:grid-cols-3">
          {levelRows.map((r) => (
            <li key={r.level}>
              Lv.{r.level} — {r.km.toFixed(1)}km
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
