// 새 캐릭터(v4) 기능 플래그. NEXT_PUBLIC_*는 빌드 시점에 값이 고정되므로, 바꾸면 재배포가 필요하다.
// 꺼져 있으면(기본) 기존 동글이 캐릭터가 그대로 나온다.
export const RACE_CHAR_V4 =
  process.env.NEXT_PUBLIC_RACE_CHAR_V4 === "true" || process.env.NEXT_PUBLIC_RACE_CHAR_V4 === "1";
