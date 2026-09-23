"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type SeasonSummary = {
  id: string;
  name: string;
  startAt: string;
  durationDays: number;
  goalKm: number;
  inviteCode: string;
  active: boolean;
  headline: string | null;
  runFactor: number;
  wodMinutesPerKm: number;
  swimMetersPerKm: number;
  logCount: number;
};

function toLocalDateInputValue(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

type FormState = {
  name: string;
  startAt: string;
  durationDays: string;
  goalKm: string;
  inviteCode: string;
  headline: string;
  runFactor: string;
  wodMinutesPerKm: string;
  swimMetersPerKm: string;
};

function emptyForm(): FormState {
  return {
    name: "",
    startAt: "",
    durationDays: "50",
    goalKm: "425",
    inviteCode: "",
    headline: "",
    runFactor: "1",
    wodMinutesPerKm: "6",
    swimMetersPerKm: "250",
  };
}
function seasonToForm(s: SeasonSummary): FormState {
  return {
    name: s.name,
    startAt: toLocalDateInputValue(s.startAt),
    durationDays: String(s.durationDays),
    goalKm: String(s.goalKm),
    inviteCode: s.inviteCode,
    headline: s.headline ?? "",
    runFactor: String(s.runFactor),
    wodMinutesPerKm: String(s.wodMinutesPerKm),
    swimMetersPerKm: String(s.swimMetersPerKm),
  };
}

export function RaceSeasonManager({ seasons }: { seasons: SeasonSummary[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function payloadOf(f: FormState, active?: boolean) {
    return {
      name: f.name.trim(),
      startAt: new Date(f.startAt).toISOString(),
      durationDays: Number(f.durationDays),
      goalKm: Number(f.goalKm),
      inviteCode: f.inviteCode.trim(),
      headline: f.headline.trim() || null,
      runFactor: Number(f.runFactor),
      wodMinutesPerKm: Number(f.wodMinutesPerKm),
      swimMetersPerKm: Number(f.swimMetersPerKm),
      active,
    };
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!createForm.name.trim() || !createForm.startAt || !createForm.inviteCode.trim()) {
      setError("이름, 시작일, 초대코드를 입력해주세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/race/seasons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadOf(createForm, false)),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했어요.");
        return;
      }
      setCreating(false);
      setCreateForm(emptyForm());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function submitEdit(e: React.FormEvent, id: string, active: boolean) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/race/seasons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadOf(editForm, active)),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했어요.");
        return;
      }
      setEditingId(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function setActive(id: string, form: FormState) {
    await fetch(`/api/admin/race/seasons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadOf(form, true)),
    });
    router.refresh();
  }

  async function resetSeason(id: string, name: string) {
    if (!confirm(`'${name}' 시즌의 모든 기록을 삭제하고 초기화할까요? 되돌릴 수 없어요.`)) return;
    await fetch(`/api/admin/race/seasons/${id}/reset`, { method: "POST" });
    router.refresh();
  }

  async function deleteSeason(id: string, name: string) {
    if (!confirm(`'${name}' 시즌을 완전히 삭제할까요? 기록도 전부 사라져요.`)) return;
    await fetch(`/api/admin/race/seasons/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col gap-2">
        {seasons.map((s) => (
          <div key={s.id} className="flex flex-col gap-2 border border-line p-4 text-sm">
            {editingId === s.id ? (
              <form onSubmit={(e) => submitEdit(e, s.id, s.active)} className="flex flex-col gap-2">
                <SeasonFields form={editForm} setForm={setEditForm} />
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="cursor-pointer bg-ink px-3 py-1.5 text-xs font-semibold text-[color:var(--color-base)] disabled:opacity-40">
                    저장
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="cursor-pointer text-xs text-ink-faint">
                    취소
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {s.name} {s.active && <span className="ml-1 text-accent">● 활성</span>}
                    </span>
                    <span className="text-xs text-ink-faint">
                      {toLocalDateInputValue(s.startAt)} 시작 · {s.durationDays}일 · 목표 {s.goalKm}km · 초대코드{" "}
                      {s.inviteCode} · 기록 {s.logCount}건
                    </span>
                    <span className="text-xs text-ink-faint">
                      환산: 러닝×{s.runFactor} · WOD·헬스 {s.wodMinutesPerKm}분=1km · 수영 {s.swimMetersPerKm}m=1km
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {!s.active && (
                      <button
                        onClick={() => setActive(s.id, seasonToForm(s))}
                        className="cursor-pointer text-xs text-ink-muted hover:text-ink"
                      >
                        활성화
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingId(s.id);
                        setEditForm(seasonToForm(s));
                      }}
                      className="cursor-pointer text-xs text-ink-muted hover:text-ink"
                    >
                      수정
                    </button>
                    <button onClick={() => resetSeason(s.id, s.name)} className="cursor-pointer text-xs text-ink-faint hover:text-red-400">
                      시즌 초기화
                    </button>
                    <button onClick={() => deleteSeason(s.id, s.name)} className="cursor-pointer text-xs text-ink-faint hover:text-red-400">
                      삭제
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {seasons.length === 0 && <p className="border border-line px-4 py-6 text-sm text-ink-faint">아직 시즌이 없어요.</p>}
      </div>

      {creating ? (
        <form onSubmit={submitCreate} className="flex flex-col gap-3 border border-line-strong p-4">
          <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">새 시즌 만들기</span>
          <SeasonFields form={createForm} setForm={setCreateForm} />
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="w-fit cursor-pointer bg-ink px-4 py-2 text-xs font-semibold text-[color:var(--color-base)] disabled:opacity-40">
              {saving ? "만드는 중..." : "만들기"}
            </button>
            <button type="button" onClick={() => setCreating(false)} className="cursor-pointer text-xs text-ink-faint">
              취소
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="w-fit cursor-pointer border border-line-strong px-4 py-2 text-xs uppercase text-ink-muted hover:border-ink hover:text-ink"
        >
          + 새 시즌 만들기
        </button>
      )}
    </div>
  );
}

function SeasonFields({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          이름
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          시작일
          <input
            type="date"
            value={form.startAt}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
          />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          기간(일)
          <input
            type="number"
            value={form.durationDays}
            onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
            className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          목표 km
          <input
            type="number"
            value={form.goalKm}
            onChange={(e) => setForm({ ...form, goalKm: e.target.value })}
            className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          초대코드
          <input
            value={form.inviteCode}
            onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
            className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-xs text-ink-faint">
        제목 문구 (선택 — 비우면 기본 문구 &ldquo;서울에서 부산 {'{'}목표km{'}'}까지, {'{'}기간{'}'}일 동안...&rdquo;)
        <textarea
          value={form.headline}
          onChange={(e) => setForm({ ...form, headline: e.target.value })}
          rows={2}
          placeholder={"서울에서 부산 425km까지,\n50일 동안 누가 가장 멀리 갈까"}
          className="resize-y border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint"
        />
      </label>
      <div className="grid grid-cols-3 gap-3">
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          러닝 환산 배율
          <input
            type="number"
            step="0.1"
            value={form.runFactor}
            onChange={(e) => setForm({ ...form, runFactor: e.target.value })}
            className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          WOD·헬스 몇 분=1km
          <input
            type="number"
            step="0.5"
            value={form.wodMinutesPerKm}
            onChange={(e) => setForm({ ...form, wodMinutesPerKm: e.target.value })}
            className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-faint">
          수영 몇 m=1km
          <input
            type="number"
            step="10"
            value={form.swimMetersPerKm}
            onChange={(e) => setForm({ ...form, swimMetersPerKm: e.target.value })}
            className="border border-line-strong bg-transparent px-3 py-2 text-sm text-ink outline-none"
          />
        </label>
      </div>
    </>
  );
}
