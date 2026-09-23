"use client";

import { ACC_OPTIONS, EYE_OPTIONS, PALETTE, type RaceAcc, type RaceBodyType, type RaceEye } from "@/lib/race/constants";
import { RaceAvatarImg } from "@/components/race/race-avatar";

export type RaceCustomizeValue = {
  color: string;
  eye: RaceEye;
  acc: RaceAcc;
  igHandle: string;
};

// 캐릭터 꾸미기 UI(색상/눈/소품/인스타 아이디) — 가입 폼과 마이페이지 편집 둘 다에서 쓴다.
export function RaceCustomizer({
  value,
  onChange,
  previewType,
}: {
  value: RaceCustomizeValue;
  onChange: (next: RaceCustomizeValue) => void;
  previewType: RaceBodyType;
}) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-3.5">
      <RaceAvatarImg
        color={value.color}
        eye={value.eye}
        acc={value.acc}
        type={previewType}
        sleep={false}
        scale={4}
        className="block bg-[#17181b] [image-rendering:pixelated]"
        alt="캐릭터 미리보기"
      />
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-[#a3a29a]">색상</span>
          <div className="flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange({ ...value, color: c })}
                aria-label={`색상 ${c}`}
                style={{ backgroundColor: c }}
                className={`h-6 w-6 cursor-pointer rounded border-2 ${value.color === c ? "border-[#f1f1ee]" : "border-transparent"}`}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-[#a3a29a]">눈</span>
          <div className="flex flex-wrap gap-1.5">
            {EYE_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange({ ...value, eye: o.value })}
                className={`cursor-pointer rounded border px-2.5 py-1 text-[13px] ${
                  value.eye === o.value ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21]" : "border-[#3c3d43] text-[#a3a29a]"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-[#a3a29a]">소품</span>
          <div className="flex flex-wrap gap-1.5">
            {ACC_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange({ ...value, acc: o.value })}
                className={`cursor-pointer rounded border px-2.5 py-1 text-[13px] ${
                  value.acc === o.value ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21]" : "border-[#3c3d43] text-[#a3a29a]"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[#a3a29a]">인스타그램 아이디 (선택)</span>
          <input
            value={value.igHandle}
            onChange={(e) => onChange({ ...value, igHandle: e.target.value })}
            maxLength={31}
            placeholder="@my.run"
            autoComplete="off"
            className="rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2 text-[15px] text-[#f1f1ee] outline-none placeholder:text-[#6f6f6a]"
          />
        </label>
      </div>
    </div>
  );
}
