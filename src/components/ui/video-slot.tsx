import { GrainOverlay } from "@/components/ui/grain-filter";

export function VideoSlot({
  src,
  className = "",
  brightness = 1.3,
  contrast = 1.05,
}: {
  src: string;
  className?: string;
  /** 원본 영상이 어두울수록 값을 높여 보정한다 (기본 1.3). */
  brightness?: number;
  contrast?: number;
}) {
  return (
    <div className={`relative overflow-hidden bg-base-elevated ${className}`}>
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          filter: `brightness(${brightness}) contrast(${contrast}) saturate(0.92)`,
          // 고정(fixed) 헤더 아래로 영상이 이어질 때 그 영역만 검게 그려지는
          // 크롬 컴포지팅 버그 방지 — 영상을 별도 GPU 레이어로 승격시킨다.
          transform: "translateZ(0)",
          willChange: "transform",
        }}
      />
      <GrainOverlay />
    </div>
  );
}
