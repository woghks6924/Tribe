import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentRaceMember } from "@/lib/auth/race-session";
import { KIND_LABEL, TYPE_LABEL, destinationNameOf, type RaceEye } from "@/lib/race/constants";
import { raceProofPublicUrl } from "@/lib/race/storage";
import { feedEventKey } from "@/lib/race/reaction-key";
import { buildLevelUpFeed, computeMemberAppearances, getRaceLevelConfig } from "@/lib/race/appearance";
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
import { RacePokeButton } from "@/components/race/race-poke-button";
import { RaceHifiveButton } from "@/components/race/race-hifive-button";

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

  const [members, logs, influences, recentProofs, guestbookEntries] = await Promise.all([
    prisma.raceMember.findMany({ where: { excluded: false } }),
    prisma.raceLog.findMany({ where: { seasonId: season.id } }),
    prisma.raceInfluence.findMany({ where: { seasonId: season.id } }),
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

  const cur = computeMemberStats(members, logs, startDateStr, uptoDateStr, influences);
  const prev = computeMemberStats(members, logs, startDateStr, addDaysToDateStr(uptoDateStr, -1), influences);
  const prevRankByMember = new Map(prev.map((s) => [s.member.id, s.rank]));
  const awards = computeAwards(cur);

  const memberIds = members.map((m) => m.id);
  const [levelConfig, allTimeLogs, levelupItems] = await Promise.all([
    getRaceLevelConfig(),
    prisma.raceLog.findMany({ where: { memberId: { in: memberIds } }, select: { memberId: true, date: true, convertedKm: true } }),
    prisma.raceMemberItem.findMany({ where: { memberId: { in: memberIds }, source: "levelup" } }),
  ]);
  const itemsByMemberLevel = new Map(levelupItems.map((it) => [`${it.memberId}:${it.acquiredLevel}`, it.itemId]));
  const levelUpFeed = buildLevelUpFeed(members, allTimeLogs, itemsByMemberLevel, levelConfig, startDateStr, uptoDateStr);

  const feed = [...buildSeasonFeed(members, logs, startDateStr, uptoDateStr, season.goalKm, influences), ...levelUpFeed]
    .sort((a, b) => dayIndexOf(a.date, startDateStr) - dayIndexOf(b.date, startDateStr))
    .slice(-14)
    .reverse();

  const proofIds = recentProofs.map((p) => p.id);
  const feedKeys = feed.filter((f) => f.memberId).map((f) => feedEventKey(f));
  const reactions =
    proofIds.length || feedKeys.length
      ? await prisma.raceReaction.findMany({
          where: {
            OR: [
              ...(proofIds.length ? [{ targetType: "PROOF", targetId: { in: proofIds } }] : []),
              ...(feedKeys.length ? [{ targetType: "FEED", targetId: { in: feedKeys } }] : []),
            ],
          },
        })
      : [];
  const reactionCountByKey = new Map<string, number>();
  const myReactedKeys = new Set<string>();
  for (const r of reactions) {
    const key = `${r.targetType}:${r.targetId}`;
    reactionCountByKey.set(key, (reactionCountByKey.get(key) ?? 0) + 1);
    if (raceSession && r.memberId === raceSession.sub) myReactedKeys.add(key);
  }

  const idleDaysByMember = new Map(cur.map((s) => [s.member.id, s.idleDays]));
  const rankDroppedByMember = new Map(cur.map((s) => [s.member.id, s.rank > (prevRankByMember.get(s.member.id) ?? s.rank)]));
  const appearances = await computeMemberAppearances(members, {
    seasonId: season.id,
    idleDaysByMember,
    rankDroppedByMember,
  });
  const appearanceOf = (memberId: string) =>
    appearances.get(memberId) ?? { level: 0, gold: false, expr: "n" as const, eq: {} };

  const trackEntries: RaceTrackEntry[] = cur.map((s) => {
    const a = appearanceOf(s.member.id);
    return {
      memberId: s.member.id,
      name: s.member.name,
      color: s.member.color,
      eye: s.member.eye as RaceEye,
      eq: a.eq,
      gold: a.gold,
      expr: a.expr,
      pts: s.pts,
      type: s.type,
    };
  });

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
                const a = appearanceOf(s.member.id);
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
                      appearance={{ color: s.member.color, eye: s.member.eye as RaceEye, type: s.type, expr: a.expr, eq: a.eq, gold: a.gold }}
                      scale={1.4}
                      className="block [image-rendering:pixelated]"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 font-bold">
                        <span>{s.member.name}</span>
                        <span className="rounded bg-[#17181b] px-1.5 py-px text-[11px] font-normal text-[#f0b84a]">Lv.{a.level}</span>
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
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="text-right">
                        <span className="font-[family-name:var(--font-race-px)] text-sm">{s.pts.toFixed(1)}</span>
                        <span className="ml-1 text-xs text-[#a3a29a]">km</span>
                        <div className="mt-1 hidden text-[11px] whitespace-nowrap text-[#6f6f6a] sm:block">{formatBreakdown(s)}</div>
                      </div>
                      {raceSession && raceSession.sub !== s.member.id && (sleep || s.pts === 0) && (
                        <RacePokeButton targetId={s.member.id} />
                      )}
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
                  {a.holder && (() => {
                    const holder = a.holder;
                    const ha = appearanceOf(holder.member.id);
                    return (
                      <div className="mt-auto flex items-center gap-2">
                        <RaceAvatarImg
                          appearance={{
                            color: holder.member.color,
                            eye: holder.member.eye as RaceEye,
                            type: holder.type,
                            expr: ha.expr,
                            eq: ha.eq,
                            gold: ha.gold,
                          }}
                          scale={1.4}
                          className="[image-rendering:pixelated]"
                        />
                        <div>
                          <b className="text-sm">
                            {holder.member.name} <span className="font-normal text-[#f0b84a]">Lv.{ha.level}</span>
                          </b>
                          <span className="block text-xs text-[#a3a29a]">{a.value}</span>
                        </div>
                      </div>
                    );
                  })()}
                  {!a.holder && (
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
                  <div key={p.id} className="group relative aspect-square overflow-hidden rounded bg-[#17181b]">
                    <a
                      href={raceProofPublicUrl(p.proofPath!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 block"
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
                    <RaceHifiveButton
                      targetType="PROOF"
                      targetId={p.id}
                      targetMemberId={p.memberId}
                      initialCount={reactionCountByKey.get(`PROOF:${p.id}`) ?? 0}
                      initialActive={myReactedKeys.has(`PROOF:${p.id}`)}
                      loggedIn={!!raceSession}
                      variant="overlay"
                      className="absolute top-1 right-1"
                    />
                  </div>
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
                feed.map((f, i) => {
                  const key = f.memberId ? feedEventKey(f) : null;
                  return (
                    <li
                      key={i}
                      className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-2 border-t border-[#3c3d43] py-1.5 text-sm first:border-t-0"
                    >
                      <span className="font-[family-name:var(--font-race-px)] text-[8px] text-[#6f6f6a]">
                        DAY {dayIndexOf(f.date, startDateStr)}
                      </span>
                      <span dangerouslySetInnerHTML={{ __html: f.text }} />
                      {key && (
                        <RaceHifiveButton
                          targetType="FEED"
                          targetId={key}
                          targetMemberId={f.memberId!}
                          initialCount={reactionCountByKey.get(`FEED:${key}`) ?? 0}
                          initialActive={myReactedKeys.has(`FEED:${key}`)}
                          loggedIn={!!raceSession}
                        />
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>
      </div>

      <section className="rounded border border-[#3c3d43] bg-[#17181b] p-4 sm:p-[18px]">
        <h2 className="text-base font-bold">업데이트 노트</h2>
        <ul className="mt-3 flex flex-col gap-2.5 text-[13px] text-[#a3a29a]">
          <li>
            <b className="text-[#f1f1ee]">캐릭터 전면 개편</b> — 체형 8종, 표정 7종이 기록·순위에 따라 자동으로 바뀌고, 레벨(누적
            거리 기준, 최대 Lv.30)에 도달하면 장비를 하나씩 골라 착용할 수 있어요. 내 캐릭터 페이지의{" "}
            <b className="text-[#f1f1ee]">옷장</b>에서 갈아입을 수 있어요.
          </li>
          <li>
            <b className="text-[#f1f1ee]">콕 찌르기</b> — 리더보드에서 잠수 중이거나 아직 0km인 크루원을 하루 한 번 깨울 수
            있어요. 계속 못 깨어나면 캐릭터가 초조해해요.
          </li>
          <li>
            <b className="text-[#f1f1ee]">방명록 위치 이동</b> — 코스 현황 바로 아래로 옮겨서 더 잘 보이게 했어요.
          </li>
          <li>
            <b className="text-[#f1f1ee]">하이파이브</b> — 인증샷과 크루 소식 항목에 👏를 눌러 반응을 남길 수 있어요.
          </li>
          <li>
            <b className="text-[#f1f1ee]">공격 / 응원</b> — 기록을 올릴 때 그 기록의 일부(공격 5% · 응원 15%)를 크루원 한 명에게
            나눠줄 수 있어요. 공격은 순위가 가까운 사람만, 응원은 누구나 대상이 될 수 있고, 내 기록은 그대로 다 쌓여요.
          </li>
          <li>
            <b className="text-[#f1f1ee]">레벨업 소식</b> — 크루원이 레벨업하면 크루 소식에 획득한 장비와 함께 알려줘요.
          </li>
          <li>
            <b className="text-[#f1f1ee]">옷장 미리보기</b> — 아직 못 가진 장비도 캐릭터에 미리 입혀볼 수 있고, 다음 장비 선택까지
            남은 거리도 옷장에서 바로 확인할 수 있어요.
          </li>
        </ul>
      </section>
    </div>
  );
}
