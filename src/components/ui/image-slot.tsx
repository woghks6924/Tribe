import Image from "next/image";
import { GrainOverlay } from "@/components/ui/grain-filter";

export function ImageSlot({
  src,
  alt,
  placeholder,
  sizes,
  className = "",
}: {
  src?: string | null;
  alt: string;
  placeholder?: string;
  sizes?: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden bg-base-elevated ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes ?? "(min-width: 1024px) 25vw, 50vw"}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_40%_30%,#232426,#101113_80%)] p-4 text-center font-mono text-[10px] tracking-[0.08em] text-ink-faint">
          {placeholder}
        </div>
      )}
      <GrainOverlay />
    </div>
  );
}
