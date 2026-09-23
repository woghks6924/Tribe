export type RaceRatios = {
  runFactor: number;
  wodMinutesPerKm: number;
  swimMetersPerKm: number;
};

// 원본 입력값(러닝/수영: km, WOD·헬스: 분)을 시즌의 그 시점 환산비율로 환산 km로 바꾼다.
// 결과는 RaceLog.convertedKm에 저장돼 이후 비율이 바뀌어도 과거 기록은 흔들리지 않는다.
export function toConvertedKm(kind: "RUN" | "WOD" | "SWIM" | "GYM", value: number, ratios: RaceRatios): number {
  if (kind === "RUN") return value * ratios.runFactor;
  if (kind === "WOD" || kind === "GYM") return value / ratios.wodMinutesPerKm;
  return value * (1000 / ratios.swimMetersPerKm);
}
