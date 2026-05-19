/** Multi-year analyst development ladder (expandable). */
export const CURRICULUM_CAREER_LEVELS: readonly {
  level: number;
  label: string;
  year: number;
}[] = [
  { level: 1, label: "Analyst Basics", year: 1 },
  { level: 2, label: "Analyst Medium", year: 2 },
  { level: 3, label: "Analyst Advanced", year: 3 },
  { level: 4, label: "Senior Basics", year: 4 },
  { level: 5, label: "Senior Medium", year: 5 },
  { level: 6, label: "Senior Advanced", year: 6 },
  { level: 7, label: "Manager Track", year: 7 },
  { level: 8, label: "Director Track", year: 8 },
  { level: 9, label: "Executive Track", year: 9 },
  { level: 10, label: "Expert Advisor", year: 10 },
] as const;

export const CURRICULUM_MAX_LEVEL = 10;

/** Advance when rolling average accuracy meets this threshold. */
export const CURRICULUM_LEVEL_UP_SCORE = 80;

/** Number of recent attempts in the rolling window for level progression. */
export const CURRICULUM_ROLLING_WINDOW = 5;

export function careerLevelLabel(level: number): string {
  const row = CURRICULUM_CAREER_LEVELS.find((l) => l.level === level);
  return row?.label ?? `Level ${level}`;
}

/** Maps career level (1–10) to seeded case bucket (junior_year 1–3). */
export function careerLevelToCaseYear(level: number): 1 | 2 | 3 {
  if (level <= 3) return 1;
  if (level <= 6) return 2;
  return 3;
}
