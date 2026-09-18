"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Submission = {
  id: string;
  name: string;
  gender: string | null;
  phone: string;
  email: string | null;
  instagramId: string | null;
  previousParticipant: boolean;
  marketingConsent: boolean;
  answers: Record<string, string | string[]>;
  status: "PENDING" | "WINNER" | "NOT_WINNER" | "CONFIRMED" | "CANCELLED";
  createdAt: string;
  personalDataPurgedAt: string | null;
};

type Field = { id: string; label: string };

const STATUSES = ["PENDING", "WINNER", "NOT_WINNER", "CONFIRMED", "CANCELLED"] as const;
const STATUS_LABEL: Record<Submission["status"], string> = {
  PENDING: "대기",
  WINNER: "당첨",
  NOT_WINNER: "미당첨",
  CONFIRMED: "참여확정",
  CANCELLED: "취소",
};

export function RunningSubmissionsManager({
  formId,
  fields,
  submissions,
}: {
  formId: string;
  fields: Field[];
  submissions: Submission[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Submission["status"] | "ALL">("ALL");
  const [previousFilter, setPreviousFilter] = useState<"ALL" | "PREVIOUS" | "NEW">("ALL");
  const [sortPreviousFirst, setSortPreviousFirst] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = submissions.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (previousFilter === "PREVIOUS" && !s.previousParticipant) return false;
      if (previousFilter === "NEW" && s.previousParticipant) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.instagramId ?? "").toLowerCase().includes(q)
      );
    });
    if (sortPreviousFirst) {
      return [...result].sort((a, b) => Number(b.previousParticipant) - Number(a.previousParticipant));
    }
    return result;
  }, [submissions, query, statusFilter, previousFilter, sortPreviousFirst]);

  async function updateStatus(id: string, status: Submission["status"]) {
    await fetch(`/api/admin/running-forms/${formId}/submissions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function deleteSubmission(id: string) {
    await fetch(`/api/admin/running-forms/${formId}/submissions/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          placeholder="이름 / 연락처 / 인스타 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Submission["status"] | "ALL")}
          className="border border-line-strong bg-base px-2 py-2 text-xs outline-none"
        >
          <option value="ALL">전체 상태</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select
          value={previousFilter}
          onChange={(e) => setPreviousFilter(e.target.value as "ALL" | "PREVIOUS" | "NEW")}
          className="border border-line-strong bg-base px-2 py-2 text-xs outline-none"
        >
          <option value="ALL">전체 참여 이력</option>
          <option value="PREVIOUS">재참여자만</option>
          <option value="NEW">신규만</option>
        </select>
        <button
          type="button"
          onClick={() => setSortPreviousFirst((prev) => !prev)}
          className={`cursor-pointer border px-3 py-2 text-xs uppercase ${
            sortPreviousFirst
              ? "border-ink bg-ink text-[color:var(--color-base)]"
              : "border-line-strong text-ink-muted hover:border-ink hover:text-ink"
          }`}
        >
          재참여자 먼저
        </button>
        <a
          href={`/api/admin/running-forms/${formId}/submissions?export=csv`}
          className="cursor-pointer border border-line-strong px-3 py-2 text-xs uppercase hover:border-ink hover:text-ink"
        >
          Export CSV
        </a>
        <span className="text-xs text-ink-faint">
          {filtered.length} / {submissions.length}건
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="border border-line px-4 py-6 text-sm text-ink-faint">신청자가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((s) => (
            <div key={s.id} className="flex flex-col gap-2 border border-line p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {s.name} {s.gender ? `· ${s.gender}` : ""}
                    {s.previousParticipant && (
                      <span className="ml-2 border border-accent px-1.5 py-0.5 text-[10px] font-bold text-accent uppercase">
                        재참여
                      </span>
                    )}
                    {s.personalDataPurgedAt && (
                      <span className="ml-2 text-[10px] font-normal text-ink-faint uppercase">
                        개인정보 파기됨 ({new Date(s.personalDataPurgedAt).toLocaleDateString()})
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {s.phone}
                    {s.email ? ` · ${s.email}` : ""}
                    {s.instagramId ? ` · @${s.instagramId.replace(/^@/, "")}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-faint">{new Date(s.createdAt).toLocaleString()}</span>
                  <select
                    value={s.status}
                    onChange={(e) => updateStatus(s.id, e.target.value as Submission["status"])}
                    className="border border-line-strong bg-base px-2 py-1.5 text-xs outline-none"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {STATUS_LABEL[st]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => deleteSubmission(s.id)}
                    className="cursor-pointer text-xs text-ink-faint hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {fields.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                  {fields.map((f) => {
                    const v = s.answers[f.id];
                    if (v == null || (Array.isArray(v) && v.length === 0) || v === "") return null;
                    return (
                      <span key={f.id}>
                        <span className="text-ink-faint">{f.label}:</span>{" "}
                        {Array.isArray(v) ? v.join(", ") : v}
                      </span>
                    );
                  })}
                </div>
              )}
              <span className="text-xs text-ink-faint">
                마케팅 수신 동의: {s.marketingConsent ? "Y" : "N"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
