import type { UserSummaryDTO } from './user';

export interface CourseSummaryDTO {
  id: number;
  name: string;
  handle: string;
  state: string;
  previewUrl: string;
}

export interface FileMetaDTO {
  id: string;
  originalFilename: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  downloadUrl: string;
  purpose: string;
  visibility: string;
}

export interface CourseTeacherDTO {
  id: string;
  email: string;
  role: string;
  profileHandle: string;
  fullName: string;
  owner: boolean;
}

export interface CourseDTO {
  id: number;
  name: string;
  description: string;
  tags: string[];
  handle: string;
  state: string;
  previewUrl: string;
  preview: FileMetaDTO;
  maxUsersAmount: number;
  lessonsCount: number;
  studentsCount: number;
  teachersCount: number;
  owner: CourseTeacherDTO;
  editors: CourseTeacherDTO[];
}

export interface CreateCourseDTO {
  name: string;
  description: string;
  tags: string[];
  maxUsersAmount: number;
}

export interface UpdateCourseDTO {
  name: string;
  description: string;
  tags: string[];
  maxUsersAmount: number;
}

export interface UpdateCourseTeacherDTO {
  teacherId: string;
}

export interface EnrollmentDTO {
  id: number;
  userId: string;
  courseId: number;
  since: string;
  user: UserSummaryDTO;
  course: CourseSummaryDTO;
}
