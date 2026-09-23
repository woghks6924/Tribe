"use client";

import { useEffect, useState } from "react";
import type { RaceAcc, RaceBodyType, RaceEye } from "@/lib/race/constants";
import { renderAvatarDataUrl } from "@/lib/race/sprite";

export function RaceAvatarImg({
  color,
  eye,
  acc,
  type,
  sleep,
  scale,
  className,
  alt = "",
}: {
  color: string;
  eye: RaceEye;
  acc: RaceAcc;
  type: RaceBodyType;
  sleep: boolean;
  scale: number;
  className?: string;
  alt?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    // 캔버스 렌더링은 document가 있는 클라이언트에서만 가능해 SSR 중엔 건너뛰어야 한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSrc(renderAvatarDataUrl(color, eye, acc, type, sleep, scale));
  }, [color, eye, acc, type, sleep, scale]);

  if (!src) {
    return <div className={className} style={{ width: 22 * scale, height: 22 * scale }} aria-hidden />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} width={22 * scale} height={22 * scale} />;
}
