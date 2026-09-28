import { BASE_TYPE_THRESHOLD_KM, HYBRID_RATIO_THRESHOLD, type RaceBodyType } from "@/lib/race/constants";

export type RunLogSample = {
  value: number; // km (원본 입력값)
  durationSec: number | null; // 시간 입력 안 했으면 null — 페이스 계산에서 제외
};

// 체형 8종 판정 — 순서대로 먼저 맞는 규칙을 적용한다(누적 기준, 시즌 내 누적).
export function typeOf(
  runPool: number,
  wodPool: number,
  swimPool: number,
  runLogs: RunLogSample[],
): RaceBodyType {
  const total = runPool + wodPool + swimPool;
  if (total < BASE_TYPE_THRESHOLD_KM) return "base";

  const runRatio = runPool / total;
  const wodRatio = wodPool / total;
  const swimRatio = swimPool / total;

  if (runRatio > HYBRID_RATIO_THRESHOLD && wodRatio > HYBRID_RATIO_THRESHOLD && swimRatio > HYBRID_RATIO_THRESHOLD) {
    return "hybrid";
  }
  if (runRatio >= 0.25 && swimRatio >= 0.25 && wodRatio < 0.2) return "tri";
  if (swimRatio >= 0.5) return "swim";
  if (wodRatio >= 0.6) return "wod";

  if (runPool >= wodPool && runPool >= swimPool) {
    const isLong = runLogs.length >= 3 && average(runLogs.map((l) => l.value)) >= 15;
    const timed = runLogs.filter((l) => l.durationSec != null && l.durationSec > 0);
    const isSpeed = timed.length >= 5 && averagePaceSecPerKm(timed) <= 5 * 60;
    if (isLong) return "long";
    if (isSpeed) return "speed";
    return "run";
  }
  return wodPool >= swimPool ? "wod" : "swim";
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// 기록 하나하나의 페이스가 아니라 "총 시간 / 총 거리"로 평균 페이스를 낸다 — 짧고 빠른 기록
// 한두 개로 평균이 왜곡되는 걸 막는다.
function averagePaceSecPerKm(timed: RunLogSample[]): number {
  const totalSec = timed.reduce((a, l) => a + (l.durationSec ?? 0), 0);
  const totalKm = timed.reduce((a, l) => a + l.value, 0);
  if (totalKm <= 0) return Infinity;
  return totalSec / totalKm;
}
