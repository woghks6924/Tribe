"use client";

import { useEffect, useState } from "react";

type ExerciseInput = { name: string; reps: string };

type RoundInput = {
  roundName: string;
  runDistance: string;
  exercises: ExerciseInput[];
  timeCapMin: string;
  timeCapSec: string;
  restMin: string;
  restSec: string;
  bonusExercise: string;
};

type SessionSummary = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  roundCount: number;
};

function emptyRound(): RoundInput {
  return {
    roundName: "",
    runDistance: "",
    exercises: [{ name: "", reps: "" }],
    timeCapMin: "",
    timeCapSec: "",
    restMin: "",
    restSec: "",
    bonusExercise: "",
  };
}

function toSeconds(min: string, sec: string): number | null {
  const m = Number(min) || 0;
  const s = Number(sec) || 0;
  if (!min && !sec) return null;
  return m * 60 + s;
}

export default function WodAdminPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [name, setName] = useState("");
  const [rounds, setRounds] = useState<RoundInput[]>([emptyRound()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadSessions() {
    setLoadingSessions(true);
    const res = await fetch("/api/wod/sessions");
    const data = await res.json();
    setSessions(data);
    setLoadingSessions(false);
  }

  useEffect(() => {
    // 마운트 시 세션 목록(외부 시스템)을 동기화하는 용도 — 파생 상태로 대체 불가.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessions();
  }, []);

  function updateRound(index: number, patch: Partial<RoundInput>) {
    setRounds((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function updateExercise(roundIndex: number, exIndex: number, patch: Partial<ExerciseInput>) {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIndex
          ? { ...r, exercises: r.exercises.map((e, j) => (j === exIndex ? { ...e, ...patch } : e)) }
          : r,
      ),
    );
  }

  function addExercise(roundIndex: number) {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIndex ? { ...r, exercises: [...r.exercises, { name: "", reps: "" }] } : r,
      ),
    );
  }

  function removeExercise(roundIndex: number, exIndex: number) {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIndex ? { ...r, exercises: r.exercises.filter((_, j) => j !== exIndex) } : r,
      ),
    );
  }

  function addRound() {
    setRounds((prev) => [...prev, emptyRound()]);
  }

  function removeRound(index: number) {
    setRounds((prev) => prev.filter((_, i) => i !== index));
  }

  function moveRound(index: number, direction: -1 | 1) {
    setRounds((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!name.trim()) {
      setError("Please name today's session.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/wod/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rounds: rounds.map((r, i) => ({
            roundNumber: i + 1,
            roundName: r.roundName || undefined,
            runDistance: r.runDistance || undefined,
            exercises: r.exercises.filter((e) => e.name || e.reps),
            timeCapSec: toSeconds(r.timeCapMin, r.timeCapSec),
            restTimeSec: toSeconds(r.restMin, r.restSec),
            bonusExercise: r.bonusExercise || undefined,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save session.");
        return;
      }
      setMessage("Saved. Activate it below to show it on the display.");
      setName("");
      setRounds([emptyRound()]);
      loadSessions();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function activate(id: string) {
    await fetch(`/api/wod/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    loadSessions();
  }

  async function deactivate(id: string) {
    await fetch(`/api/wod/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });
    loadSessions();
  }

  async function deleteSession(id: string) {
    await fetch(`/api/wod/sessions/${id}`, { method: "DELETE" });
    loadSessions();
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-16">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-[0.02em] uppercase">WOD Admin</h1>
        <p className="text-sm text-ink-muted">
          Build today&apos;s session, save it, then activate it — only one session shows on{" "}
          <code className="text-ink">/wod-display</code> at a time.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-xs tracking-[0.08em] text-ink-muted uppercase">Sessions</h2>
        {loadingSessions ? (
          <p className="text-sm text-ink-faint">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="border border-line px-4 py-6 text-sm text-ink-faint">No sessions yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-line px-4 py-3 text-sm"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-xs text-ink-faint">
                    {s.roundCount} rounds · {new Date(s.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {s.isActive ? (
                    <>
                      <span className="text-xs tracking-[0.08em] text-accent uppercase">Active</span>
                      <button
                        onClick={() => deactivate(s.id)}
                        className="cursor-pointer text-xs text-ink-muted hover:text-ink"
                      >
                        Deactivate
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => activate(s.id)}
                      className="cursor-pointer border border-line-strong px-3 py-1.5 text-xs uppercase hover:border-ink hover:text-ink"
                    >
                      Activate
                    </button>
                  )}
                  <button
                    onClick={() => deleteSession(s.id)}
                    className="cursor-pointer text-xs text-ink-faint hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <form onSubmit={handleSave} className="flex flex-col gap-8">
        <h2 className="text-xs tracking-[0.08em] text-ink-muted uppercase">New Session</h2>
        <input
          required
          placeholder="Session name (e.g. 2026-08-19 Morning WOD)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />

        <div className="flex flex-col gap-6">
          {rounds.map((round, i) => (
            <div key={i} className="flex flex-col gap-4 border border-line p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">
                  Round {i + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveRound(i, -1)}
                    disabled={i === 0}
                    className="cursor-pointer px-1.5 text-ink-faint hover:text-ink disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveRound(i, 1)}
                    disabled={i === rounds.length - 1}
                    className="cursor-pointer px-1.5 text-ink-faint hover:text-ink disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRound(i)}
                    disabled={rounds.length === 1}
                    className="cursor-pointer px-2 text-xs text-ink-faint hover:text-red-400 disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Round name (e.g. R1)"
                  value={round.roundName}
                  onChange={(e) => updateRound(i, { roundName: e.target.value })}
                  className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
                />
                <input
                  placeholder="Run distance (e.g. 500m × 2)"
                  value={round.runDistance}
                  onChange={(e) => updateRound(i, { runDistance: e.target.value })}
                  className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs text-ink-faint">Exercises</span>
                {round.exercises.map((ex, j) => (
                  <div key={j} className="flex gap-2">
                    <input
                      placeholder="Exercise (e.g. 스쿼트)"
                      value={ex.name}
                      onChange={(e) => updateExercise(i, j, { name: e.target.value })}
                      className="flex-1 border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
                    />
                    <input
                      placeholder="Reps (e.g. 60개 A/B 30+30)"
                      value={ex.reps}
                      onChange={(e) => updateExercise(i, j, { reps: e.target.value })}
                      className="flex-1 border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
                    />
                    <button
                      type="button"
                      onClick={() => removeExercise(i, j)}
                      disabled={round.exercises.length === 1}
                      className="cursor-pointer px-2 text-ink-faint hover:text-red-400 disabled:opacity-30"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addExercise(i)}
                  className="w-fit cursor-pointer border border-line-strong px-3 py-1.5 text-xs text-ink-muted hover:border-ink hover:text-ink"
                >
                  + Add Exercise
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-ink-faint">Time cap (min : sec)</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="min"
                      value={round.timeCapMin}
                      onChange={(e) => updateRound(i, { timeCapMin: e.target.value })}
                      className="w-full border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="sec"
                      value={round.timeCapSec}
                      onChange={(e) => updateRound(i, { timeCapSec: e.target.value })}
                      className="w-full border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-ink-faint">Rest (min : sec)</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="min"
                      value={round.restMin}
                      onChange={(e) => updateRound(i, { restMin: e.target.value })}
                      className="w-full border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="sec"
                      value={round.restSec}
                      onChange={(e) => updateRound(i, { restSec: e.target.value })}
                      className="w-full border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
                    />
                  </div>
                </div>
              </div>

              <input
                placeholder="Bonus exercise (optional, e.g. 보너스 스쿼트 AMRAP)"
                value={round.bonusExercise}
                onChange={(e) => updateRound(i, { bonusExercise: e.target.value })}
                className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRound}
          className="w-fit cursor-pointer border border-line-strong px-4 py-2 text-xs uppercase text-ink-muted hover:border-ink hover:text-ink"
        >
          + Add Round
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {message && <p className="text-xs text-accent">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-fit cursor-pointer bg-ink px-6 py-3 text-xs font-semibold tracking-[0.08em] text-base uppercase hover:bg-ink/85 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save Session"}
        </button>
      </form>
    </div>
  );
}
