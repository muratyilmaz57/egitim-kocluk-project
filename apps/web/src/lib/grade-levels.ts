export const GRADE_LEVELS = ["8. sinif", "9. sinif", "10. sinif", "11. sinif", "12. sinif"] as const;

export type GradeLevel = (typeof GRADE_LEVELS)[number];

export function gradeLevelLabel(value: string) {
  return value.replace("sinif", "Sınıf");
}

export function isGradeLevel(value?: string | null): value is GradeLevel {
  return GRADE_LEVELS.includes(value as GradeLevel);
}

export function lessonMatchesGrade(
  lesson: { gradeLevel?: string | null; topics: Array<{ gradeLevel: string | null }> },
  gradeLevel: string,
) {
  return lesson.gradeLevel === gradeLevel || lesson.topics.some((topic) => topic.gradeLevel === gradeLevel);
}
