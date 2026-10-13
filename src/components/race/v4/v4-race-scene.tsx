"use client";

import { useCallback, useMemo } from "react";
import { characterFor, useRaceAssets } from "./assets";
import { CourseScene } from "./course-scene";
import type { V4Runner } from "./types";

// 레이스 메인 상단: 내 위치 구간(로그인 안 했으면 1등이 있는 구간) 배경에서 크루가 달리는 장면.
export function V4RaceScene({ runners, defaultSegKey }: { runners: V4Runner[]; defaultSegKey: string }) {
  const A = useRaceAssets();
  const looks = useMemo(() => new Map(runners.map((r) => [r.id, r.look])), [runners]);
  const members = useMemo(
    () =>
      runners.map((r) => ({
        id: r.id,
        name: r.name,
        km: r.km,
        type: r.type,
        todayLogged: r.todayLogged,
        dotColor: r.nameColor,
        isMe: r.isMe,
      })),
    [runners],
  );
  const getChar = useCallback((id: string) => characterFor(A!, looks.get(id)!), [A, looks]);

  if (!A) {
    return (
      <section className="flex aspect-[960/520] items-center justify-center rounded border border-[#3c3d43] bg-[#2a2b2e] text-sm text-[#6f6f6a]">
        코스 불러오는 중…
      </section>
    );
  }
  return (
    <CourseScene
      members={members}
      getChar={getChar}
      defaultSegKey={defaultSegKey}
      description="내가 있는 구간(로그인 전엔 1등이 있는 구간)이 먼저 열려요. 좌우 화살표·스와이프·아래 진행바로 구간을 옮겨 보세요. 오늘 기록이 있으면 달리고, 없으면 숨을 고르고 있어요."
    />
  );
}
