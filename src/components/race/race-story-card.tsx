"use client";

import { useState } from "react";
import { CHECKPOINTS, destinationNameOf, type RaceAcc, type RaceBodyType, type RaceEye, TYPE_LABEL } from "@/lib/race/constants";
import { drawCrown, drawSprite, grid, SPRITE_GRID_SIZE } from "@/lib/race/sprite";

const N = SPRITE_GRID_SIZE;

// 문자열 시드로 결정적 의사난수를 만든다(배경 노이즈 텍스처 전용, 통계 계산과는 무관).
function mulberry32(seed: number) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function stringSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0;
  return h;
}

function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러오지 못했어요."));
    };
    img.src = url;
  });
}

// object-fit: cover와 동일하게 (x,y,w,h) 영역을 이미지로 꽉 채워서 그린다.
function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

export type RaceStoryInput = {
  memberId: string;
  name: string;
  color: string;
  eye: RaceEye;
  acc: RaceAcc;
  igHandle: string | null;
  type: RaceBodyType;
  rank: number;
  totalCount: number;
  pts: number;
  goalKm: number;
  todaySummary: string; // "오늘  러닝 5km · WOD 20분" 또는 "최근 7일  +12.3km"
  dayLabel: string; // "DAY 10/50"
};

export function RaceStoryCard({ input }: { input: RaceStoryInput }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file);
    setImgSrc(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function makeStory() {
    setBusy(true);
    try {
      try {
        await Promise.all([
          document.fonts.load('60px "Press Start 2P"'),
          document.fonts.load('700 96px "IBM Plex Sans KR"'),
          document.fonts.load('500 44px "IBM Plex Sans KR"'),
        ]);
      } catch {
        // 폰트 프리로드 실패해도 폴백 폰트로 그대로 그린다.
      }

      const W = 1080;
      const H = 1920;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const g = canvas.getContext("2d")!;

      g.fillStyle = "#1d1e21";
      g.fillRect(0, 0, W, H);

      if (photoFile) {
        // 내 사진을 배경으로 꽉 채우고, 위에 얹는 글자/캐릭터가 항상 잘 보이도록 어둡게 스크림을 깐다.
        g.imageSmoothingEnabled = true;
        try {
          const photo = await loadImageFile(photoFile);
          drawImageCover(g, photo, 0, 0, W, H);
        } catch {
          // 사진 로드 실패 시 기본 배경으로 조용히 폴백.
        }
        g.fillStyle = "rgba(13,14,16,.62)";
        g.fillRect(0, 0, W, H);
      } else {
        g.imageSmoothingEnabled = false;
        const rnd = mulberry32(stringSeed(input.memberId) + stringSeed(input.dayLabel));
        for (let i = 0; i < 9000; i++) {
          g.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.18)";
          g.fillRect(Math.floor((rnd() * W) / 3) * 3, Math.floor((rnd() * H) / 3) * 3, 3, 3);
        }
      }
      g.imageSmoothingEnabled = false;

      const PX = '"Press Start 2P", monospace';
      const KR = '"IBM Plex Sans KR", system-ui, sans-serif';
      g.textAlign = "center";
      g.textBaseline = "alphabetic";

      g.font = `44px ${PX}`;
      g.fillStyle = "#f1f1ee";
      g.fillText("TRI.BE RACE", W / 2, 290);
      g.font = `26px ${PX}`;
      g.fillStyle = "#f0b84a";
      g.fillText(input.dayLabel, W / 2, 345);

      const sc = 28;
      const sx = (W - N * sc) / 2;
      const sy = 360;
      const gd = grid(input.type, 2, false, input.eye, input.acc);
      g.fillStyle = "rgba(0,0,0,.35)";
      g.fillRect(sx + 6 * sc, sy + 21 * sc, 10 * sc, sc);
      drawSprite(g, gd, input.color, sx, sy, sc);
      if (input.rank === 1) drawCrown(g, sx, sy + (gd.top - 3) * sc, sc);

      g.font = `700 92px ${KR}`;
      g.fillStyle = input.color;
      g.fillText(input.name, W / 2, 1100);
      g.font = `500 40px ${KR}`;
      g.fillStyle = "#a3a29a";
      g.fillText(
        `${input.igHandle ? `@${input.igHandle}  ·  ` : ""}${TYPE_LABEL[input.type]}  ·  ${input.rank}위 / ${input.totalCount}명`,
        W / 2,
        1165,
      );

      g.font = `96px ${PX}`;
      g.fillStyle = "#f0b84a";
      const kmT = input.pts.toFixed(1);
      g.fillText(kmT, W / 2 - 40, 1305);
      const kw = g.measureText(kmT).width;
      g.font = `500 44px ${KR}`;
      g.fillStyle = "#f1f1ee";
      g.textAlign = "left";
      g.fillText("km", W / 2 - 40 + kw / 2 + 14, 1305);
      g.textAlign = "center";

      g.font = `500 42px ${KR}`;
      g.fillStyle = "#f1f1ee";
      g.fillText(input.todaySummary, W / 2, 1385);

      const L = 140;
      const R = 940;
      const y = 1545;
      const X = (km: number) => L + (Math.min(km, input.goalKm) / input.goalKm) * (R - L);
      g.fillStyle = "#3c3d43";
      g.fillRect(L, y, R - L, 6);
      g.fillStyle = "#f0b84a";
      g.fillRect(L, y, X(input.pts) - L, 6);
      CHECKPOINTS.filter((cp) => cp.km <= input.goalKm).forEach((cp) => {
        g.fillStyle = input.pts >= cp.km ? "#f0b84a" : "#6f6f6a";
        g.fillRect(X(cp.km) - 7, y - 4, 14, 14);
      });
      drawSprite(g, grid(input.type, 2, false, input.eye, input.acc), input.color, X(input.pts) - N * 2, y - N * 4 - 4, 4);

      g.font = `500 30px ${KR}`;
      g.fillStyle = "#a3a29a";
      g.textAlign = "left";
      g.fillText("서울", L - 10, y + 60);
      g.textAlign = "right";
      g.fillText(`${destinationNameOf(input.goalKm)} ${input.goalKm}`, R + 10, y + 60);
      g.textAlign = "center";
      g.fillStyle = "#f1f1ee";

      g.font = `700 44px ${KR}`;
      g.fillStyle = "#f1f1ee";
      g.fillText("@tri.be_seoul   #TRIBERACE", W / 2, 1690);

      setImgSrc(canvas.toDataURL("image/png"));
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!imgSrc) return;
    const blob = await (await fetch(imgSrc)).blob();
    const file = new File([blob], "tribe-race.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: "Tri.be Race" });
        return;
      } catch {
        // 사용자가 공유를 취소한 경우 등 — 다운로드로 폴백하지 않고 그냥 종료.
        return;
      }
    }
    const a = document.createElement("a");
    a.href = imgSrc;
    a.download = "tribe-race.png";
    a.click();
  }

  return (
    <div className="flex flex-col gap-2.5 border-t border-[#3c3d43] pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h3 className="text-[15px] font-bold">인스타 스토리 인증</h3>
        <button
          type="button"
          onClick={makeStory}
          disabled={busy}
          className="cursor-pointer rounded border border-[#3c3d43] px-3 py-2 text-sm text-[#f1f1ee] disabled:opacity-40"
        >
          {busy ? "만드는 중..." : "스토리 카드 만들기"}
        </button>
      </div>
      <p className="text-xs text-[#6f6f6a]">
        내 캐릭터와 오늘 기록이 담긴 9:16 카드를 만들어서 인스타 스토리에 자랑해요.
      </p>

      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[#a3a29a]">
          <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          <span className="cursor-pointer rounded border border-[#3c3d43] px-3 py-1.5 hover:border-[#f0b84a] hover:text-[#f0b84a]">
            {photoFile ? "내 사진 바꾸기" : "내 사진 추가 (선택)"}
          </span>
        </label>
        {photoPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoPreview} alt="선택한 사진 미리보기" className="h-10 w-10 rounded object-cover" />
        )}
        {photoFile && (
          <button
            type="button"
            onClick={() => {
              setPhotoFile(null);
              setImgSrc(null);
              if (photoPreview) URL.revokeObjectURL(photoPreview);
              setPhotoPreview(null);
            }}
            className="cursor-pointer text-xs text-[#6f6f6a] underline"
          >
            제거
          </button>
        )}
      </div>
      <p className="-mt-1.5 text-[11px] text-[#6f6f6a]">
        사진을 추가하면 카드 배경으로 쓰여요. 우리 서버엔 저장되지 않고, 카드 이미지 안에만 합성돼요.
      </p>

      {imgSrc && (
        <div className="grid grid-cols-1 items-start gap-4 min-[480px]:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt="내 캐릭터와 기록이 담긴 인스타 스토리 카드"
            className="block w-full max-w-[200px] rounded border border-[#3c3d43]"
            style={{ aspectRatio: "9/16" }}
          />
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={share}
              className="w-fit cursor-pointer rounded border border-[#0e0f11] bg-[#f0b84a] px-4 py-2 text-sm font-bold text-[#2a1d05]"
            >
              스토리에 공유
            </button>
            <p className="text-xs text-[#a3a29a]">
              공유가 지원되지 않는 환경이면 이미지가 대신 다운로드돼요. 인스타 스토리에 올리고
              @tri.be_seoul을 태그해주세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
