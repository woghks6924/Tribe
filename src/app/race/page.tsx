import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentRaceMember } from "@/lib/auth/race-session";
import { KIND_LABEL, TYPE_LABEL, destinationNameOf, type RaceAcc, type RaceEye } from "@/lib/race/constants";
import { raceProofPublicUrl } from "@/lib/race/storage";
import {
  addDaysToDateStr,
  buildSeasonFeed,
  checkpointOf,
  computeAwards,
  computeMemberStats,
  dayIndexOf,
  formatBreakdown,
  isSleeping,
  todayKstDateStr,
} from "@/lib/race/stats";
import { RaceTrack, type RaceTrackEntry } from "@/components/race/race-track";
import { RaceAvatarImg } from "@/components/race/race-avatar";
import { RaceGuestbook } from "@/components/race/race-guestbook";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tri.be Race",
  description: "크루 50일 시즌 레이스",
};

function dateLabel(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${m}월 ${d}일`;
}

function hoursAgoLabel(date: Date): string {
  const h = Math.floor((Date.now() - date.getTime()) / 3600000);
  return h < 1 ? "방금" : `${h}시간 전`;
}

export default async function RacePage() {
  const [season, raceSession] = await Promise.all([
    prisma.raceSeason.findFirst({ where: { active: true } }),
    getCurrentRaceMember(),
  ]);

  if (!season) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="font-[family-name:var(--font-race-px)] text-sm text-[#f0b84a]">TRI.BE RACE</span>
        <p className="text-[#a3a29a]">지금은 진행 중인 시즌이 없어요. 다음 시즌 공지를 기다려주세요.</p>
      </div>
    );
  }

  const [members, logs, recentProofs, guestbookEntries] = await Promise.all([
    prisma.raceMember.findMany({ where: { excluded: false } }),
    prisma.raceLog.findMany({ where: { seasonId: season.id } }),
    prisma.raceLog.findMany({
      where: { seasonId: season.id, proofPath: { not: null }, proofExpiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { member: { select: { name: true } } },
    }),
    prisma.raceGuestbookEntry.findMany({
      where: { seasonId: season.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { author: { select: { name: true } } },
    }),
  ]);

  const startDateStr = season.startAt.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const today = todayKstDateStr();
  const todayDay = Math.min(dayIndexOf(today, startDateStr), season.durationDays);
  const uptoDateStr = todayDay <= 0 ? startDateStr : addDaysToDateStr(startDateStr, todayDay - 1);

  const cur = computeMemberStats(members, logs, startDateStr, uptoDateStr);
  const prev = computeMemberStats(members, logs, startDateStr, addDaysToDateStr(uptoDateStr, -1));
  const prevRankByMember = new Map(prev.map((s) => [s.member.id, s.rank]));
  const feed = buildSeasonFeed(members, logs, startDateStr, uptoDateStr, season.goalKm).slice(-14).reverse();
  const awards = computeAwards(cur);

  const trackEntries: RaceTrackEntry[] = cur.map((s) => ({
    memberId: s.member.id,
    name: s.member.name,
    color: s.member.color,
    eye: s.member.eye as RaceEye,
    acc: s.member.acc as RaceAcc,
    pts: s.pts,
    type: s.type,
    idleDays: s.idleDays,
  }));

  const leader = cur[0];
  const endDateStr = addDaysToDateStr(startDateStr, season.durationDays - 1);
  const seasonOver = todayDay >= season.durationDays;

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-5 px-4 py-6 sm:px-6">
      <header className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)] md:items-end">
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-[family-name:var(--font-race-px)] text-[13px]">TRI.BE</span>
              <span className="rounded border border-[#f0b84a] px-2 py-1 font-[family-name:var(--font-race-px)] text-[9px] text-[#f0b84a]">
                RACE · {season.name.toUpperCase()}
              </span>
            </div>
            <Link
              href="/race/me"
              className="rounded border border-[#3c3d43] px-3 py-1.5 text-sm text-[#f1f1ee] hover:border-[#f0b84a] hover:text-[#f0b84a]"
            >
              {raceSession ? `${raceSession.name}(내 캐릭터)` : "참가하기 / 로그인"}
            </Link>
          </div>
          <h1 className="text-[clamp(22px,3.4vw,32px)] leading-[1.3] font-bold tracking-tight">
            {season.headline ? (
              season.headline.split("\n").map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))
            ) : (
              <>
                서울에서{" "}
                <em className="text-[#f0b84a] not-italic">
                  {destinationNameOf(season.goalKm)} {season.goalKm}km
                </em>
                까지,
                <br />
                {season.durationDays}일 동안 누가 가장 멀리 갈까
              </>
            )}
          </h1>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-race-px)] text-[22px] text-[#f0b84a]">
              DAY {Math.max(1, todayDay)}
            </span>
            <span className="font-[family-name:var(--font-race-px)] text-[11px] text-[#a3a29a]">
              / {season.durationDays}
            </span>
          </div>
          <div className="flex h-2.5 gap-px border border-[#3c3d43] bg-[#17181b] p-px">
            {Array.from({ length: season.durationDays }, (_, i) => (
              <i
                key={i}
                className={`block flex-1 ${i + 1 < todayDay ? "bg-[#f0b84a]" : i + 1 === todayDay ? "bg-[#f1f1ee]" : "bg-transparent"}`}
              />
            ))}
          </div>
          <p className="text-sm text-[#a3a29a]">
            {seasonOver
              ? `${dateLabel(uptoDateStr)} · 시즌 마지막 날`
              : `${dateLabel(uptoDateStr)} · 시상까지 ${season.durationDays - todayDay}일 (${dateLabel(endDateStr)})`}
          </p>
        </div>
      </header>

      <section className="rounded border border-[#3c3d43] bg-[#2a2b2e] p-4 sm:p-[18px]">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">코스 현황</h2>
            {leader && (
              <p className="text-[13px] text-[#a3a29a]">
                선두 {leader.member.name} · {leader.pts.toFixed(1)}km · {checkpointOf(leader.pts)} ·{" "}
                {destinationNameOf(season.goalKm)}까지 {Math.max(0, season.goalKm - leader.pts).toFixed(1)}km
              </p>
            )}
          </div>
        </div>
        <RaceTrack entries={trackEntries} goalKm={season.goalKm} />
        <p className="mt-2.5 text-xs text-[#a3a29a]">
          환산 기준 <b className="text-[#f1f1ee]">1km</b> = 러닝 1km · WOD·헬스 {season.wodMinutesPerKm}분 · 수영{" "}
          {season.swimMetersPerKm}m. 훈련 비율에 따라 캐릭터 체형이 바뀌고, 3일 동안 기록이 없으면 캐릭터가 잠들어요.
        </p>
      </section>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <section className="rounded border border-[#3c3d43] bg-[#2a2b2e] p-4 sm:p-[18px]">
          <h2 className="text-base font-bold">리더보드</h2>
          <p className="text-[13px] text-[#a3a29a]">어제 대비 순위 변화와 바로 앞 사람과의 거리를 보여줘요</p>
          {cur.length === 0 ? (
            <p className="mt-4 text-sm text-[#6f6f6a]">
              아직 크루원이 없어요.{" "}
              <Link href="/race/join" className="text-[#f0b84a] underline">
                첫 캐릭터 만들기 →
              </Link>
            </p>
          ) : (
            <ol className="mt-3.5 flex flex-col">
              {cur.map((s, i) => {
                const prevRank = prevRankByMember.get(s.member.id) ?? s.rank;
                const diff = prevRank - s.rank;
                const gap = i === 0 ? `선두 · ${checkpointOf(s.pts)}` : `${cur[i - 1].member.name}까지 ${(cur[i - 1].pts - s.pts).toFixed(1)}km`;
                const sleep = isSleeping(s.idleDays);
                return (
                  <li
                    key={s.member.id}
                    className="grid grid-cols-[40px_44px_minmax(0,1fr)_auto] items-center gap-3 border-t border-[#3c3d43] py-2.5 first:border-t-0"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className={`font-[family-name:var(--font-race-px)] text-[13px] ${i === 0 ? "text-[#f0b84a]" : ""}`}>
                        {s.rank}
                      </span>
                      {diff > 0 ? (
                        <span className="text-[11px] font-medium text-[#86d494]">▲{diff}</span>
                      ) : diff < 0 ? (
                        <span className="text-[11px] font-medium text-[#f08068]">▼{-diff}</span>
                      ) : (
                        <span className="text-[11px] font-medium text-[#6f6f6a]">–</span>
                      )}
                    </div>
                    <RaceAvatarImg
                      color={s.member.color}
                      eye={s.member.eye as RaceEye}
                      acc={s.member.acc as RaceAcc}
                      type={s.type}
                      sleep={sleep}
                      scale={2}
                      className="block [image-rendering:pixelated]"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 font-bold">
                        <span>{s.member.name}</span>
                        {s.member.igHandle && <span className="text-[11px] font-normal text-[#a3a29a]">@{s.member.igHandle}</span>}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        <span className="rounded bg-[#323338] px-1.5 py-px text-[11px] font-medium text-[#a3a29a]">
                          {TYPE_LABEL[s.type]}
                        </span>
                        {s.streak >= 3 && (
                          <span className="rounded bg-[#323338] px-1.5 py-px text-[11px] font-medium text-[#ffb38f]">
                            {s.streak}일 연속
                          </span>
                        )}
                        {sleep && (
                          <span className="rounded bg-[#323338] px-1.5 py-px text-[11px] font-medium text-[#a3a8d6]">
                            잠수 {s.idleDays}일
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-xs text-[#a3a29a]">{gap}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-[family-name:var(--font-race-px)] text-sm">{s.pts.toFixed(1)}</span>
                      <span className="ml-1 text-xs text-[#a3a29a]">km</span>
                      <div className="mt-1 hidden text-[11px] whitespace-nowrap text-[#6f6f6a] sm:block">{formatBreakdown(s)}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="flex flex-col gap-5">
          <section className="rounded border border-[#3c3d43] bg-[#2a2b2e] p-4 sm:p-[18px]">
            <h2 className="text-base font-bold">시상 부문</h2>
            <p className="text-[13px] text-[#a3a29a]">
              {seasonOver ? "시즌 마지막 날이에요. 지금 순위가 최종 결과가 돼요." : `${dateLabel(endDateStr)} 시즌 종료 시점 기준으로 시상해요.`}
            </p>
            <div className="mt-3.5 grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2">
              {awards.map((a) => (
                <div key={a.key} className="flex flex-col gap-2 rounded bg-[#323338] p-3">
                  <span className="font-[family-name:var(--font-race-px)] text-[8px] leading-relaxed text-[#f0b84a]">{a.label}</span>
                  <h3 className="text-sm font-bold">{a.title}</h3>
                  <p className="text-xs leading-relaxed text-[#a3a29a]">{a.description}</p>
                  {a.holder ? (
                    <div className="mt-auto flex items-center gap-2">
                      <RaceAvatarImg
                        color={a.holder.member.color}
                        eye={a.holder.member.eye as RaceEye}
                        acc={a.holder.member.acc as RaceAcc}
                        type={a.holder.type}
                        sleep={isSleeping(a.holder.idleDays)}
                        scale={2}
                        className="[image-rendering:pixelated]"
                      />
                      <div>
                        <b className="text-sm">{a.holder.member.name}</b>
                        <span className="block text-xs text-[#a3a29a]">{a.value}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-auto text-xs text-[#6f6f6a]">아직 후보가 없어요.</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {recentProofs.length > 0 && (
            <section className="rounded border border-[#3c3d43] bg-[#2a2b2e] p-4 sm:p-[18px]">
              <h2 className="text-base font-bold">인증샷</h2>
              <p className="text-[13px] text-[#a3a29a]">최근 24시간 동안 올라온 인증샷이에요. 시간이 지나면 자동으로 사라져요.</p>
              <div className="mt-3 grid grid-cols-3 gap-2 min-[420px]:grid-cols-4">
                {recentProofs.map((p) => (
                  <a
                    key={p.id}
                    href={raceProofPublicUrl(p.proofPath!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-square overflow-hidden rounded bg-[#17181b]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={raceProofPublicUrl(p.proofPath!)}
                      alt={`${p.member.name}의 ${KIND_LABEL[p.kind]} 인증샷`}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pt-4 pb-1">
                      <span className="block truncate text-[11px] font-semibold text-white">{p.member.name}</span>
                      <span className="block text-[10px] text-white/70">
                        {KIND_LABEL[p.kind]} · {hoursAgoLabel(p.createdAt)}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          <section className="rounded border border-[#3c3d43] bg-[#2a2b2e] p-4 sm:p-[18px]">
            <h2 className="text-base font-bold">크루 소식</h2>
            <ul className="mt-3 flex flex-col">
              {feed.length === 0 ? (
                <li className="py-2 text-sm text-[#6f6f6a]">아직 소식이 없어요</li>
              ) : (
                feed.map((f, i) => (
                  <li key={i} className="grid grid-cols-[52px_minmax(0,1fr)] gap-2 border-t border-[#3c3d43] py-1.5 text-sm first:border-t-0">
                    <span className="pt-1 font-[family-name:var(--font-race-px)] text-[8px] text-[#6f6f6a]">
                      DAY {dayIndexOf(f.date, startDateStr)}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: f.text }} />
                  </li>
                ))
              )}
            </ul>
          </section>

          <RaceGuestbook
            entries={guestbookEntries.map((e) => ({
              id: e.id,
              authorId: e.authorId,
              authorName: e.author.name,
              body: e.body,
              createdAt: e.createdAt.toISOString(),
            }))}
            currentMemberId={raceSession?.sub ?? null}
            loggedIn={!!raceSession}
          />
        </div>
      </div>
    </div>
  );
}
