import { ITEMS, type RaceItem } from "@/lib/race/constants";

export type RaceLevelConfig = {
  levelBaseKm: number;
  levelExponent: number;
  maxLevel: number;
  pickLevels: number[];
};

// 레벨 N에 도달하는 데 필요한 전체 누적 환산 km.
export function kmForLevel(level: number, config: RaceLevelConfig): number {
  return config.levelBaseKm * Math.pow(level, config.levelExponent);
}

// 전체 누적 환산 km(시즌 무관)로부터 현재 레벨을 구한다. maxLevel에서 멈춘다.
export function levelFromKm(totalKm: number, config: RaceLevelConfig): number {
  let level = 0;
  while (level < config.maxLevel && totalKm >= kmForLevel(level + 1, config)) level++;
  return level;
}

export function pickLevelsReached(level: number, config: RaceLevelConfig): number[] {
  return [...config.pickLevels].filter((l) => l <= level).sort((a, b) => a - b);
}

// 남은 장비 선택 횟수 = 도달한 선택 레벨 수 - levelup으로 실제 받은 아이템 수.
export function remainingPicks(level: number, levelupItemCount: number, config: RaceLevelConfig): number {
  return Math.max(0, pickLevelsReached(level, config).length - levelupItemCount);
}

// 아직 도달 안 한 선택 레벨 중 가장 가까운 것 — "몇 레벨 더 가면 다음 장비를 고를 수 있는지"
// 보여줄 때 쓴다(옷장 화면). 이미 도달했지만 아직 안 고른 pending 레벨은 nextPendingPickLevel이
// 따로 담당하므로 여긴 관여하지 않는다.
export function nextUpcomingPickLevel(level: number, config: RaceLevelConfig): number | null {
  const upcoming = [...config.pickLevels].filter((l) => l > level).sort((a, b) => a - b);
  return upcoming[0] ?? null;
}

// 다음으로 팝업을 띄워야 할 "선택 레벨" — 없으면 null. 여러 레벨이 밀려 있으면 낮은 것부터.
export function nextPendingPickLevel(level: number, levelupItemCount: number, config: RaceLevelConfig): number | null {
  const reached = pickLevelsReached(level, config);
  if (levelupItemCount >= reached.length) return null;
  return reached[levelupItemCount];
}

function mulberry32(seed: number) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function stringSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h;
}

// (멤버 ID + 레벨) 시드로 고정된 후보를 고른다 — 새로고침해도 안 바뀐다. 안 고른 장비는
// 풀에 남아 있어서 다음 선택 때 다시 나올 수 있다. 남은 아이템이 count보다 적으면 그만큼만.
export function pickCandidates(memberId: string, level: number, ownedItemIds: string[], count = 3): RaceItem[] {
  const pool = ITEMS.filter((it) => !ownedItemIds.includes(it.id));
  if (pool.length <= count) return pool;
  const rnd = mulberry32(stringSeed(`${memberId}:${level}`));
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
