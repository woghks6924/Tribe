const TICK_COUNT = 60;

export function SpecGauge({
  min,
  max,
  scaleMin,
  scaleMax,
  labels,
  unit = "",
}: {
  min: number;
  max: number;
  scaleMin: number;
  scaleMax: number;
  labels: readonly number[];
  unit?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-[3px]">
        {Array.from({ length: TICK_COUNT }).map((_, i) => {
          const value = scaleMin + (i / (TICK_COUNT - 1)) * (scaleMax - scaleMin);
          const active = value >= min && value <= max;
          return (
            <span key={i} className={`h-4 w-px ${active ? "bg-accent" : "bg-line-strong"}`} />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-ink-faint">
        {labels.map((l) => (
          <span key={l}>
            {l}
            {unit}
          </span>
        ))}
      </div>
    </div>
  );
}
