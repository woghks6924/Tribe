"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { WodSessionData } from "@/lib/wod";

type Phase = "idle" | "exercise" | "rest" | "complete";

type TimerState = {
  sessionId: string;
  roundIndex: number;
  phase: Phase;
  phaseEndAt: number | null; // epoch ms
  startedAt: number | null;
};

const STORAGE_KEY = "wod-display-state";

function formatTime(totalSec: number) {
  const s = Math.max(0, Math.ceil(totalSec));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function formatElapsed(ms: number) {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function advanceToNextRound(prev: TimerState, session: WodSessionData): TimerState {
  const nextIndex = prev.roundIndex + 1;
  const nextRound = session.rounds[nextIndex];
  if (!nextRound) {
    return { ...prev, phase: "complete", phaseEndAt: null };
  }
  return {
    ...prev,
    roundIndex: nextIndex,
    phase: "exercise",
    phaseEndAt: Date.now() + (nextRound.timeCapSec ?? 0) * 1000,
  };
}

function formatReps(reps: { group: string; reps: string }[]): string {
  if (reps.length <= 1) return reps[0]?.reps ?? "";
  return reps.map((g) => (g.group ? `${g.group} ${g.reps}` : g.reps)).join("   ");
}

// 세그먼트(런닝+운동) 개수가 많아질수록 태블릿 화면에 스크롤 없이 다 들어가도록
// 운동 이름/횟수뿐 아니라 라운드명·타이머·간격까지 함께 단계적으로 줄인다.
function phaseSizes(exerciseCount: number) {
  if (exerciseCount <= 1) {
    return { roundName: 120, timer: 140, name: 80, reps: 68, run: 44, bonus: 28, gap: 20, innerGap: 6 };
  }
  if (exerciseCount === 2) {
    return { roundName: 100, timer: 120, name: 56, reps: 48, run: 36, bonus: 24, gap: 12, innerGap: 4 };
  }
  return { roundName: 80, timer: 100, name: 38, reps: 32, run: 28, bonus: 20, gap: 8, innerGap: 3 };
}

export default function WodDisplayPage() {
  const [session, setSession] = useState<WodSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/wod/active");
      const data = (await res.json()) as { session: WodSessionData | null };
      setSession(data.session);
      setLoading(false);

      if (data.session) {
        let resumed = false;
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const saved = JSON.parse(raw) as TimerState;
            if (saved.sessionId === data.session.id && saved.phase !== "idle") {
              setTimer(saved);
              resumed = true;
            }
          }
        } catch {
          // localStorage 접근 불가 시 그냥 처음부터 시작
        }
        if (!resumed) {
          setTimer({
            sessionId: data.session.id,
            roundIndex: 0,
            phase: "idle",
            phaseEndAt: null,
            startedAt: null,
          });
        }
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!timer) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
    } catch {
      // 저장 실패해도 화면 동작에는 지장 없음
    }
  }, [timer]);

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(Date.now()), 250);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const advance = useCallback(
    (fromPhase: Phase) => {
      setTimer((prev) => {
        if (!prev || !session) return prev;
        if (fromPhase === "exercise") {
          const round = session.rounds[prev.roundIndex];
          if (round?.restTimeSec) {
            return { ...prev, phase: "rest", phaseEndAt: Date.now() + round.restTimeSec * 1000 };
          }
          return advanceToNextRound(prev, session);
        }
        if (fromPhase === "rest") {
          return advanceToNextRound(prev, session);
        }
        return prev;
      });
    },
    [session],
  );

  useEffect(() => {
    // 벽시계 시간(외부 시스템)이 타임캡을 지났는지 매 tick마다 확인해 전환하는
    // 용도 — 파생 상태로 대체 불가.
    if (!timer || !session) return;
    if ((timer.phase === "exercise" || timer.phase === "rest") && timer.phaseEndAt != null) {
      if (now >= timer.phaseEndAt) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        advance(timer.phase);
      }
    }
  }, [now, timer, session, advance]);

  function handleStart() {
    if (!session) return;
    const first = session.rounds[0];
    setTimer({
      sessionId: session.id,
      roundIndex: 0,
      phase: "exercise",
      phaseEndAt: Date.now() + (first?.timeCapSec ?? 0) * 1000,
      startedAt: Date.now(),
    });
  }

  function handleNextRound() {
    if (!timer) return;
    advance(timer.phase);
  }

  function handleReset() {
    if (!session) return;
    setTimer({
      sessionId: session.id,
      roundIndex: 0,
      phase: "idle",
      phaseEndAt: null,
      startedAt: null,
    });
  }

  const logo = (
    <div className="pointer-events-none absolute top-6 left-6 z-10">
      <Image src="/logo/tribe-logo-white.png" alt="Tri.be" width={473} height={100} className="h-6 w-auto opacity-80" />
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black text-xl text-white">
        {logo}
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-black text-center text-white">
        {logo}
        <span className="text-3xl font-bold">No active WOD session</span>
        <span className="text-lg text-gray-400">Activate one from /wod-admin</span>
      </div>
    );
  }

  const round = session.rounds[timer?.roundIndex ?? 0];
  const phase = timer?.phase ?? "idle";
  const exerciseSegments = round?.segments.filter((s) => s.type === "exercise") ?? [];
  const sizes = phaseSizes(exerciseSegments.length);

  return (
    <div className="fixed inset-0 flex flex-col items-center overflow-hidden bg-black px-6 py-10 text-center text-white select-none">
      {logo}
      {phase === "idle" && (
        <div className="flex h-full w-full flex-col items-center gap-8 overflow-y-auto py-4">
          <span className="mt-2 text-4xl font-bold tracking-wide">{session.name}</span>

          <div className="grid w-full max-w-6xl grid-cols-1 gap-5 px-2 sm:grid-cols-2 lg:grid-cols-3">
            {session.rounds.map((r, i) => (
              <div
                key={r.id}
                className="flex flex-col gap-3 rounded-lg border border-white/15 bg-white/[0.03] px-6 py-5 text-left"
              >
                <span className="text-2xl font-bold text-[#c8b89a]">{r.roundName || `R${i + 1}`}</span>

                <div className="flex flex-col gap-1.5">
                  {r.segments.map((seg, k) =>
                    seg.type === "run" ? (
                      <span key={k} className="text-lg text-gray-400">
                        {seg.distance}
                      </span>
                    ) : (
                      <div key={k} className="flex items-baseline justify-between gap-4">
                        <span className="text-lg font-semibold text-white">{seg.name}</span>
                        <span className="text-lg font-semibold text-[#c8b89a]">
                          {formatReps(seg.reps)}
                        </span>
                      </div>
                    ),
                  )}
                </div>

                {(r.timeCapSec || r.restTimeSec) && (
                  <div className="flex gap-4 text-sm text-white/50">
                    {r.timeCapSec ? <span>Cap {formatTime(r.timeCapSec)}</span> : null}
                    {r.restTimeSec ? <span>Rest {formatTime(r.restTimeSec)}</span> : null}
                  </div>
                )}

                {r.bonusExercise && (
                  <span className="text-sm font-semibold text-[#22c55e]">{r.bonusExercise}</span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleStart}
            className="mb-2 cursor-pointer rounded bg-[#c8b89a] px-16 py-8 text-4xl font-bold text-black"
          >
            시작
          </button>
        </div>
      )}

      {phase === "exercise" && round && timer && (
        <div className="flex h-full w-full flex-col items-center justify-between overflow-y-auto py-6">
          <span
            className="leading-none font-bold text-[#c8b89a]"
            style={{ fontSize: sizes.roundName }}
          >
            {round.roundName || `R${timer.roundIndex + 1}`}
          </span>

          <div className="flex flex-col items-center" style={{ gap: sizes.gap }}>
            {round.segments.map((seg, i) =>
              seg.type === "run" ? (
                <span key={i} className="text-gray-400" style={{ fontSize: sizes.run }}>
                  {seg.distance}
                </span>
              ) : (
                <div key={i} className="flex flex-col items-center" style={{ gap: sizes.innerGap }}>
                  <span
                    className="leading-none font-bold text-white"
                    style={{ fontSize: sizes.name }}
                  >
                    {seg.name}
                  </span>
                  {seg.reps.length <= 1 ? (
                    <span
                      className="leading-none font-bold text-[#c8b89a]"
                      style={{ fontSize: sizes.reps }}
                    >
                      {seg.reps[0]?.reps ?? ""}
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-baseline justify-center gap-x-6 gap-y-1">
                      {seg.reps.map((g, k) => (
                        <span key={k} className="leading-none font-bold text-[#c8b89a]">
                          {g.group && (
                            <span
                              className="mr-1.5 text-white/70"
                              style={{ fontSize: sizes.reps * 0.55 }}
                            >
                              {g.group}
                            </span>
                          )}
                          <span style={{ fontSize: sizes.reps }}>{g.reps}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ),
            )}
          </div>

          {round.bonusExercise && (
            <span className="font-bold text-[#22c55e]" style={{ fontSize: sizes.bonus }}>
              {round.bonusExercise}
            </span>
          )}

          <span
            className="leading-none font-bold text-[#ef4444]"
            style={{ fontSize: sizes.timer }}
          >
            {formatTime(((timer.phaseEndAt ?? now) - now) / 1000)}
          </span>

          <button
            onClick={handleNextRound}
            className="cursor-pointer border border-white/30 px-8 py-4 text-lg uppercase text-white/80 hover:border-white hover:text-white"
          >
            다음 라운드
          </button>
        </div>
      )}

      {phase === "rest" && timer && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-10">
          <span className="text-[100px] leading-none font-bold text-[#3b82f6]">REST</span>
          <span className="text-[140px] leading-none font-bold text-[#3b82f6]">
            {formatTime(((timer.phaseEndAt ?? now) - now) / 1000)}
          </span>
          <button
            onClick={handleNextRound}
            className="cursor-pointer border border-white/30 px-8 py-4 text-lg uppercase text-white/80 hover:border-white hover:text-white"
          >
            다음 라운드
          </button>
        </div>
      )}

      {phase === "complete" && timer && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-6">
          <span className="text-6xl font-bold text-[#c8b89a]">WOD COMPLETE</span>
          {timer.startedAt != null && (
            <span className="text-3xl text-gray-300">
              Total time: {formatElapsed(now - timer.startedAt)}
            </span>
          )}
          <button
            onClick={handleReset}
            className="cursor-pointer border border-white/30 px-6 py-3 text-sm uppercase text-white/80 hover:border-white hover:text-white"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
