import type { RaceAcc, RaceBodyType, RaceEye } from "@/lib/race/constants";

// 22x22 그리드에 캐릭터를 픽셀 단위로 그려 넣는다. 순수 데이터 로직이라 서버/클라이언트
// 어디서든 호출 가능하고, 실제 캔버스에 칠하는 drawSprite/drawCrown만 CanvasRenderingContext2D가
// 있는 클라이언트에서 쓰인다. 나중에 실제 픽셀아트 이미지로 교체할 때는 이 grid()가 반환하는
// 문자 배열 대신 이미지 스프라이트시트 좌표를 반환하도록만 바꾸면 drawSprite 쪽은 그대로 둘 수 있다.
export type RaceSpriteGrid = { rows: string[][]; top: number };

const N = 22;
const C = 11;

type TypeShape = {
  rx: number;
  ry: number;
  leg: number;
  lw: number;
  arm: "nub" | "fist" | "fists" | "fin" | null;
  band?: boolean;
};

const TYPES: Record<RaceBodyType, TypeShape> = {
  base: { rx: 5, ry: 5, leg: 2, lw: 1, arm: null },
  run: { rx: 4.3, ry: 4.8, leg: 5, lw: 1, arm: "nub" },
  wod: { rx: 6.2, ry: 5, leg: 2, lw: 2, arm: "fist" },
  swim: { rx: 6.2, ry: 4.2, leg: 2, lw: 1, arm: "fin" },
  hybrid: { rx: 5.2, ry: 5, leg: 4, lw: 1, arm: "fists", band: true },
};

const spriteCache = new Map<string, RaceSpriteGrid>();

function inEllipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number): boolean {
  return ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
}

export function grid(
  type: RaceBodyType,
  frame: number,
  sleep: boolean,
  eye: RaceEye = "dot",
  acc: RaceAcc = "none",
): RaceSpriteGrid {
  const key = [type, frame, sleep, eye, acc].join("|");
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const T = TYPES[type];
  const g: string[][] = Array.from({ length: N }, () => Array(N).fill("."));
  const cy = 20 - T.leg + 0.5 - T.ry;

  const legTop = Math.floor(cy + T.ry) - 1;
  ([
    [-1, C - 3 - (T.lw - 1)],
    [1, C + 2],
  ] as const).forEach(([side, x0]) => {
    const lift = (frame === 0 && side < 0) || (frame === 1 && side > 0) ? 1 : 0;
    for (let y = legTop; y <= 20 - lift; y++) {
      for (let x = x0; x < x0 + T.lw; x++) g[y][x] = y === 20 - lift ? "s" : "b";
    }
  });

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (inEllipse(x, y, C, cy, T.rx, T.ry)) g[y][x] = "b";
    }
  }

  const blob = (cx: number, cy0: number, rx: number, ry: number) => {
    for (let y = 1; y < N - 1; y++) {
      for (let x = 1; x < N - 1; x++) {
        if (inEllipse(x, y, cx, cy0, rx, ry)) g[y][x] = "b";
      }
    }
  };
  [-1, 1].forEach((sd) => {
    if (T.arm === "nub") blob(C + sd * (T.rx + 0.5), cy + 1.3, 1.2, 1.2);
    if (T.arm === "fist") blob(C + sd * (T.rx + 1.1), cy + 1, 1.9, 1.9);
    if (T.arm === "fists") blob(C + sd * (T.rx + 0.7), cy + 1, 1.4, 1.4);
    if (T.arm === "fin") blob(C + sd * (T.rx + 1.3), cy - 0.6, 2.2, 1);
  });

  if (T.band) {
    const by = Math.round(cy - T.ry + 1.5);
    for (let x = 0; x < N; x++) if (g[by][x] === "b") g[by][x] = "h";
  }

  const ey = Math.round(cy - 1);
  const set = (x: number, y: number, ch: string, onlyBody = false) => {
    if (y < 0 || y >= N || x < 0 || x >= N) return;
    if (onlyBody && g[y][x] === ".") return;
    g[y][x] = ch;
  };

  if (acc === "shades") {
    [C - 4, C - 1, C, C + 3].forEach((x) => set(x, ey, "k", true));
    [C - 3, C - 2, C + 1, C + 2].forEach((x) => {
      set(x, ey, "k");
      set(x, ey + 1, "k");
    });
    set(C - 3, ey, "w");
    set(C + 1, ey, "w");
  } else if (sleep) {
    [C - 3, C - 2, C + 1, C + 2].forEach((x) => set(x, ey + 1, "k"));
  } else if (eye === "round") {
    [C - 3, C - 2, C + 1, C + 2].forEach((x) => {
      set(x, ey, "k");
      set(x, ey + 1, "k");
    });
    set(C - 3, ey, "w");
    set(C + 1, ey, "w");
  } else if (eye === "happy") {
    ([
      [C - 4, C - 3, C - 2],
      [C + 1, C + 2, C + 3],
    ] as const).forEach(([a, b, c]) => {
      set(a, ey + 1, "k", true);
      set(b, ey, "k");
      set(c, ey + 1, "k");
    });
  } else if (eye === "wink") {
    set(C - 2, ey, "k");
    set(C - 2, ey + 1, "k");
    set(C + 1, ey + 1, "k");
    set(C + 2, ey + 1, "k");
    set(C + 2, ey, "k");
  } else {
    [C - 2, C + 1].forEach((x) => {
      set(x, ey, "k");
      set(x, ey + 1, "k");
    });
  }

  g[ey + 3][C - 1] = "m";
  g[ey + 3][C] = "m";
  [C - 3, C + 2].forEach((x) => {
    if (g[ey + 2][x] === "b") g[ey + 2][x] = "c";
  });

  const top = Math.floor(cy - T.ry);
  if (acc === "bib") {
    for (let x = C - 2; x <= C + 1; x++) {
      if (g[ey + 4]?.[x] === "b") g[ey + 4][x] = "w";
      if (g[ey + 5]?.[x] === "b") g[ey + 5][x] = "w";
    }
    [C - 1, C].forEach((x) => {
      if (g[ey + 5]?.[x] === "w") g[ey + 5][x] = "k";
    });
  }
  if (acc === "band") {
    const by = Math.round(cy - T.ry + 1.5);
    for (let x = 0; x < N; x++) if (g[by][x] === "b" || g[by][x] === "h") g[by][x] = "r";
  }
  if (acc === "cap") {
    for (let x = C - 2; x <= C + 1; x++) set(x, top - 1, "p");
    for (let x = C - 4; x <= C + 3; x++) set(x, top, "p");
    for (let x = C - 5; x <= C + 6; x++) set(x, top + 1, "p");
  }

  const outline = g.map((row) => row.slice());
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (g[y][x] !== ".") continue;
      const touchesBody = ([
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const).some(([dx, dy]) => {
        const v = g[y + dy]?.[x + dx];
        return v && v !== ".";
      });
      if (touchesBody) outline[y][x] = "o";
    }
  }

  const result: RaceSpriteGrid = { rows: outline, top: acc === "cap" ? top - 1 : top };
  spriteCache.set(key, result);
  return result;
}

// 문자 → 색상 매핑. b(몸통)는 캐릭터 고유 색, 나머지는 고정 색.
const COLOR_MAP: Record<string, string> = {
  o: "#0e0f11",
  k: "#0e0f11",
  m: "#0e0f11",
  s: "#ecebe4",
  c: "#ff9aa2",
  h: "#f0b84a",
  p: "#ecebe4",
  r: "#e5484d",
  w: "#ffffff",
};

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  g: RaceSpriteGrid,
  color: string,
  x: number,
  y: number,
  s: number,
) {
  for (let r = 0; r < N; r++) {
    const row = g.rows[r];
    for (let c = 0; c < N; c++) {
      const ch = row[c];
      if (ch === ".") continue;
      ctx.fillStyle = ch === "b" ? color : (COLOR_MAP[ch] ?? color);
      ctx.fillRect(x + c * s, y + r * s, s, s);
    }
  }
}

const CROWN = ["h..h..h", "hh.h.hh", "hhhhhhh"];

export function drawCrown(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = "#f0b84a";
  CROWN.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === "h") ctx.fillRect(x + (C - 3 + c) * s, y + r * s, s, s);
    });
  });
}

export const SPRITE_GRID_SIZE = N;
export const SPRITE_CENTER = C;

// 캐릭터 아바타를 base64 PNG data URL로 렌더링 — 리더보드 썸네일, 마이카드 등에서 사용.
// document가 없는 서버 환경에서는 호출하지 않는다(클라이언트 컴포넌트에서만 사용).
export function renderAvatarDataUrl(
  color: string,
  eye: RaceEye,
  acc: RaceAcc,
  type: RaceBodyType,
  sleep: boolean,
  scale: number,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = N * scale;
  canvas.height = N * scale;
  const ctx = canvas.getContext("2d")!;
  drawSprite(ctx, grid(type, 2, sleep, eye, acc), color, 0, 0, scale);
  return canvas.toDataURL();
}
