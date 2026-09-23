"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type MemberSummary = {
  id: string;
  name: string;
  igHandle: string | null;
  excluded: boolean;
  failedLoginCount: number;
  lockedUntil: string | null;
  logCount: number;
};

export function RaceMemberManager({ members }: { members: MemberSummary[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = members.filter((m) => m.name.toLowerCase().includes(query.trim().toLowerCase()));

  async function toggleExcluded(id: string, excluded: boolean) {
    await fetch(`/api/admin/race/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ excluded: !excluded }),
    });
    router.refresh();
  }

  async function resetPin(id: string, name: string) {
    if (!confirm(`'${name}'의 PIN을 0000으로 초기화할까요?`)) return;
    await fetch(`/api/admin/race/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetPin: true }),
    });
    router.refresh();
  }

  async function deleteMember(id: string, name: string) {
    if (!confirm(`'${name}' 계정을 완전히 삭제할까요? 기록도 전부 사라지고 되돌릴 수 없어요.`)) return;
    await fetch(`/api/admin/race/members/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        placeholder="이름 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-xs border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
      />
      {filtered.length === 0 ? (
        <p className="border border-line px-4 py-6 text-sm text-ink-faint">멤버가 없어요.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((m) => {
            const locked = m.lockedUntil && new Date(m.lockedUntil) > new Date();
            return (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 border border-line p-4 text-sm">
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {m.name}
                    {m.excluded && (
                      <span className="ml-2 border border-line-strong px-1.5 py-0.5 text-[10px] font-bold text-ink-faint uppercase">
                        제외됨
                      </span>
                    )}
                    {locked && (
                      <span className="ml-2 border border-red-400 px-1.5 py-0.5 text-[10px] font-bold text-red-400 uppercase">
                        잠김
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-ink-faint">
                    {m.igHandle ? `@${m.igHandle} · ` : ""}
                    기록 {m.logCount}건 · 로그인 실패 {m.failedLoginCount}회
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => toggleExcluded(m.id, m.excluded)} className="cursor-pointer text-xs text-ink-muted hover:text-ink">
                    {m.excluded ? "제외 해제" : "리더보드에서 제외"}
                  </button>
                  <button onClick={() => resetPin(m.id, m.name)} className="cursor-pointer text-xs text-ink-muted hover:text-ink">
                    PIN 초기화
                  </button>
                  <button onClick={() => deleteMember(m.id, m.name)} className="cursor-pointer text-xs text-ink-faint hover:text-red-400">
                    삭제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
