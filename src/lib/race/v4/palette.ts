// v4 꾸미기 선택지. DOM 의존성 없음 — 화면과 저장 API(검증)가 같이 쓴다.

export const HAIR_NAMES: [string | null, string][] = [
  [null, "기본(짧은 머리)"],
  ["hair_twoblock", "투블럭"],
  ["hair_sidepart", "가르마"],
  ["hair_pomade", "포마드"],
  ["hair_curly", "곱슬"],
  ["hair_bun", "번"],
  ["hair_ponytail", "포니테일"],
  ["hair_twintail", "트윈테일"],
  ["hair_long", "긴 머리"],
  ["hair_braid", "땋은 머리"],
];
export const ITEM_NAMES: [string | null, string][] = [
  [null, "없음"],
  ["item_cap", "캡"],
  ["item_beanie", "비니"],
  ["item_headband", "헤어밴드"],
  ["item_headphones", "헤드폰"],
  ["item_sunglasses", "선글라스"],
  ["item_scarf", "스카프"],
];
export const ANIM_NAMES: [string, string][] = [
  ["running", "달리기"],
  ["breathing_idle", "대기"],
  ["jumping", "점프(레벨업)"],
  ["backflip", "백플립(완주)"],
  ["getting_up", "일어나기"],
  ["falling_back_death", "넘어짐(추월당함)"],
];
export const PALETTE = {
  top: ["#2b2b30", "#f2f2ee", "#ff6b3d", "#ef4f6a", "#3f7cff", "#2fae7a", "#f0c23a", "#7b5cd6"],
  bottom: ["#2c3e66", "#1d1d22", "#55585f", "#f2f2ee", "#3a6b4a", "#8b2f3a", "#c7a27a", "#4b8ad8"],
  shoes: ["#f2f2ee", "#1d1d22", "#ff6b3d", "#3fd0ff", "#c6f24a", "#ff5cab", "#f0c23a", "#8a8f99"],
  hair: ["#2a2430", "#5a3a26", "#a8743f", "#e4c27a", "#c24a3a", "#8a8d96", "#3b5bd6", "#e98fbf"],
};
export const COLOR_NAMES = { top: "상의", bottom: "하의", shoes: "신발", hair: "머리" };


// 장비·펫 한글 이름표. 목록 자체는 manifest에서 읽고, 여기엔 이름만 둔다(없는 키는 키 이름 그대로 보여준다).
export const SLOT_LABELS: Record<string, string> = { head: "머리", face: "얼굴", neck: "목", back: "등", waist: "허리" };
export const ITEM_LABELS: Record<string, string> = {
  item_cap: "캡",
  item_beanie: "비니",
  item_headband: "헤어밴드",
  item_headphones: "헤드폰",
  head_bucket: "버킷햇",
  head_visor: "바이저",
  head_earmuffs: "귀마개",
  head_swimcap: "수영모",
  head_helmet: "헬멧",
  head_crown: "왕관",
  head_santa: "산타모자",
  item_sunglasses: "선글라스",
  item_scarf: "스카프",
  neck_medal: "완주 메달",
  neck_towel: "수건",
  neck_gaiter: "넥게이터",
  back_pack: "백팩",
  back_vest: "러닝 베스트",
  back_flag: "깃발",
  back_cape: "망토",
  back_wings: "날개",
  waist_belt: "러닝 벨트",
  waist_jacket: "허리 재킷",
};
export const PET_NAMES: Record<string, string> = {
  pet_cat: "고양이",
  pet_corgi: "코기",
  pet_bichon: "비숑",
  pet_retriever: "리트리버",
  pet_maltese: "말티즈",
  pet_bird: "새",
  pet_shark: "상어",
  pet_dolphin: "돌고래",
  pet_hamster: "햄스터",
  pet_quokka: "쿼카",
  pet_capybara: "카피바라",
  pet_squirrel: "다람쥐",
};
