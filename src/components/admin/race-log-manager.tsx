"use client";

import { useCallback, useEffect, useState } from "react";
import { KIND_LABEL, KIND_UNIT } from "@/lib/race/constants";

type LogRow = {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  kind: "RUN" | "WOD" | "SWIM" | "GYM";
  value: number;
  convertedKm: number;
  proofPath: string | null;
};

const KINDS = ["RUN", "WOD", "SWIM", "GYM"] as const;

export function RaceLogManager({
  seasons,
  members,
  initialSeasonId,
}: {
  seasons: { id: string; name: string }[];
  members: { id: string; name: string }[];
  initialSeasonId: string | null;
}) {
  const [seasonId, setSeasonId] = useState(initialSeasonId ?? seasons[0]?.id ?? "");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [addMemberId, setAddMemberId] = useState(members[0]?.id ?? "");
  const [addKind, setAddKind] = useState<(typeof KINDS)[number]>("RUN");
  const [addDate, setAddDate] = useState("");
  const [addValue, setAddValue] = useState("");
  const [adding, setAdding] = useState(false);

  const loadLogs = useCallback(async (sid: string) => {
    if (!sid) {
      setLogs([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/race/logs?seasonId=${sid}`);
      const data = await res.json();
      setLogs(res.ok ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 선택된 시즌의 기록(외부 시스템=서버)을 동기화하는 용도 — 파생 상태로 대체 불가.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLogs(seasonId);
  }, [seasonId, loadLogs]);

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!addMemberId || !(Number(addValue) > 0)) {
      setError("멤버와 기록 값을 입력해주세요.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/race/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonId,
          memberId: addMemberId,
          kind: addKind,
          value: Number(addValue),
          date: addDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "추가에 실패했어요.");
        return;
      }
      setAddValue("");
      loadLogs(seasonId);
    } finally {
      setAdding(false);
    }
  }

  async function updateLog(id: string, patch: { kind?: string; value?: number; date?: string }) {
    await fetch(`/api/admin/race/logs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    loadLogs(seasonId);
  }

  async function deleteLog(id: string) {
    if (!confirm("이 기록을 삭제할까요?")) return;
    await fetch(`/api/admin/race/logs/${id}`, { method: "DELETE" });
    loadLogs(seasonId);
  }

  const filtered = logs.filter((l) => l.memberName.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={seasonId}
          onChange={(e) => setSeasonId(e.target.value)}
          className="border border-line-strong bg-base px-2 py-2 text-sm outline-none"
        >
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          placeholder="멤버 이름 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
        />
        <span className="text-xs text-ink-faint">{filtered.length}건</span>
      </div>

      <form onSubmit={submitAdd} className="flex flex-wrap items-end gap-2 border border-line-strong p-4">
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          멤버
          <select value={addMemberId} onChange={(e) => setAddMemberId(e.target.value)} className="border border-line-strong bg-base px-2 py-2 text-sm outline-none">
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          종목
          <select value={addKind} onChange={(e) => setAddKind(e.target.value as (typeof KINDS)[number])} className="border border-line-strong bg-base px-2 py-2 text-sm outline-none">
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          값 ({KIND_UNIT[addKind]})
          <input
            type="number"
            step="0.1"
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            className="w-24 border border-line-strong bg-transparent px-2 py-2 text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          날짜 (비우면 오늘)
          <input
            type="date"
            value={addDate}
            onChange={(e) => setAddDate(e.target.value)}
            className="border border-line-strong bg-transparent px-2 py-2 text-sm text-ink outline-none"
          />
        </label>
        <button type="submit" disabled={adding} className="cursor-pointer bg-ink px-4 py-2 text-xs font-semibold text-[color:var(--color-base)] disabled:opacity-40">
          {adding ? "추가 중..." : "기록 추가"}
        </button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-ink-faint">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="border border-line px-4 py-6 text-sm text-ink-faint">기록이 없어요.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 border border-line px-4 py-2.5 text-sm">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold">{l.memberName}</span>
                <select
                  value={l.kind}
                  onChange={(e) => updateLog(l.id, { kind: e.target.value })}
                  className="border border-line-strong bg-base px-2 py-1 text-xs outline-none"
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.1"
                  defaultValue={l.value}
                  onBlur={(e) => {
                    const v = Number(e.target.value);
                    if (v > 0 && v !== l.value) updateLog(l.id, { value: v });
                  }}
                  className="w-20 border border-line-strong bg-transparent px-2 py-1 text-xs text-ink outline-none"
                />
                <span className="text-xs text-ink-faint">{KIND_UNIT[l.kind]}</span>
                <input
                  type="date"
                  defaultValue={l.date}
                  onBlur={(e) => {
                    if (e.target.value && e.target.value !== l.date) updateLog(l.id, { date: e.target.value });
                  }}
                  className="border border-line-strong bg-transparent px-2 py-1 text-xs text-ink outline-none"
                />
                <span className="text-xs text-ink-faint">환산 {l.convertedKm.toFixed(2)}km</span>
                {l.proofPath && <span className="text-xs text-ink-faint">📷</span>}
              </div>
              <button onClick={() => deleteLog(l.id)} className="cursor-pointer text-xs text-ink-faint hover:text-red-400">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
