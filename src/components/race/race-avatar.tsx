"use client";

import { useEffect, useState } from "react";
import type { RacePaintOptions } from "@/lib/race/sprite";
import { renderAvatarDataUrl, SPRITE_GRID_SIZE } from "@/lib/race/sprite";

export function RaceAvatarImg({
  appearance,
  scale,
  className,
  alt = "",
}: {
  appearance: Omit<RacePaintOptions, "scale">;
  scale: number;
  className?: string;
  alt?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const key = JSON.stringify(appearance);

  useEffect(() => {
    // 캔버스 렌더링은 document가 있는 클라이언트에서만 가능해 SSR 중엔 건너뛰어야 한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSrc(renderAvatarDataUrl({ ...appearance, scale }));
    // key가 appearance의 내용을 정확히 반영하는 deps라 eslint의 얕은 비교 경고는 무시해도 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, scale]);

  if (!src) {
    return (
      <div
        className={className}
        style={{ width: SPRITE_GRID_SIZE * scale, height: SPRITE_GRID_SIZE * scale }}
        aria-hidden
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} width={SPRITE_GRID_SIZE * scale} height={SPRITE_GRID_SIZE * scale} />;
}
