"use client";

import { useEffect, useState } from "react";
import { Character, loadRaceAssets, type RaceAssets, type V4Look } from "@/lib/race/v4/sprite";

// 에셋(manifest + PNG 42장)은 페이지 안의 모든 캐릭터가 같이 쓰므로 한 번만 불러온다.
let loading: Promise<RaceAssets> | null = null;
export function loadRaceAssetsOnce() {
  if (!loading) {
    loading = loadRaceAssets("/race-assets/").catch((e) => {
      loading = null; // 실패하면 다음에 다시 시도할 수 있게
      throw e;
    });
  }
  return loading;
}

export function useRaceAssets(): RaceAssets | null {
  const [A, setA] = useState<RaceAssets | null>(null);
  useEffect(() => {
    let alive = true;
    loadRaceAssetsOnce()
      .then((a) => alive && setA(a))
      .catch(() => {
        // 에셋을 못 불러오면 캐릭터 자리는 비어 있는 채로 둔다.
      });
    return () => {
      alive = false;
    };
  }, []);
  return A;
}

// 같은 외형은 Character(=구워 둔 프레임 캐시)를 공유한다.
const charCache = new WeakMap<RaceAssets, Map<string, Character>>();
export function characterFor(A: RaceAssets, look: V4Look): Character {
  let m = charCache.get(A);
  if (!m) charCache.set(A, (m = new Map()));
  const key = JSON.stringify(look);
  let c = m.get(key);
  if (!c) {
    c = new Character(A, look);
    m.set(key, c);
  }
  return c;
}
