import { useCallback, useState } from 'react';
import { filesAPI } from '../api/endpoints/file';
import { lessonApi } from '../api/endpoints/lesson';
import type { FileMetaDTO } from '../types/CourseCard';
import type {
  CreateLessonDTO,
  LessonDTO,
  UpdateLessonDTO,
  UpdateLessonStateDTO,
} from '../types/lesson';

export const useLesson = () => {
  const [lesson, setLesson] = useState<LessonDTO | null>(null);
  const [lessons, setLessons] = useState<LessonDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLessonById = useCallback(async (lessonId: number): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const lessonData = await lessonApi.getLessonById(lessonId);
      setLesson(lessonData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Ошибка загрузки урока';
      setError(errorMessage);
      setLesson(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLesson = useCallback(
    async (
      courseId: number,
      lessonData: CreateLessonDTO
    ): Promise<LessonDTO> => {
      setLoading(true);
      setError(null);

      try {
        const newLesson = await lessonApi.createLesson(courseId, lessonData);
        setLessons(prev => [...prev, newLesson]);
        return newLesson;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Ошибка создания урока';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const getCourseLessons = useCallback(
    async (courseId: number): Promise<void> => {
      setLoading(true);
      setError(null);

    try {
      const lessonsData = await lessonApi.getCourseLessons(courseId);
      setLessons(lessonsData);
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = err as { response?: { status?: number } };
        const status = response.response?.status;
        if (status === 403) {
          setLessons([]);
          setError('Уроки доступны после записи на курс');
          return;
        }
      }
      const errorMessage =
        err instanceof Error ? err.message : 'Ошибка загрузки уроков курса';
      setError(errorMessage);
      throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteLesson = useCallback(
    async (lessonId: number): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await lessonApi.deleteLesson(lessonId);
        setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
        if (lesson?.id === lessonId) {
          setLesson(null);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Ошибка удаления урока';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [lesson]
  );

  const addLessonMaterial = useCallback(
    async (lessonId: number, file: File): Promise<FileMetaDTO> => {
      setLoading(true);
      setError(null);

      try {
        const fileId = await lessonApi.addLessonMaterials(lessonId, file);
        return await filesAPI.getFileMeta(fileId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Ошибка загрузки материала урока';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const replaceLesson = useCallback(
    async (
      lessonId: number,
      lessonData: UpdateLessonDTO
    ): Promise<LessonDTO> => {
      setLoading(true);
      setError(null);

      try {
        const updatedLesson = await lessonApi.replaceLesson(lessonId, lessonData);
        setLesson(updatedLesson);
        setLessons(prev =>
          prev.map(item => (item.id === updatedLesson.id ? updatedLesson : item))
        );
        return updatedLesson;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'РћС€РёР±РєР° РѕР±РЅРѕРІР»РµРЅРёСЏ СѓСЂРѕРєР°';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateLessonState = useCallback(
    async (
      lessonId: number,
      data: UpdateLessonStateDTO
    ): Promise<LessonDTO> => {
      setLoading(true);
      setError(null);

      try {
        const updatedLesson = await lessonApi.updateLessonState(lessonId, data);
        setLesson(prev => (prev?.id === lessonId ? updatedLesson : prev));
        setLessons(prev =>
          prev.map(item => (item.id === updatedLesson.id ? updatedLesson : item))
        );
        return updatedLesson;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'РћС€РёР±РєР° РѕР±РЅРѕРІР»РµРЅРёСЏ СЃРѕСЃС‚РѕСЏРЅРёСЏ СѓСЂРѕРєР°';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteLessonMaterial = useCallback(
    async (lessonId: number, fileId: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await lessonApi.deleteLessonMaterial(lessonId, fileId);
        setLesson(prev =>
          prev?.id === lessonId
            ? {
                ...prev,
                materials: prev.materials.filter(material => material.id !== fileId),
              }
            : prev
        );
        setLessons(prev =>
          prev.map(item =>
            item.id === lessonId
              ? {
                  ...item,
                  materials: item.materials.filter(
                    material => material.id !== fileId
                  ),
                }
              : item
          )
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'РћС€РёР±РєР° СѓРґР°Р»РµРЅРёСЏ РјР°С‚РµСЂРёР°Р»Р°';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );
  const clearError = useCallback((): void => setError(null), []);
  const clearLesson = useCallback((): void => setLesson(null), []);

  return {
    lesson,
    lessons,
    loading,
    error,

    getLessonById,
    createLesson,
    getCourseLessons,
    replaceLesson,
    updateLessonState,
    deleteLessonMaterial,
    deleteLesson,
    addLessonMaterial,
    clearError,
    clearLesson,
  };
};
