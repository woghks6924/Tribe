import type { RaceExpr } from "@/lib/race/constants";
import { isSleeping } from "@/lib/race/stats";

export type ExpressionInput = {
  idleDays: number;
  unacknowledgedPokes: number;
  lastLogAt: Date | null; // 가장 최근 기록 제출 시각(정확한 타임스탬프, 날짜 문자열 아님)
  receivedHifiveWithin24h: boolean;
  bigEffortWithin24h: boolean; // 최근 24시간 내 러닝 15km+ 또는 WOD 90분+ 단건 기록
  rankDroppedFromYesterday: boolean;
};

// 표정 7종 중 하나를 우선순위대로 자동 결정한다 — 사용자가 고르는 값이 아니다.
export function computeExpression(input: ExpressionInput): RaceExpr {
  const sleeping = isSleeping(input.idleDays);
  if (sleeping && input.unacknowledgedPokes >= 3) return "restless";
  if (sleeping) return "sleep";
  if (input.lastLogAt && Date.now() - input.lastLogAt.getTime() <= 6 * 60 * 60 * 1000) return "happy";
  if (input.receivedHifiveWithin24h) return "hifive";
  if (input.bigEffortWithin24h) return "tired";
  if (input.rankDroppedFromYesterday) return "mad";
  return "n";
}
