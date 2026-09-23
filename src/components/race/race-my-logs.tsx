"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KIND_CAP, KIND_LABEL, KIND_UNIT } from "@/lib/race/constants";

const KINDS = ["RUN", "WOD", "SWIM", "GYM"] as const;
type Kind = (typeof KINDS)[number];

export type MyLogRow = {
  id: string;
  date: string;
  kind: Kind;
  value: number;
  convertedKm: number;
};

export function RaceMyLogs({ logs }: { logs: MyLogRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKind, setEditKind] = useState<Kind>("RUN");
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (logs.length === 0) return null;

  function startEdit(log: MyLogRow) {
    setEditingId(log.id);
    setEditKind(log.kind);
    setEditValue(String(log.value));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function saveEdit(id: string) {
    const value = parseFloat(editValue);
    if (!(value > 0)) {
      setError("기록을 입력해주세요.");
      return;
    }
    if (value > KIND_CAP[editKind]) {
      setError(`한 번에 ${KIND_CAP[editKind]}${KIND_UNIT[editKind]}까지 올릴 수 있어요.`);
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/race/logs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: editKind, value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "수정에 실패했어요.");
        return;
      }
      setEditingId(null);
      router.refresh();
    } catch {
      setError("문제가 발생했어요.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("이 기록을 삭제할까요? 되돌릴 수 없어요.")) return;
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/race/logs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "삭제에 실패했어요.");
        return;
      }
      router.refresh();
    } catch {
      setError("문제가 발생했어요.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-bold text-[#a3a29a]">내 최근 기록</h3>
      {error && <p className="text-sm text-[#f08068]">{error}</p>}
      <div className="flex flex-col gap-1.5">
        {logs.map((log) => {
          const editing = editingId === log.id;
          const busy = busyId === log.id;
          return (
            <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#3c3d43] px-3 py-2 text-sm">
              {editing ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#6f6f6a]">{log.date}</span>
                  <div className="flex gap-1">
                    {KINDS.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setEditKind(k)}
                        className={`cursor-pointer rounded border px-2 py-1 text-xs ${
                          editKind === k ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21] font-medium" : "border-[#3c3d43] text-[#a3a29a]"
                        }`}
                      >
                        {KIND_LABEL[k]}
                      </button>
                    ))}
                  </div>
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    className="w-20 rounded border border-[#3c3d43] bg-[#17181b] px-2 py-1 text-sm text-[#f1f1ee] outline-none"
                  />
                  <span className="text-xs text-[#a3a29a]">{KIND_UNIT[editKind]}</span>
                  <button
                    type="button"
                    onClick={() => saveEdit(log.id)}
                    disabled={busy}
                    className="cursor-pointer rounded bg-[#f0b84a] px-2.5 py-1 text-xs font-bold text-[#2a1d05] disabled:opacity-40"
                  >
                    저장
                  </button>
                  <button type="button" onClick={cancelEdit} className="cursor-pointer text-xs text-[#6f6f6a] underline">
                    취소
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-[#a3a29a]">
                    <span className="text-xs text-[#6f6f6a]">{log.date}</span>{" "}
                    {KIND_LABEL[log.kind]} {log.value}
                    {KIND_UNIT[log.kind]}{" "}
                    <span className="text-xs text-[#6f6f6a]">(+{log.convertedKm.toFixed(1)}km)</span>
                  </span>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => startEdit(log)} disabled={busy} className="cursor-pointer text-xs text-[#a3a29a] underline disabled:opacity-40">
                      수정
                    </button>
                    <button type="button" onClick={() => remove(log.id)} disabled={busy} className="cursor-pointer text-xs text-[#f08068] underline disabled:opacity-40">
                      삭제
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
