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

