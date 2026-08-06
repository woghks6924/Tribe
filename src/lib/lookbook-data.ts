export type LookbookPhoto = {
  number: string;
  src: string;
  caption: string;
};

export const LOOKBOOK_PHOTOS: LookbookPhoto[] = [
  { number: "01", src: "/lookbook/look-01.png", caption: "Before the mile begins." },
  { number: "02", src: "/lookbook/look-02.png", caption: "Breath before rhythm." },
  { number: "03", src: "/lookbook/look-03.png", caption: "Between one loop and the next." },
  { number: "04", src: "/lookbook/look-04.png", caption: "The pack, unhurried." },
  { number: "05", src: "/lookbook/look-05.png", caption: "Small rituals, same purpose." },
  { number: "06", src: "/lookbook/look-06.png", caption: "Alone, but never really." },
  { number: "07", src: "/lookbook/look-07.png", caption: "Before the city goes quiet." },
  { number: "08", src: "/lookbook/look-08.png", caption: "Miles don't lie." },
  { number: "09", src: "/lookbook/look-09.png", caption: "The record doesn't matter tonight." },
  { number: "10", src: "/lookbook/look-10.png", caption: "Still catching his breath." },
  { number: "11", src: "/lookbook/look-11.png", caption: "Rest is part of the run." },
  { number: "12", src: "/lookbook/look-12.png", caption: "Every street, a starting line." },
  { number: "13", src: "/lookbook/look-13.png", caption: "Same loop, different night." },
  { number: "14", src: "/lookbook/look-14.png", caption: "Refuel. Repeat." },
  { number: "15", src: "/lookbook/look-15.png", caption: "One tribe, one pace." },
  { number: "16", src: "/lookbook/look-16.png", caption: "Together, mile after mile." },
  { number: "17", src: "/lookbook/look-17.png", caption: "The last stretch home." },
];

// 필드노트(전체화면 가로 스크롤) 섹션에는 와이드/그룹 구도가 잘 어울리는 컷만 재사용한다.
export const FIELD_NOTE_NUMBERS = ["04", "07", "16", "09", "12", "17"];
