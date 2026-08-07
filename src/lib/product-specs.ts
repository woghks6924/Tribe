export const PURPOSE_TAGS = ["Running", "Road Race", "Competition", "Daily Wear", "Gym Training"] as const;

export const CARE_OPTIONS = [
  "Machine Wash Cold",
  "Wash with Like Colors",
  "Do Not Bleach",
  "Lay Flat to Dry",
  "Do Not Iron",
  "Do Not Dry Clean",
] as const;

export const TEMP_SCALE = { min: 0, max: 95, labels: [0, 32, 50, 70, 85, 95] } as const;
export const EFFORT_SCALE = { min: 0, max: 100, labels: [0, 25, 50, 75, 100] } as const;
