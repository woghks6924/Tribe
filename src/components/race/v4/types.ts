import type { RaceBodyType } from "@/lib/race/constants";
import type { V4Look } from "@/lib/race/v4/sprite";

// 서버 컴포넌트가 계산해서 클라이언트(캔버스) 컴포넌트에 넘기는 한 사람 분량의 데이터.
export type V4Runner = {
  id: string;
  name: string;
  km: number;
  type: RaceBodyType;
  todayLogged: boolean;
  look: V4Look;
  nameColor: string; // 이름·진행바 점 색(기존 대표색)
  isMe?: boolean;
  sleeping?: boolean; // 잠수(3일 무기록)
};
