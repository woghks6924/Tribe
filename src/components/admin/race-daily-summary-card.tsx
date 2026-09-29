"use client";

import { useState } from "react";
import { destinationNameOf } from "@/lib/race/constants";

export type DailySummaryInput = {
  dayLabel: string; // "DAY 10/50"
  dateLabel: string; // "9월 28일"
  goalKm: number;
  leader: { name: string; color: string; pts: number; checkpoint: string } | null;
  top5: { name: string; color: string; pts: number }[];
  participated: number;
  totalMembers: number;
  todaysKm: number;
  todaysEvents: string[]; // 이미 <b> 태그 제거된 순수 텍스트
};

function buildText(input: DailySummaryInput): string {
  const lines: string[] = [];
  lines.push(`🏃 Tri.be Race · ${input.dayLabel}`);
  lines.push(input.dateLabel);
  lines.push("");
  if (input.leader) {
    lines.push(`🥇 선두: ${input.leader.name} · ${input.leader.pts.toFixed(1)}km (${input.leader.checkpoint})`);
  }
  lines.push(`오늘 기록 인증: ${input.participated}/${input.totalMembers}명 · 오늘 합산 +${input.todaysKm.toFixed(1)}km`);
  lines.push("");
  lines.push("📋 오늘의 순위 TOP 5");
  input.top5.forEach((s, i) => lines.push(`${i + 1}위 ${s.name} · ${s.pts.toFixed(1)}km`));
  if (input.todaysEvents.length > 0) {
    lines.push("");
    lines.push("📰 오늘의 소식");
    input.todaysEvents.forEach((e) => lines.push(`- ${e}`));
  }
  return lines.join("\n");
}

export function RaceDailySummaryCard({ input }: { input: DailySummaryInput }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const text = buildText(input);

  async function copyText() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function makeImage() {
    setBusy(true);
    try {
      try {
        await Promise.all([
          document.fonts.load('60px "Press Start 2P"'),
          document.fonts.load('700 60px "IBM Plex Sans KR"'),
          document.fonts.load('500 30px "IBM Plex Sans KR"'),
        ]);
      } catch {
        // 폰트 프리로드 실패해도 폴백 폰트로 그대로 그린다.
      }

      const W = 1080;
      const H = 1350;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const g = canvas.getContext("2d")!;

      g.fillStyle = "#1d1e21";
      g.fillRect(0, 0, W, H);

      const PX = '"Press Start 2P", monospace';
      const KR = '"IBM Plex Sans KR", system-ui, sans-serif';
      g.textAlign = "center";
      g.textBaseline = "alphabetic";

      g.font = `36px ${PX}`;
      g.fillStyle = "#f1f1ee";
      g.fillText("TRI.BE RACE", W / 2, 130);
      g.font = `22px ${PX}`;
      g.fillStyle = "#f0b84a";
      g.fillText(input.dayLabel, W / 2, 180);
      g.font = `500 28px ${KR}`;
      g.fillStyle = "#a3a29a";
      g.fillText(input.dateLabel, W / 2, 220);

      if (input.leader) {
        g.font = `700 64px ${KR}`;
        g.fillStyle = input.leader.color;
        g.fillText(input.leader.name, W / 2, 330);
        g.font = `500 30px ${KR}`;
        g.fillStyle = "#a3a29a";
        g.fillText(
          `선두 · ${input.leader.pts.toFixed(1)}km · ${input.leader.checkpoint} · ${destinationNameOf(input.goalKm)}까지 ${Math.max(0, input.goalKm - input.leader.pts).toFixed(1)}km`,
          W / 2,
          375,
        );
      }

      g.font = `500 32px ${KR}`;
      g.fillStyle = "#f1f1ee";
      g.fillText(`오늘 기록 인증 ${input.participated}/${input.totalMembers}명 · 합산 +${input.todaysKm.toFixed(1)}km`, W / 2, 450);

      let y = 540;
      g.textAlign = "left";
      g.font = `700 26px ${KR}`;
      g.fillStyle = "#f0b84a";
      g.fillText("오늘의 순위 TOP 5", 90, y);
      y += 50;
      input.top5.forEach((s, i) => {
        g.fillStyle = i === 0 ? "#f0b84a" : "#6f6f6a";
        g.font = `14px ${PX}`;
        g.fillText(String(i + 1), 90, y);
        g.font = `700 30px ${KR}`;
        g.fillStyle = s.color;
        g.fillText(s.name, 140, y);
        g.textAlign = "right";
        g.font = `500 26px ${KR}`;
        g.fillStyle = "#a3a29a";
        g.fillText(`${s.pts.toFixed(1)}km`, W - 90, y);
        g.textAlign = "left";
        y += 52;
      });

      if (input.todaysEvents.length > 0) {
        y += 20;
        g.font = `700 26px ${KR}`;
        g.fillStyle = "#f0b84a";
        g.fillText("오늘의 소식", 90, y);
        y += 46;
        g.font = `500 26px ${KR}`;
        g.fillStyle = "#f1f1ee";
        input.todaysEvents.slice(0, 8).forEach((e) => {
          const truncated = e.length > 30 ? `${e.slice(0, 30)}…` : e;
          g.fillText(`· ${truncated}`, 90, y);
          y += 40;
        });
      }

      g.textAlign = "center";
      g.font = `700 30px ${KR}`;
      g.fillStyle = "#f1f1ee";
      g.fillText("@tri.be_seoul   #TRIBERACE", W / 2, H - 60);

      setImgSrc(canvas.toDataURL("image/png"));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!imgSrc) return;
    const a = document.createElement("a");
    a.href = imgSrc;
    a.download = `tribe-race-${input.dayLabel.replace(/\s+/g, "")}.png`;
    a.click();
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2 border border-line p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">텍스트 요약</span>
          <button onClick={copyText} className="cursor-pointer text-xs text-ink-muted hover:text-ink">
            {copied ? "복사됨!" : "복사하기"}
          </button>
        </div>
        <pre className="whitespace-pre-wrap font-sans text-sm text-ink">{text}</pre>
      </div>

      <div className="flex flex-col gap-3 border border-line p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs tracking-[0.08em] text-ink-muted uppercase">이미지 카드 (1080×1350)</span>
          <button
            onClick={makeImage}
            disabled={busy}
            className="cursor-pointer border border-line-strong px-3 py-1.5 text-xs text-ink-muted hover:border-ink hover:text-ink disabled:opacity-40"
          >
            {busy ? "만드는 중..." : "카드 만들기"}
          </button>
        </div>
        {imgSrc && (
          <div className="flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imgSrc} alt="오늘의 레이스 요약 카드" className="w-full max-w-[240px] border border-line" style={{ aspectRatio: "1080/1350" }} />
            <button onClick={download} className="cursor-pointer bg-ink px-4 py-2 text-xs font-semibold text-[color:var(--color-base)]">
              다운로드
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
