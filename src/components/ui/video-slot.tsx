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
          // 원본 영상 상단에 얇은 블랙 레터박스가 박혀 있어, object-cover가
          // 세로로 크롭하지 않는(좁고 긴) 화면 비율에서는 그대로 노출된다.
          // 살짝 확대해 모든 화면 비율에서 가장자리가 잘려나가도록 한다.
          // translateZ(0)은 고정 헤더 아래로 영상이 이어질 때 그 영역만 검게
          // 그려지는 크롬 컴포지팅 버그 방지용으로 함께 유지한다.
          transform: "scale(1.3) translateZ(0)",
          willChange: "transform",
        }}
      />
      <GrainOverlay />
    </div>
  );
}
