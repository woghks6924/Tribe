// 목업의 grainB 필터와 동일한 SVG feTurbulence 그레인. 레이아웃에서 한 번만 렌더링한다.
export function GrainFilterDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <filter id="tribe-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves={3}
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.8 0 0 0 0"
          />
        </filter>
      </defs>
    </svg>
  );
}

export function GrainOverlay({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grain-overlay ${className}`}
      style={{ filter: "url(#tribe-grain)" }}
    />
  );
}
