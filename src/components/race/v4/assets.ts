"use client";

import { useEffect, useState } from "react";
import { Character, ensurePetImages, loadRaceAssets, type RaceAssets, type V4Look } from "@/lib/race/v4/sprite";

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

// 쓰는 펫의 이미지를 불러오고, 다 오면 숫자가 바뀌어서(다시 그리라는 신호) 화면이 갱신된다.
export function usePetImages(A: RaceAssets | null, names: (string | null | undefined)[]): number {
  const [version, setVersion] = useState(0);
  const key = [...new Set(names.filter((n): n is string => !!n))].sort().join(",");
  useEffect(() => {
    if (!A || !key) return;
    let alive = true;
    ensurePetImages(A, key.split(","))
      .then(() => alive && setVersion((v) => v + 1))
      .catch(() => {
        // 펫 이미지를 못 받으면 펫만 안 보인다.
      });
    return () => {
      alive = false;
    };
  }, [A, key]);
  return version;
}

// 같은 외형은 Character(=구워 둔 프레임 캐시)를 공유한다.
const charCache = new WeakMap<RaceAssets, Map<string, Character>>();
export function characterFor(A: RaceAssets, look: V4Look): Character {
  let m = charCache.get(A);
  if (!m) charCache.set(A, (m = new Map()));
  const key = JSON.stringify({ ...look, pet: null }); // 펫은 Character가 안 쓴다 — 펫만 다른 외형은 같은 프레임 캐시를 공유
  let c = m.get(key);
  if (!c) {
    c = new Character(A, look);
    m.set(key, c);
  }
  return c;
}
