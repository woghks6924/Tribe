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

function roundPreview(round: WodSessionData["rounds"][number]): string {
  const runs = round.segments.filter((s) => s.type === "run");
  return runs.map((s) => s.distance).join(", ");
}

// 세그먼트(런닝+운동) 개수가 많아질수록 화면에 다 들어가도록 글자 크기를 단계적으로 줄인다.
function exerciseSizes(exerciseCount: number) {
  if (exerciseCount <= 1) return { name: 88, reps: 76 };
  if (exerciseCount === 2) return { name: 68, reps: 60 };
  return { name: 48, reps: 42 };
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
  const sizes = exerciseSizes(exerciseSegments.length);

  return (
    <div className="fixed inset-0 flex flex-col items-center overflow-hidden bg-black px-6 py-10 text-center text-white select-none">
      {logo}
      {phase === "idle" && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-10">
          <span className="text-4xl font-bold tracking-wide">{session.name}</span>
          <div className="flex flex-col gap-4">
            {session.rounds.map((r, i) => (
              <div key={r.id} className="text-2xl text-gray-300">
                {r.roundName || `R${i + 1}`}
                {roundPreview(r) ? ` — ${roundPreview(r)}` : ""}
              </div>
            ))}
          </div>
          <button
            onClick={handleStart}
            className="cursor-pointer rounded bg-[#c8b89a] px-16 py-8 text-4xl font-bold text-black"
          >
            시작
          </button>
        </div>
      )}

      {phase === "exercise" && round && timer && (
        <div className="flex h-full w-full flex-col items-center justify-between overflow-y-auto py-6">
          <span className="text-[120px] leading-none font-bold text-[#c8b89a]">
            {round.roundName || `R${timer.roundIndex + 1}`}
          </span>

          <div className="flex flex-col items-center gap-5">
            {round.segments.map((seg, i) =>
              seg.type === "run" ? (
                <span key={i} className="text-[48px] text-gray-400">
                  {seg.distance}
                </span>
              ) : (
                <div key={i} className="flex flex-col items-center gap-1.5">
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
            <span className="text-[28px] font-bold text-[#22c55e]">{round.bonusExercise}</span>
          )}

          <span className="text-[140px] leading-none font-bold text-[#ef4444]">
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
