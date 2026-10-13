"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Character, Pet, loadRaceAssets, type RaceAssets, type V4Look } from "@/lib/race/v4/sprite";
import { LabCompare } from "./lab-compare";
import { LabCourse } from "./lab-course";
import type { LabMember, LevelRow, LookPatch } from "./lab-shared";
import { LabStory } from "./lab-story";
import { LabStudio } from "./lab-studio";
import { LabUnlock } from "./lab-unlock";

// v2: 장비가 부위별 items 배열이 되고 펫이 생겨서 저장 형식이 바뀌었다(v1 값은 읽지 않는다).
const STORAGE_KEY = "race-lab-looks-v2";

function mergeLook(base: V4Look, patch: LookPatch): V4Look {
  return { ...base, ...patch, colors: { ...base.colors, ...(patch.colors || {}) } };
}

export function RaceLab({ members, levelRows }: { members: LabMember[]; levelRows: LevelRow[] }) {
  const [A, setA] = useState<RaceAssets | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [looks, setLooks] = useState<Record<string, V4Look>>(() => Object.fromEntries(members.map((m) => [m.id, m.defaultLook])));
  const [selectedId, setSelectedId] = useState(members[0]?.id ?? "");
  const [showCompare, setShowCompare] = useState(true);
  const [allRun, setAllRun] = useState(false);
  const charsRef = useRef(new Map<string, Character>());
  const petsRef = useRef(new Map<string, Pet>());

  useEffect(() => {
    let alive = true;
    loadRaceAssets("/race-assets/", { pets: true })
      .then((a) => alive && setA(a))
      .catch(() => alive && setError("에셋을 불러오지 못했어요."));
    return () => {
      alive = false;
    };
  }, []);

  // 저장해 둔 외형(테스트용, 이 브라우저에만)을 불러온다.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, LookPatch>;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLooks((prev) => {
        const next = { ...prev };
        for (const m of members) if (saved[m.id]) next[m.id] = mergeLook(m.defaultLook, saved[m.id]);
        return next;
      });
    } catch {
      // 저장값이 깨져 있어도 기본값으로 계속 간다.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 외형이 바뀌면 이미 만들어 둔 Character들도 같이 갱신한다(프레임 캐시가 다시 구워짐).
  useEffect(() => {
    for (const [id, ch] of charsRef.current) if (looks[id]) ch.setLook(looks[id]);
  }, [looks]);

  const getChar = useCallback(
    (id: string) => {
      let c = charsRef.current.get(id);
      if (!c) {
        c = new Character(A!, looks[id]);
        charsRef.current.set(id, c);
      }
      return c;
    },
    [A, looks],
  );

  // 펫은 상태가 없어서 이름별로 하나씩만 만들어 같이 쓴다.
  const getPet = useCallback(
    (id: string) => {
      const name = looks[id]?.pet;
      if (!name || !A) return null;
      let p = petsRef.current.get(name);
      if (!p) {
        p = new Pet(A, name);
        petsRef.current.set(name, p);
      }
      return p;
    },
    [A, looks],
  );

  // 기본값과 다른(=직접 꾸민) 멤버만 저장한다. 그래야 기존 캐릭터의 색·장비가 바뀌어도 기본값이 따라간다.
  function persist(next: Record<string, V4Look>) {
    const edited: Record<string, V4Look> = {};
    for (const m of members) if (JSON.stringify(next[m.id]) !== JSON.stringify(m.defaultLook)) edited[m.id] = next[m.id];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(edited));
    } catch {
      // 저장이 막힌 환경(사생활 보호 모드 등)에서는 이번 방문 동안만 유지된다.
    }
  }

  function changeLook(id: string, patch: LookPatch) {
    const next = { ...looks, [id]: mergeLook(looks[id], patch) };
    setLooks(next);
    persist(next);
  }

  function resetLook(m: LabMember) {
    const next = { ...looks, [m.id]: m.defaultLook };
    setLooks(next);
    persist(next);
  }

  // 테스트용: 오늘 기록과 상관없이 모두 달리게 해서 달리기 동작을 바로 볼 수 있다(기본은 기록 기준).
  const shown = useMemo(() => (allRun ? members.map((m) => ({ ...m, todayLogged: true })) : members), [allRun, members]);

  if (members.length === 0) {
    return <p className="rounded border border-[#3c3d43] p-4 text-sm text-[#a3a29a]">시즌 참가자가 아직 없어요.</p>;
  }
  if (error) return <p className="rounded border border-[#3c3d43] p-4 text-sm text-[#f08068]">{error}</p>;
  if (!A) return <p className="rounded border border-[#3c3d43] p-4 text-sm text-[#a3a29a]">에셋 불러오는 중…</p>;

  const selected = members.find((m) => m.id === selectedId) ?? members[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[#a3a29a]">
        <button
          type="button"
          aria-pressed={allRun}
          onClick={() => setAllRun((v) => !v)}
          className={`cursor-pointer rounded border px-3 py-1.5 ${
            allRun ? "border-[#f0b84a] bg-[#f0b84a]/10 text-[#f0b84a]" : "border-[#3c3d43] hover:border-[#f0b84a] hover:text-[#f0b84a]"
          }`}
        >
          {allRun ? "전원 달리기 켜짐" : "전원 달리기로 보기"}
        </button>
        <span>
          꺼져 있으면 오늘 기록이 있는 사람만 달리고, 없는 사람은 숨쉬기 대기예요(오늘 달린 사람 {members.filter((m) => m.todayLogged).length}명).
        </span>
      </div>

      <LabCourse members={shown} getChar={getChar} getPet={getPet} />

      <section className="flex flex-col gap-3 rounded border border-[#3c3d43] bg-[#2a2b2e] p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold">기존 vs 새 캐릭터</h2>
            <p className="text-xs text-[#a3a29a]">같은 멤버를 기존 동글이와 새 캐릭터로 나란히. 새 캐릭터는 아래 꾸미기 패널 값이 반영돼요.</p>
          </div>
          <button
            type="button"
            aria-pressed={showCompare}
            onClick={() => setShowCompare((v) => !v)}
            className="cursor-pointer rounded border border-[#3c3d43] px-3 py-1.5 text-xs text-[#a3a29a] hover:border-[#f0b84a] hover:text-[#f0b84a]"
          >
            {showCompare ? "비교 숨기기" : "비교 보기"}
          </button>
        </div>
        {showCompare && <LabCompare members={shown} getChar={getChar} />}
      </section>

      <LabUnlock member={selected} levelRows={levelRows} A={A} />

      <LabStudio
        A={A}
        getPet={getPet}
        members={members}
        selectedId={selected.id}
        onSelect={setSelectedId}
        look={looks[selected.id]}
        onLookChange={(patch) => changeLook(selected.id, patch)}
        onReset={() => resetLook(selected)}
        getChar={getChar}
      />

      <LabStory member={shown.find((m) => m.id === selected.id) ?? selected} getChar={getChar} getPet={getPet} />
    </div>
  );
}
