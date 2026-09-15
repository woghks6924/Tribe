"use client";

import { useState, type FormEvent } from "react";
import type { RunningFormField } from "@/lib/running";

const inputClass =
  "border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint";

export function RunningSignupForm({
  formId,
  fields,
  closed,
  privacyItems,
  privacyPurpose,
  privacyRetention,
}: {
  formId: string;
  fields: RunningFormField[];
  closed: boolean;
  privacyItems: string;
  privacyPurpose: string;
  privacyRetention: string;
}) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!privacyConsent) {
      setError("개인정보 수집·이용에 동의해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/running/forms/${formId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gender: gender || undefined,
          phone,
          email: email || undefined,
          instagramId: instagramId || undefined,
          marketingConsent,
          privacyConsent,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "신청에 실패했습니다.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col gap-2 border border-line px-6 py-10 text-center">
        <span className="font-display text-xl font-extrabold tracking-[0.02em] uppercase">
          신청 완료
        </span>
        <p className="text-sm text-ink-muted">참여해주셔서 감사합니다. 안내는 개별 연락드릴게요.</p>
      </div>
    );
  }

  if (closed) {
    return (
      <div className="flex flex-col gap-2 border border-line-strong px-6 py-10 text-center">
        <span className="font-display text-lg font-extrabold tracking-[0.02em] uppercase text-ink-faint">
          마감된 신청폼입니다
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        required
        placeholder="이름"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={inputClass}
      />

      <div className="flex gap-2">
        {["남", "여", "선택안함"].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGender(g)}
            className={`flex-1 cursor-pointer border px-3 py-2.5 text-xs uppercase ${
              gender === g
                ? "border-ink bg-ink text-base"
                : "border-line-strong text-ink-muted hover:border-ink hover:text-ink"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <input
        required
        type="tel"
        placeholder="연락처"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className={inputClass}
      />
      <input
        type="email"
        placeholder="이메일 (선택)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={inputClass}
      />
      <input
        placeholder="인스타그램 아이디 (선택)"
        value={instagramId}
        onChange={(e) => setInstagramId(e.target.value)}
        className={inputClass}
      />

      {fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">
            {field.label}
            {field.required && <span className="text-red-400"> *</span>}
          </span>
          {field.description && (
            <p className="text-xs whitespace-pre-line text-ink-faint">{field.description}</p>
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
                      ? "border-ink bg-ink text-base"
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
                        ? "border-ink bg-ink text-base"
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

      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <div className="flex flex-col gap-3 border border-line-strong p-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold">
              <span className="text-red-500">*</span> 개인정보 수집 및 이용 동의
            </span>
            <span className="text-xs text-ink-faint">
              동의하지 않을 경우, 신청이 제한될 수 있습니다.
            </span>
          </div>
          <div className="flex flex-col gap-2 border-t border-line pt-3 text-xs">
            <div className="flex items-baseline justify-between gap-4">
              <span className="shrink-0 text-ink-faint">수집 및 이용 항목</span>
              <span className="text-right font-semibold">{privacyItems}</span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="shrink-0 text-ink-faint">수집 및 이용 목적</span>
              <span className="text-right font-semibold">{privacyPurpose}</span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="shrink-0 text-ink-faint">보유 및 이용 기간</span>
              <span className="text-right font-semibold text-red-500">{privacyRetention}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPrivacyConsent((prev) => !prev)}
            className={`flex cursor-pointer items-center justify-center gap-1.5 border px-4 py-3 text-sm font-bold ${
              privacyConsent ? "border-ink bg-ink text-base" : "border-line-strong text-ink-muted"
            }`}
          >
            {privacyConsent && "✓ "}동의합니다
          </button>
        </div>
        <label className="flex items-start gap-2 text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>(선택) 이벤트·마케팅 정보 수신에 동의합니다.</span>
        </label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="cursor-pointer bg-ink px-6 py-3.5 text-sm font-bold tracking-[0.08em] text-base uppercase hover:bg-ink/85 disabled:opacity-40"
      >
        {loading ? "신청 중..." : "신청하기"}
      </button>
    </form>
  );
}
