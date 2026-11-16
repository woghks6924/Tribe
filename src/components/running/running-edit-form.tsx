"use client";

import { useState, type FormEvent } from "react";
import type { RunningFormField } from "@/lib/running";
import {
  RunningFieldInputs,
  findMissingRequiredField,
  type RunningAnswers,
} from "@/components/running/running-field-inputs";

const inputClass =
  "border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint";

type Found = { name: string; editable: boolean; reason: string | null; deadline: string };

// 신청 내용 수정: 신청할 때 쓴 연락처 + 인스타그램 ID로 본인 확인 → 설문 답변만 고친다.
export function RunningEditForm({ formId, fields }: { formId: string; fields: RunningFormField[] }) {
  const [phone, setPhone] = useState("");
  const [instagramId, setInstagramId] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [answers, setAnswers] = useState<RunningAnswers>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function lookup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/running/forms/${formId}/my-submission`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, instagramId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "신청 내역을 찾지 못했어요.");
        return;
      }
      setAnswers((data.answers ?? {}) as RunningAnswers);
      setFound({ name: data.name, editable: data.editable, reason: data.reason, deadline: data.deadline });
    } catch {
      setError("문제가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const missing = findMissingRequiredField(fields, answers);
    if (missing) {
      setError(`${missing}을(를) 입력해주세요.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/running/forms/${formId}/my-submission`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, instagramId, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했어요.");
        return;
      }
      setSaved(true);
    } catch {
      setError("문제가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  if (saved) {
    return (
      <div className="flex flex-col gap-2 border border-line px-6 py-10 text-center">
        <span className="font-display text-xl font-extrabold tracking-[0.02em] uppercase">수정 완료</span>
        <p className="text-sm text-ink-muted">신청 내용이 수정되었어요.</p>
      </div>
    );
  }

  if (!found) {
    return (
      <form onSubmit={lookup} className="flex flex-col gap-4">
        <p className="text-xs leading-relaxed text-ink-muted">
          신청할 때 입력한 <b>연락처</b>와 <b>인스타그램 ID</b>를 입력하면 신청 내용을 불러와요. 두 가지가 모두 일치해야 해요.
        </p>
        <input
          required
          type="tel"
          placeholder="연락처"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
        <input
          required
          placeholder="인스타그램 아이디"
          value={instagramId}
          onChange={(e) => setInstagramId(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer bg-ink px-6 py-3.5 text-xs font-semibold tracking-[0.08em] text-[color:var(--color-base)] uppercase hover:bg-ink/85 disabled:opacity-40"
        >
          {loading ? "확인 중..." : "내 신청 불러오기"}
        </button>
      </form>
    );
  }

  if (!found.editable) {
    return (
      <div className="flex flex-col gap-2 border border-line-strong px-6 py-8 text-center">
        <span className="text-sm font-bold">{found.name}님의 신청</span>
        <p className="text-sm text-ink-muted">{found.reason}</p>
      </div>
    );
  }

  const deadline = new Date(found.deadline).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <p className="text-xs text-ink-muted">
        <b>{found.name}</b>님의 신청이에요. 설문 답변만 수정할 수 있고, {deadline}까지 가능해요.
      </p>
      {fields.length === 0 ? (
        <p className="text-sm text-ink-faint">수정할 설문 항목이 없어요.</p>
      ) : (
        <RunningFieldInputs fields={fields} answers={answers} setAnswers={setAnswers} />
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || fields.length === 0}
        className="cursor-pointer bg-ink px-6 py-3.5 text-xs font-semibold tracking-[0.08em] text-[color:var(--color-base)] uppercase hover:bg-ink/85 disabled:opacity-40"
      >
        {loading ? "저장 중..." : "수정 저장"}
      </button>
    </form>
  );
}
