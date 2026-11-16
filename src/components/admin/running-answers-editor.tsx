"use client";

import { useState } from "react";
import type { RunningFormField } from "@/lib/running";
import { buildItemAnswer, itemAttrs, parseItemAnswer, type ItemAttrKey } from "@/lib/running-item";
import { ItemAttrInput } from "@/components/running/item-attr-input";

type Answers = Record<string, string | string[]>;

const inputClass = "border border-line-strong bg-base px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-ink-faint";

// 이미 접수된 신청의 설문 답변을 관리자가 직접 고친다(예: 나중에 추가한 협찬 품목의 사이즈·색상을 DM으로 받아서 입력).
// 신청자 화면과 달리 필수 여부는 강제하지 않는다 — 관리자는 빈 칸으로 둘 수도 있어야 해서.
export function RunningAnswersEditor({
  fields,
  initial,
  saving,
  error,
  onSave,
  onCancel,
}: {
  fields: RunningFormField[];
  initial: Answers;
  saving: boolean;
  error: string | null;
  onSave: (answers: Answers) => void;
  onCancel: () => void;
}) {
  const [answers, setAnswers] = useState<Answers>(initial);

  const set = (id: string, value: string | string[]) => setAnswers((prev) => ({ ...prev, [id]: value }));
  const str = (id: string) => (typeof answers[id] === "string" ? (answers[id] as string) : "");
  const arr = (id: string) => (Array.isArray(answers[id]) ? (answers[id] as string[]) : []);

  // 이전에 저장된 값이 지금 선택지에 없어도(선택지를 나중에 바꾼 경우) 그대로 고를 수 있게 목록에 끼워 넣는다.
  const withCurrent = (options: string[], current: string) => (current && !options.includes(current) ? [current, ...options] : options);

  function setItemPart(f: RunningFormField, part: ItemAttrKey, value: string) {
    set(f.id, buildItemAnswer({ ...parseItemAnswer(answers[f.id]), [part]: value }));
  }

  function finish() {
    // 빈 답변은 저장하지 않는다.
    const cleaned: Answers = {};
    for (const f of fields) {
      const v = answers[f.id];
      if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
      cleaned[f.id] = v;
    }
    onSave(cleaned);
  }

  return (
    <div className="flex flex-col gap-3 border border-line-strong bg-base-elevated p-3">
      {fields.map((f) => (
        <div key={f.id} className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-ink-muted">{f.label}</span>

          {f.type === "text" && <input value={str(f.id)} onChange={(e) => set(f.id, e.target.value)} className={inputClass} />}
          {f.type === "textarea" && (
            <textarea value={str(f.id)} onChange={(e) => set(f.id, e.target.value)} rows={2} className={inputClass} />
          )}
          {(f.type === "select" || f.type === "radio") && (
            <select value={str(f.id)} onChange={(e) => set(f.id, e.target.value)} className={inputClass}>
              <option value="">(선택 안 함)</option>
              {withCurrent(f.options ?? [], str(f.id)).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          )}
          {f.type === "checkbox" && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {[...new Set([...(f.options ?? []), ...arr(f.id)])].map((o) => (
                <label key={o} className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <input
                    type="checkbox"
                    checked={arr(f.id).includes(o)}
                    onChange={(e) => set(f.id, e.target.checked ? [...arr(f.id), o] : arr(f.id).filter((x) => x !== o))}
                  />
                  {o}
                </label>
              ))}
            </div>
          )}
          {f.type === "item" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {itemAttrs(f).map((attr) => (
                <ItemAttrInput
                  key={attr.key}
                  label={attr.label}
                  options={attr.options}
                  allowCustom
                  value={parseItemAnswer(answers[f.id])[attr.key]}
                  onChange={(v) => setItemPart(f, attr.key, v)}
                  placeholder={attr.placeholder}
                  labelClass="flex flex-col gap-1 text-[11px] text-ink-faint"
                  selectClass={inputClass}
                  inputClass={inputClass}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={finish}
          className="cursor-pointer bg-ink px-4 py-1.5 text-xs font-semibold text-[color:var(--color-base)] hover:bg-ink/85 disabled:opacity-40"
        >
          {saving ? "저장 중…" : "답변 저장"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="cursor-pointer border border-line-strong px-4 py-1.5 text-xs text-ink-muted hover:border-ink hover:text-ink"
        >
          취소
        </button>
      </div>
    </div>
  );
}
