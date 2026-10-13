# Tri.be Race 캐릭터 v4 (사람 캐릭터 + 장비 + 펫 + 코스 배경)

`docs/race-assets/`에 새 캐릭터 에셋과 모듈이 전부 들어 있다.
작업은 **A단계(테스트 페이지)까지만** 하고 멈춰. 내가 확인하고 "B단계 진행"이라고 하면 그때 B단계를 한다.
동작 레퍼런스: `docs/race-assets/race-preview.html` (브라우저로 열면 코스 + 구간 배경 + 꾸미기 + 펫이 돈다. 화면 구성과 코드를 그대로 참고).

## 들어있는 것
| 경로 | 내용 |
|---|---|
| `sprites/base/{anim}_{dir}.png` | 동작별 가로 시트: running, breathing_idle, jumping, backflip, getting_up, falling_back_death(south만). dir = east(옆), south(정면). 시트마다 프레임 크기가 달라서 manifest의 `size` 사용 |
| `hair/` | 헤어 9종 (east/south) |
| `items/` | 장비 23종. 부위(head/face/neck/back/waist)는 manifest `slots`, 몸 뒤에 그릴 장비는 `behind`, 모자류는 `hats` |
| `pets/` | 펫 11종(고양이, 코기, 비숑, 리트리버, 말티즈, 새, 돌고래, 햄스터, 쿼카, 카피바라, 다람쥐). manifest `pets`에 정지 그림 + 있으면 달리기 시트. 새·돌고래는 달리기 시트 없이 `Pet`이 코드로 띄워서 움직임 |
| `manifest.json` | 위 전부의 메타데이터 + 색→부위 대응표(lut), 옷 구역 경계(bands) |
| `tribe-sprite.js` | `loadRaceAssets`, `Character`(색 바꾸기 + 헤어/장비/배번 합성 + 캐시), `Pet`, `TypeFX`(유형 8종 연출), `drawTypeIcon`, `TYPES`, `HAIR_STYLES`, `ITEMS`, `PETS` |
| `tribe-course.js` | `drawCourse`(구간 배경 8종, 이미지 없음), `SEGMENTS`(서울0·수원35·천안90·대전160·김천235·대구300·밀양370·부산425), `segmentAt(km)`, `timeOfDay()`(KST 새벽/낮/노을/밤) |
| `build_assets.py`, `build_pets.py` | PixelLab Export → 에셋 재생성용 (내가 따로 돌림. 앱 코드에서 쓰지 않음) |

에셋은 앞으로도 추가된다(펫, 얼굴 장비 등). **코드에 아이템/펫 목록을 하드코딩하지 말고 manifest를 읽어서** 목록을 만들 것. 한글 이름표만 상수로 둔다(preview의 SLOT_ITEMS, PETS 참고, 없는 키는 키 이름 그대로 표시).

---

## A단계: 테스트 페이지 `/race/lab`

**기존 /race 화면, Prisma 스키마, API는 수정 금지. 새 파일 추가만. DB 쓰기와 마이그레이션 없음.**

1. 에셋을 `public/race-assets/`로 복사. `tribe-sprite.js`, `tribe-course.js`는 `src/lib/race/v4/`로 옮겨 TS로 바꾸되 로직은 그대로. canvas를 쓰므로 클라이언트 컴포넌트에서만 import.
2. 접근: 기존 관리자 인증을 재사용, 없으면 `?key=`가 환경변수 `RACE_LAB_KEY`와 같을 때만. `robots: noindex`, 메뉴에 링크 걸지 않기.
3. 화면 (race-preview.html과 같은 구조):
   - **코스 장면**: 실제 시즌 참가자를 읽어서(읽기 전용), 고른 구간 배경 위에 그 구간에 있는 사람들을 달리게(`segmentAt(totalKm)`). 기본 구간은 1등이 있는 곳. 아래에 8구간 썸네일 + 시간대 선택(지금 시간/새벽/낮/노을/밤). 이름표는 겹치면 한 줄 위로.
   - 오늘 기록 없는 사람은 `breathing_idle`, 있는 사람은 `running`.
   - **외형 초기값**: 기존 `color` → 상의색, 장착 중인 옛 아이템 → 새 키(cap→item_cap, beanie→item_beanie, headband→item_headband, headphones→item_headphones, sunglasses→item_sunglasses, scarf→item_scarf, 나머지 없음). 헤어 기본, 하의 `#2c3e66`, 신발 `#f2f2ee`, 머리 `#2a2430`, 펫 없음.
   - 훈련 유형은 기존 계산 로직 그대로, 키만 `TYPES` 키(base, run, long, speed, wod, swim, tri, hybrid)로 매핑.
   - **비교 카드**: 같은 멤버를 기존 동글이와 새 캐릭터로 나란히 (기존 렌더 컴포넌트는 import만 해서 재사용).
   - **꾸미기 패널**: 멤버를 고르면 헤어, 색 4부위 × 8색(preview의 PALETTE), 부위별 장비(부위마다 1개씩 동시 착용), 펫, 배번, 동작, 방향을 바꿔보기. 테스트라서 보유·레벨 상관없이 전부 착용 가능. 저장은 localStorage에만.
   - **해금 미리보기**: 꾸미기 패널 위에 그 멤버의 실제 레벨 기준으로 아래 해금 규칙을 적용하면 무엇이 열려 있는지 배지로 표시(잠금 아이콘). 실제 적용은 B단계.
   - **스토리 카드(9:16) 미리보기**: 그 멤버의 구간 배경 + south 캐릭터 + 펫 + 유형 아이콘.
   - 펫은 캐릭터 바로 뒤(east 기준 왼쪽 15px)에서 같은 땅을 달린다. 프로필(south)에서는 오른쪽 옆에 앉아 있게(`moving: false`).
4. 성능: `Character`는 동작×방향별로 처음 한 번만 굽고 캐시. 화면 밖 canvas는 requestAnimationFrame 멈춤. iPhone Safari에서 25명 코스가 끊기지 않는지 확인.
5. 프리뷰 배포 후 바뀐 파일 목록과 `/race/lab` 프리뷰 URL을 알려주고 **멈춰**.

---

## B단계: 실제 /race 교체 (내가 "B단계 진행"이라고 하면)

1. **데이터** (추가형 마이그레이션만, 삭제 금지)
   - RaceMember에 `hairStyle String?`, `topColor`, `bottomColor`, `shoesColor`, `hairColor`(String, 기본값 `#2b2b30` / `#2c3e66` / `#f2f2ee` / `#2a2430`), `bibNumber Int?`, `petKey String?` 추가.
   - 백필: 기존 `color` → `topColor`. `eyes`는 안 쓰지만 컬럼은 남김.
   - 옷장(RaceMemberItem)은 유지하고 키 매핑은 A단계와 동일. 매핑 안 되는 옛 아이템은 옷장에서 숨김.
   - 장착은 **부위별 1개**: 같은 부위에서 하나를 끼면 기존 것은 서버에서 해제.
2. **해금 규칙** (상수는 한 곳에)
   - `PET_UNLOCK_LEVEL = 6`, `UNLOCK_ALL_LEVEL = 10`
   - Lv2~5: 레벨업마다 기본 장비 1개 선택 (버킷햇, 바이저, 수건, 넥게이터, 러닝벨트)
   - Lv6~9: 레벨업마다 레어 장비 1개 선택 (귀마개, 백팩, 러닝베스트, 허리재킷, 깃발, 망토, 날개, 왕관)
   - Lv6 이상: **펫 전부 자유 선택·교체** (1마리만 데리고 다님)
   - Lv10 이상: **장비 전부 자유 선택**
   - 조건부(레벨 무관): 수영모(수영 기록 1회), 헬멧(러닝·WOD·수영 모두 기록), 완주 메달(425km 도착), 산타모자(12월), 돌고래 펫(수영 누적 3km. 나중에 상어가 추가되면 같은 조건)
   - 옛 아이템을 이미 가진 사람은 그대로 보유.
   - 옷장/펫 화면에 "Lv.6이 되면 펫을 고를 수 있어요 (앞으로 OOkm)" 같은 진행 표시.
   - 현재 레벨 공식과 Lv.2~12 각 레벨의 필요 누적 km를 응답에 같이 알려줘.
3. **화면 교체**
   - 코스/리더보드/피드/프로필/스토리 카드의 캐릭터 렌더를 새 모듈로. 레이스 메인 상단에 내 구간 배경 장면(`drawCourse`) 추가.
   - 레벨업 순간 `jumping` 1회, 부산 도착 `backflip`, 순위가 밀렸다는 피드 카드에는 `falling_back_death`(south).
   - 잠수(3일 무기록) 상태는 기존 규칙 유지, 새 캐릭터는 `breathing_idle` + 머리 위 "Zz".
   - 꾸미기 화면(PIN 로그인 후): A단계 꾸미기 패널을 서버 저장 + 해금 규칙 적용 버전으로.
4. 기능 플래그 `NEXT_PUBLIC_RACE_CHAR_V4`로 감싸서, 끄면 기존 동글이로 즉시 돌아가게.

## 공통 제약
- 진행 중인 시즌(9/23~11/11)의 기록·순위·레벨 계산에는 영향 없게. 시간은 KST.
- 프리뷰 배포 → 내가 확인 → 머지. 끝날 때마다 바뀐 파일 목록과 프리뷰 URL.
