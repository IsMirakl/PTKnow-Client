import type { LessonDTO } from '../types/lesson';

const STORAGE_KEY = 'ptknow:last-course-progress';

export interface ContinueCourseState {
  courseId: number;
  courseName: string;
  lessonName?: string;
  lessonBeginAt?: string;
}

export const saveContinueCourseState = (
  state: ContinueCourseState | null
): void => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!state) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const getContinueCourseState = (): ContinueCourseState | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ContinueCourseState>;
    if (
      typeof parsed.courseId !== 'number' ||
      typeof parsed.courseName !== 'string'
    ) {
      return null;
    }

    return {
      courseId: parsed.courseId,
      courseName: parsed.courseName,
      lessonName:
        typeof parsed.lessonName === 'string' ? parsed.lessonName : undefined,
      lessonBeginAt:
        typeof parsed.lessonBeginAt === 'string'
          ? parsed.lessonBeginAt
          : undefined,
    };
  } catch {
    return null;
  }
};

export const formatContinueLessonTime = (
  value?: string | null
): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const buildContinueCourseState = (
  courseId: number,
  courseName: string,
  lesson: LessonDTO | null
): ContinueCourseState => ({
  courseId,
  courseName,
  lessonName: lesson?.name,
  lessonBeginAt: lesson?.beginAt,
});
