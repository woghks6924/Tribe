"""
대회 사진 폴더 -> public/race-photos/<slug>/ (index.json + thumbs/*.jpg) 만들기

쓰는 법 (프로젝트 폴더에서):
  python scripts/race-photos/make_index.py ^
      --src "D:\\대회사진\\jtbc-2026" ^
      --slug jtbc-2026 --name "2026 JTBC 서울마라톤" --date 2026-11-01 ^
      --drive-url "https://drive.google.com/drive/folders/..." ^
      --spot "결승선 부근"

선택 옵션:
  --ids ids.csv    : 파일명,드라이브파일ID  (없으면 원본 보기/다운로드 링크가 동작하지 않는 임시 ID를 넣어요)
  --bibs bibs.csv  : 파일명,배번 배번 ...    (없으면 배번은 비워둬요 -> 시간대 검색만 가능)
  --size 640       : 썸네일 긴 변(px)
  --quality 72     : JPEG 품질
  --tz +09:00      : 사진에 시간대 정보가 없을 때 가정하는 시간대(기본 한국)

필요한 것: Python 3 + Pillow (pip install pillow)
"""
import argparse
import csv
import json
import os
import sys
from datetime import datetime, timezone, timedelta

try:
    from PIL import Image, ImageOps
except ImportError:  # pragma: no cover
    sys.exit("Pillow가 없어요. 먼저 실행: pip install pillow")

EXTS = {".jpg", ".jpeg", ".png", ".heic"}  # heic는 pillow-heif가 있어야 열려요
try:  # 아이폰 사진(HEIC)을 쓰려면: pip install pillow-heif
    from pillow_heif import register_heif_opener

    register_heif_opener()
except Exception:
    pass


def parse_tz(s):
    sign = -1 if s.startswith("-") else 1
    h, m = s.lstrip("+-").split(":")
    return timezone(sign * timedelta(hours=int(h), minutes=int(m)))


def taken_at(path, img, default_tz):
    """촬영 시각(EXIF) -> timezone이 붙은 datetime. 없으면 파일 수정 시각."""
    exif = img.getexif()
    sub = exif.get_ifd(0x8769) if hasattr(exif, "get_ifd") else {}
    raw = sub.get(0x9003) or exif.get(0x0132)  # DateTimeOriginal, 없으면 DateTime
    off = sub.get(0x9011)  # OffsetTimeOriginal ("+09:00")
    if raw:
        try:
            dt = datetime.strptime(str(raw).strip(), "%Y:%m:%d %H:%M:%S")
            tz = parse_tz(off) if off else default_tz
            return dt.replace(tzinfo=tz), True
        except ValueError:
            pass
    return datetime.fromtimestamp(os.path.getmtime(path), tz=default_tz), False


def read_csv(path):
    rows = {}
    if not path:
        return rows
    with open(path, encoding="utf-8-sig", newline="") as f:
        for r in csv.reader(f):
            if len(r) >= 2 and r[0].strip() and not r[0].lower().startswith("filename"):
                rows[r[0].strip()] = r[1].strip()
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="원본 사진 폴더")
    ap.add_argument("--slug", required=True)
    ap.add_argument("--name", required=True)
    ap.add_argument("--date", required=True, help="대회 날짜 YYYY-MM-DD")
    ap.add_argument("--drive-url", required=True)
    ap.add_argument("--contact", default="@tri.be 인스타그램 DM")
    ap.add_argument("--spot", default="촬영 지점")
    ap.add_argument("--ids")
    ap.add_argument("--bibs")
    ap.add_argument("--size", type=int, default=640)
    ap.add_argument("--quality", type=int, default=72)
    ap.add_argument("--tz", default="+09:00")
    ap.add_argument("--out", default=os.path.join("public", "race-photos"))
    args = ap.parse_args()

    tz = parse_tz(args.tz)
    ids_raw = read_csv(args.ids)
    # 드라이브 파일명과 로컬 파일명이 대소문자·확장자만 달라도 짝이 맞게 이름(확장자 뺀 것, 소문자)으로 비교한다.
    ids = {os.path.splitext(k)[0].lower(): v for k, v in ids_raw.items()}
    bibs = {k: v.replace(",", " ").split() for k, v in read_csv(args.bibs).items()}

    files = sorted(f for f in os.listdir(args.src) if os.path.splitext(f)[1].lower() in EXTS)
    if not files:
        sys.exit(f"사진을 찾지 못했어요: {args.src}")

    items = []
    no_exif = 0
    for name in files:
        path = os.path.join(args.src, name)
        try:
            img = Image.open(path)
            when, has_exif = taken_at(path, img, tz)
        except Exception as e:  # 깨진 파일은 건너뛴다
            print(f"건너뜀(열 수 없음): {name} ({e})")
            continue
        no_exif += 0 if has_exif else 1
        items.append((when, name, img))
    items.sort(key=lambda x: x[0])

    out_dir = os.path.join(args.out, args.slug)
    thumb_dir = os.path.join(out_dir, "thumbs")
    os.makedirs(thumb_dir, exist_ok=True)

    photos = []
    total = 0
    missing_ids = 0
    for i, (when, name, img) in enumerate(items, start=1):
        pid = f"p{i:04d}"
        im = ImageOps.exif_transpose(img).convert("RGB")
        im.thumbnail((args.size, args.size))
        tpath = os.path.join(thumb_dir, f"{pid}.jpg")
        im.save(tpath, "JPEG", quality=args.quality, optimize=True, progressive=True)
        total += os.path.getsize(tpath)
        drive_id = ids.get(os.path.splitext(name)[0].lower())
        if not drive_id:
            missing_ids += 1
            drive_id = f"TEMP_{pid}"
        photos.append(
            {
                "id": pid,
                "driveId": drive_id,
                "takenAt": when.isoformat(timespec="seconds"),
                "spot": args.spot,
                "bibs": bibs.get(name, []),
            }
        )

    data = {
        "event": {
            "slug": args.slug,
            "name": args.name,
            "date": args.date,
            "driveFolderUrl": args.drive_url,
            "contact": args.contact,
        },
        "spots": [args.spot],
        "photos": photos,
    }
    with open(os.path.join(out_dir, "index.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"완료: {len(photos)}장 -> {out_dir}")
    print(f"  썸네일 총 {total / 1024 / 1024:.1f}MB (평균 {total / len(photos) / 1024:.0f}KB)")
    print(f"  촬영 시각 범위: {photos[0]['takenAt']} ~ {photos[-1]['takenAt']}")
    if no_exif:
        print(f"  주의: 촬영 시각(EXIF)이 없어서 파일 수정 시각을 쓴 사진 {no_exif}장")
    if missing_ids:
        print(f"  주의: 드라이브 파일 ID가 없는 사진 {missing_ids}장 (원본 보기/다운로드 링크는 아직 동작 안 함)")
    if ids_raw and missing_ids:
        print(f"  참고: ids.csv에는 {len(ids_raw)}개가 있는데 짝이 안 맞은 사진이 {missing_ids}장이에요. 파일명이 같은지 확인하세요")
    if not any(p["bibs"] for p in photos):
        print("  참고: 배번이 없어서 시간대 검색만 가능해요")


if __name__ == "__main__":
    main()
