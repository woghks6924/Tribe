# 2단계: /race 캐릭터를 새 캐릭터로 교체 (테스트 페이지 확인 후)

`/race/lab`에서 확인 끝났다. 이제 실제 /race에 적용해줘. 1단계에서 만든 `src/lib/race/v4/` 모듈과 `public/race-assets/`를 그대로 쓴다.

1. 데이터 (추가형 마이그레이션만, 삭제 금지)
   - RaceMember에 `hairStyle String?`, `topColor`, `bottomColor`, `shoesColor`, `hairColor`(String, 기본값 `#2b2b30` / `#2c3e66` / `#f2f2ee` / `#2a2430`), `bibNumber Int?` 추가.
   - 백필: 기존 `color` → `topColor`. `eyes`는 안 쓰지만 컬럼은 남김.
   - 장비는 기존 옷장(RaceMemberItem) 유지, 키 매핑은 1단계와 동일. 매핑 안 되는 옛 아이템은 옷장에서 숨김. 장착은 1개.
2. 화면 교체
   - 코스/리더보드/피드/프로필/스토리 카드의 캐릭터 렌더를 새 모듈로 교체. 레이스 메인 상단에 내 위치 구간 배경 장면(`drawCourse`) 추가.
   - 레벨업 순간 `jumping` 1회, 부산 도착 `backflip`, 순위가 밀렸다는 피드 카드에는 `falling_back_death`(south).
   - 꾸미기 화면(PIN 로그인 후): `/race/lab` 꾸미기 패널을 서버 저장 방식으로. 헤어는 전부 무료, 장비는 보유한 것만.
3. 기능 플래그 `NEXT_PUBLIC_RACE_CHAR_V4`로 감싸서, 끄면 기존 동글이로 즉시 돌아가게.
4. 진행 중인 시즌(9/23~11/11) 기록·순위·레벨에는 영향 없게. 프리뷰 배포 → 확인 → 머지. 바뀐 파일 목록과 프리뷰 URL 알려줘.
