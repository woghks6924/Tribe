import { useEffect, useRef, type RefObject } from "react";
import type { RaceBodyType, RaceEye, RaceExpr } from "@/lib/race/constants";
import type { RaceEquipment } from "@/lib/race/sprite";
import type { V4Look } from "@/lib/race/v4/sprite";

export type LookPatch = Partial<Omit<V4Look, "colors">> & { colors?: Partial<V4Look["colors"]> };

export type LabMember = {
  id: string;
  name: string;
  km: number;
  type: RaceBodyType;
  todayLogged: boolean;
  level: number;
  legacy: { color: string; eye: RaceEye; type: RaceBodyType; expr: RaceExpr; eq: RaceEquipment; gold: boolean };
  defaultLook: V4Look;
};

export const HAIR_NAMES: [string | null, string][] = [
  [null, "기본(짧은 머리)"],
  ["hair_twoblock", "투블럭"],
  ["hair_sidepart", "가르마"],
  ["hair_pomade", "포마드"],
  ["hair_curly", "곱슬"],
  ["hair_bun", "번"],
  ["hair_ponytail", "포니테일"],
  ["hair_twintail", "트윈테일"],
  ["hair_long", "긴 머리"],
  ["hair_braid", "땋은 머리"],
];
export const ITEM_NAMES: [string | null, string][] = [
  [null, "없음"],
  ["item_cap", "캡"],
  ["item_beanie", "비니"],
  ["item_headband", "헤어밴드"],
  ["item_headphones", "헤드폰"],
  ["item_sunglasses", "선글라스"],
  ["item_scarf", "스카프"],
];
export const ANIM_NAMES: [string, string][] = [
  ["running", "달리기"],
  ["breathing_idle", "대기"],
  ["jumping", "점프(레벨업)"],
  ["backflip", "백플립(완주)"],
  ["getting_up", "일어나기"],
  ["falling_back_death", "넘어짐(추월당함)"],
];
export const PALETTE = {
  top: ["#2b2b30", "#f2f2ee", "#ff6b3d", "#ef4f6a", "#3f7cff", "#2fae7a", "#f0c23a", "#7b5cd6"],
  bottom: ["#2c3e66", "#1d1d22", "#55585f", "#f2f2ee", "#3a6b4a", "#8b2f3a", "#c7a27a", "#4b8ad8"],
  shoes: ["#f2f2ee", "#1d1d22", "#ff6b3d", "#3fd0ff", "#c6f24a", "#ff5cab", "#f0c23a", "#8a8f99"],
  hair: ["#2a2430", "#5a3a26", "#a8743f", "#e4c27a", "#c24a3a", "#8a8d96", "#3b5bd6", "#e98fbf"],
};
export const COLOR_NAMES = { top: "상의", bottom: "하의", shoes: "신발", hair: "머리" };

/**
 * 화면에 보일 때만 requestAnimationFrame을 돌린다(스크롤로 벗어나면 멈춤). draw는 매 프레임 최신
 * 클로저가 쓰이므로 deps를 신경 쓰지 않아도 된다.
 */
export function useCanvasLoop(canvasRef: RefObject<HTMLCanvasElement | null>, draw: (now: number, dt: number) => void) {
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    let raf = 0;
    let visible = false;
    let running = false;
    let last = performance.now();

    const tick = (now: number) => {
      if (!visible) {
        running = false;
        return;
      }
      const dt = Math.min(50, now - last);
      last = now;
      drawRef.current(now, dt);
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else {
          cancelAnimationFrame(raf);
          running = false;
        }
      },
      { rootMargin: "120px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [canvasRef]);
}
