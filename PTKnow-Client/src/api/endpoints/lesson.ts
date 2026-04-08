import type {
  CreateLessonDTO,
  LessonDTO,
  UpdateLessonDTO,
  UpdateLessonStateDTO,
} from '../../types/lesson';
import { api } from '../axiosConfig';

export const lessonApi = {
  createLesson: async (
    courseId: number,
    data: CreateLessonDTO
  ): Promise<LessonDTO> => {
    const response = await api.post(`/v1/lessons/${String(courseId)}`, data);
    return response.data;
  },
  getLessonById: async (lessonId: number): Promise<LessonDTO> => {
    const response = await api.get(`/v1/lessons/${String(lessonId)}`);
    return response.data;
  },
  getCourseLessons: async (courseId: number): Promise<LessonDTO[]> => {
    const response = await api.get(`/v1/lessons/course/${String(courseId)}`);
    const payload = response.data as unknown;
    if (Array.isArray(payload)) {
      return payload as LessonDTO[];
    }
    if (payload && typeof payload === 'object') {
      const data = payload as {
        items?: LessonDTO[];
        lessons?: LessonDTO[];
        data?: LessonDTO[];
        content?: LessonDTO[];
      };
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.lessons)) return data.lessons;
      if (Array.isArray(data.data)) return data.data;
      if (Array.isArray(data.content)) return data.content;
    }
    return [];
  },
  updateLesson: async (
    lessonId: number,
    data: UpdateLessonDTO
  ): Promise<LessonDTO> => {
    const response = await api.patch(`/v1/lessons/${String(lessonId)}`, data);
    return response.data;
  },
  replaceLesson: async (
    lessonId: number,
    data: UpdateLessonDTO
  ): Promise<LessonDTO> => {
    const response = await api.put(`/v1/lessons/${String(lessonId)}`, data);
    return response.data;
  },
  updateLessonState: async (
    lessonId: number,
    data: UpdateLessonStateDTO
  ): Promise<LessonDTO> => {
    const response = await api.patch(
      `/v1/lessons/${String(lessonId)}/state`,
      data
    );
    return response.data;
  },
  addLessonMaterials: async (
    lessonId: number,
    file: File
  ): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(
      `/v1/lessons/${String(lessonId)}/materials`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
  deleteLessonMaterial: async (
    lessonId: number,
    fileId: string
  ): Promise<void> => {
    await api.delete(
      `/v1/lessons/${String(lessonId)}/materials/${String(fileId)}`
    );
  },
  deleteLesson: async (lessonId: number): Promise<void> => {
    await api.delete(`/v1/lessons/${String(lessonId)}`);
  },
};
