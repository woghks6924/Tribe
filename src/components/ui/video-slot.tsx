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
        style={{ filter: `brightness(${brightness}) contrast(${contrast}) saturate(0.92)` }}
      />
      <GrainOverlay />
    </div>
  );
}
