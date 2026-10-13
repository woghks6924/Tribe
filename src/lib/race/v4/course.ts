// Tri.be Race 코스 배경 (tribe-course.js의 TS 포팅, 로직은 그대로).
// 이미지 없이 코드로 그리는 픽셀 배경. 캔버스 크기 = COURSE.W * S × COURSE.H * S (기본 320×140 논리 픽셀).
// 캐릭터 발 밑 y(논리 픽셀) = COURSE.GROUND ~ COURSE.GROUND + 14

export const COURSE = { W: 320, H: 140, GROUND: 120 };

export type Tod = "dawn" | "day" | "sunset" | "night";

export type CourseSegment = { key: string; name: string; from: number; to: number; desc: string };

export const SEGMENTS: CourseSegment[] = [
  { key: "seoul", name: "서울", from: 0, to: 35, desc: "한강 · 남산타워" },
  { key: "suwon", name: "수원", from: 35, to: 90, desc: "화성 성곽" },
  { key: "cheonan", name: "천안", from: 90, to: 160, desc: "삼거리 능수버들" },
  { key: "daejeon", name: "대전", from: 160, to: 235, desc: "엑스포 한빛탑" },
  { key: "gimcheon", name: "김천", from: 235, to: 300, desc: "황금 들녘 · KTX" },
  { key: "daegu", name: "대구", from: 300, to: 370, desc: "83타워 · 앞산" },
  { key: "miryang", name: "밀양", from: 370, to: 425, desc: "영남루 · 밀양강" },
  { key: "busan", name: "부산", from: 425, to: Infinity, desc: "광안대교 · 바다" },
];

export function segmentAt(km: number): CourseSegment {
  return SEGMENTS.find((s) => km >= s.from && km < s.to) || SEGMENTS[0];
}

/** 한국 시간 기준 하늘: dawn(5~8시) day(8~17) sunset(17~19) night */
export function timeOfDay(date = new Date()): Tod {
  const h = (date.getUTCHours() + 9) % 24;
  return h >= 5 && h < 8 ? "dawn" : h < 17 && h >= 8 ? "day" : h >= 17 && h < 19 ? "sunset" : "night";
}

const SKY: Record<Tod, string[]> = {
  dawn: ["#4f5f9c", "#8a83bd", "#d99db0", "#f6c4a8", "#ffe0c0"],
  day: ["#5fa8f5", "#79b8f8", "#95c8fb", "#b2d8fd", "#d2e9ff"],
  sunset: ["#ff8a5c", "#ffa070", "#ffb987", "#ffcf9f", "#ffe3bd"],
  night: ["#0a1028", "#101a3c", "#16234c", "#1d2d5c", "#26386a"],
};
const HAZE: Record<Tod, string> = { dawn: "#9a8fbc", day: "#a7bfdc", sunset: "#cf8f86", night: "#2a3360" };
const HAZE2: Record<Tod, string> = { dawn: "#857caa", day: "#8eaacb", sunset: "#b57677", night: "#1f2750" };
const TINT: Record<Tod, string | null> = {
  dawn: "rgba(130,100,200,.14)",
  day: null,
  sunset: "rgba(255,120,70,.16)",
  night: "rgba(8,12,40,.42)",
};

/** 스토리 카드처럼 배경 위쪽을 하늘색으로 이어 붙일 때 쓰는 맨 위 하늘 색. */
export function skyTopColor(tod: Tod) {
  return SKY[tod][0];
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cache: Record<string, unknown> = {};
function seeded<T>(key: string, make: (r: () => number) => T): T {
  if (!(key in cache)) cache[key] = make(rng([...key].reduce((a, c) => a * 31 + c.charCodeAt(0), 7)));
  return cache[key] as T;
}

type Light = [number, number, string];

class G {
  ctx: CanvasRenderingContext2D;
  S: number;
  constructor(ctx: CanvasRenderingContext2D, S: number) {
    this.ctx = ctx;
    this.S = S;
  }
  px(x: number, y: number, w: number, h: number, c: string) {
    this.ctx.fillStyle = c;
    this.ctx.fillRect(
      Math.round(x) * this.S,
      Math.round(y) * this.S,
      Math.max(1, Math.round(w)) * this.S,
      Math.max(1, Math.round(h)) * this.S,
    );
  }
  // period 간격으로 반복해서 그리기 (오른쪽→왼쪽으로 흐름)
  rep(period: number, offset: number, fn: (x: number, i: number) => void, margin = 60) {
    const o = ((offset % period) + period) % period;
    for (let x = -o - margin; x < COURSE.W + margin; x += period) fn(x, Math.floor((x + offset) / period));
  }
}

// ───── 공통 요소 ─────
function sky(g: G, tod: Tod) {
  const b = SKY[tod];
  b.forEach((c, i) => g.px(0, i * 16, COURSE.W, 16, c));
  g.px(0, 80, COURSE.W, 60, b[4]);
  if (tod !== "night") {
    const sy = tod === "day" ? 12 : tod === "dawn" ? 46 : 40;
    const sc = tod === "day" ? "#fff7d6" : "#fff0d0";
    g.px(240, sy + 2, 14, 10, sc);
    g.px(242, sy, 10, 14, sc);
  }
}

function nightSky(g: G, t: number) {
  const st = seeded("stars", (r) => Array.from({ length: 40 }, (): [number, number, number] => [r() * 320, r() * 70, r()]));
  for (const [x, y, k] of st) if (Math.floor(t / 600 + k * 10) % 7 !== 0) g.px(x, y, 1, 1, k > 0.7 ? "#ffffff" : "#9fb0e0");
  g.px(250, 14, 10, 10, "#f4efd8");
  g.px(254, 13, 7, 9, "#0d1430");
}

function skyline(g: G, key: string, off: number, base: number, minH: number, maxH: number, color: string, lights: Light[], light = "#ffd98a") {
  const B = seeded("sky-" + key, (r) => {
    const a: [number, number, number, number][] = [];
    for (let x = 0; x < 640; x += 5 + Math.floor(r() * 7)) a.push([x, minH + Math.floor(r() * (maxH - minH)), 4 + Math.floor(r() * 6), r()]);
    return a;
  });
  const o = ((off % 640) + 640) % 640;
  for (const [x0, h, w, k] of B) {
    let x = x0 - o;
    if (x < -10) x += 640;
    if (x > COURSE.W) continue;
    g.px(x, base - h, w, h, color);
    if (k > 0.75) g.px(x + Math.floor(w / 2), base - h - 3, 1, 3, color);
    for (let yy = base - h + 3; yy < base - 2; yy += 4)
      for (let xx = x + 1; xx < x + w - 1; xx += 2)
        if ((xx * 7 + yy * 13 + Math.floor(k * 100)) % 5 === 0) lights.push([xx, yy, light]);
  }
}

function hills(g: G, key: string, off: number, base: number, amp: number, color: string, period = 640) {
  const H = seeded("hill-" + key, (r) => Array.from({ length: 8 }, (): [number, number] => [r() * 6.28, 0.5 + r()]));
  const o = off % period;
  for (let x = 0; x < COURSE.W; x++) {
    const u = ((x + o) / period) * 6.28;
    let h = 0;
    H.forEach(([p, f], i) => (h += Math.sin(u * (i + 1) * f + p) / (i + 1)));
    const y = base - amp * (0.6 + 0.4 * h);
    g.px(x, y, 1, base - y, color);
  }
}

function water(g: G, y0: number, y1: number, off: number, c = "#5b8ccc", hi = "#9cc3ef", edge = "#86aee0") {
  g.px(0, y0, COURSE.W, y1 - y0, c);
  g.px(0, y0, COURSE.W, 1, edge);
  const W = seeded("wave", (r) => Array.from({ length: 22 }, (): [number, number, number] => [r() * 400, r(), 2 + Math.floor(r() * 4)]));
  for (const [x0, k, w] of W) {
    const y = y0 + 2 + Math.floor(k * (y1 - y0 - 3));
    const x = ((((x0 - off) % 400) + 400) % 400) - 40;
    g.px(x, y, w, 1, hi);
  }
}

function grass(g: G, y0: number, y1: number, off: number, c = "#7fb069", d = "#5f9150") {
  g.px(0, y0, COURSE.W, y1 - y0, c);
  g.rep(23, off, (x, i) => g.px(x, y0 + 1 + (i & 3), 1, 2, d));
}

function ground(g: G, kind: "river" | "country" | "city" | "boardwalk", off: number) {
  const y = 112;
  if (kind === "river" || kind === "country") {
    const [c, e, d] = kind === "river" ? ["#c9b69a", "#a79478", "#f1e6d2"] : ["#c4a57c", "#9e825d", "#b39469"];
    g.px(0, y, COURSE.W, 28, c);
    g.px(0, y, COURSE.W, 1, e);
    if (kind === "river") g.rep(34, off, (x) => g.px(x, 126, 14, 1, d));
    else g.rep(17, off, (x, i) => g.px(x + (i % 5), 118 + ((i * 7) % 18), 2, 1, d));
  } else if (kind === "city") {
    g.px(0, y, COURSE.W, 28, "#b9b7b2");
    g.px(0, y, COURSE.W, 2, "#8d8b86");
    g.rep(16, off, (x) => g.px(x, y + 2, 1, 26, "#a6a49f"));
    g.px(0, 129, COURSE.W, 1, "#a6a49f");
  } else if (kind === "boardwalk") {
    g.px(0, y, COURSE.W, 28, "#b98a5a");
    g.px(0, y, COURSE.W, 1, "#8c6440");
    g.rep(8, off, (x) => g.px(x, y + 1, 1, 27, "#9c7148"));
  }
}

// 기와지붕 (처마 끝이 살짝 들림)
function roof(g: G, x: number, y: number, w: number, h: number, c: string, edge: string) {
  for (let i = 0; i < h; i++) {
    const ww = w - (h - 1 - i) * 2;
    g.px(x + (w - ww) / 2, y + i, ww, 1, c);
  }
  g.px(x - 1, y + h - 2, 2, 1, c);
  g.px(x + w - 1, y + h - 2, 2, 1, c);
  g.px(x, y + h, w, 1, edge);
}

// ───── 구간별 장면 ─────
type Scene = (g: G, off: number, tod: Tod, L: Light[], t: number) => void;

const SCENES: Record<string, Scene> = {
  seoul(g, off, tod, L) {
    skyline(g, "seoul", off * 0.15, 80, 10, 34, HAZE[tod], L);
    g.rep(300, off * 0.12, (x) => {
      const c = HAZE2[tod];
      g.px(x + 40, 40, 2, 40, c);
      g.px(x + 38, 46, 6, 3, c);
      g.px(x + 40.5, 33, 1, 7, c);
      L.push([x + 40, 47, "#ff6a6a"]);
    });
    water(g, 80, 104, off * 0.3);
    g.rep(260, off * 0.45, (x) => {
      g.px(x, 75, 150, 3, "#d4c3b0");
      for (let k = 0; k < 6; k++) g.px(x + 6 + k * 27, 78, 3, 26, "#bba891");
      for (let k = 0; k < 10; k++) L.push([x + 5 + k * 15, 74, "#ffe9a8"]);
    });
    grass(g, 104, 112, off);
    ground(g, "river", off);
  },

  suwon(g, off, tod, L) {
    hills(g, "suwon", off * 0.1, 80, 22, HAZE[tod]);
    grass(g, 80, 112, off * 0.6, "#8cbf73", "#6fa25d");
    // 성곽: 돌담 + 여장(凸) + 문루
    const wall = "#cfc4ae",
      dark = "#a99c84";
    g.px(0, 86, COURSE.W, 14, wall);
    g.rep(4, off * 0.4, (x) => g.px(x, 84, 2, 2, wall));
    g.rep(6, off * 0.4, (x, i) => g.px(x + (i % 2) * 3, 88 + (i % 3) * 4, 3, 1, dark));
    g.px(0, 99, COURSE.W, 1, dark);
    g.rep(300, off * 0.4, (x) => {
      g.px(x, 74, 36, 26, "#bfb39b");
      g.px(x + 13, 88, 10, 12, "#5a4636");
      g.px(x + 4, 66, 28, 8, "#7a3b2e");
      roof(g, x - 2, 60, 40, 6, "#3d4552", "#2c323c");
      roof(g, x + 6, 52, 24, 5, "#3d4552", "#2c323c");
      L.push([x + 9, 70, "#ffcf6a"], [x + 26, 70, "#ffcf6a"]);
    });
    ground(g, "country", off);
  },

  cheonan(g, off, tod, L) {
    hills(g, "cheonan", off * 0.1, 82, 16, HAZE[tod]);
    g.px(0, 82, COURSE.W, 30, "#a7c46a");
    g.rep(12, off * 0.5, (x) => g.px(x, 84, 1, 26, "#93b158"));
    g.rep(90, off * 0.5, (x) => {
      g.px(x + 30, 72, 22, 12, "#e9e3d4");
      roof(g, x + 26, 66, 30, 5, "#8a5a3c", "#6d4630");
      L.push([x + 36, 77, "#ffd98a"]);
    });
    // 능수버들
    g.rep(110, off * 0.8, (x) => {
      g.px(x + 20, 82, 3, 28, "#6b4f34");
      g.px(x + 8, 60, 28, 8, "#6f9a3c");
      for (let k = 0; k < 14; k++) g.px(x + 6 + k * 2, 66, 1, 10 + ((k * 5) % 13), k % 2 ? "#86b04a" : "#6f9a3c");
    });
    ground(g, "country", off);
  },

  daejeon(g, off, tod, L) {
    skyline(g, "daejeon", off * 0.15, 80, 8, 24, HAZE[tod], L);
    g.rep(300, off * 0.2, (x) => {
      // 한빛탑: 받침 → 가늘어지는 탑신 → 구슬 → 첨탑
      const c = "#e8ecf2",
        s = "#b9c2d0";
      g.px(x + 30, 72, 16, 8, c);
      for (let i = 0; i < 26; i++) g.px(x + 37 - Math.floor((26 - i) / 9), 46 + i, 2 + Math.floor((26 - i) / 9) * 2, 1, i % 6 ? c : s);
      g.px(x + 34, 38, 8, 8, "#d9dfe8");
      g.px(x + 35, 39, 2, 2, "#ffffff");
      g.px(x + 37.5, 26, 1, 12, c);
      L.push([x + 37, 26, "#ff6a6a"], [x + 36, 42, "#9fe3ff"], [x + 39, 42, "#9fe3ff"]);
    });
    water(g, 80, 104, off * 0.3, "#5f93c4");
    grass(g, 104, 112, off);
    ground(g, "river", off);
  },

  gimcheon(g, off, tod, L, t) {
    hills(g, "gim1", off * 0.06, 74, 30, HAZE2[tod]);
    hills(g, "gim2", off * 0.12, 80, 18, HAZE[tod]);
    // KTX 고가 + 가끔 지나가는 열차
    g.px(0, 76, COURSE.W, 2, "#c9c6bd");
    g.rep(40, off * 0.2, (x) => g.px(x, 78, 2, 6, "#b3afa5"));
    const tx = ((t * 0.12) % 1400) - 400;
    if (tx > -260 && tx < COURSE.W) {
      g.px(tx, 70, 220, 6, "#f2f4f7");
      g.px(tx + 220, 71, 6, 5, "#f2f4f7");
      g.px(tx, 73, 226, 1, "#2f5fb3");
      for (let k = 0; k < 26; k++) {
        g.px(tx + 4 + k * 8, 71, 4, 1, "#5a6b84");
        L.push([tx + 4 + k * 8, 71, "#fff2b0"]);
      }
    }
    // 황금 들녘 (가을 시즌)
    g.px(0, 84, COURSE.W, 28, "#e3b84a");
    g.rep(6, off * 0.6, (x, i) => g.px(x, 86 + (i % 4) * 6, 4, 1, "#c99a2e"));
    g.px(0, 84, COURSE.W, 1, "#c99a2e");
    g.rep(140, off * 0.6, (x) => {
      // 허수아비
      g.px(x + 50, 92, 1, 14, "#6b4f34");
      g.px(x + 46, 95, 9, 1, "#6b4f34");
      g.px(x + 48, 88, 5, 4, "#e8d6a8");
      g.px(x + 47, 87, 7, 1, "#b8463a");
    });
    ground(g, "country", off);
  },

  daegu(g, off, tod, L) {
    hills(g, "daegu", off * 0.08, 78, 34, HAZE2[tod]);
    skyline(g, "daegu", off * 0.18, 84, 10, 30, HAZE[tod], L);
    g.rep(300, off * 0.14, (x) => {
      // 83타워: 가는 기둥 + 전망대 + 첨탑
      const c = "#d6dbe4";
      g.px(x + 50, 36, 3, 48, c);
      g.px(x + 45, 30, 13, 7, c);
      g.px(x + 46, 32, 11, 2, "#7f93b8");
      g.px(x + 51, 18, 1, 12, c);
      L.push([x + 51, 18, "#ff6a6a"], [x + 47, 32, "#ffe9a8"], [x + 53, 32, "#ffe9a8"]);
    });
    g.px(0, 84, COURSE.W, 28, "#9b9a93");
    g.rep(70, off * 0.6, (x) => {
      g.px(x + 10, 78, 34, 34, "#c7c1b6");
      for (let yy = 82; yy < 108; yy += 6)
        for (let xx = 14; xx < 40; xx += 6) {
          g.px(x + xx, yy, 3, 3, "#8ea1b8");
          L.push([x + xx + 1, yy + 1, "#ffd98a"]);
        }
    });
    // 가로수 (가을 은행나무)
    g.rep(46, off, (x) => {
      g.px(x + 20, 98, 2, 14, "#6b4f34");
      g.px(x + 15, 88, 12, 11, "#e9c13d");
      g.px(x + 17, 86, 8, 2, "#e9c13d");
      g.px(x + 16, 96, 10, 2, "#cfa52a");
    });
    ground(g, "city", off);
  },

  miryang(g, off, tod, L) {
    hills(g, "miryang", off * 0.08, 80, 26, HAZE2[tod]);
    // 절벽 위 영남루
    g.rep(330, off * 0.25, (x) => {
      g.px(x + 10, 66, 90, 18, "#8a8174");
      g.px(x + 4, 74, 104, 10, "#7a7266");
      g.px(x + 30, 54, 50, 12, "#c9b48e");
      for (let k = 0; k < 6; k++) g.px(x + 31 + k * 9, 56, 2, 10, "#7a3b2e");
      roof(g, x + 24, 46, 62, 8, "#3d4552", "#2c323c");
      g.px(x + 50, 42, 10, 4, "#3d4552");
      for (let k = 0; k < 5; k++) L.push([x + 35 + k * 10, 60, "#ffcf6a"]);
    });
    water(g, 84, 104, off * 0.35, "#4f8db0", "#8fc4e0", "#78b0d0");
    grass(g, 104, 112, off, "#86b46c", "#679653");
    ground(g, "river", off);
  },

  busan(g, off, tod, L, t) {
    skyline(g, "busan", off * 0.12, 72, 18, 46, HAZE[tod], L, "#ffe2a0");
    water(g, 72, 104, off * 0.25, "#3c7fc4", "#a6d4ff", "#6aa4dc");
    // 광안대교: 주탑 2개 + 케이블 + 상판
    g.rep(320, off * 0.3, (x) => {
      const c = "#e4e6ea";
      g.px(x, 82, 320, 3, c);
      for (const tx of [90, 210]) {
        g.px(x + tx, 50, 3, 35, c);
        g.px(x + tx - 2, 58, 7, 1, c);
      }
      for (let k = 0; k <= 60; k++) {
        const u = k / 60,
          xx = 90 + u * 120,
          sag = Math.sin(u * Math.PI) * 26;
        g.px(x + xx, 51 + sag, 1, 1, c);
        if (k % 5 === 0) g.px(x + xx, 52 + sag, 1, 30 - sag, "#c9ccd2");
      }
      for (let k = 0; k <= 20; k++) {
        const u = k / 20;
        g.px(x + u * 90, 82 - u * 31, 1, 1, c);
        g.px(x + 213 + u * 90, 51 + u * 31, 1, 1, c);
      }
      const hue = ["#ff7ab0", "#7ad0ff", "#c9a0ff", "#8affc1"];
      for (let k = 0; k < 40; k++) L.push([x + k * 8, 81, hue[(k + Math.floor(t / 500)) % 4]]);
    });
    // 갈매기
    for (let i = 0; i < 3; i++) {
      const sx = ((t * 0.02 + i * 110) % 380) - 30,
        sy = 30 + i * 9 + Math.sin(t / 400 + i) * 3;
      const up = Math.floor(t / 250 + i) % 2;
      g.px(sx, sy + (up ? 0 : 1), 2, 1, "#ffffff");
      g.px(sx + 2, sy + 1, 1, 1, "#ffffff");
      g.px(sx + 3, sy + (up ? 0 : 1), 2, 1, "#ffffff");
    }
    g.px(0, 104, COURSE.W, 8, "#ecd9a8");
    g.rep(9, off * 0.9, (x, i) => g.px(x, 106 + (i % 3) * 2, 1, 1, "#d6bf88"));
    ground(g, "boardwalk", off);
  },
};

/**
 * 배경 한 장면을 그린다.
 * opts.S 배율(기본 3), opts.tod 기본 현재 한국 시간, opts.speed 흐르는 속도(0이면 정지)
 */
export function drawCourse(ctx: CanvasRenderingContext2D, key: string, t: number, opts: { S?: number; tod?: Tod; speed?: number } = {}) {
  const S = opts.S || 3;
  const tod = opts.tod || timeOfDay();
  const speed = opts.speed == null ? 1 : opts.speed;
  const g = new G(ctx, S);
  const off = t * 0.05 * speed;
  const L: Light[] = [];
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  sky(g, tod);
  (SCENES[key] || SCENES.seoul)(g, off, tod, L, t);
  const tint = TINT[tod];
  if (tint) {
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, COURSE.W * S, COURSE.H * S);
  }
  if (tod === "night") nightSky(g, t);
  if (tod === "night") for (const [x, y, c] of L) g.px(x, y, 1, 1, c);
  ctx.restore();
}
