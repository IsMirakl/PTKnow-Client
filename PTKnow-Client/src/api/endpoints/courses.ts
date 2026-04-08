import type {
  CourseDTO,
  CourseTeacherDTO,
  CreateCourseDTO,
  EnrollmentDTO,
  UpdateCourseDTO,
  UpdateCourseTeacherDTO,
} from '../../types/CourseCard';
import type { PageResponseDTO } from '../../types/common';
import { api } from '../axiosConfig';

export interface CourseListParams {
  page?: number;
  size?: number;
  sort?: string;
  q?: string;
  state?: string;
  tag?: string;
}

export const courseCardApi = {
  getAllCourses: async (
    params?: CourseListParams
  ): Promise<PageResponseDTO<CourseDTO>> => {
    const response = await api.get('/v1/course', {
      params,
    });
    const payload = response.data as Partial<PageResponseDTO<CourseDTO>>;

    return {
      items: Array.isArray(payload.items) ? payload.items : [],
      page: typeof payload.page === 'number' ? payload.page : params?.page ?? 0,
      size: typeof payload.size === 'number' ? payload.size : params?.size ?? 20,
      totalItems:
        typeof payload.totalItems === 'number'
          ? payload.totalItems
          : Array.isArray(payload.items)
            ? payload.items.length
            : 0,
      totalPages:
        typeof payload.totalPages === 'number'
          ? payload.totalPages
          : Array.isArray(payload.items) && payload.items.length > 0
            ? 1
            : 0,
      hasNext: Boolean(payload.hasNext),
    };
  },

  createCourse: async (
    courseData: CreateCourseDTO,
    preview?: File
  ): Promise<CourseDTO> => {
    const formData = new FormData();

    formData.append(
      'course',
      new Blob([JSON.stringify(courseData)], {
        type: 'application/json',
      })
    );

    if (preview) {
      formData.append('preview', preview);
    }
    const response = await api.post('/v1/course', formData);
    return response.data;
  },

  getCourseById: async (id: number): Promise<CourseDTO> => {
    const response = await api.get(`/v1/course/id/${String(id)}`);
    return response.data;
  },

  getCourseByHandle: async (handle: string): Promise<CourseDTO> => {
    const response = await api.get(`/v1/course/handle/${handle}`);
    return response.data;
  },

  updateCourse: async (
    id: number,
    data: UpdateCourseDTO
  ): Promise<CourseDTO> => {
    const response = await api.patch(`/v1/course/${String(id)}`, data);
    return response.data;
  },

  replaceCourse: async (
    id: number,
    data: UpdateCourseDTO
  ): Promise<CourseDTO> => {
    const response = await api.put(`/v1/course/${String(id)}`, data);
    return response.data;
  },

  updateCoursePreview: async (id: number, file: File): Promise<CourseDTO> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(
      `/v1/course/${String(id)}/preview`,
      formData
    );
    return response.data;
  },

  publishCourse: async (id: number): Promise<CourseDTO> => {
    const response = await api.post(`/v1/course/${String(id)}/publish`);
    return response.data;
  },

  archiveCourse: async (id: number): Promise<CourseDTO> => {
    const response = await api.post(`/v1/course/${String(id)}/archive`);
    return response.data;
  },

  enrollInCourse: async (id: number): Promise<EnrollmentDTO> => {
    const response = await api.post(`/v1/course/${String(id)}/enroll`);
    return response.data;
  },

  cancelEnrollment: async (id: number): Promise<void> => {
    await api.delete(`/v1/course/${String(id)}/enroll`);
  },

  addCourseTeacher: async (
    id: number,
    data: UpdateCourseTeacherDTO
  ): Promise<void> => {
    await api.post(`/v1/course/${String(id)}/teachers`, data);
  },

  removeCourseTeacher: async (id: number, teacherId: string): Promise<void> => {
    await api.delete(`/v1/course/${String(id)}/teachers/${teacherId}`);
  },

  addCourseEditor: async (
    id: number,
    userId: string
  ): Promise<void> => {
    await api.post(`/v1/course/${String(id)}/editors/${userId}`);
  },

  removeCourseEditor: async (id: number, userId: string): Promise<void> => {
    await api.delete(`/v1/course/${String(id)}/editors/${userId}`);
  },

  getCourseTeachers: async (id: number): Promise<CourseTeacherDTO[]> => {
    const response = await api.get(`/v1/course/${String(id)}/teachers`);
    return response.data;
  },

  getCourseStudents: async (id: number): Promise<EnrollmentDTO[]> => {
    const response = await api.get(`/v1/course/${String(id)}/students`);
    return response.data;
  },

  getCourseMembers: async (id: number): Promise<EnrollmentDTO[]> => {
    const response = await api.get(`/v1/course/${String(id)}/members`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/v1/course/${String(id)}`);
  },
};
