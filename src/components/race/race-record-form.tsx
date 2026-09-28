"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KIND_CAP, KIND_LABEL, KIND_UNIT } from "@/lib/race/constants";

const KINDS = ["RUN", "WOD", "SWIM", "GYM"] as const;
type Kind = (typeof KINDS)[number];
type InfluenceMode = "NONE" | "ATTACK" | "CHEER";
type RosterEntry = { id: string; name: string; rank: number };

export function RaceRecordForm({
  myId,
  myRank,
  roster,
  nearbyRankRange,
}: {
  myId: string;
  myRank: number;
  roster: RosterEntry[];
  nearbyRankRange: number;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("RUN");
  const [amount, setAmount] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [influenceMode, setInfluenceMode] = useState<InfluenceMode>("NONE");
  const [targetId, setTargetId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cheerCandidates = roster.filter((r) => r.id !== myId);
  const attackCandidates = cheerCandidates.filter((r) => Math.abs(r.rank - myRank) <= nearbyRankRange);
  const candidates = influenceMode === "ATTACK" ? attackCandidates : cheerCandidates;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    const value = parseFloat(amount);
    if (!(value > 0)) {
      setError("기록을 입력해주세요.");
      return;
    }
    if (value > KIND_CAP[kind]) {
      setError(`한 번에 ${KIND_CAP[kind]}${KIND_UNIT[kind]}까지 올릴 수 있어요. 나눠서 올려주세요.`);
      return;
    }
    if (influenceMode !== "NONE" && !targetId) {
      setError("공격하거나 응원할 크루원을 골라주세요.");
      return;
    }

    setLoading(true);
    try {
      let proofPath: string | undefined;
      if (file) {
        const imageCompression = (await import("browser-image-compression")).default;
        const compressed = await imageCompression(file, {
          maxWidthOrHeight: 1080,
          fileType: "image/webp",
          initialQuality: 0.82,
          useWebWorker: true,
        });
        const formData = new FormData();
        formData.append("file", compressed, "proof.webp");
        const uploadRes = await fetch("/api/race/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error ?? "인증샷 업로드에 실패했어요.");
          return;
        }
        proofPath = uploadData.path;
      }

      const durationSec =
        kind === "RUN" && (minutes || seconds)
          ? (parseInt(minutes || "0", 10) || 0) * 60 + (parseInt(seconds || "0", 10) || 0)
          : undefined;

      const influence = influenceMode !== "NONE" ? { targetId, mode: influenceMode } : undefined;

      const res = await fetch("/api/race/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, value, proofPath, durationSec, influence }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "기록 올리기에 실패했어요.");
        return;
      }
      setAmount("");
      setMinutes("");
      setSeconds("");
      setFile(null);
      setInfluenceMode("NONE");
      setTargetId("");
      const rankMsg =
        data.prevRank && data.rank ? ` · ${data.prevRank}위 → ${data.rank}위` : "";
      const influenceMsg = data.influence
        ? ` · ${data.influence.targetName}님을 ${data.influence.mode === "CHEER" ? "응원" : "공격"}했어요 (${
            data.influence.mode === "CHEER" ? "+" : "-"
          }${Number(data.influence.km).toFixed(1)}km)`
        : "";
      setOk(
        `+${Number(data.convertedKm).toFixed(1)}km 반영${rankMsg}${influenceMsg}${file ? " · 인증샷은 24시간 뒤 삭제돼요" : ""}`,
      );
      router.refresh();
    } catch {
      setError("문제가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-[#a3a29a]">종목</span>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="종목">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`cursor-pointer rounded border px-3 py-1.5 text-sm ${
                kind === k ? "border-[#f1f1ee] bg-[#f1f1ee] text-[#1d1e21] font-medium" : "border-[#3c3d43] text-[#a3a29a]"
              }`}
            >
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[#a3a29a]">기록</span>
          <div className="flex items-center gap-2">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="8.5"
              className="w-full rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2.5 text-[15px] text-[#f1f1ee] outline-none placeholder:text-[#6f6f6a]"
            />
            <span className="min-w-6 text-sm text-[#a3a29a]">{KIND_UNIT[kind]}</span>
          </div>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[#a3a29a]">인증샷 (선택)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-[13px] text-[#a3a29a]"
          />
        </label>
      </div>
      {kind === "RUN" && (
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[#a3a29a]">시간 (선택, 페이스 계산·스피드형 판정에 쓰여요)</span>
          <div className="flex items-center gap-1.5">
            <input
              value={minutes}
              onChange={(e) => setMinutes(e.target.value.replace(/\D/g, "").slice(0, 3))}
              type="text"
              inputMode="numeric"
              placeholder="45"
              className="w-16 rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2 text-[15px] text-[#f1f1ee] outline-none placeholder:text-[#6f6f6a]"
            />
            <span className="text-sm text-[#a3a29a]">분</span>
            <input
              value={seconds}
              onChange={(e) => setSeconds(e.target.value.replace(/\D/g, "").slice(0, 2))}
              type="text"
              inputMode="numeric"
              placeholder="00"
              className="w-16 rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2 text-[15px] text-[#f1f1ee] outline-none placeholder:text-[#6f6f6a]"
            />
            <span className="text-sm text-[#a3a29a]">초</span>
          </div>
        </label>
      )}
      {cheerCandidates.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded border border-[#3c3d43] p-2.5">
          <span className="text-sm text-[#a3a29a]">공격 또는 응원 (선택, 이번 기록에서만)</span>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="공격 또는 응원">
            {(["NONE", "CHEER", "ATTACK"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setInfluenceMode(m);
                  setTargetId("");
                }}
                className={`cursor-pointer rounded border px-3 py-1.5 text-sm ${
                  influenceMode === m
                    ? "border-[#f1f1ee] bg-[#f1f1ee] font-medium text-[#1d1e21]"
                    : "border-[#3c3d43] text-[#a3a29a]"
                }`}
              >
                {m === "NONE" ? "안 함" : m === "CHEER" ? "👏 응원" : "⚔️ 공격"}
              </button>
            ))}
          </div>
          {influenceMode !== "NONE" && (
            <>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2 text-[15px] text-[#f1f1ee] outline-none"
              >
                <option value="">대상 선택</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.rank}위 · {c.name}
                  </option>
                ))}
              </select>
              {influenceMode === "ATTACK" && candidates.length === 0 && (
                <p className="text-xs text-[#f08068]">지금은 공격 가능한 순위 인접자가 없어요.</p>
              )}
              <p className="text-xs text-[#6f6f6a]">
                {influenceMode === "CHEER"
                  ? "이번 기록의 일부를 대상에게 나눠줘요. 내 기록은 그대로 다 쌓여요."
                  : "이번 기록의 일부만큼 대상의 순위를 낮춰요. 내 기록은 그대로 다 쌓여요."}
              </p>
            </>
          )}
        </div>
      )}
      <p className="text-xs text-[#6f6f6a]">
        인증샷은 24시간 동안 크루 피드에 공개된 뒤 자동으로 삭제돼요. 한 번에 러닝 50km, WOD·헬스 240분, 수영 10km까지
        올릴 수 있어요.
      </p>
      {error && <p className="text-sm text-[#f08068]">{error}</p>}
      {ok && <p className="text-sm text-[#86d494]">{ok}</p>}
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-fit cursor-pointer rounded border border-[#0e0f11] bg-[#f0b84a] px-4 py-2.5 text-sm font-bold text-[#2a1d05] shadow-[3px_3px_0_#0e0f11] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#0e0f11] disabled:opacity-40"
        >
          {loading ? "올리는 중..." : "기록 올리기"}
        </button>
      </div>
    </form>
  );
}
