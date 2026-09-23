"use client";

import { useEffect, useState } from "react";
import type { RaceAppearance } from "@/lib/race/appearance";
import { renderRaceAvatarDataUrl } from "@/lib/race/layer-render";

export function RaceAvatarImg({
  appearance,
  sleep,
  heightPx = 88,
  className,
  alt = "",
}: {
  appearance: RaceAppearance;
  sleep?: boolean;
  heightPx?: number;
  className?: string;
  alt?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const key = JSON.stringify(appearance);

  useEffect(() => {
    let cancelled = false;
    renderRaceAvatarDataUrl(appearance, heightPx).then((url) => {
      if (!cancelled) {
        // 캔버스 렌더링은 document가 있는 클라이언트에서만 가능해 SSR 중엔 건너뛰어야 한다.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSrc(url);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, heightPx]);

  if (!src) {
    return <div className={className} style={{ width: heightPx, height: heightPx }} aria-hidden />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      height={heightPx}
      style={{ opacity: sleep ? 0.55 : 1, height: heightPx, width: "auto" }}
    />
  );
}
