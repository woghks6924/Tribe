// Tri.be Race 캐릭터 합성 모듈 (의존성 없음, 브라우저 Canvas 전용)
//
// 사용 예:
//   import { loadRaceAssets, Character, TypeFX, TYPES } from './tribe-sprite.js'
//   const A = await loadRaceAssets('/race-assets/')
//   const me = new Character(A, { hair: 'hair_ponytail', item: 'item_cap',
//     colors: { top: '#2b2b30', bottom: '#1f3b73', shoes: '#ff6b3d', hair: '#3a2a20' }, bib: 18 })
//   const fx = new TypeFX('run')
//   // 매 프레임:
//   const f = me.frameAt('running', 'east', timeMs)  // { canvas, cx, top, ground, landing }
//   // 땅에 세우기: y = 땅y - (f.ground + 1) * scale
//   fx.drawBehind(ctx, f, x, y, scale, timeMs, dt)
//   ctx.drawImage(f.canvas, x, y, f.canvas.width * scale, f.canvas.height * scale)
//   fx.drawFront(ctx, f, x, y, scale, timeMs, dt)

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v)
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
const lumOf = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  let h = 0
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6
    else if (mx === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
    if (h < 0) h += 1
  }
  return [h, mx ? d / mx : 0, mx]
}

function canvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const im = new Image()
    im.onload = () => res(im)
    im.onerror = rej
    im.src = src
  })
}

/**
 * manifest.json과 PNG들을 모두 불러온다.
 * opts.manifest / opts.urlFor 를 주면 fetch 없이 인라인 데이터로도 동작한다(미리보기용).
 */
export async function loadRaceAssets(base = '/race-assets/', opts = {}) {
  const manifest = opts.manifest || (await (await fetch(base + 'manifest.json')).json())
  const urlFor = opts.urlFor || ((src) => base + src)
  const imgs = {}
  const srcs = []
  for (const dirs of Object.values(manifest.anims)) for (const a of Object.values(dirs)) srcs.push(a.src)
  for (const dirs of Object.values(manifest.layers)) for (const l of Object.values(dirs)) srcs.push(l.src)
  for (const p of Object.values(manifest.pets || {})) for (const k of ['still', 'run']) for (const v of Object.values(p[k] || {})) srcs.push(v.src)
  await Promise.all(srcs.map((s) => loadImage(urlFor(s)).then((im) => (imgs[s] = im))))
  const lut = new Map(Object.entries(manifest.lut))
  const lutRgb = [...lut.keys()].map((k) => [k, hexToRgb(k)])
  return { manifest, imgs, lut, lutRgb, regionCache: new Map() }
}

export const HAIR_STYLES = ['hair_twoblock', 'hair_sidepart', 'hair_pomade', 'hair_curly', 'hair_bun', 'hair_ponytail', 'hair_twintail', 'hair_long', 'hair_braid']
export const ITEMS = [
  'item_cap', 'item_beanie', 'item_headband', 'item_headphones', 'head_bucket', 'head_visor', 'head_earmuffs',
  'head_swimcap', 'head_helmet', 'head_crown', 'head_santa', 'item_sunglasses',
  'item_scarf', 'neck_medal', 'neck_towel', 'neck_gaiter',
  'back_pack', 'back_vest', 'back_flag', 'back_cape', 'back_wings', 'waist_belt', 'waist_jacket',
]

// 색 → 부위 판정. 옷 색은 상의/하의/신발이 같은 회색 팔레트를 공유하므로 머리 꼭대기 기준 높이로 나눈다.
function regionOf(A, r, g, b, relY) {
  const key = toHex(r, g, b)
  let L = A.regionCache.get(key)
  if (L === undefined) {
    L = A.lut.get(key) || null
    if (!L) {
      // 애니메이션에만 나오는 색: 가장 가까운 색을 쓰되, 너무 멀면 원래 색 유지
      let best = null, bd = 1e9
      for (const [k, [R, G, B]] of A.lutRgb) {
        const d = (R - r) ** 2 + (G - g) ** 2 + (B - b) ** 2
        if (d < bd) { bd = d; best = k }
      }
      L = bd < 30 * 30 ? A.lut.get(best) : null
    }
    A.regionCache.set(key, L)
  }
  if (!L) return null
  if ((L.hair || 0) >= 0.5) return 'hair'
  if ((L.top || 0) + (L.bottom || 0) + (L.shoes || 0) < 0.5) return null
  const { topMax, bottomMax } = A.manifest.bands
  return relY <= topMax ? 'top' : relY <= bottomMax ? 'bottom' : 'shoes'
}

// 명암은 유지하고 색만 바꾼다: 목표색 + (원래 밝기 - 부위 평균 밝기)
function tint(d, i, target, meanL) {
  const k = (lumOf(d[i], d[i + 1], d[i + 2]) - meanL) * 0.85
  d[i] = clamp(Math.round(target[0] + k))
  d[i + 1] = clamp(Math.round(target[1] + k))
  d[i + 2] = clamp(Math.round(target[2] + k))
}

// 앞쪽 장비를 그리는 순서 (뒤에 있는 것부터)
const FRONT_ORDER = ['waist', 'back', 'neck', 'face', 'head']
// 달릴 때 펄럭이는 장비: 프레임마다 1px씩 흔든다
const SWAYING = ['back_cape', 'back_flag']
const SWAY = [0, -1, -1, 0, 0, -1, -1, 0]

const DEFAULT_COLORS = { top: '#2b2b30', bottom: '#2c3e66', shoes: '#f2f2ee', hair: '#2a2430' }

export class Character {
  /**
   * look = { hair: 'hair_long' | null,
   *          items: ['item_cap', 'neck_medal', 'back_pack'],  // 부위(head/face/neck/back/waist)마다 1개
   *          colors: { top, bottom, shoes, hair }, bib: 숫자 | null }
   * (예전 형식 item: 'item_cap' 도 받는다)
   */
  constructor(A, look = {}) {
    this.A = A
    this.look = { hair: null, items: [], bib: null, ...look, colors: { ...DEFAULT_COLORS, ...(look.colors || {}) } }
    this.cache = {}
    this.layerCache = {}
  }

  setLook(look) {
    this.look = { ...this.look, ...look, colors: { ...this.look.colors, ...(look.colors || {}) } }
    this.cache = {}
    this.layerCache = {}
  }

  hasAnim(anim, dir) {
    return !!(this.A.manifest.anims[anim] && this.A.manifest.anims[anim][dir])
  }

  /** 애니메이션 프레임 배열(구워 둔 canvas). 방향이 없으면 south로 대체. */
  frames(anim, dir = 'east') {
    const M = this.A.manifest
    if (!this.hasAnim(anim, dir)) dir = 'south'
    const key = anim + '/' + dir
    if (this.cache[key]) return this.cache[key]
    const a = M.anims[anim][dir]
    const sheet = this.A.imgs[a.src]
    const [fw, fh] = a.size
    const out = []
    for (let f = 0; f < a.frames; f++) {
      const [cx, top] = a.anchors[f]
      const c = canvas(fw, fh)
      const ctx = c.getContext('2d')
      // 몸통만 먼저 따로 구워서 색을 바꾸고, 등 뒤 장비 → 몸 → 머리 → 앞 장비 순서로 합친다
      const body = canvas(fw, fh)
      const bctx = body.getContext('2d')
      bctx.drawImage(sheet, f * fw, 0, fw, fh, 0, 0, fw, fh)
      const bottom = this._recolorBody(bctx, fw, fh, top)
      const sway = SWAY[f % SWAY.length]
      this._drawLayers(ctx, dir, cx, top, 'behind', sway)
      ctx.drawImage(body, 0, 0)
      this._drawLayers(ctx, dir, cx, top, 'front', sway)
      const prevTop = a.anchors[(f - 1 + a.frames) % a.frames][1]
      out.push({ canvas: c, cx, top, bottom, landing: top > prevTop })
    }
    // 발 밑 기준선: 애니메이션 전체에서 가장 낮은 줄 (캐릭터를 땅에 세울 때 사용)
    const base = Math.max(...out.map((o) => o.bottom))
    for (const o of out) {
      o.ground = base
      delete o.bottom
    }
    this.cache[key] = out
    return out
  }

  /** 시간(ms) 기준 현재 프레임. fps 기본 10. */
  frameAt(anim, dir, timeMs, fps = 10) {
    const fr = this.frames(anim, dir)
    return fr[Math.floor((timeMs / 1000) * fps) % fr.length]
  }

  _recolorBody(ctx, w, h, top) {
    const M = this.A.manifest
    const img = ctx.getImageData(0, 0, w, h)
    const d = img.data
    const tg = {}
    for (const r of ['top', 'bottom', 'shoes', 'hair']) tg[r] = hexToRgb(this.look.colors[r])
    let bottom = 0
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        if (!d[i + 3]) continue
        bottom = y
        const r = regionOf(this.A, d[i], d[i + 1], d[i + 2], y - top)
        if (r) tint(d, i, tg[r], M.regionLum[r])
      }
    }
    ctx.putImageData(img, 0, 0)
    return bottom
  }

  // 헤어 레이어는 머리색 계열(푸른 회색) 픽셀만 칠하고, 진한 외곽선은 그대로 둔다
  _layer(name, dir) {
    const key = name + '/' + dir
    if (key in this.layerCache) return this.layerCache[key]
    const L = this.A.manifest.layers[name] && this.A.manifest.layers[name][dir]
    if (!L) return (this.layerCache[key] = null)
    const im = this.A.imgs[L.src]
    const c = canvas(im.width, im.height)
    const ctx = c.getContext('2d')
    ctx.drawImage(im, 0, 0)
    if (name.startsWith('hair_')) {
      const img = ctx.getImageData(0, 0, c.width, c.height)
      const d = img.data
      const tg = hexToRgb(this.look.colors.hair)
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue
        const [hh, s, v] = rgbToHsv(d[i], d[i + 1], d[i + 2])
        if (hh > 0.5 && hh < 0.8 && s < 0.5 && v < 0.6 && v >= 0.24) tint(d, i, tg, this.A.manifest.regionLum.hair)
      }
      ctx.putImageData(img, 0, 0)
    }
    return (this.layerCache[key] = { canvas: c, dx: L.dx, dy: L.dy })
  }

  _items() {
    const { item, items } = this.look
    const list = [...(items || []), ...(item ? [item] : [])]
    const M = this.A.manifest, seen = {}
    // 같은 부위는 마지막 것만
    for (const n of list) if (M.layers[n]) seen[(M.slots && M.slots[n]) || n] = n
    return Object.values(seen)
  }

  _drawLayers(ctx, dir, cx, top, pass, sway = 0) {
    const M = this.A.manifest
    const items = this._items()
    const behind = M.behind || []
    const put = (name) => {
      const L = this._layer(name, dir)
      if (!L) return
      const s = SWAYING.includes(name) ? sway : 0
      ctx.drawImage(L.canvas, Math.round(cx + L.dx) + (dir === 'south' ? 0 : s), top + L.dy + (dir === 'south' ? s : 0))
    }
    if (pass === 'behind') {
      items.filter((n) => behind.includes(n)).forEach(put)
      return
    }
    const { hair, bib } = this.look
    const H = hair && this._layer(hair, dir)
    const hatName = items.find((n) => M.hats.includes(n))
    const I = hatName && this._layer(hatName, dir)
    if (H) {
      const hx = Math.round(cx + H.dx), hy = top + H.dy
      if (I) {
        // 모자 규칙: 모자 챙(맨 아래 줄) 위로 삐져나오는 머리는 자른다.
        // 묶은 머리·땋은 머리·트윈테일처럼 모자 옆/아래로 내려오는 부분은 남는다. 번은 모자 속으로 숨긴다.
        const tmp = canvas(ctx.canvas.width, ctx.canvas.height)
        const t = tmp.getContext('2d')
        t.drawImage(H.canvas, hx, hy)
        const ix = Math.round(cx + I.dx), iy = top + I.dy
        const brim = iy + I.canvas.height - 2
        if (hair === 'hair_bun') t.clearRect(0, 0, tmp.width, brim)
        else t.clearRect(ix - 2, 0, I.canvas.width + 4, brim)
        ctx.drawImage(tmp, 0, 0)
      } else {
        ctx.drawImage(H.canvas, hx, hy)
      }
    }
    if (bib != null) this._drawBib(ctx, dir, cx, top, String(bib))
    const slot = (n) => (M.slots && M.slots[n]) || 'head'
    for (const s of FRONT_ORDER) items.filter((n) => !behind.includes(n) && slot(n) === s).forEach(put)
  }

  // 배번: 흰 천 + 3x5 픽셀 숫자 (정면에서만)
  _drawBib(ctx, dir, cx, top, text) {
    const y = top + 21
    if (dir !== 'south') return // 옆모습에서는 배번이 안 보인다
    text = text.slice(-2)
    const w = text.length * 4 + 3
    const x = Math.round(cx - w / 2)
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(x - 1, y - 1, w + 2, 9)
    ctx.fillStyle = '#f4f4f0'
    ctx.fillRect(x, y, w, 7)
    ctx.fillStyle = '#d23a2f'
    ctx.fillRect(x, y, w, 1)
    ctx.fillStyle = '#1a1a1a'
    ;[...text].forEach((ch, k) => {
      const g = DIGITS[ch] || DIGITS['0']
      g.forEach((row, r) => [...row].forEach((p, c) => p === '#' && ctx.fillRect(x + 2 + k * 4 + c, y + 2 + r - 1, 1, 1)))
    })
  }
}

const DIGITS = {
  0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['###', '..#', '###', '#..', '###'],
  3: ['###', '..#', '.##', '..#', '###'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '###', '..#', '###'],
  6: ['###', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
  9: ['###', '#.#', '###', '..#', '###'],
}

// ───────────────────────── 펫 ─────────────────────────

export const PETS = {
  pet_cat: '고양이', pet_corgi: '코기', pet_bichon: '비숑', pet_retriever: '리트리버', pet_maltese: '말티즈',
  pet_bird: '새', pet_shark: '상어', pet_dolphin: '돌고래', pet_hamster: '햄스터', pet_quokka: '쿼카',
  pet_capybara: '카피바라', pet_squirrel: '다람쥐',
}
// 다리 없는 펫: 떠서 따라온다
const FLOATING = ['pet_bird', 'pet_shark', 'pet_dolphin']

/**
 * 펫. 달리기 애니메이션이 있으면 그걸 쓰고, 없으면 정지 그림을 코드로 깡총(또는 둥실) 움직인다.
 *   const pet = new Pet(A, 'pet_cat')
 *   pet.draw(ctx, footX, groundY, scale, timeMs, { dir: 'east', moving: true })
 *   (animated: false 로 주면 달리기 애니메이션이 있어도 깡총 버전으로 그린다)
 *   footX = 펫 몸 가운데 x, groundY = 발 밑 y (캐릭터와 같은 땅)
 */
export class Pet {
  constructor(A, name) {
    this.A = A
    this.name = name
    this.P = (A.manifest.pets || {})[name]
  }

  draw(ctx, x, groundY, s, t, { dir = 'east', moving = true, animated = true } = {}) {
    const P = this.P
    if (!P) return
    const run = animated && moving && P.run && P.run[dir]
    let img, sx = 0, w, h, ground, lift = 0, squash = 0
    if (run) {
      const f = Math.floor((t / 1000) * 12) % run.frames
      img = this.A.imgs[run.src]
      ;[w, h] = run.size
      sx = f * w
      ground = run.ground
    } else {
      const still = P.still[dir] || P.still.south
      img = this.A.imgs[still.src]
      ;[w, h] = still.size
      ground = still.ground
      if (FLOATING.includes(this.name)) {
        lift = 6 + Math.round(Math.sin(t / 260) * 2)
      } else if (moving) {
        const ph = (t / 300) % 1 // 깡총: 0.3초에 한 번
        lift = Math.round(Math.sin(ph * Math.PI) * 4)
        squash = ph < 0.08 || ph > 0.92 ? 1 : 0 // 착지 순간 살짝 납작
      } else {
        squash = Math.floor(t / 900) % 2 // 숨쉬기
      }
    }
    const dx = Math.round(x - (w / 2) * s)
    const dy = Math.round(groundY - (ground + 1) * s - lift * s)
    ctx.drawImage(img, sx, 0, w, h, dx, dy + squash * s, w * s, (h - squash) * s)
  }
}

// ───────────────────────── 훈련 유형 연출 ─────────────────────────

export const TYPES = {
  base: { name: '새내기', color: '#9ee0aa', desc: '새싹' },
  run: { name: '러너형', color: '#9cc7ff', desc: '속도선' },
  long: { name: '장거리형', color: '#58c9c0', desc: '땀방울·발자국' },
  speed: { name: '스피드형', color: '#f0d24a', desc: '잔상·번개' },
  wod: { name: '파워형', color: '#ef6a5a', desc: '붉은 기운·착지 먼지' },
  swim: { name: '스위머형', color: '#5fb8ff', desc: '물방울' },
  tri: { name: '철인형', color: '#c690e6', desc: '3색 리본' },
  hybrid: { name: '하이브리드', color: '#f0b84a', desc: '금테·반짝이' },
}

export const TYPE_ICONS = {
  base: ['..g..', '.ggg.', 'g.g.g', '..g..', '..g..'], run: ['.....', '..xx.', 'xxxx.', 'xxxxx', '.....'],
  long: ['..x..', '.xxx.', 'xxxxx', 'xx.xx', '.....'], speed: ['..xx.', '.xx..', 'xxxx.', '..xx.', '.xx..'],
  wod: ['x...x', 'xxxxx', 'x.x.x', 'xxxxx', 'x...x'], swim: ['.....', '.x.x.', 'x.x.x', '.....', 'x.x.x'],
  tri: ['..x..', '.x.x.', 'x...x', 'xxxxx', '.....'], hybrid: ['..x..', '.xxx.', 'xxxxx', '.xxx.', 'x...x'],
}

/** 유형 아이콘(5x5)을 px 크기로 그린다. */
export function drawTypeIcon(ctx, type, x, y, px = 2, bg = true) {
  const t = TYPES[type]
  if (!t) return
  if (bg) {
    ctx.fillStyle = 'rgba(0,0,0,.5)'
    ctx.fillRect(x - px, y - px, px * 7, px * 7)
  }
  ctx.fillStyle = t.color
  TYPE_ICONS[type].forEach((row, r) => [...row].forEach((ch, c) => ch !== '.' && ctx.fillRect(x + c * px, y + r * px, px, px)))
}

const silCache = new WeakMap()
function silhouette(frameCanvas, color) {
  let m = silCache.get(frameCanvas)
  if (!m) silCache.set(frameCanvas, (m = {}))
  if (!m[color]) {
    const c = canvas(frameCanvas.width, frameCanvas.height)
    const x = c.getContext('2d')
    x.drawImage(frameCanvas, 0, 0)
    x.globalCompositeOperation = 'source-in'
    x.fillStyle = color
    x.fillRect(0, 0, c.width, c.height)
    m[color] = c
  }
  return m[color]
}

/**
 * 유형별 효과. 캐릭터 그리기 전에 drawBehind, 그린 뒤 drawFront 를 부른다.
 * f = Character.frameAt() 결과, (x, y) = 프레임 왼쪽 위, s = 배율, groundY = 발 밑 y(없으면 자동)
 * 오른쪽(east)으로 달리는 기준. 캐릭터마다 TypeFX 인스턴스를 하나씩 둔다.
 */
export class TypeFX {
  constructor(type) {
    this.type = type
    this.parts = []
    this.prevFrame = []
    this.lastLanding = null
  }

  drawBehind(ctx, f, x, y, s, t, dt, groundY) {
    const k = this.type
    const W = f.canvas.width * s, H = f.canvas.height * s
    const col = TYPES[k] && TYPES[k].color
    const cx = x + f.cx * s, top = y + f.top * s
    this.gy = groundY != null ? groundY : y + (f.ground + 1) * s
    if (k === 'wod' && Math.floor(t / 120) % 2)
      for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        ctx.globalAlpha = 0.55
        ctx.drawImage(silhouette(f.canvas, col), x + a * s, y + b * s, W, H)
      }
    if (k === 'hybrid')
      for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        ctx.globalAlpha = 0.85
        ctx.drawImage(silhouette(f.canvas, col), x + a * s, y + b * s, W, H)
      }
    if (k === 'speed') {
      this.prevFrame.unshift(f.canvas)
      this.prevFrame = this.prevFrame.slice(0, 4)
      this.prevFrame.slice(1).forEach((c, i) => {
        ctx.globalAlpha = 0.35 - i * 0.1
        ctx.drawImage(silhouette(c, col), x - (i + 1) * 5 * s, y, W, H)
      })
    }
    ctx.globalAlpha = 1
    if (k === 'tri') {
      ;['#5fb8ff', '#f0b84a', '#ef6a5a'].forEach((c, i) => {
        for (let j = 0; j < 10; j++) {
          const px = cx - 6 * s - j * 2 * s, py = top + (20 + i * 3) * s + Math.sin(t / 120 + j * 0.7) * 1.5 * s
          this._px(ctx, px, py, c, 1 - j / 10, s)
        }
      })
    }
    if (k === 'run' || k === 'speed') {
      ctx.fillStyle = k === 'run' ? 'rgba(200,215,240,.6)' : 'rgba(240,210,74,.65)'
      const fi = Math.floor(t / 100)
      ;[[16, 9], [24, 13], [32, 7]].forEach(([dy, l], i) => {
        const len = (l + ((fi + i) % 2 ? 4 : 0)) * s
        ctx.fillRect(cx - 9 * s - len, top + dy * s, len, s)
      })
    }
  }

  drawFront(ctx, f, x, y, s, t, dt) {
    const k = this.type
    const cx = x + f.cx * s, top = y + f.top * s, gy = this.gy
    if (f.landing && this.lastLanding !== f) {
      if (k === 'wod') for (let i = 0; i < 6; i++) this.parts.push({ x: cx + (Math.random() * 10 - 5) * s, y: gy - s, vx: (Math.random() - 0.5) * 1.4, vy: -0.6 - Math.random() * 0.6, l: 1, c: '#8a8070', g: 1 })
      if (k === 'long') this.parts.push({ x: cx, y: gy, vx: -0.9, vy: 0, l: 1.6, c: '#58c9c0', foot: 1 })
      if (k === 'swim') for (let i = 0; i < 5; i++) this.parts.push({ x: cx + (Math.random() * 10 - 5) * s, y: gy - 2 * s, vx: (Math.random() - 0.5) * 1.6, vy: -1 - Math.random() * 0.8, l: 1, c: '#8fd3ff', g: 1 })
    }
    this.lastLanding = f.landing ? f : null
    const r = Math.random()
    if (k === 'long' && r < dt / 260) this.parts.push({ x: cx + (4 + Math.random() * 4) * s, y: top + (4 + Math.random() * 4) * s, vx: 0.4, vy: 0.2, l: 1, c: '#8fd3ff', g: 1 })
    if (k === 'swim' && r < dt / 140) this.parts.push({ x: cx + (Math.random() * 20 - 10) * s, y: top + (30 + Math.random() * 10) * s, vx: 0, vy: -0.6, l: 1.2, c: Math.random() < 0.5 ? '#5fb8ff' : '#bfe6ff' })
    if (k === 'hybrid' && r < dt / 140) {
      const a = Math.random() * 6.28
      this.parts.push({ x: cx + Math.cos(a) * 18 * s, y: top + 18 * s + Math.sin(a) * 18 * s, vx: 0, vy: -0.2, l: 1, c: '#f0b84a' })
    }
    if (k === 'speed' && r < dt / 220) this.parts.push({ x: cx - Math.random() * 16 * s, y: top + (10 + Math.random() * 25) * s, vx: -1.5, vy: 0, l: 0.6, c: '#f0d24a' })
    if (k === 'base' && r < dt / 700) this.parts.push({ x: cx + (Math.random() * 8 - 4) * s, y: top - 2 * s, vx: 0, vy: -0.3, l: 1, c: '#ecebe4' })

    const m = s / 2
    this.parts = this.parts.filter((p) => p.l > 0)
    for (const p of this.parts) {
      p.x += p.vx * dt * 0.12 * m
      p.y += p.vy * dt * 0.12 * m
      if (p.g) p.vy += dt * 0.004
      p.l -= dt * 0.0015
      const a = Math.max(0, Math.min(1, p.l))
      if (p.foot) {
        ctx.globalAlpha = a * 0.6
        ctx.fillStyle = p.c
        ctx.fillRect(Math.round(p.x), gy, 4 * s, 2 * s)
        ctx.globalAlpha = 1
      } else this._px(ctx, p.x, p.y, p.c, a, s)
    }
    if (k === 'base') {
      // 머리 위 새싹
      const sx = Math.round(cx), sy = Math.round(top - 3 * s)
      ctx.fillStyle = '#5fbf6a'
      ctx.fillRect(sx, sy, s, 3 * s)
      ctx.fillRect(sx - 2 * s, sy - s, 2 * s, s)
      ctx.fillRect(sx + s, sy - 2 * s, 2 * s, s)
    }
  }

  _px(ctx, x, y, c, a, s) {
    ctx.globalAlpha = a
    ctx.fillStyle = c
    ctx.fillRect(Math.round(x), Math.round(y), s, s)
    ctx.globalAlpha = 1
  }
}
