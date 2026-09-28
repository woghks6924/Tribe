import type { RaceBodyType, RaceEye, RaceExpr } from "@/lib/race/constants";

// v3 캐릭터 스프라이트 — docs/race-character-v3.html 레퍼런스의 build()/palette()/paint()를
// TypeScript로 그대로 옮긴 것. 32x32 픽셀 그리드에 체형 8종 · 표정 7종 · 눈 4종 · 장비 6부위 ·
// Lv.30 금테를 조합해서 그린다. 로직/좌표는 레퍼런스와 1:1로 맞춘다 — 숫자를 바꾸지 말 것.
const N = 32;
const C = 16;

type ArmShape = "s" | "m" | "fist" | "fin" | "finS";

type TypeShape = {
  rx: number;
  ry: number;
  leg: number;
  lw: number;
  arm: ArmShape;
  pack?: boolean; // 장거리형 배낭
  spike?: boolean; // 스피드형 뾰족머리 (모자류 착용 시 숨김)
  gog?: boolean; // 스위머/철인 수경 (비니 착용 시 숨김)
  star?: boolean; // 하이브리드 별 마크
};

const TYPES: Record<RaceBodyType, TypeShape> = {
  base: { rx: 7, ry: 7, leg: 3, lw: 2, arm: "s" },
  run: { rx: 6, ry: 6.8, leg: 7, lw: 2, arm: "s" },
  long: { rx: 6, ry: 6.8, leg: 7, lw: 2, arm: "s", pack: true },
  speed: { rx: 6, ry: 6.8, leg: 7, lw: 2, arm: "s", spike: true },
  wod: { rx: 8.8, ry: 7, leg: 3, lw: 3, arm: "fist" },
  swim: { rx: 9, ry: 6, leg: 3, lw: 2, arm: "fin", gog: true },
  tri: { rx: 7, ry: 6.6, leg: 5, lw: 2, arm: "finS", gog: true },
  hybrid: { rx: 7.4, ry: 7, leg: 5, lw: 2, arm: "m", star: true },
};

export type RaceEquipment = {
  head?: string | null;
  face?: string | null;
  neck?: string | null;
  body?: string | null;
  wrist?: string | null;
  feet?: string | null;
};

export type RaceBuildOptions = {
  type: RaceBodyType;
  frame?: number; // 0..3 달리기 프레임, -1(기본) = 제자리
  expr?: RaceExpr;
  eye?: RaceEye; // expr === 'n' 일 때만 적용
  eq?: RaceEquipment;
  tick?: number; // 스카프 펄럭임 등 애니메이션 카운터
};

export type RaceBuiltSprite = { grid: string[][]; cy: number; top: number };

export function build(o: RaceBuildOptions): RaceBuiltSprite {
  const T = TYPES[o.type] ?? TYPES.base;
  const eq = o.eq ?? {};
  const frame = o.frame ?? -1;
  const expr = o.expr ?? "n";
  const tick = o.tick ?? 0;
  const moving = frame >= 0;
  const g: string[][] = Array.from({ length: N }, () => Array(N).fill("."));
  const set = (x: number, y: number, c: string) => {
    if (x >= 0 && x < N && y >= 0 && y < N) g[y][x] = c;
  };
  const inE = (x: number, y: number, cx: number, cy0: number, rx: number, ry: number) =>
    ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy0) / ry) ** 2 <= 1;
  const isB = (v: string) => v === "B" || v === "L" || v === "D";
  const cy = 29 - T.leg + 1.5 - T.ry;
  const top = Math.floor(cy - T.ry);

  // 다리 + 신발
  const legTop = Math.floor(cy + T.ry) - 1;
  const liftTable: [number, number][] = [
    [2, 0],
    [0, 0],
    [0, 2],
    [0, 0],
  ];
  const lift = liftTable[moving ? frame : 1];
  const shoes = eq.feet === "shoes";
  ([
    [0, C - 4 - (T.lw - 1)],
    [1, C + 3],
  ] as [number, number][]).forEach(([i, x0]) => {
    const lf = lift[i];
    for (let y = legTop; y <= 29 - lf; y++)
      for (let x = x0; x < x0 + T.lw; x++)
        set(x, y, y >= 29 - lf ? (shoes ? "S" : "s") : x === x0 + T.lw - 1 ? "D" : "B");
    if (shoes) set(i ? x0 + T.lw : x0 - 1, 29 - lf, "S");
  });

  // 몸통 (명암)
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      if (inE(x, y, C, cy, T.rx, T.ry)) {
        const d = (-(x + 0.5 - C) / T.rx) * 0.6 - ((y + 0.5 - cy) / T.ry) * 0.8;
        g[y][x] = d > 0.62 ? "L" : d < -0.5 ? "D" : "B";
      }

  // 팔 (+ 손목밴드, 하이파이브 손)
  const sw = frame === 0 ? -1 : frame === 2 ? 1 : 0;
  const wb = eq.wrist === "wrist";
  const blob = (cx: number, cy0: number, rx: number, ry: number) => {
    for (let y = 1; y < N - 1; y++)
      for (let x = 1; x < N - 1; x++)
        if (inE(x, y, cx, cy0, rx, ry))
          g[y][x] = wb && y === Math.round(cy0 - 0.5) ? "R" : (y + 0.5 - cy0) / ry > 0.2 ? "D" : "B";
  };
  ([-1, 1] as const).forEach((sd) => {
    const dy = moving ? sd * sw : 0;
    if (expr === "hifive" && sd === 1) {
      blob(C + T.rx + 1.4, cy - 4.2, 1.7, 1.7);
      return;
    }
    if (T.arm === "s") blob(C + sd * (T.rx + 0.6), cy + 2 + dy, 1.5, 1.5);
    if (T.arm === "m") blob(C + sd * (T.rx + 0.8), cy + 1.5 + dy, 1.9, 1.9);
    if (T.arm === "fist") blob(C + sd * (T.rx + 1.6), cy + 1.5 + dy, 2.6, 2.6);
    if (T.arm === "fin") blob(C + sd * (T.rx + 2), cy - 0.5 + dy, 3, 1.3);
    if (T.arm === "finS") blob(C + sd * (T.rx + 1.6), cy + 0.2 + dy, 2.3, 1.1);
  });

  // 체형 표시: 장거리 팩
  if (T.pack) {
    const x0 = Math.round(C - T.rx - 3);
    for (let y = Math.round(cy - 2); y <= Math.round(cy + 2); y++) for (let x = x0; x < x0 + 2; x++) set(x, y, "T");
    set(x0 + 1, Math.round(cy - 3), "A");
    set(x0 + 2, Math.round(cy - 1), "A");
  }

  // 몸 장비: 트라이브 티 / 배번표
  if (eq.body === "tee") {
    for (let y = Math.round(cy + 1.5); y < N; y++)
      for (let x = 0; x < N; x++) {
        const v = g[y][x];
        if (isB(v) && inE(x, y, C, cy, T.rx, T.ry)) g[y][x] = v === "D" ? "t" : "T";
      }
    if (!T.star) {
      const ly = Math.round(cy + 2.6);
      ([
        [C - 1, ly],
        [C, ly],
        [C - 2, ly + 1],
        [C - 1, ly + 1],
        [C, ly + 1],
        [C + 1, ly + 1],
      ] as [number, number][]).forEach(([x, y]) => set(x, y, "A"));
    }
  }
  // 체형 표시: 하이브리드 별
  if (T.star) {
    const r = Math.round(cy + 2);
    ([
      [C - 1, r],
      [C, r],
      [C - 2, r + 1],
      [C - 1, r + 1],
      [C, r + 1],
      [C + 1, r + 1],
      [C - 1, r + 2],
      [C, r + 2],
    ] as [number, number][]).forEach(([x, y]) => set(x, y, "A"));
  }
  if (eq.body === "bib") {
    const r = Math.round(cy + 2);
    for (let y = r; y <= r + 2; y++) for (let x = C - 3; x <= C + 2; x++) set(x, y, "w");
    set(C - 1, r + 1, "K");
    set(C, r + 1, "K");
    set(C - 3, r, "R");
    set(C + 2, r, "R");
  }

  // 체형 표시: 스피드 뾰족머리 (모자류 착용 시 숨김)
  const hat = eq.head === "cap" || eq.head === "beanie";
  if (T.spike && !hat) {
    const s = moving ? [-1, 0, 1, 0][frame] : 0;
    ([
      [C - 3, top],
      [C - 3 + s, top - 1],
      [C, top],
      [C + s, top - 1],
      [C + s, top - 2],
      [C + 3, top],
      [C + 3 + s, top - 1],
    ] as [number, number][]).forEach(([x, y]) => set(x, y, "H"));
  }
  // 체형 표시: 수경 (비니 착용 시 숨김)
  if (T.gog && eq.head !== "beanie") {
    const gr = top + 2;
    for (let x = 0; x < N; x++) if (isB(g[gr][x])) g[gr][x] = "q";
    [C - 5, C - 4, C - 3, C + 2, C + 3, C + 4].forEach((x) => set(x, gr, "Q"));
    set(C - 5, gr, "W");
    set(C + 2, gr, "W");
  }
  // 머리 장비: 헤어밴드
  if (eq.head === "band") {
    const br = T.gog ? top + 3 : top + 2;
    for (let x = 0; x < N; x++) {
      const v = g[br][x];
      if (isB(v)) g[br][x] = v === "D" ? "r" : "R";
    }
  }
  // 목 장비: 스카프 (펄럭임)
  if (eq.neck === "scarf" && moving) {
    const sy = Math.round(cy - 1);
    const x0 = Math.round(C - T.rx) - (T.pack ? 3 : 1);
    for (let i = 0; i < 5; i++) {
      const wy = sy + ((i + tick) % 2 === 0 ? 0 : 1) + (i > 2 ? 1 : 0);
      set(x0 - i, wy, i % 2 ? "x" : "X");
      if (i < 3) set(x0 - i, wy + 1, "x");
    }
  }

  // 눈 · 입 · 볼
  const ey = Math.round(cy - 2);
  const bigEye = (x0: number) => {
    for (let y = ey; y < ey + 3; y++) for (let x = x0; x < x0 + 2; x++) set(x, y, "K");
    set(x0, ey, "W");
  };
  const arcs: [number, number][] = [
    [C - 5, ey + 2],
    [C - 4, ey + 1],
    [C - 3, ey + 1],
    [C - 2, ey + 2],
    [C + 1, ey + 2],
    [C + 2, ey + 1],
    [C + 3, ey + 1],
    [C + 4, ey + 2],
  ];
  const closedL = () => [C - 5, C - 4, C - 3].forEach((x) => set(x, ey + 2, "K"));
  if (expr === "sleep") [C - 5, C - 4, C - 3, C + 2, C + 3, C + 4].forEach((x) => set(x, ey + 2, "K"));
  else if (expr === "happy" || expr === "hifive") arcs.forEach(([x, y]) => set(x, y, "K"));
  else if (expr === "tired") {
    [C - 4, C - 3, C + 2, C + 3].forEach((x) => {
      set(x, ey + 1, "K");
      set(x, ey + 2, "K");
    });
    [C - 5, C - 4, C - 3, C - 2, C + 1, C + 2, C + 3, C + 4].forEach((x) => set(x, ey + 1, "K"));
  } else if (expr === "restless") {
    closedL();
    bigEye(C + 2);
  } else if (expr === "mad") {
    bigEye(C - 4);
    bigEye(C + 2);
  } else {
    const eye = o.eye ?? "round";
    if (eye === "dot")
      [C - 3, C + 2].forEach((x) => {
        set(x, ey + 1, "K");
        set(x, ey + 2, "K");
      });
    else if (eye === "happy") arcs.forEach(([x, y]) => set(x, y, "K"));
    else if (eye === "wink") {
      bigEye(C - 4);
      [C + 1, C + 2, C + 3].forEach((x) => set(x, ey + 2, "K"));
      set(C + 2, ey + 1, "K");
    } else {
      bigEye(C - 4);
      bigEye(C + 2);
    }
  }
  if (expr === "mad")
    ([
      [C - 5, ey - 2],
      [C - 4, ey - 2],
      [C - 3, ey - 1],
      [C + 4, ey - 2],
      [C + 3, ey - 2],
      [C + 2, ey - 1],
    ] as [number, number][]).forEach(([x, y]) => set(x, y, "K"));
  const my = ey + 4;
  if (expr === "mad" || expr === "tired") {
    set(C - 2, my + 1, "K");
    set(C - 1, my, "K");
    set(C, my, "K");
    set(C + 1, my + 1, "K");
  } else if (expr === "happy" || expr === "hifive") {
    [C - 2, C - 1, C, C + 1].forEach((x) => set(x, my, "K"));
    set(C - 1, my + 1, "P");
    set(C, my + 1, "P");
  } else if (expr === "sleep") {
    set(C - 1, my, "K");
    set(C, my, "K");
  } else if (expr === "restless") {
    set(C - 2, my + 1, "K");
    set(C - 1, my, "K");
    set(C, my + 1, "K");
    set(C + 1, my, "K");
  } else {
    set(C - 2, my, "K");
    set(C - 1, my + 1, "K");
    set(C, my + 1, "K");
    set(C + 1, my, "K");
  }
  if (expr !== "mad")
    [C - 7, C - 6, C + 5, C + 6].forEach((x) => {
      if (isB(g[ey + 3][x])) g[ey + 3][x] = "P";
    });
  if (expr === "tired") {
    const x = Math.round(C + T.rx) + 1;
    set(x, ey - 2, "Z");
    set(x, ey - 1, "Z");
    set(x - 1, ey - 1, "Z");
  }

  // 얼굴 장비: 선글라스 (표정보다 위에 그려짐)
  if (eq.face === "shades") {
    [C - 5, C - 4, C - 3, C - 2, C + 1, C + 2, C + 3, C + 4].forEach((x) => {
      set(x, ey, "K");
      set(x, ey + 1, "K");
    });
    set(C - 1, ey, "K");
    set(C, ey, "K");
    set(C - 5, ey, "W");
    set(C + 1, ey, "W");
  }
  // 머리 장비: 러닝캡 / 비니 / 헤드폰
  if (eq.head === "cap") {
    for (let x = C - 3; x <= C + 2; x++) set(x, top - 1, "p");
    for (let x = C - 5; x <= C + 4; x++) set(x, top, "p");
    for (let x = C - 6; x <= C + 5; x++) set(x, top + 1, "p");
    for (let x = C + 5; x <= C + 8; x++) set(x, top + 2, "v");
    set(C - 1, top, "A");
    set(C, top, "A");
  }
  if (eq.head === "beanie") {
    for (let y = top - 1; y <= top + 2; y++) {
      const h = [3, 5, 6, 7][y - top + 1];
      for (let x = C - h; x < C + h; x++) set(x, y, y === top + 2 ? "n" : "N");
    }
    ([
      [C - 1, top - 3],
      [C, top - 3],
      [C - 1, top - 2],
      [C, top - 2],
    ] as [number, number][]).forEach(([x, y]) => set(x, y, "w"));
  }
  if (eq.head === "phones") {
    const hr = top - 1;
    for (let x = C - 4; x <= C + 3; x++) set(x, hr, "K");
    set(C - 5, hr + 1, "K");
    set(C + 4, hr + 1, "K");
    const a = Math.round(C - T.rx) - 1;
    const b = Math.round(C + T.rx);
    for (let y = ey - 2; y <= ey + 1; y++) {
      set(a, y, "K");
      set(a + 1, y, "K");
      set(b - 1, y, "K");
      set(b, y, "K");
    }
    set(a, ey - 1, "A");
    set(b, ey - 1, "A");
    for (let y = hr + 1; y < ey - 2; y++) {
      set(C - 5 - (y > hr + 2 ? 1 : 0), y, "K");
      set(C + 4 + (y > hr + 2 ? 1 : 0), y, "K");
    }
  }

  // 외곽선 (땀방울 Z는 제외)
  const out = g.map((row) => row.slice());
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if (g[y][x] !== ".") continue;
      const touches = (
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as [number, number][]
      ).some(([a, b]) => {
        const v = g[y + b]?.[x + a];
        return v && v !== "." && v !== "Z";
      });
      if (touches) out[y][x] = "O";
    }

  return { grid: out, cy, top };
}

function mix(hex: string, target: "w" | "k", amount: number): string {
  const p = (s: string) => parseInt(s, 16);
  const r = p(hex.slice(1, 3));
  const g = p(hex.slice(3, 5));
  const b = p(hex.slice(5, 7));
  const T = target === "w" ? 255 : 0;
  const f = (v: number) =>
    Math.round(v + (T - v) * amount)
      .toString(16)
      .padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
}

// 문자 → 색. gold=true면 외곽선이 금색(Lv.30).
export function palette(color: string, gold?: boolean): Record<string, string> {
  return {
    O: gold ? "#c98f2a" : mix(color, "k", 0.62),
    B: color,
    L: mix(color, "w", 0.35),
    D: mix(color, "k", 0.22),
    H: mix(color, "k", 0.35),
    W: "#ffffff",
    K: "#1b1b22",
    P: "#ff9aa8",
    T: "#2c2d31",
    t: "#1f2023",
    A: "#f0b84a",
    R: "#e5484d",
    r: "#b8363a",
    S: "#f0b84a",
    s: "#ecebe4",
    X: "#f0b84a",
    x: "#c98f2a",
    Z: "#8fd3ff",
    Q: "#9fdcff",
    q: "#2c2d31",
    p: "#ecebe4",
    v: "#c9c7bd",
    w: "#ffffff",
    N: "#58607a",
    n: "#454b61",
  };
}

export type RacePaintOptions = RaceBuildOptions & {
  color: string;
  gold?: boolean;
  scale?: number;
};

// 캔버스에 그린다(좌상단 원점 기준, 위치를 옮기려면 호출 전에 ctx.translate). 그림자/체형별
// 오버레이(속도선·zZ·뒤척임 표시·하이파이브 이펙트·반짝이)도 여기서 함께 그린다.
export function paint(ctx: CanvasRenderingContext2D, o: RacePaintOptions): void {
  const s = o.scale ?? 3;
  const built = build(o);
  const pal = palette(o.color, o.gold);
  const frame = o.frame ?? -1;
  const moving = frame >= 0;
  const bob = moving && (frame === 1 || frame === 3) ? -s : 0;
  const tk = o.tick ?? 0;
  const T = TYPES[o.type] ?? TYPES.base;

  ctx.fillStyle = "rgba(0,0,0,.18)";
  ctx.fillRect(9 * s, 30.4 * s, 14 * s, s);

  if (T.spike && moving) {
    ctx.fillStyle = "rgba(150,155,170,.6)";
    ([
      [built.cy - 2, 4],
      [built.cy + 1, 6],
      [built.cy + 4, 3],
    ] as [number, number][]).forEach(([r, l], i) => {
      ctx.fillRect(0, Math.round(r) * s + bob, (l + ((frame + i) % 2 ? 1 : -1)) * s, s);
    });
  }

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const ch = built.grid[r][c];
      if (ch === ".") continue;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(c * s, r * s + bob, s, s);
    }
  }

  if (o.expr === "sleep") {
    ctx.fillStyle = "#a3a8d6";
    ctx.font = `${Math.round(s * 3.6)}px monospace`;
    const z = tk % 3;
    ctx.fillText("z", 24 * s, 8 * s - z * s);
    ctx.fillText("Z", 27 * s, 5 * s - z * s);
  }
  if (o.expr === "restless") {
    ctx.fillStyle = "#f0b84a";
    const t0 = built.top - 4;
    [t0, t0 + 1, t0 + 2, t0 + 4].forEach((r) => ctx.fillRect(26 * s, r * s + (tk % 2 ? 0 : -s), s, s));
  }
  if (o.expr === "hifive") {
    ctx.fillStyle = "#ff6f8f";
    [".x.x.", "xxxxx", ".xxx.", "..x.."].forEach((row, r) => {
      [...row].forEach((ch, c) => {
        if (ch === "x") ctx.fillRect((24 + c) * s, (Math.max(0, built.top - 7) + r) * s + (tk % 2 ? 0 : -s), s, s);
      });
    });
  }
  if (T.star || o.gold) {
    ctx.fillStyle = "#f0b84a";
    const positions: [number, number][] = [
      [3, 8],
      [28, 6],
      [2, 18],
      [29, 16],
    ];
    const p = positions[tk % 4];
    ctx.fillRect(p[0] * s, p[1] * s, s, s);
  }
}

export function renderAvatarDataUrl(o: RacePaintOptions): string {
  const s = o.scale ?? 3;
  const canvas = document.createElement("canvas");
  canvas.width = N * s;
  canvas.height = N * s;
  const ctx = canvas.getContext("2d")!;
  paint(ctx, o);
  return canvas.toDataURL();
}

// 리더보드 1위 캐릭터 머리 위에 그리는 왕관 — v3 레퍼런스엔 없는, 기존 기능 유지용 추가.
const CROWN = ["h..h..h", "hh.h.hh", "hhhhhhh"];

export function drawCrown(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = "#f0b84a";
  CROWN.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === "h") ctx.fillRect(x + (C - 3 + c) * s, y + r * s, s, s);
    });
  });
}

export const SPRITE_GRID_SIZE = N;
export const SPRITE_CENTER = C;
