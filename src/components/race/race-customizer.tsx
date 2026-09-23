"use client";

import {
  APPAREL_COLOR_PRESETS,
  BOTTOM_TYPES,
  defaultBottomTypeFor,
  defaultHairStyleFor,
  defaultTopTypeFor,
  HAIR_COLOR_PRESETS,
  HAIR_STYLES,
  PROP_OPTIONS,
  SHOE_TYPES,
  SKIN_TONE_OPTIONS,
  TOP_TYPES,
  type RaceAppearance,
  type RaceGender,
} from "@/lib/race/appearance";
import { RaceAvatarImg } from "@/components/race/race-avatar";

export type RaceCustomizeValue = RaceAppearance & { igHandle: string };

function ColorPicker({
  value,
  onChange,
  presets,
}: {
  value: string;
  onChange: (color: string) => void;
  presets: string[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {presets.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-label={`색상 ${c}`}
          style={{ backgroundColor: c }}
          className={`h-6 w-6 cursor-pointer rounded border-2 ${value === c ? "border-[#f1f1ee]" : "border-transparent"}`}
        />
      ))}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-8 cursor-pointer rounded border border-[#3c3d43] bg-transparent p-0"
        aria-label="직접 색상 선택"
      />
    </div>
  );
}

function SegButtons({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`cursor-pointer rounded border px-2.5 py-1 text-[13px] ${
            value === o.value ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21]" : "border-[#3c3d43] text-[#a3a29a]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function RaceCustomizer({
  value,
  onChange,
}: {
  value: RaceCustomizeValue;
  onChange: (next: RaceCustomizeValue) => void;
}) {
  function setGender(gender: RaceGender) {
    if (gender === value.gender) return;
    onChange({
      ...value,
      gender,
      hairStyle: defaultHairStyleFor(gender),
      topType: defaultTopTypeFor(gender),
      bottomType: defaultBottomTypeFor(gender),
    });
  }
  function patch(next: Partial<RaceCustomizeValue>) {
    onChange({ ...value, ...next });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <RaceAvatarImg appearance={value} heightPx={140} className="[image-rendering:pixelated]" alt="캐릭터 미리보기" />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-[#a3a29a]">성별</span>
        <SegButtons
          options={[
            { value: "male", label: "남성" },
            { value: "female", label: "여성" },
          ]}
          value={value.gender}
          onChange={(v) => setGender(v as RaceGender)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-[#a3a29a]">피부 톤</span>
        <SegButtons options={SKIN_TONE_OPTIONS} value={value.skinTone} onChange={(v) => patch({ skinTone: v as RaceAppearance["skinTone"] })} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-[#a3a29a]">헤어스타일</span>
        <SegButtons options={HAIR_STYLES[value.gender]} value={value.hairStyle} onChange={(v) => patch({ hairStyle: v })} />
        <ColorPicker value={value.hairColor} onChange={(c) => patch({ hairColor: c })} presets={HAIR_COLOR_PRESETS} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-[#a3a29a]">상의</span>
        <SegButtons options={TOP_TYPES[value.gender]} value={value.topType} onChange={(v) => patch({ topType: v })} />
        <ColorPicker value={value.topColor} onChange={(c) => patch({ topColor: c })} presets={APPAREL_COLOR_PRESETS} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-[#a3a29a]">하의</span>
        <SegButtons options={BOTTOM_TYPES[value.gender]} value={value.bottomType} onChange={(v) => patch({ bottomType: v })} />
        <ColorPicker value={value.bottomColor} onChange={(c) => patch({ bottomColor: c })} presets={APPAREL_COLOR_PRESETS} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-[#a3a29a]">신발</span>
        <SegButtons options={SHOE_TYPES} value={value.shoeType} onChange={(v) => patch({ shoeType: v })} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-[#a3a29a]">들고 다닐 소지품 (선택)</span>
        <SegButtons
          options={PROP_OPTIONS.map((o) => ({ value: o.value || "none", label: o.label }))}
          value={value.prop ?? "none"}
          onChange={(v) => patch({ prop: v === "none" ? null : (v as RaceAppearance["prop"]) })}
        />
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-[#a3a29a]">인스타그램 아이디 (선택)</span>
        <input
          value={value.igHandle}
          onChange={(e) => patch({ igHandle: e.target.value })}
          maxLength={31}
          placeholder="@my.run"
          autoComplete="off"
          className="rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2 text-[15px] text-[#f1f1ee] outline-none placeholder:text-[#6f6f6a]"
        />
      </label>
    </div>
  );
}
