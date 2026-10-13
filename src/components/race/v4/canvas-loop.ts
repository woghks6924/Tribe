import { useEffect, useRef, type RefObject } from "react";

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
