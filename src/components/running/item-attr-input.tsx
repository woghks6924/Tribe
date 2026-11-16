"use client";

import { useState } from "react";

const CUSTOM = "__custom__";

// 협찬 품목의 사이즈·기장·색상 한 칸. 선택지가 있으면 드롭다운, 없으면 직접 입력칸.
// 선택지가 있어도 allowCustom이면 "직접 입력" 항목이 생겨서 목록에 없는 값을 적을 수 있다.
// 신청 화면과 관리자 답변 수정 화면이 같이 쓴다(className으로 모양만 다르게).
export function ItemAttrInput({
  label,
  options,
  allowCustom,
  value,
  onChange,
  required,
  placeholder,
  selectClass,
  inputClass,
  labelClass,
}: {
  label: string;
  options: string[];
  allowCustom: boolean;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  selectClass: string;
  inputClass: string;
  labelClass: string;
}) {
  // 선택지에 없는 값이 이미 들어 있거나, "직접 입력"을 고른 상태
  const [customMode, setCustomMode] = useState(false);
  const hasOptions = options.length > 0;
  const isCustom = hasOptions && allowCustom && (customMode || (value !== "" && !options.includes(value)));

  return (
    <label className={labelClass}>
      {label}
      {hasOptions ? (
        <>
          <select
            required={required}
            value={isCustom ? CUSTOM : value}
            onChange={(e) => {
              if (e.target.value === CUSTOM) {
                setCustomMode(true);
                onChange("");
              } else {
                setCustomMode(false);
                onChange(e.target.value);
              }
            }}
            className={selectClass}
          >
            <option value="">선택해주세요</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
            {allowCustom && <option value={CUSTOM}>직접 입력</option>}
          </select>
          {isCustom && (
            <input
              required={required}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`${label}을(를) 직접 입력`}
              className={inputClass}
            />
          )}
        </>
      ) : (
        <input required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
      )}
    </label>
  );
}
