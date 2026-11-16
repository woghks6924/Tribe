"use client";

import type { Dispatch, SetStateAction } from "react";
import type { RunningFormField } from "@/lib/running";
import { buildItemAnswer, itemAttrs, parseItemAnswer, safeHttpUrl, type ItemAttrKey } from "@/lib/running-item";
import { ItemAttrInput } from "@/components/running/item-attr-input";

export type RunningAnswers = Record<string, string | string[]>;

const inputClass =
  "border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint";

// 객관식/체크박스/협찬 품목 질문은 버튼·여러 칸으로 렌더링돼 브라우저 기본 required 검증이 통하지 않으므로,
// 제출 전에 직접 확인한다. 빠진 질문의 이름을 돌려준다.
export function findMissingRequiredField(fields: RunningFormField[], answers: RunningAnswers): string | null {
  for (const field of fields) {
    if (field.required && field.type === "item") {
      const values = parseItemAnswer(answers[field.id]);
      if (itemAttrs(field).some((a) => !values[a.key])) return field.label;
      continue;
    }
    if (!field.required || (field.type !== "radio" && field.type !== "checkbox")) continue;
    const value = answers[field.id];
    const isEmpty = value == null || (Array.isArray(value) && value.length === 0);
    if (isEmpty) return field.label;
  }
  return null;
}

// 신청 폼과 "신청 내용 수정" 화면이 같이 쓰는 설문 질문 입력 영역.
export function RunningFieldInputs({
  fields,
  answers,
  setAnswers,
}: {
  fields: RunningFormField[];
  answers: RunningAnswers;
  setAnswers: Dispatch<SetStateAction<RunningAnswers>>;
}) {
  function setAnswer(fieldId: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  }

  function toggleCheckboxAnswer(fieldId: string, option: string, checked: boolean) {
    setAnswers((prev) => {
      const current = Array.isArray(prev[fieldId]) ? (prev[fieldId] as string[]) : [];
      const next = checked ? [...current, option] : current.filter((o) => o !== option);
      return { ...prev, [fieldId]: next };
    });
  }

  // 협찬 품목: 사이즈·기장·색상을 각각 바꿀 때마다 하나의 답변(["사이즈: M", "색상: 블랙"])으로 합친다.
  function setItemPart(field: RunningFormField, part: ItemAttrKey, value: string) {
    setAnswer(field.id, buildItemAnswer({ ...parseItemAnswer(answers[field.id]), [part]: value }));
  }

  return (
    <>
      {fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">
            {field.type === "item" && safeHttpUrl(field.url) ? (
              <a
                href={safeHttpUrl(field.url)!}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-ink underline underline-offset-2"
              >
                {field.label} ↗
              </a>
            ) : (
              field.label
            )}
            {field.required && <span className="text-red-400"> *</span>}
          </span>
          {field.description && (
            <p className="text-xs whitespace-pre-line text-ink-faint">{field.description}</p>
          )}
          {field.type === "item" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {itemAttrs(field).map((attr) => (
                <ItemAttrInput
                  key={attr.key}
                  label={attr.label}
                  options={attr.options}
                  allowCustom={attr.allowCustom}
                  value={parseItemAnswer(answers[field.id])[attr.key]}
                  onChange={(v) => setItemPart(field, attr.key, v)}
                  required={field.required}
                  placeholder={attr.placeholder}
                  labelClass="flex flex-col gap-1 text-xs text-ink-faint"
                  selectClass="border border-line-strong bg-base px-4 py-3 text-sm text-ink outline-none"
                  inputClass={`${inputClass} text-ink`}
                />
              ))}
            </div>
          )}
          {field.type === "text" && (
            <input
              required={field.required}
              value={(answers[field.id] as string) ?? ""}
              onChange={(e) => setAnswer(field.id, e.target.value)}
              className={inputClass}
            />
          )}
          {field.type === "textarea" && (
            <textarea
              required={field.required}
              rows={3}
              value={(answers[field.id] as string) ?? ""}
              onChange={(e) => setAnswer(field.id, e.target.value)}
              className={inputClass}
            />
          )}
          {field.type === "select" && (
            <select
              required={field.required}
              value={(answers[field.id] as string) ?? ""}
              onChange={(e) => setAnswer(field.id, e.target.value)}
              className="border border-line-strong bg-base px-4 py-3 text-sm outline-none"
            >
              <option value="">선택해주세요</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
          {field.type === "radio" && (
            <div className="flex flex-wrap gap-2">
              {(field.options ?? []).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswer(field.id, opt)}
                  className={`cursor-pointer border px-3 py-2 text-xs ${
                    answers[field.id] === opt
                      ? "border-ink bg-ink text-[color:var(--color-base)]"
                      : "border-line-strong text-ink-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
          {field.type === "checkbox" && (
            <div className="flex flex-wrap gap-2">
              {(field.options ?? []).map((opt) => {
                const checked = Array.isArray(answers[field.id])
                  ? (answers[field.id] as string[]).includes(opt)
                  : false;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleCheckboxAnswer(field.id, opt, !checked)}
                    className={`cursor-pointer border px-3 py-2 text-xs ${
                      checked
                        ? "border-ink bg-ink text-[color:var(--color-base)]"
                        : "border-line-strong text-ink-muted hover:border-ink hover:text-ink"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
