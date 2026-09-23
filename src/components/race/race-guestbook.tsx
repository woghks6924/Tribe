"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type GuestbookEntryRow = {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string; // ISO
};

const MAX_LEN = 140;

function timeAgo(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return "방금";
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export function RaceGuestbook({
  entries,
  currentMemberId,
  loggedIn,
}: {
  entries: GuestbookEntryRow[];
  currentMemberId: string | null;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) {
      setError("내용을 입력해주세요.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/race/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "등록에 실패했어요.");
        return;
      }
      setText("");
      router.refresh();
    } catch {
      setError("문제가 발생했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("이 글을 삭제할까요?")) return;
    await fetch(`/api/race/guestbook/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <section className="rounded border border-[#3c3d43] bg-[#2a2b2e] p-4 sm:p-[18px]">
      <h2 className="text-base font-bold">크루 방명록</h2>
      <p className="mt-1 mb-3 text-xs text-[#6f6f6a]">서로에게 짧게 한마디씩 남겨보세요.</p>

      {loggedIn ? (
        <form onSubmit={submit} className="mb-4 flex flex-col gap-1.5">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_LEN}
              placeholder="한마디 남기기..."
              className="w-full rounded border border-[#3c3d43] bg-[#17181b] px-3 py-2 text-sm text-[#f1f1ee] outline-none placeholder:text-[#6f6f6a]"
            />
            <button
              type="submit"
              disabled={busy}
              className="shrink-0 cursor-pointer rounded border border-[#0e0f11] bg-[#f0b84a] px-4 py-2 text-sm font-bold text-[#2a1d05] disabled:opacity-40"
            >
              등록
            </button>
          </div>
          {error && <p className="text-sm text-[#f08068]">{error}</p>}
        </form>
      ) : (
        <p className="mb-4 text-sm text-[#6f6f6a]">한마디를 남기려면 캐릭터로 로그인해주세요.</p>
      )}

      {entries.length === 0 ? (
        <p className="text-sm text-[#6f6f6a]">아직 방명록이 없어요.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((e) => (
            <div key={e.id} className="flex items-start justify-between gap-2 border-b border-[#3c3d43] pb-2 text-sm last:border-b-0">
              <div>
                <span className="font-semibold text-[#f1f1ee]">{e.authorName}</span>{" "}
                <span className="text-[#a3a29a]">{e.body}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-[#6f6f6a]">{timeAgo(e.createdAt)}</span>
                {currentMemberId === e.authorId && (
                  <button type="button" onClick={() => remove(e.id)} className="cursor-pointer text-xs text-[#f08068] underline">
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
