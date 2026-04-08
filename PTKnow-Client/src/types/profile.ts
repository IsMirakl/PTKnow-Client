import type { CourseSummaryDTO } from './CourseCard';
import type { UserStatus } from './user';

export interface ProfileResponseDTO {
  fullName: string;
  summary: string;
  handle: string;
  avatarUrl: string;
  id?: string;
  status?: UserStatus;
  role?: string;
  email?: string;
  enrolledCourses?: CourseSummaryDTO[];
  teachingCourses?: CourseSummaryDTO[];
}

export interface ProfileUpdateDTO {
  fullName: string;
  summary: string;
  handle: string;
}
