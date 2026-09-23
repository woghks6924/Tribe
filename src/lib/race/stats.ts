import {
  BASE_TYPE_THRESHOLD_KM,
  CHECKPOINTS,
  HYBRID_RATIO_THRESHOLD,
  SLEEP_IDLE_DAYS,
  type RaceBodyType,
} from "@/lib/race/constants";

export type RaceLogRow = {
  memberId: string;
  date: string; // KST YYYY-MM-DD
  kind: "RUN" | "WOD" | "SWIM" | "GYM";
  value: number;
  convertedKm: number;
};

// 꾸미기 관련 필드는 DB(Prisma)에서는 그냥 String이라 여기서는 느슨하게 받는다 —
// 실제 RaceGender 등으로의 좁히기는 렌더링하는 컴포넌트 쪽에서 한다.
export type RaceMemberRow = {
  id: string;
  name: string;
  gender: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  topType: string;
  topColor: string;
  bottomType: string;
  bottomColor: string;
  shoeType: string;
  prop: string | null;
  igHandle: string | null;
  excluded: boolean;
};

export type RaceMemberStats = {
  member: RaceMemberRow;
  runRaw: number; // km
  wodRaw: number; // 분 (WOD만)
  gymRaw: number; // 분 (헬스만)
  swimRaw: number; // km
  runPool: number; // 환산 km
  wodPool: number; // 환산 km (WOD+헬스 합산)
  swimPool: number; // 환산 km
  pts: number; // = runPool+wodPool+swimPool, 순위 기준
  days: Set<string>;
  lastDate: string | null;
  l7: number; // 최근 7일 환산 km
  streak: number;
  idleDays: number;
  type: RaceBodyType;
  rank: number;
};

// "YYYY-MM-DD" 문자열을 순수 달력일 기준 일수(epoch로부터)로 변환 — 타임존 영향을 받지 않는다.
function dateStrToDays(s: string): number {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}
export function addDaysToDateStr(s: string, n: number): string {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}
export function dayIndexOf(dateStr: string, seasonStartDateStr: string): number {
  return dateStrToDays(dateStr) - dateStrToDays(seasonStartDateStr) + 1;
}
export function todayKstDateStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export function typeOf(runPool: number, wodPool: number, swimPool: number): RaceBodyType {
  const total = runPool + wodPool + swimPool;
  if (total < BASE_TYPE_THRESHOLD_KM) return "base";
  if (
    runPool / total > HYBRID_RATIO_THRESHOLD &&
    wodPool / total > HYBRID_RATIO_THRESHOLD &&
    swimPool / total > HYBRID_RATIO_THRESHOLD
  ) {
    return "hybrid";
  }
  if (runPool >= wodPool && runPool >= swimPool) return "run";
  return wodPool >= swimPool ? "wod" : "swim";
}

export function checkpointOf(km: number): string {
  let label = "출발 전";
  for (const cp of CHECKPOINTS) {
    if (cp.km > 0 && km >= cp.km) label = `${cp.name} 통과`;
  }
  const goal = CHECKPOINTS[CHECKPOINTS.length - 1].km;
  return km >= goal ? "부산 도착" : label;
}
export function checkpointIndexOf(km: number): number {
  let idx = 0;
  CHECKPOINTS.forEach((cp, i) => {
    if (km >= cp.km) idx = i;
  });
  return idx;
}

// 시즌 시작일부터 uptoDate(포함)까지 각 멤버의 누적 통계를 계산해 순위를 매긴다.
export function computeMemberStats(
  members: RaceMemberRow[],
  logs: RaceLogRow[],
  seasonStartDateStr: string,
  uptoDateStr: string,
): RaceMemberStats[] {
  const upto = dayIndexOf(uptoDateStr, seasonStartDateStr);
  const byMember = new Map<string, RaceMemberStats>(
    members.map((m) => [
      m.id,
      {
        member: m,
        runRaw: 0,
        wodRaw: 0,
        gymRaw: 0,
        swimRaw: 0,
        runPool: 0,
        wodPool: 0,
        swimPool: 0,
        pts: 0,
        days: new Set<string>(),
        lastDate: null,
        l7: 0,
        streak: 0,
        idleDays: 0,
        type: "base",
        rank: 0,
      },
    ]),
  );

  for (const log of logs) {
    const s = byMember.get(log.memberId);
    if (!s) continue;
    const logDay = dayIndexOf(log.date, seasonStartDateStr);
    if (logDay > upto) continue;

    if (log.kind === "RUN") {
      s.runRaw += log.value;
      s.runPool += log.convertedKm;
    } else if (log.kind === "WOD") {
      s.wodRaw += log.value;
      s.wodPool += log.convertedKm;
    } else if (log.kind === "GYM") {
      s.gymRaw += log.value;
      s.wodPool += log.convertedKm;
    } else {
      s.swimRaw += log.value;
      s.swimPool += log.convertedKm;
    }
    s.pts += log.convertedKm;
    s.days.add(log.date);
    if (!s.lastDate || log.date > s.lastDate) s.lastDate = log.date;
    if (logDay > upto - 7) s.l7 += log.convertedKm;
  }

  const result = [...byMember.values()];
  result.forEach((s) => {
    // 연속 기록일수: uptoDate(오늘 기록이 없으면 하루 전)부터 거슬러 올라가며 카운트.
    let streak = 0;
    let cursor = uptoDateStr;
    if (!s.days.has(cursor)) cursor = addDaysToDateStr(cursor, -1);
    while (dayIndexOf(cursor, seasonStartDateStr) > 0 && s.days.has(cursor)) {
      streak++;
      cursor = addDaysToDateStr(cursor, -1);
    }
    s.streak = streak;
    s.idleDays = s.lastDate ? upto - dayIndexOf(s.lastDate, seasonStartDateStr) : upto;
    s.type = typeOf(s.runPool, s.wodPool, s.swimPool);
  });

  result.sort((a, b) => b.pts - a.pts || a.member.name.localeCompare(b.member.name));
  result.forEach((s, i) => (s.rank = i + 1));
  return result;
}

export function isSleeping(idleDays: number): boolean {
  return idleDays >= SLEEP_IDLE_DAYS;
}

export type RaceFeedEvent = { date: string; text: string; memberId?: string };

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// 하루 전(before) 대비 오늘(after) 통계를 비교해 크루 소식 이벤트를 만든다. focusMemberId를 주면
// 그 사람 기준으로 "추월" 이벤트도 추가한다(기록 제출 직후 호출할 때만 사용).
export function eventsBetween(
  before: RaceMemberStats[],
  after: RaceMemberStats[],
  date: string,
  focusMemberId?: string,
): RaceFeedEvent[] {
  const events: RaceFeedEvent[] = [];
  const beforeByMember = new Map(before.map((s) => [s.member.id, s]));
  const goal = CHECKPOINTS[CHECKPOINTS.length - 1].km;

  if (before.length && after[0] && before[0] && after[0].member.id !== before[0].member.id && after[0].pts > 0) {
    events.push({ date, text: `<b>${escapeHtml(after[0].member.name)}</b> 선두 탈환` });
  }

  for (const s of after) {
    const o = beforeByMember.get(s.member.id);
    if (!o) continue;
    const n = escapeHtml(s.member.name);

    if (checkpointIndexOf(s.pts) > checkpointIndexOf(o.pts)) {
      const cp = CHECKPOINTS[checkpointIndexOf(s.pts)];
      events.push({
        date,
        memberId: s.member.id,
        text: cp.km === goal ? `<b>${n}</b> 부산 도착! 완주 배지 획득` : `<b>${n}</b> · ${cp.name} 통과 (${cp.km}km)`,
      });
    }
    if (s.type !== o.type && s.type !== "base") {
      events.push({
        date,
        memberId: s.member.id,
        text: `<b>${n}</b> · ${s.type === "hybrid" ? "하이브리드로" : `${s.type}형으로`} 진화`,
      });
    }
    if ((s.streak === 5 || s.streak === 7 || s.streak === 10) && o.streak < s.streak) {
      events.push({ date, memberId: s.member.id, text: `<b>${n}</b> ${s.streak}일 연속 기록 중` });
    }
    if (s.idleDays === 3 && o.idleDays === 2) {
      events.push({ date, memberId: s.member.id, text: `<b>${n}</b> 잠수 3일째… 캐릭터가 잠들었어요` });
    }
    if (o.idleDays >= 3 && s.idleDays === 0) {
      events.push({ date, memberId: s.member.id, text: `<b>${n}</b> 잠수 탈출!` });
    }
  }

  if (focusMemberId) {
    const f = after.find((s) => s.member.id === focusMemberId);
    const fo = beforeByMember.get(focusMemberId);
    if (f && fo) {
      after.forEach((s) => {
        const so = beforeByMember.get(s.member.id);
        if (so && s.member.id !== focusMemberId && so.rank < fo.rank && s.rank > f.rank) {
          events.push({ date, text: `<b>${escapeHtml(f.member.name)}</b> → ${escapeHtml(s.member.name)} 추월!` });
        }
      });
    }
  }

  return events;
}

// 시즌 시작부터 오늘까지 하루 단위로 통계를 다시 계산해 크루 소식 피드 전체를 만든다.
// 로그 몇백 건, 최대 50일 정도라 매 페이지 로드마다 다시 계산해도 비용이 크지 않다.
export function buildSeasonFeed(
  members: RaceMemberRow[],
  logs: RaceLogRow[],
  seasonStartDateStr: string,
  todayDateStr: string,
): RaceFeedEvent[] {
  const todayDay = dayIndexOf(todayDateStr, seasonStartDateStr);
  const feed: RaceFeedEvent[] = [];
  for (let d = 2; d <= todayDay; d++) {
    const dateStr = addDaysToDateStr(seasonStartDateStr, d - 1);
    const prevDateStr = addDaysToDateStr(seasonStartDateStr, d - 2);
    const before = computeMemberStats(members, logs, seasonStartDateStr, prevDateStr);
    const after = computeMemberStats(members, logs, seasonStartDateStr, dateStr);
    feed.push(...eventsBetween(before, after, dateStr));
  }
  return feed;
}

export type RaceAward = {
  key: "grand" | "streak" | "hybrid" | "spurt";
  label: string;
  title: string;
  description: string;
  holder: RaceMemberStats | null;
  value: string;
};

export function computeAwards(stats: RaceMemberStats[]): RaceAward[] {
  const grand = stats[0] ?? null;
  const days = [...stats].sort((a, b) => b.days.size - a.days.size || b.pts - a.pts)[0] ?? null;
  const hybridCandidates = stats
    .filter((s) => s.pts >= 20)
    .map((s) => ({ s, v: Math.min(s.runPool, s.wodPool, s.swimPool) / s.pts }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v);
  const hybrid = hybridCandidates[0] ?? null;
  const spurt = [...stats].sort((a, b) => b.l7 - a.l7)[0] ?? null;

  return [
    {
      key: "grand",
      label: "GRAND",
      title: "가장 멀리 간 사람",
      description: "시즌 누적 환산 거리 1위",
      holder: grand,
      value: grand ? `${grand.pts.toFixed(1)}km` : "",
    },
    {
      key: "streak",
      label: "STREAK",
      title: "가장 꾸준한 사람",
      description: "기록한 날이 가장 많은 사람",
      holder: days,
      value: days ? `${days.days.size}일 기록` : "",
    },
    {
      key: "hybrid",
      label: "HYBRID",
      title: "하이브리드상",
      description: "러닝·WOD·수영을 가장 고르게",
      holder: hybrid?.s ?? null,
      value: hybrid ? `가장 약한 종목 비중 ${Math.round(hybrid.v * 100)}%` : "",
    },
    {
      key: "spurt",
      label: "SPURT",
      title: "최근 7일 스퍼트",
      description: "지난 7일 동안 가장 많이 전진",
      holder: spurt,
      value: spurt ? `${spurt.l7.toFixed(1)}km` : "",
    },
  ];
}

export function formatBreakdown(s: RaceMemberStats): string {
  const parts: string[] = [];
  if (s.runRaw) parts.push(`런 ${s.runRaw.toFixed(1)}km`);
  if (s.wodRaw) parts.push(`WOD ${Math.round(s.wodRaw)}분`);
  if (s.gymRaw) parts.push(`헬스 ${Math.round(s.gymRaw)}분`);
  if (s.swimRaw) parts.push(`수영 ${s.swimRaw.toFixed(1)}km`);
  return parts.join(" · ") || "아직 기록 없음";
}
