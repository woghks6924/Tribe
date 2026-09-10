export type WodRepsByGroup = {
  group: string; // 빈 문자열이면 그룹 구분 없음
  reps: string;
};

export type WodRunSegment = {
  type: "run";
  distance: string;
};

export type WodExerciseSegment = {
  type: "exercise";
  name: string;
  reps: WodRepsByGroup[];
};

export type WodSegment = WodRunSegment | WodExerciseSegment;

export type WodRoundData = {
  id: string;
  roundNumber: number;
  roundName: string | null;
  segments: WodSegment[];
  timeCapSec: number | null;
  restTimeSec: number | null;
  bonusExercise: string | null;
};

export type WodSessionData = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  rounds: WodRoundData[];
};

export type WodRoundInput = {
  roundNumber: number;
  roundName?: string;
  segments: WodSegment[];
  timeCapSec?: number | null;
  restTimeSec?: number | null;
  bonusExercise?: string;
};
