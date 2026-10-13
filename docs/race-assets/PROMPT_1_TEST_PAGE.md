# 1단계: 새 캐릭터 테스트 페이지 (/race/lab)

`docs/race-assets/` 에 PixelLab 사람 캐릭터 에셋, 합성 모듈, 코스 배경 모듈이 있다.
**지금 /race의 동글이 캐릭터는 절대 건드리지 말고**, 별도 테스트 페이지에서만 새 캐릭터를 띄워줘. 내가 확인한 뒤 2단계(`PROMPT_2_SWAP.md`)로 교체한다.
동작 레퍼런스: `docs/race-assets/race-preview.html` (브라우저로 열면 코스 + 구간 배경 + 꾸미기가 돈다).

## 들어있는 것
- `sprites/base/{anim}_{dir}.png` : 동작별 가로 시트 (running, breathing_idle, jumping, backflip, getting_up, falling_back_death[south만]). 시트마다 프레임 크기가 다르니 manifest의 `size`를 쓴다.
- `hair/`, `items/` : 헤어 9종, 장비 6종 (east/south)
- `manifest.json` : 프레임 기준점, 레이어 오프셋, 색→부위 대응표, 옷 구역 경계, 모자 목록
- `tribe-sprite.js` : `loadRaceAssets`, `Character`(색 바꾸기 + 헤어/장비/배번 합성 + 캐시), `TypeFX`(유형 8종 연출), `drawTypeIcon`, `TYPES`
- `tribe-course.js` : `drawCourse`(구간 배경 8종, 이미지 없음), `SEGMENTS`(서울0·수원35·천안90·대전160·김천235·대구300·밀양370·부산425), `segmentAt(km)`, `timeOfDay()`(KST 새벽/낮/노을/밤)
- `build_assets.py` : PixelLab Export 폴더 → 에셋 재생성 (헤어/장비 추가 시 다시 실행)

## 할 일
1. 에셋은 `public/race-assets/`로 복사. 두 JS 모듈은 `src/lib/race/v4/`로 옮겨 TS로 바꾸되 로직은 그대로. canvas를 쓰므로 클라이언트 컴포넌트에서만 import.
2. 새 라우트 `/race/lab` 추가.
   - 접근: 기존 관리자 인증을 재사용. 없으면 `?key=` 값이 환경변수 `RACE_LAB_KEY`와 같을 때만 열림. `robots: noindex`, 메뉴/네비에 링크 걸지 않기.
   - **DB 쓰기 없음. 마이그레이션 없음.** 기존 시즌 데이터는 읽기만 한다.
3. 화면 구성 (race-preview.html과 같은 구조):
   - **코스 장면**: 실제 시즌 참가자를 읽어 와서, 선택한 구간 배경 위에 그 구간에 있는 사람들을 달리게 한다(`segmentAt(totalKm)`). 기본 구간은 1등이 있는 곳. 아래에 8구간 썸네일 + 시간대 선택(지금 시간/새벽/낮/노을/밤).
   - 오늘 기록 없는 사람은 `breathing_idle`, 있는 사람은 `running`.
   - 이름표는 겹치면 한 줄 위로 (preview 코스 코드 그대로).
   - **외형 초기값**: 기존 `color` → 상의색, 장착 중인 아이템 → 새 장비 키로 매핑(cap→item_cap, beanie→item_beanie, headband→item_headband, headphones→item_headphones, sunglasses→item_sunglasses, scarf→item_scarf, 그 외 없음). 헤어는 기본(짧은 머리), 하의 `#2c3e66`, 신발 `#f2f2ee`, 머리 `#2a2430`.
   - 훈련 유형은 기존 계산 로직을 그대로 쓰고 키만 `TYPES` 키(base, run, long, speed, wod, swim, tri, hybrid)로 매핑.
   - **비교 토글**: 같은 멤버를 기존 동글이 캐릭터와 새 캐릭터로 나란히 보여주는 카드 목록(기존 렌더 컴포넌트를 import만 해서 재사용).
   - **꾸미기 패널**: 멤버 하나 고르면 헤어 10개, 색 4부위 × 8색(preview의 PALETTE), 장비, 배번, 동작, 방향을 바꿔볼 수 있게. 저장은 localStorage에만(테스트용).
   - 스토리 카드(9:16) 미리보기 1장: 그 멤버의 구간 배경 + south 캐릭터 + 유형 아이콘.
4. 성능: `Character`는 동작×방향별로 처음 한 번만 굽고 캐시. 화면에 안 보이는 canvas는 requestAnimationFrame 멈춤. 모바일(iPhone Safari)에서 24명 코스가 끊기지 않는지 확인.

## 제약
- 기존 /race 파일, Prisma 스키마, API는 수정 금지. 새 파일 추가만.
- 시간은 KST.
- 프리뷰 배포로 올리고, 바뀐 파일 목록과 `/race/lab` 프리뷰 URL 알려줘. 머지는 내가 확인한 다음에.
