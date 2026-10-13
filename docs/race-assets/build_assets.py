"""Tri.be Race 캐릭터 에셋 빌드 스크립트.

PixelLab 캐릭터 Export(zip 압축 해제 폴더)를 읽어서
  - base 애니메이션을 동작/방향별 스프라이트 시트로 저장
  - hair_* / item_* State를 base와 비교해 레이어만 떼어내고 머리 기준점 오프셋을 기록
  - base vs colormap 정지 이미지로 '색 → 부위' 대응표(LUT)를 만들고
  - manifest.json 하나로 정리한다.

사용법: python build_assets.py <export_dir> <out_dir>
"""
import colorsys
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image

DIRS = ["south", "east"]


def head_anchor(im):
    """이미지에서 머리 꼭대기 y와, 그 4픽셀 아래 줄의 가로 중심 x."""
    p = im.load()
    W, H = im.size
    top = next(y for y in range(H) for x in range(W) if p[x, y][3])
    xs = [x for x in range(W) if p[x, top + 4][3]]
    return top, (min(xs) + max(xs)) / 2


def region_of(px):
    r, g, b, a = px
    if not a:
        return None
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if s > 0.6 and v > 0.5:
        if h < 0.05 or h > 0.95:
            return "top"
        if 0.12 < h < 0.2:
            return "hair"
        if 0.25 < h < 0.45:
            return "shoes"
        if 0.55 < h < 0.72:
            return "bottom"
    return "keep"


def _hsv(px):
    return colorsys.rgb_to_hsv(px[0] / 255, px[1] / 255, px[2] / 255)


def _hairlike(px):
    """PixelLab 기본 머리색(푸른 회색) 계열인지."""
    if not px[3]:
        return False
    h, s, v = _hsv(px)
    return 0.5 < h < 0.8 and s < 0.5 and v < 0.6


def _dark(px):
    return px[3] and _hsv(px)[2] < 0.24


def _components(pts):
    pts, seen, comps = set(pts), set(), []
    for s0 in pts:
        if s0 in seen:
            continue
        stack, comp = [s0], []
        seen.add(s0)
        while stack:
            u = stack.pop()
            comp.append(u)
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    v = (u[0] + dx, u[1] + dy)
                    if v in pts and v not in seen:
                        seen.add(v)
                        stack.append(v)
        comps.append(comp)
    return sorted(comps, key=len, reverse=True)


def _changed(q, o, thresh):
    return q[3] and (o[3] == 0 or sum(abs(q[k] - o[k]) for k in range(3)) > thresh)


def extract_hair(base_im, state_im, base_hair_mask, thresh=45):
    """헤어 State에서 '머리 전체'를 떼어낸다.

    diff만 쓰면 기본 머리와 겹치는 부분이 빠져 조각나므로,
    머리색 계열 픽셀 중 (바뀌었거나 / 원래 머리 자리였던) 것 + 새로 생긴 외곽선을 모두 담는다.
    피부색 픽셀(붉은 계열)은 머리색 조건에서 자동으로 빠진다.
    """
    pb, ps = base_im.load(), state_im.load()
    W, H = base_im.size
    pts = set()
    for y in range(H):
        for x in range(W):
            q, o = ps[x, y], pb[x, y]
            if _hairlike(q) and (_changed(q, o, thresh) or (x, y) in base_hair_mask):
                pts.add((x, y))
    # 새로 생긴 외곽선: 머리 픽셀에 붙어 있는 어두운 픽셀 중 base와 달라진 것
    for y in range(H):
        for x in range(W):
            q, o = ps[x, y], pb[x, y]
            if _dark(q) and _changed(q, o, thresh) and any(
                (x + dx, y + dy) in pts for dx in (-1, 0, 1) for dy in (-1, 0, 1)
            ):
                pts.add((x, y))
    return _paint(state_im, _grow(_components(pts), gap=3))


def extract_item(base_im, state_im, thresh=60):
    """장비 State에서 base와 달라진 픽셀 중 큰 덩어리 + 주변 조각(스카프 꼬리, 선글라스 렌즈 등)."""
    pb, ps = base_im.load(), state_im.load()
    W, H = base_im.size
    diff = {(x, y) for y in range(H) for x in range(W) if _changed(ps[x, y], pb[x, y], thresh)}
    comps = _components(diff)
    if not comps:
        return None
    return _paint(state_im, _grow(comps, gap=2))


def _grow(comps, gap):
    """가장 큰 덩어리에서 시작해, gap 픽셀 안에 붙어 있는 조각(3px 이상)만 차례로 흡수한다.
    몸통 쪽에 떨어진 잡티는 빠지고, 땋은 머리·스카프 꼬리처럼 이어진 조각은 남는다."""
    if not comps:
        return set()
    keep, rest, grown = set(comps[0]), [c for c in comps[1:] if len(c) >= 3], True
    while grown:
        grown = False
        for c in list(rest):
            if any((p[0] + dx, p[1] + dy) in keep for p in c
                   for dx in range(-gap, gap + 1) for dy in range(-gap, gap + 1)):
                keep |= set(c)
                rest.remove(c)
                grown = True
    return keep


def _paint(state_im, keep):
    ps = state_im.load()
    out = Image.new("RGBA", state_im.size, (0, 0, 0, 0))
    po = out.load()
    for (x, y) in keep:
        po[x, y] = ps[x, y]
    return out if keep else None


def hair_mask(base_im, cm_im):
    pb, pm = base_im.load(), cm_im.load()
    return {(x, y) for y in range(base_im.height) for x in range(base_im.width)
            if pb[x, y][3] and region_of(pm[x, y]) == "hair"}


def main(src, dst):
    src, dst = Path(src), Path(dst)
    meta = json.loads((src / "metadata.json").read_text())
    S = {s["folder"]: s for s in meta["states"]}
    base = S["base"]
    manifest = {"anims": {}, "layers": {}, "lut": {}}

    # 1) base 애니메이션 → 시트
    for anim, dirs in base["frames"]["animations"].items():
        name = anim.lower()
        for d, files in dirs.items():
            if d not in DIRS:
                continue
            frames = [Image.open(src / f).convert("RGBA") for f in files]
            fw, fh = frames[0].size
            sheet = Image.new("RGBA", (fw * len(frames), fh), (0, 0, 0, 0))
            anchors = []
            for i, f in enumerate(frames):
                sheet.paste(f, (i * fw, 0))
                t, cx = head_anchor(f)
                anchors.append([round(cx, 1), t])
            path = dst / "sprites" / "base" / f"{name}_{d}.png"
            path.parent.mkdir(parents=True, exist_ok=True)
            sheet.save(path)
            manifest["anims"].setdefault(name, {})[d] = {
                "src": str(path.relative_to(dst)), "frames": len(frames), "size": [fw, fh], "anchors": anchors,
            }

    # 2) hair / item 레이어
    for key, st in S.items():
        if not (key.startswith("hair_") or key.startswith("item_") or key == "short_curly_hair"):
            continue
        if key == "item_bib":  # 흰 셔츠 위 흰 배번은 차이가 안 잡혀서 코드로 그린다(참가번호 표시)
            continue
        lname = "hair_curly" if key == "short_curly_hair" else key
        for d in DIRS:
            b = Image.open(src / base["frames"]["rotations"][d]).convert("RGBA")
            s = Image.open(src / st["frames"]["rotations"][d]).convert("RGBA")
            if lname.startswith("hair_"):
                cmi = Image.open(src / S["colormap"]["frames"]["rotations"][d]).convert("RGBA")
                layer = extract_hair(b, s, hair_mask(b, cmi))
            else:
                layer = extract_item(b, s)
            if layer is None or layer.getbbox() is None:
                continue
            bb = layer.getbbox()
            t, cx = head_anchor(b)
            crop = layer.crop(bb)
            kind = "hair" if lname.startswith("hair_") else "items"
            path = dst / kind / f"{lname}_{d}.png"
            path.parent.mkdir(parents=True, exist_ok=True)
            crop.save(path)
            manifest["layers"].setdefault(lname, {})[d] = {
                "src": str(path.relative_to(dst)), "dx": round(bb[0] - cx, 1), "dy": bb[1] - t,
            }

    # 3) 색 → 부위 대응표 (정지 8방향 전부 사용)
    lut = defaultdict(Counter)
    cm = S["colormap"]
    for d, f in base["frames"]["rotations"].items():
        a = Image.open(src / f).convert("RGBA")
        m = Image.open(src / cm["frames"]["rotations"][d]).convert("RGBA")
        pa, pm = a.load(), m.load()
        for y in range(a.height):
            for x in range(a.width):
                if pa[x, y][3]:
                    lut["#%02x%02x%02x" % pa[x, y][:3]][region_of(pm[x, y]) or "keep"] += 1
    for c, cnt in lut.items():
        tot = sum(cnt.values())
        manifest["lut"][c] = {k: round(v / tot, 2) for k, v in cnt.items()}

    # 4) 옷 구역 경계(머리 꼭대기 기준 y) + 부위별 평균 밝기(색 바꿀 때 명암 유지용)
    rel = defaultdict(list)
    lum = defaultdict(list)
    for d in DIRS:
        a = Image.open(src / base["frames"]["rotations"][d]).convert("RGBA")
        m = Image.open(src / cm["frames"]["rotations"][d]).convert("RGBA")
        t, _ = head_anchor(a)
        pa, pm = a.load(), m.load()
        for y in range(a.height):
            for x in range(a.width):
                r = region_of(pm[x, y]) if pa[x, y][3] else None
                if r and r != "keep":
                    rel[r].append(y - t)
                    q = pa[x, y]
                    lum[r].append(0.299 * q[0] + 0.587 * q[1] + 0.114 * q[2])
    q = lambda v, f: sorted(v)[int(len(v) * f)]
    manifest["bands"] = {"topMax": min(rel["bottom"]) - 1, "bottomMax": min(rel["shoes"]) - 1}
    manifest["regionLum"] = {r: round(sum(v) / len(v), 1) for r, v in lum.items()}
    manifest["hats"] = ["item_cap", "item_beanie"]
    for r, v in rel.items():
        print(r, "rel y", min(v), max(v))

    (dst / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1))
    print("anims:", {k: list(v) for k, v in manifest["anims"].items()})
    print("layers:", sorted(manifest["layers"]))
    print("lut colors:", len(manifest["lut"]))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
