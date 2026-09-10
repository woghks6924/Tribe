"use client";

import { useEffect, useState } from "react";
import type { WodRepsByGroup, WodRoundData, WodSegment, WodSessionData } from "@/lib/wod";

type GroupRepsInput = { group: string; reps: string };

type SegmentInput =
  | { type: "run"; distance: string }
  | { type: "exercise"; name: string; repsByGroup: GroupRepsInput[] };

type RoundInput = {
  roundName: string;
  segments: SegmentInput[];
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
  teamSize: number | null;
  createdAt: string;
  roundCount: number;
};

function emptyRound(): RoundInput {
  return {
    roundName: "",
    segments: [
      { type: "run", distance: "" },
      { type: "exercise", name: "", repsByGroup: [{ group: "", reps: "" }] },
    ],
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

function toMinSec(totalSec: number | null): { min: string; sec: string } {
  if (totalSec == null) return { min: "", sec: "" };
  return { min: String(Math.floor(totalSec / 60)), sec: String(totalSec % 60) };
}

function segmentToInput(seg: WodSegment): SegmentInput {
  if (seg.type === "run") return { type: "run", distance: seg.distance };
  const repsByGroup: WodRepsByGroup[] = seg.reps.length ? seg.reps : [{ group: "", reps: "" }];
  return { type: "exercise", name: seg.name, repsByGroup };
}

function roundToInput(r: WodRoundData): RoundInput {
  const cap = toMinSec(r.timeCapSec);
  const rest = toMinSec(r.restTimeSec);
  return {
    roundName: r.roundName ?? "",
    segments: r.segments.length ? r.segments.map(segmentToInput) : emptyRound().segments,
    timeCapMin: cap.min,
    timeCapSec: cap.sec,
    restMin: rest.min,
    restSec: rest.sec,
    bonusExercise: r.bonusExercise ?? "",
  };
}

export default function WodAdminPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [name, setName] = useState("");
  const [format, setFormat] = useState<"solo" | "team">("solo");
  const [teamSize, setTeamSize] = useState("");
  const [rounds, setRounds] = useState<RoundInput[]>([emptyRound()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  async function loadForEdit(id: string, mode: "edit" | "copy") {
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/wod/sessions/${id}`);
    if (!res.ok) {
      setError("Failed to load session.");
      return;
    }
    const data = (await res.json()) as WodSessionData;
    setName(mode === "copy" ? `${data.name} (사본)` : data.name);
    setFormat(data.teamSize != null ? "team" : "solo");
    setTeamSize(data.teamSize != null ? String(data.teamSize) : "");
    setRounds(data.rounds.length ? data.rounds.map(roundToInput) : [emptyRound()]);
    setEditingId(mode === "edit" ? data.id : null);
    document.getElementById("session-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setFormat("solo");
    setTeamSize("");
    setRounds([emptyRound()]);
    setError(null);
    setMessage(null);
  }

  function updateRound(index: number, patch: Partial<RoundInput>) {
    setRounds((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
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

  function addSegment(roundIndex: number, type: "run" | "exercise") {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIndex
          ? {
              ...r,
              segments: [
                ...r.segments,
                type === "run"
                  ? { type: "run", distance: "" }
                  : { type: "exercise", name: "", repsByGroup: [{ group: "", reps: "" }] },
              ],
            }
          : r,
      ),
    );
  }

  function removeSegment(roundIndex: number, segIndex: number) {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIndex ? { ...r, segments: r.segments.filter((_, j) => j !== segIndex) } : r,
      ),
    );
  }

  function moveSegment(roundIndex: number, segIndex: number, direction: -1 | 1) {
    setRounds((prev) =>
      prev.map((r, i) => {
        if (i !== roundIndex) return r;
        const target = segIndex + direction;
        if (target < 0 || target >= r.segments.length) return r;
        const segments = [...r.segments];
        [segments[segIndex], segments[target]] = [segments[target], segments[segIndex]];
        return { ...r, segments };
      }),
    );
  }

  function updateRunSegment(roundIndex: number, segIndex: number, distance: string) {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIndex
          ? {
              ...r,
              segments: r.segments.map((s, j) =>
                j === segIndex && s.type === "run" ? { ...s, distance } : s,
              ),
            }
          : r,
      ),
    );
  }

  function updateExerciseName(roundIndex: number, segIndex: number, name: string) {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIndex
          ? {
              ...r,
              segments: r.segments.map((s, j) =>
                j === segIndex && s.type === "exercise" ? { ...s, name } : s,
              ),
            }
          : r,
      ),
    );
  }

  function updateGroupRow(
    roundIndex: number,
    segIndex: number,
    groupIndex: number,
    patch: Partial<GroupRepsInput>,
  ) {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIndex
          ? {
              ...r,
              segments: r.segments.map((s, j) =>
                j === segIndex && s.type === "exercise"
                  ? {
                      ...s,
                      repsByGroup: s.repsByGroup.map((g, k) =>
                        k === groupIndex ? { ...g, ...patch } : g,
                      ),
                    }
                  : s,
              ),
            }
          : r,
      ),
    );
  }

  function addGroupRow(roundIndex: number, segIndex: number) {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIndex
          ? {
              ...r,
              segments: r.segments.map((s, j) =>
                j === segIndex && s.type === "exercise"
                  ? { ...s, repsByGroup: [...s.repsByGroup, { group: "", reps: "" }] }
                  : s,
              ),
            }
          : r,
      ),
    );
  }

  function removeGroupRow(roundIndex: number, segIndex: number, groupIndex: number) {
    setRounds((prev) =>
      prev.map((r, i) =>
        i === roundIndex
          ? {
              ...r,
              segments: r.segments.map((s, j) =>
                j === segIndex && s.type === "exercise"
                  ? { ...s, repsByGroup: s.repsByGroup.filter((_, k) => k !== groupIndex) }
                  : s,
              ),
            }
          : r,
      ),
    );
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
      const url = editingId ? `/api/wod/sessions/${editingId}` : "/api/wod/sessions";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          teamSize: format === "team" && teamSize ? Number(teamSize) : null,
          rounds: rounds.map((r, i) => ({
            roundNumber: i + 1,
            roundName: r.roundName || undefined,
            segments: r.segments
              .map((s): WodSegment | null => {
                if (s.type === "run") {
                  if (!s.distance) return null;
                  return { type: "run", distance: s.distance };
                }
                const reps = s.repsByGroup.filter((g) => g.group || g.reps);
                if (!s.name && reps.length === 0) return null;
                return { type: "exercise", name: s.name, reps };
              })
              .filter((s): s is WodSegment => s !== null),
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
      setMessage(editingId ? "Updated." : "Saved. Activate it below to show it on the display.");
      setName("");
      setFormat("solo");
      setTeamSize("");
      setRounds([emptyRound()]);
      setEditingId(null);
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
                    {s.teamSize != null ? `Team of ${s.teamSize}` : "Solo"} · {s.roundCount} rounds ·{" "}
                    {new Date(s.createdAt).toLocaleString()}
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
                    onClick={() => loadForEdit(s.id, "edit")}
                    className="cursor-pointer text-xs text-ink-muted hover:text-ink"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => loadForEdit(s.id, "copy")}
                    className="cursor-pointer text-xs text-ink-muted hover:text-ink"
                  >
                    Copy
                  </button>
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

      <form id="session-form" onSubmit={handleSave} className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xs tracking-[0.08em] text-ink-muted uppercase">
            {editingId ? "Edit Session" : "New Session"}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="cursor-pointer text-xs text-ink-faint hover:text-ink"
            >
              Cancel edit
            </button>
          )}
        </div>
        <input
          required
          placeholder="Session name (e.g. 2026-08-19 Morning WOD)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
        />

        <div className="flex items-center gap-4">
          <div className="flex border border-line-strong">
            <button
              type="button"
              onClick={() => setFormat("solo")}
              className={`cursor-pointer px-4 py-2 text-xs uppercase tracking-[0.08em] ${
                format === "solo" ? "bg-ink text-base" : "text-ink-muted hover:text-ink"
              }`}
            >
              Solo
            </button>
            <button
              type="button"
              onClick={() => setFormat("team")}
              className={`cursor-pointer border-l border-line-strong px-4 py-2 text-xs uppercase tracking-[0.08em] ${
                format === "team" ? "bg-ink text-base" : "text-ink-muted hover:text-ink"
              }`}
            >
              Team
            </button>
          </div>
          {format === "team" && (
            <input
              type="number"
              min="2"
              placeholder="Team size (e.g. 2)"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className="w-40 border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
            />
          )}
        </div>

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

              <input
                placeholder="Round name (e.g. R1)"
                value={round.roundName}
                onChange={(e) => updateRound(i, { roundName: e.target.value })}
                className="border border-line-strong bg-transparent px-4 py-3 text-sm outline-none placeholder:text-ink-faint"
              />

              <div className="flex flex-col gap-3">
                <span className="text-xs text-ink-faint">
                  Segments (run + exercise, in order — repeat as many times as needed)
                </span>
                {round.segments.map((seg, j) =>
                  seg.type === "run" ? (
                    <div key={j} className="flex items-center gap-2 border border-line-strong p-3">
                      <span className="shrink-0 text-xs tracking-[0.08em] text-ink-faint uppercase">
                        Run
                      </span>
                      <input
                        placeholder="Distance (e.g. 500m x 2)"
                        value={seg.distance}
                        onChange={(e) => updateRunSegment(i, j, e.target.value)}
                        className="flex-1 border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
                      />
                      <SegmentMoveRemove
                        onUp={() => moveSegment(i, j, -1)}
                        onDown={() => moveSegment(i, j, 1)}
                        onRemove={() => removeSegment(i, j)}
                        upDisabled={j === 0}
                        downDisabled={j === round.segments.length - 1}
                      />
                    </div>
                  ) : (
                    <div key={j} className="flex flex-col gap-2 border border-line-strong p-3">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-xs tracking-[0.08em] text-ink-faint uppercase">
                          Exercise
                        </span>
                        <input
                          placeholder="Exercise name (e.g. 스쿼트)"
                          value={seg.name}
                          onChange={(e) => updateExerciseName(i, j, e.target.value)}
                          className="flex-1 border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
                        />
                        <SegmentMoveRemove
                          onUp={() => moveSegment(i, j, -1)}
                          onDown={() => moveSegment(i, j, 1)}
                          onRemove={() => removeSegment(i, j)}
                          upDisabled={j === 0}
                          downDisabled={j === round.segments.length - 1}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 pl-4">
                        <span className="text-[11px] text-ink-faint">
                          Reps — leave group blank if everyone does the same count, or add a row
                          per group (A/B/C...) for different counts
                        </span>
                        {seg.repsByGroup.map((g, k) => (
                          <div key={k} className="flex gap-2">
                            <input
                              placeholder="Group (optional, e.g. A)"
                              value={g.group}
                              onChange={(e) =>
                                updateGroupRow(i, j, k, { group: e.target.value })
                              }
                              className="w-32 border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
                            />
                            <input
                              placeholder="Reps (e.g. 60개)"
                              value={g.reps}
                              onChange={(e) => updateGroupRow(i, j, k, { reps: e.target.value })}
                              className="flex-1 border border-line-strong bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-faint"
                            />
                            <button
                              type="button"
                              onClick={() => removeGroupRow(i, j, k)}
                              disabled={seg.repsByGroup.length === 1}
                              className="cursor-pointer px-2 text-ink-faint hover:text-red-400 disabled:opacity-30"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addGroupRow(i, j)}
                          className="w-fit cursor-pointer border border-line-strong px-2.5 py-1 text-[11px] text-ink-muted hover:border-ink hover:text-ink"
                        >
                          + Add Group
                        </button>
                      </div>
                    </div>
                  ),
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addSegment(i, "run")}
                    className="cursor-pointer border border-line-strong px-3 py-1.5 text-xs text-ink-muted hover:border-ink hover:text-ink"
                  >
                    + Add Run
                  </button>
                  <button
                    type="button"
                    onClick={() => addSegment(i, "exercise")}
                    className="cursor-pointer border border-line-strong px-3 py-1.5 text-xs text-ink-muted hover:border-ink hover:text-ink"
                  >
                    + Add Exercise
                  </button>
                </div>
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
          {saving ? "Saving..." : editingId ? "Update Session" : "Save Session"}
        </button>
      </form>
    </div>
  );
}

function SegmentMoveRemove({
  onUp,
  onDown,
  onRemove,
  upDisabled,
  downDisabled,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  upDisabled: boolean;
  downDisabled: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onUp}
        disabled={upDisabled}
        className="cursor-pointer px-1 text-ink-faint hover:text-ink disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={downDisabled}
        className="cursor-pointer px-1 text-ink-faint hover:text-ink disabled:opacity-30"
      >
        ↓
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="cursor-pointer px-1.5 text-xs text-ink-faint hover:text-red-400"
      >
        ×
      </button>
    </div>
  );
}
