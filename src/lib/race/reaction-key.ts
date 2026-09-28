// 크루 소식(RaceFeedEvent)은 DB에 저장되지 않고 매번 로그에서 재계산되는 값이라, 하이파이브가
// 붙을 "고정된 ID"가 원래 없다. 같은 입력(date+memberId+text)이면 항상 같은 문자열을 만들어
// 그걸 RaceReaction.targetId로 쓴다 — 페이지를 새로고침해도 항상 똑같이 재현된다.
export function feedEventKey(event: { date: string; memberId?: string; text: string }): string {
  const raw = `${event.date}|${event.memberId ?? ""}|${event.text}`;
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = (Math.imul(h, 31) + raw.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}
