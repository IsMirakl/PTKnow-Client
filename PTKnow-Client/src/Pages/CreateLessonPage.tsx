import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import Footer from '../Components/Footer';
import Header from '../Components/Header';
import { FormAlert } from '../Components/ui/forms/FormAlert';
import { ErrorModal } from '../Components/ui/forms/ErrorModal';
import { useAuth } from '../hooks/useAuth';
import { useLesson } from '../hooks/useLessons';
import { useCourseStore } from '../stores/courseStore';
import type { FileMetaDTO } from '../types/CourseCard';
import styles from '../styles/pages/CreateLessonPage.module.css';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const LESSON_TYPE_OPTIONS = [
  { value: 'LECTURE', label: 'Лекция' },
  { value: 'PRACTICE', label: 'Практика' },
];

const formatFileSize = (size: number) => {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
  }

  return `${Math.max(1, Math.round(size / 1024))} КБ`;
};

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
  const [type, setType] = useState('LECTURE');
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [uploadedMaterials, setUploadedMaterials] = useState<FileMetaDTO[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [sizeModalMessage, setSizeModalMessage] = useState<string | null>(null);

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
    setType(lesson.type ?? 'LECTURE');
    setUploadedMaterials(lesson.materials ?? []);
  }, [lesson, lessonId]);

  const isEditMode = Boolean(lessonId);

  const canManageLessons = useMemo(() => {
    if (!user || !course) return false;
    const normalizedRole = user.role?.toUpperCase() ?? '';
    const isOwner = user.id === course.owner?.id;
    const isEditor = (course.editors ?? []).some(editor => editor.id === user.id);
    return normalizedRole === 'ADMIN' || normalizedRole === 'TEACHER' || isOwner || isEditor;
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

  const closeSizeModal = () => {
    setSizeModalMessage(null);
  };

  const handleMaterialFilesChange = (files: FileList | null) => {
    resetErrors();

    if (!files || files.length === 0) {
      return;
    }

    const nextFiles = Array.from(files);
    const oversizedFiles = nextFiles.filter(file => file.size > MAX_FILE_SIZE_BYTES);

    if (oversizedFiles.length > 0) {
      const names = oversizedFiles.map(file => `«${file.name}»`).join(', ');
      setSizeModalMessage(
        `Файлы ${names} превышают лимит 10 МБ. Уменьшите размер или выберите другие материалы.`
      );
      return;
    }

    setMaterialFiles(prev => {
      const merged = [...prev];

      nextFiles.forEach(file => {
        const alreadyExists = merged.some(
          existing =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified
        );

        if (!alreadyExists) {
          merged.push(file);
        }
      });

      return merged;
    });
  };

  const removePendingFile = (targetFile: File) => {
    setMaterialFiles(prev =>
      prev.filter(
        file =>
          !(
            file.name === targetFile.name &&
            file.size === targetFile.size &&
            file.lastModified === targetFile.lastModified
          )
      )
    );
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

    if (!name.trim() || !description.trim() || !beginAt || !endsAt || !type.trim()) {
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

      if (materialFiles.length > 0) {
        try {
          const uploaded = await Promise.all(
            materialFiles.map(file => addLessonMaterial(savedLesson.id, file))
          );
          setUploadedMaterials(prev => [...prev, ...uploaded]);
          setMaterialFiles([]);
          setUploadMessage(
            uploaded.length === 1
              ? 'Материал успешно добавлен к уроку.'
              : `Материалы успешно добавлены: ${uploaded.length}`
          );
        } catch (materialError) {
          const message =
            materialError instanceof Error
              ? materialError.message
              : 'Не удалось загрузить материалы урока.';
          setUploadError(message);
          return;
        }
      }

      navigate(`/courses/${courseId}/lessons/${savedLesson.id}`);
    } catch (submitError) {
      console.error('Error saving lesson:', submitError);
    }
  };

  const activeMessage =
    (localError || error || uploadError || uploadMessage) ?? null;

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.hero}>
            <div className={styles.heroMain}>
              <div className={styles.heroBadges}>
                <span className={styles.badge}>Урок</span>
                <span className={styles.badgeSecondary}>
                  {isEditMode ? 'Редактирование' : 'Создание'}
                </span>
                {course?.handle && (
                  <span className={styles.badgeGhost}>@{course.handle}</span>
                )}
              </div>
              <h1 className={styles.title}>
                {isEditMode ? 'Настройте урок' : 'Создайте сильный урок'}
              </h1>
              <p className={styles.subtitle}>
                Соберите тему, формат, расписание и материалы в одной форме, чтобы
                урок сразу выглядел цельным и готовым к публикации
              </p>
            </div>

            <aside className={styles.heroAside}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Курс</span>
                <strong>{course?.name ?? '—'}</strong>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Режим</span>
                <strong>{isEditMode ? 'Обновление урока' : 'Новый урок'}</strong>
              </div>
            </aside>
          </section>

          <div className={styles.noticeStack}>
            {courseError && (
              <div className={styles.notice}>Ошибка загрузки курса: {courseError}</div>
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
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>Основа урока</h2>
                  <p>Название, формат и короткое описание того, что получит студент</p>
                </div>
              </div>

              <div className={styles.gridTwo}>
                <label className={styles.field}>
                  <span>Название урока</span>
                  <input
                    type="text"
                    value={name}
                    onChange={event => {
                      resetErrors();
                      setName(event.target.value);
                    }}
                    placeholder="Например: Введение в типографику интерфейсов"
                    disabled={isFormDisabled}
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>Тип занятия</span>
                  <select
                    value={type}
                    onChange={event => {
                      resetErrors();
                      setType(event.target.value);
                    }}
                    disabled={isFormDisabled}
                    required
                  >
                    {LESSON_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className={styles.field}>
                <span>Описание</span>
                <textarea
                  value={description}
                  onChange={event => {
                    resetErrors();
                    setDescription(event.target.value);
                  }}
                  placeholder="Кратко опишите цель урока, фокус и ожидаемый результат"
                  disabled={isFormDisabled}
                  required
                />
              </label>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>Содержание</h2>
                  <p>Текст урока в Markdown и дополнительные материалы для скачивания</p>
                </div>
              </div>

              <label className={styles.field}>
                <span>Содержание урока (Markdown)</span>
                <textarea
                  value={contentMd}
                  onChange={event => {
                    resetErrors();
                    setContentMd(event.target.value);
                  }}
                  placeholder={'# План урока\n\nОпишите ключевые тезисы, задания и ссылки'}
                  disabled={isFormDisabled}
                  className={styles.markdownField}
                />
              </label>

              <div className={styles.uploadCard}>
                <div className={styles.uploadIntro}>
                  <div>
                    <h3>Материалы урока</h3>
                    <p>
                      Загружайте несколько файлов любого типа. Каждый файл не должен
                      превышать 10 МБ
                    </p>
                  </div>
                  <span className={styles.uploadLimit}>Лимит: 10 МБ на файл</span>
                </div>

                <div className={styles.uploadActions}>
                  <label className={styles.uploadField}>
                    <input
                      type="file"
                      multiple
                      onChange={event => {
                        handleMaterialFilesChange(event.target.files);
                        event.target.value = '';
                      }}
                      disabled={isFormDisabled}
                    />
                    <span>Добавить файлы</span>
                  </label>
                  <p className={styles.helper}>
                    Можно выбрать файлы повторно: новые материалы будут аккуратно
                    добавлены к уже выбранным
                  </p>
                </div>

                {materialFiles.length > 0 && (
                  <div className={styles.filesSection}>
                    <span className={styles.sectionLabel}>Будут загружены</span>
                    <div className={styles.fileList}>
                      {materialFiles.map(file => (
                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}`}
                          className={styles.fileChip}
                        >
                          <div className={styles.fileChipBody}>
                            <strong>{file.name}</strong>
                            <span>{formatFileSize(file.size)}</span>
                          </div>
                          <button
                            type="button"
                            className={styles.fileChipRemove}
                            onClick={() => removePendingFile(file)}
                            aria-label={`Убрать файл ${file.name}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {uploadedMaterials.length > 0 && (
                  <div className={styles.filesSection}>
                    <span className={styles.sectionLabel}>Уже прикреплено</span>
                    <div className={styles.fileList}>
                      {uploadedMaterials.map(file => (
                        <div key={file.id} className={styles.fileChip}>
                          <div className={styles.fileChipBody}>
                            <strong>{file.originalFilename}</strong>
                            <span>{formatFileSize(file.size)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2>Расписание</h2>
                  <p>Выберите время начала и окончания, чтобы урок попал в календарь</p>
                </div>
              </div>

              <div className={styles.gridTwo}>
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
            </section>

            {activeMessage && (
              <FormAlert
                message={activeMessage}
                variant={
                  uploadMessage && !(localError || error || uploadError)
                    ? 'success'
                    : 'error'
                }
              />
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => navigate(`/course/${courseId}`)}
              >
                Отмена
              </button>
              <button type="submit" className={styles.primaryButton} disabled={isFormDisabled}>
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

      <ErrorModal
        title="Файл слишком большой"
        message={sizeModalMessage}
        isOpen={Boolean(sizeModalMessage)}
        onClose={closeSizeModal}
      />
    </>
  );
};

export default CreateLessonPage;
