import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import Footer from '../Components/Footer';
import Header from '../Components/Header';
import { FormAlert } from '../Components/ui/forms/FormAlert';
import { useAuth } from '../hooks/useAuth';
import { useLesson } from '../hooks/useLessons';
import { useCourseStore } from '../stores/courseStore';
import type { FileMetaDTO } from '../types/CourseCard';
import styles from '../styles/pages/CreateLessonPage.module.css';

const CreateLessonPage: React.FC = () => {
  const { courseId: courseIdParam, lessonId: lessonIdParam } = useParams<{
    courseId: string;
    lessonId?: string;
  }>();
  const parsedCourseId = courseIdParam ? Number(courseIdParam) : null;
  const parsedLessonId = lessonIdParam ? Number(lessonIdParam) : null;
  const courseId = Number.isFinite(parsedCourseId) ? parsedCourseId : null;
  const lessonId = Number.isFinite(parsedLessonId) ? parsedLessonId : null;
  const {
    lesson,
    createLesson,
    replaceLesson,
    getLessonById,
    addLessonMaterial,
    loading,
    error,
    clearError,
  } = useLesson();
  const { user, isLoading: authLoading, isInitialized } = useAuth();
  const {
    course,
    fetchCourse,
    loading: courseLoading,
    error: courseError,
  } = useCourseStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [contentMd, setContentMd] = useState('');
  const [beginAt, setBeginAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [type, setType] = useState('');
  const [mdFile, setMdFile] = useState<File | null>(null);
  const [uploadedMaterial, setUploadedMaterial] = useState<FileMetaDTO | null>(
    null
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId, true);
    }
  }, [courseId, fetchCourse]);

  useEffect(() => {
    if (lessonId) {
      getLessonById(lessonId).catch(errorValue => {
        console.error('Error fetching lesson:', errorValue);
      });
    }
  }, [getLessonById, lessonId]);

  useEffect(() => {
    if (!lessonId || !lesson) {
      return;
    }

    setName(lesson.name ?? '');
    setDescription(lesson.description ?? '');
    setContentMd(lesson.contentMd ?? '');
    setBeginAt(lesson.beginAt ? lesson.beginAt.slice(0, 16) : '');
    setEndsAt(lesson.endsAt ? lesson.endsAt.slice(0, 16) : '');
    setType(lesson.type ?? '');
  }, [lesson, lessonId]);

  const isEditMode = Boolean(lessonId);

  const canManageLessons = useMemo(() => {
    if (!user || !course) return false;
    const normalizedRole = user.role?.toUpperCase() ?? '';
    return normalizedRole === 'ADMIN' || user.id === course.owner?.id;
  }, [course, user]);

  const isFormDisabled =
    loading ||
    !courseId ||
    authLoading ||
    courseLoading ||
    !canManageLessons;

  if (!courseId) {
    return <Navigate to="/home" replace />;
  }

  if (
    isInitialized &&
    !authLoading &&
    !courseLoading &&
    user &&
    course &&
    !canManageLessons
  ) {
    return <Navigate to="/home" replace />;
  }

  const toIso = (value: string) => (value ? new Date(value).toISOString() : '');

  const resetErrors = () => {
    if (error) {
      clearError();
    }
    if (localError) {
      setLocalError(null);
    }
    if (uploadError) {
      setUploadError(null);
    }
    if (uploadMessage) {
      setUploadMessage(null);
    }
  };

  const handleMdFileChange = (file: File | null) => {
    setUploadedMaterial(null);
    setUploadMessage(null);
    setUploadError(null);
    setMdFile(null);

    if (!file) {
      return;
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.md') && !fileName.endsWith('.markdown')) {
      setUploadError('Можно загружать только файлы .md или .markdown.');
      return;
    }

    setMdFile(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetErrors();

    if (!courseId) {
      setLocalError('Не найден идентификатор курса.');
      return;
    }

    if (!user || !isInitialized) {
      setLocalError('Сначала войдите, чтобы управлять уроками.');
      return;
    }

    if (!canManageLessons) {
      setLocalError('У вас нет прав для управления уроками этого курса.');
      return;
    }

    if (
      !name.trim() ||
      !description.trim() ||
      !beginAt ||
      !endsAt ||
      !type.trim()
    ) {
      setLocalError('Заполните все обязательные поля.');
      return;
    }

    const beginIso = toIso(beginAt);
    const endIso = toIso(endsAt);

    if (beginIso && endIso && beginIso >= endIso) {
      setLocalError('Дата окончания должна быть позже даты начала.');
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        contentMd: contentMd.trim(),
        beginAt: beginIso,
        endsAt: endIso,
        type: type.trim(),
        timeRangeValid: beginIso < endIso,
      };

      const savedLesson =
        isEditMode && lessonId
          ? await replaceLesson(lessonId, payload)
          : await createLesson(courseId, payload);

      if (mdFile) {
        try {
          const uploaded = await addLessonMaterial(savedLesson.id, mdFile);
          setUploadedMaterial(uploaded);
          setUploadMessage('Материал успешно добавлен к уроку.');
        } catch (materialError) {
          const message =
            materialError instanceof Error
              ? materialError.message
              : 'Не удалось загрузить материал.';
          setUploadError(message);
        }
      }

      if (isEditMode) {
        navigate(`/course/${courseId}`);
        return;
      }

      setName('');
      setDescription('');
      setContentMd('');
      setBeginAt('');
      setEndsAt('');
      setType('');
      setMdFile(null);
    } catch (submitError) {
      console.error('Error saving lesson:', submitError);
    }
  };

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <h1>{isEditMode ? 'Редактирование урока' : 'Создание урока'}</h1>
              <p>
                {isEditMode
                  ? 'Обновите содержание, расписание и материалы урока.'
                  : 'Добавьте структуру, расписание и материалы урока.'}
              </p>
            </div>
            <div className={styles.badges}>
              <span className={styles.badge}>Урок</span>
              {course?.handle && (
                <span className={styles.badgeSecondary}>@{course.handle}</span>
              )}
            </div>
          </div>

          <div className={styles.noticeStack}>
            {!courseId && (
              <div className={styles.notice}>
                Добавьте идентификатор курса в URL, чтобы продолжить.
              </div>
            )}
            {courseError && (
              <div className={styles.notice}>
                Ошибка загрузки курса: {courseError}
              </div>
            )}
            {!authLoading && !user && (
              <div className={styles.notice}>
                Войдите в аккаунт автора курса, чтобы управлять уроками.
                <button
                  type="button"
                  className={styles.noticeAction}
                  onClick={() => navigate('/auth')}
                >
                  Войти
                </button>
              </div>
            )}
            {user && !canManageLessons && (
              <div className={styles.notice}>
                У вас нет прав для управления уроками в этом курсе.
              </div>
            )}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.section}>
              <label className={styles.field}>
                <span>Название урока</span>
                <input
                  type="text"
                  value={name}
                  onChange={event => {
                    resetErrors();
                    setName(event.target.value);
                  }}
                  placeholder="Введите название"
                  disabled={isFormDisabled}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Описание</span>
                <textarea
                  value={description}
                  onChange={event => {
                    resetErrors();
                    setDescription(event.target.value);
                  }}
                  placeholder="Коротко опишите урок"
                  disabled={isFormDisabled}
                  required
                />
              </label>
            </div>

            <div className={styles.section}>
              <label className={styles.field}>
                <span>Содержание (Markdown)</span>
                <textarea
                  value={contentMd}
                  onChange={event => {
                    resetErrors();
                    setContentMd(event.target.value);
                  }}
                  placeholder="Добавьте материал урока"
                  disabled={isFormDisabled}
                />
              </label>

              <label className={styles.field}>
                <span>Файл материала (.md)</span>
                <input
                  type="file"
                  accept=".md,.markdown,text/markdown"
                  onChange={event => {
                    resetErrors();
                    const file = event.target.files?.[0] ?? null;
                    handleMdFileChange(file);
                  }}
                  disabled={isFormDisabled}
                />
                {mdFile && (
                  <span className={styles.helper}>Выбран: {mdFile.name}</span>
                )}
                {uploadedMaterial && (
                  <span className={styles.helper}>
                    Загружен: {uploadedMaterial.originalFilename}
                  </span>
                )}
              </label>
            </div>

            <div className={styles.section}>
              <div className={styles.row}>
                <label className={styles.field}>
                  <span>Начало</span>
                  <input
                    type="datetime-local"
                    value={beginAt}
                    onChange={event => {
                      resetErrors();
                      setBeginAt(event.target.value);
                    }}
                    disabled={isFormDisabled}
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>Окончание</span>
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={event => {
                      resetErrors();
                      setEndsAt(event.target.value);
                    }}
                    disabled={isFormDisabled}
                    required
                  />
                </label>
              </div>

              <label className={styles.field}>
                <span>Тип занятия</span>
                <input
                  type="text"
                  value={type}
                  onChange={event => {
                    resetErrors();
                    setType(event.target.value);
                  }}
                  placeholder="Например: LECTURE"
                  disabled={isFormDisabled}
                  required
                />
              </label>
            </div>

            {(localError || error || uploadError || uploadMessage) && (
              <FormAlert
                message={(localError || error || uploadError || uploadMessage) ?? ''}
                variant={
                  uploadMessage && !(localError || error || uploadError)
                    ? 'success'
                    : 'error'
                }
              />
            )}

            <div className={styles.actions}>
              <button type="submit" disabled={isFormDisabled}>
                {loading
                  ? isEditMode
                    ? 'Сохранение...'
                    : 'Создание...'
                  : isEditMode
                    ? 'Сохранить урок'
                    : 'Создать урок'}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default CreateLessonPage;
