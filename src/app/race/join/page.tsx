import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentRaceMember } from "@/lib/auth/race-session";
import { RaceJoinForm } from "@/components/race/race-join-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "캐릭터 만들기 — Tri.be Race",
};

export default async function RaceJoinPage() {
  const session = await getCurrentRaceMember();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-10">
      <div className="flex flex-col gap-1">
        <span className="font-[family-name:var(--font-race-px)] text-[11px] text-[#f0b84a]">TRI.BE RACE</span>
        <h1 className="text-2xl font-bold">새 캐릭터 만들기</h1>
        <p className="text-sm text-[#a3a29a]">크루 초대코드로 캐릭터를 만들고 바로 레이스에 참가해요.</p>
      </div>
      {session && (
        <p className="rounded border border-[#3c3d43] bg-[#2a2b2e] px-4 py-3 text-sm text-[#a3a29a]">
          이미 <b className="text-[#f1f1ee]">{session.name}</b>(으)로 로그인돼 있어요.{" "}
          <Link href="/race/me" className="text-[#f0b84a] underline">
            내 캐릭터로 가기
          </Link>
        </p>
      )}
      <RaceJoinForm />
      <Link href="/race" className="text-sm text-[#6f6f6a] underline">
        ← 레이스 현황으로
      </Link>
    </div>
  );
}
