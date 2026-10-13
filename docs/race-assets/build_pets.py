"""펫 에셋 빌드: PixelLab 펫 캐릭터 Export(압축 푼 폴더)를 반 크기로 줄여 race-assets에 추가한다.

사용법: python build_pets.py <race-assets 폴더> <펫이름>=<export 폴더> [<펫이름>=<export 폴더> ...]
예:     python build_pets.py race-assets pet_cat=/tmp/pet_cat pet_corgi=/tmp/pet_corgi

- 정지 그림(south, east)과 running 애니메이션(있으면 east/south)을 반 크기로 줄인다.
  2x2 칸마다 대표 색 하나를 골라서 픽셀이 뭉개지지 않게 하고, 가장자리는 외곽선 색을 우선한다.
- manifest.json 의 "pets" 항목을 갱신한다.
"""
import colorsys
import json
import sys
from collections import Counter
from pathlib import Path

from PIL import Image

DIRS = ["south", "east"]


def half(im):
    W, H = im.size
    p = im.load()
    out = Image.new("RGBA", (W // 2, H // 2), (0, 0, 0, 0))
    po = out.load()
    for y in range(H // 2):
        for x in range(W // 2):
            px = [p[2 * x + i, 2 * y + j] for i in (0, 1) for j in (0, 1)]
            op = [q for q in px if q[3] > 0]
            if len(op) < 2:
                continue
            dark = [q for q in op if colorsys.rgb_to_hsv(q[0] / 255, q[1] / 255, q[2] / 255)[2] < 0.3]
            if dark and len(op) < 4:
                po[x, y] = dark[0]
            else:
                po[x, y] = Counter(op).most_common(1)[0][0]
    return out


def bottom_row(im):
    bb = im.getbbox()
    return bb[3] - 1 if bb else im.height - 1


def main(assets, pairs):
    assets = Path(assets)
    mpath = assets / "manifest.json"
    manifest = json.loads(mpath.read_text())
    pets = manifest.setdefault("pets", {})
    for pair in pairs:
        name, src = pair.split("=", 1)
        src = Path(src)
        meta = json.loads((src / "metadata.json").read_text())
        st = meta["states"][0]
        entry = {"still": {}, "run": {}}
        for d in DIRS:
            f = st["frames"]["rotations"].get(d)
            if not f:
                continue
            im = half(Image.open(src / f).convert("RGBA"))
            path = assets / "pets" / f"{name}_{d}.png"
            path.parent.mkdir(parents=True, exist_ok=True)
            im.save(path)
            entry["still"][d] = {"src": str(path.relative_to(assets)), "size": list(im.size), "ground": bottom_row(im)}
        anims = st["frames"].get("animations", {})
        run = next((v for k, v in anims.items() if k.lower() in ("running", "run", "walking", "walk")), None)
        for d in DIRS:
            if not run or d not in run:
                continue
            frames = [half(Image.open(src / f).convert("RGBA")) for f in run[d]]
            fw, fh = frames[0].size
            sheet = Image.new("RGBA", (fw * len(frames), fh), (0, 0, 0, 0))
            for i, fr in enumerate(frames):
                sheet.paste(fr, (i * fw, 0))
            path = assets / "pets" / f"{name}_run_{d}.png"
            sheet.save(path)
            entry["run"][d] = {"src": str(path.relative_to(assets)), "frames": len(frames), "size": [fw, fh],
                               "ground": max(bottom_row(fr) for fr in frames)}
        pets[name] = entry
        print(name, "still:", list(entry["still"]), "run:", list(entry["run"]))
    mpath.write_text(json.dumps(manifest, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2:])
