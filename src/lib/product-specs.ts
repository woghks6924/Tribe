export const PURPOSE_TAGS = ["Running", "Road Race", "Competition", "Daily Wear", "Gym Training"] as const;

export const CARE_OPTIONS = [
  "Machine Wash Cold",
  "Wash with Like Colors",
  "Do Not Bleach",
  "Lay Flat to Dry",
  "Do Not Iron",
  "Do Not Dry Clean",
] as const;

// 한국 기온 표시 관례에 맞춰 섭씨(°C) 기준, 사계절 범위(-10°C ~ 35°C)로 표시한다.
export const TEMP_SCALE = { min: -10, max: 35, labels: [-10, 0, 10, 20, 30, 35] } as const;
export const EFFORT_SCALE = { min: 0, max: 100, labels: [0, 25, 50, 75, 100] } as const;
