import { create } from 'zustand';
import { courseCardApi } from '../api';
import type { CourseDTO } from '../types/CourseCard';

interface CourseState {
  course: CourseDTO | null;
  loading: boolean;
  error: string | null;
  forbidden: boolean;
  fetchCourse: (id: number, force?: boolean) => Promise<void>;
  clearCourse: () => void;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  course: null,
  loading: false,
  error: null,
  forbidden: false,

  fetchCourse: async (id: number, force = false) => {
    const { course } = get();
    if (!force && course?.id === id) return;

    set({ loading: true, error: null, forbidden: false });
    try {
      const data = await courseCardApi.getCourseById(id);
      set({ course: data, loading: false, forbidden: false });
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = err as { response?: { status?: number } };
        const status = response.response?.status;
        if (status === 403) {
          set({ error: null, loading: false, forbidden: true, course: null });
          return;
        }
      }
      const message =
        err instanceof Error ? err.message : 'Ошибка загрузки курса';
      set({ error: message, loading: false, forbidden: false });
    }
  },

  clearCourse: () => set({ course: null, error: null, forbidden: false }),
}));
