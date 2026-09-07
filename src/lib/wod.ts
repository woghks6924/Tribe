export type WodExercise = {
  name: string;
  reps: string;
};

export type WodRoundData = {
  id: string;
  roundNumber: number;
  roundName: string | null;
  runDistance: string | null;
  exercises: WodExercise[];
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
