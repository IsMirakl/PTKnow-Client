import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import courseDetails from '../assets/image/courseDetails.svg';

import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { Calendar } from '../Components/ui/Calendar/Calendar';
import { LessonList } from '../Components/ui/lesson/LessonList';

import { NextLessonCard } from '../Components/ui/lesson/NextLessonCard';
import { TeachersCard } from '../Components/ui/Teacher/TeachersCard';
import { useLessonStore } from '../stores/scheduleStore';
import { useCourseStore } from '../stores/courseStore';
import { useLesson } from '../hooks/useLessons';
import { courseCardApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useMyEnrollments } from '../hooks/useMyEnrollments';
import type {
  CourseTeacherDTO,
  EnrollmentDTO,
  FileMetaDTO,
} from '../types/CourseCard';
import { AuthImage } from '../Components/AuthImage';
import { FormAlert } from '../Components/ui/forms/FormAlert';
import styles from '../styles/pages/CourseDetailsPage.module.css';
import { buildContinueCourseState, saveContinueCourseState } from '../utils/continueCourse';

const formatLessonTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const LESSON_STATES = ['PLANNED', 'ONGOING', 'CANCELLED', 'FINISHED'] as const;

const CourseDetailsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const parsedCourseId = courseId ? Number(courseId) : null;
  const resolvedCourseId = Number.isFinite(parsedCourseId)
    ? parsedCourseId
    : null;
  const { setLesson, setSelectedDate } = useLessonStore();
  const {
    course,
    fetchCourse,
    loading: courseLoading,
    error: courseError,
    clearCourse,
    forbidden: courseForbidden,
  } = useCourseStore();
  const {
    getCourseLessons,
    updateLessonState,
    deleteLessonMaterial,
    loading: lessonsLoading,
    error: lessonsError,
    lessons: fetchedLessons,
  } = useLesson();
  const { user } = useAuth();
  const { enrolledCourses } = useMyEnrollments();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [settingsName, setSettingsName] = useState('');
  const [settingsDescription, setSettingsDescription] = useState('');
  const [settingsTags, setSettingsTags] = useState('');
  const [settingsStatus, setSettingsStatus] = useState('');
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [courseTeachers, setCourseTeachers] = useState<CourseTeacherDTO[]>([]);
  const [courseStudents, setCourseStudents] = useState<EnrollmentDTO[]>([]);
  const [courseMembers, setCourseMembers] = useState<EnrollmentDTO[]>([]);
  const [teacherIdInput, setTeacherIdInput] = useState('');
  const [editorIdInput, setEditorIdInput] = useState('');
  const [peopleLoading, setPeopleLoading] = useState(false);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [peopleSuccess, setPeopleSuccess] = useState<string | null>(null);
  const [lessonActionError, setLessonActionError] = useState<string | null>(null);
  const [busyLessonIds, setBusyLessonIds] = useState<Set<number>>(new Set());

  const normalizedLessons = useMemo(
    () => (Array.isArray(fetchedLessons) ? fetchedLessons : []),
    [fetchedLessons]
  );

  const sortedLessons = useMemo(
    () =>
      [...normalizedLessons].sort(
        (a, b) => new Date(a.beginAt).getTime() - new Date(b.beginAt).getTime()
      ),
    [normalizedLessons]
  );

  const nextLesson = useMemo(() => {
    if (sortedLessons.length === 0) return null;
    const now = new Date();
    const upcoming = sortedLessons.find(
      lesson => new Date(lesson.beginAt).getTime() > now.getTime()
    );
    return upcoming ?? sortedLessons[0];
  }, [sortedLessons]);

  useEffect(() => {
    if (!resolvedCourseId || !course?.name) {
      return;
    }

    saveContinueCourseState(
      buildContinueCourseState(resolvedCourseId, course.name, nextLesson)
    );
  }, [course?.name, nextLesson, resolvedCourseId]);

  useEffect(() => {
    if (!resolvedCourseId) {
      return;
    }

    fetchCourse(resolvedCourseId, true);
    getCourseLessons(resolvedCourseId).catch(error => {
      console.error('Ошибка загрузки уроков:', error);
    });
  }, [fetchCourse, getCourseLessons, resolvedCourseId]);

  useEffect(() => {
    if (!course) {
      return;
    }
    setSettingsName(course.name ?? '');
    setSettingsDescription(course.description ?? '');
    setSettingsTags(course.tags?.join(', ') ?? '');
    setSettingsStatus(course.state ?? '');
  }, [course]);

  useEffect(() => {
    if (sortedLessons.length === 0) {
      setLesson([]);
      return;
    }

    const firstLessonDate = new Date(sortedLessons[0].beginAt)
      .toISOString()
      .split('T')[0];
    setLesson(sortedLessons);
    setSelectedDate(firstLessonDate);
  }, [sortedLessons, setLesson, setSelectedDate]);

  const handleJoin = useCallback(() => {
    if (resolvedCourseId) {
      navigate(`/course/${resolvedCourseId}/register`);
    }
  }, [navigate, resolvedCourseId]);

  const handleCreateLesson = useCallback(() => {
    if (resolvedCourseId) {
      navigate(`/courses/${resolvedCourseId}/lessons/new`);
    }
  }, [navigate, resolvedCourseId]);

  const handleEditLesson = useCallback(
    (lessonId: number) => {
      if (resolvedCourseId) {
        navigate(`/courses/${resolvedCourseId}/lessons/${lessonId}/edit`);
      }
    },
    [navigate, resolvedCourseId]
  );

  const canDeleteCourse = useMemo(() => {
    if (!course || !user) return false;
    const normalizedRole = user.role?.toUpperCase() ?? '';
    return normalizedRole === 'ADMIN' || user.id === course.owner?.id;
  }, [course, user]);

  const canManageLessons = useMemo(() => {
    if (!course || !user) return false;
    const normalizedRole = user.role?.toUpperCase() ?? '';
    return normalizedRole === 'ADMIN' || user.id === course.owner?.id;
  }, [course, user]);

  const refreshPeople = useCallback(async () => {
    if (!resolvedCourseId || !canManageLessons) {
      return;
    }

    setPeopleLoading(true);
    setPeopleError(null);

    try {
      const [teachersData, studentsData, membersData] = await Promise.all([
        courseCardApi.getCourseTeachers(resolvedCourseId),
        courseCardApi.getCourseStudents(resolvedCourseId),
        courseCardApi.getCourseMembers(resolvedCourseId),
      ]);
      setCourseTeachers(teachersData);
      setCourseStudents(studentsData);
      setCourseMembers(membersData);
    } catch (error) {
      setPeopleError(
        error instanceof Error
          ? error.message
          : 'Не удалось загрузить участников курса.'
      );
    } finally {
      setPeopleLoading(false);
    }
  }, [canManageLessons, resolvedCourseId]);

  const teachers = useMemo(() => {
    if (!course) return [];
    const result: CourseTeacherDTO[] = [];
    if (course.owner) {
      result.push(course.owner);
    }
    if (course.editors?.length) {
      course.editors.forEach(editor => {
        if (!result.some(teacher => teacher.id === editor.id)) {
          result.push(editor);
        }
      });
    }
    return result;
  }, [course]);

  const isEnrolled = useMemo(() => {
    if (!resolvedCourseId) return false;
    return enrolledCourses.some(courseItem => courseItem.id === resolvedCourseId);
  }, [enrolledCourses, resolvedCourseId]);

  const canJoinCourse = useMemo(() => {
    if (!user) return true;
    const normalizedRole = user.role?.toUpperCase() ?? '';
    return normalizedRole !== 'ADMIN' && normalizedRole !== 'TEACHER';
  }, [user]);

  useEffect(() => {
    refreshPeople().catch(error => {
      console.error('Error loading course people:', error);
    });
  }, [refreshPeople]);

  const handleDeleteCourse = useCallback(async () => {
    if (!resolvedCourseId || isDeleting) {
      return;
    }

    const confirmed = window.confirm('Удалить курс без возможности восстановления?');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await courseCardApi.delete(resolvedCourseId);
      toast.success('Курс удален.');
      clearCourse();
      navigate('/courses');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось удалить курс.';
      setDeleteError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }, [clearCourse, isDeleting, navigate, resolvedCourseId]);

  const handleLeaveCourse = useCallback(async () => {
    if (!resolvedCourseId || !isEnrolled) {
      return;
    }
    const confirmed = window.confirm('Покинуть курс?');
    if (!confirmed) {
      return;
    }
    try {
      await courseCardApi.cancelEnrollment(resolvedCourseId);
      navigate('/courses');
    } catch (error) {
      console.error('Не удалось покинуть курс:', error);
    }
  }, [isEnrolled, navigate, resolvedCourseId]);

  const handleSaveSettings = useCallback(async () => {
    if (!course || !resolvedCourseId || settingsLoading) {
      return;
    }

    setSettingsError(null);
    setSettingsSuccess(null);

    if (!settingsName.trim()) {
      setSettingsError('Название курса не может быть пустым.');
      return;
    }

    if (!settingsDescription.trim()) {
      setSettingsError('Описание курса не может быть пустым.');
      return;
    }

    const nextTags = settingsTags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

    setSettingsLoading(true);
    try {
      await courseCardApi.replaceCourse(resolvedCourseId, {
        name: settingsName.trim(),
        description: settingsDescription.trim(),
        tags: nextTags.length > 0 ? nextTags : course.tags ?? [],
        maxUsersAmount: course.maxUsersAmount,
      });

      if (settingsStatus && settingsStatus !== course.state) {
        if (settingsStatus === 'PUBLISHED') {
          await courseCardApi.publishCourse(resolvedCourseId);
        } else if (settingsStatus === 'ARCHIVED') {
          await courseCardApi.archiveCourse(resolvedCourseId);
        } else if (settingsStatus === 'DRAFT') {
          setSettingsError('Нельзя вернуть курс в черновик через настройки.');
        }
      }

      await fetchCourse(resolvedCourseId, true);
      setSettingsSuccess('Настройки курса обновлены.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Не удалось обновить курс.';
      setSettingsError(message);
    } finally {
      setSettingsLoading(false);
    }
  }, [
    course,
    fetchCourse,
    resolvedCourseId,
    settingsDescription,
    settingsLoading,
    settingsName,
    settingsStatus,
    settingsTags,
  ]);

  const handleAddTeacher = useCallback(async () => {
    if (!resolvedCourseId || !teacherIdInput.trim()) {
      return;
    }

    setPeopleError(null);
    setPeopleSuccess(null);
    try {
      await courseCardApi.addCourseTeacher(resolvedCourseId, {
        teacherId: teacherIdInput.trim(),
      });
      setTeacherIdInput('');
      await refreshPeople();
      await fetchCourse(resolvedCourseId, true);
      setPeopleSuccess('Преподаватель добавлен.');
    } catch (error) {
      setPeopleError(
        error instanceof Error ? error.message : 'Не удалось добавить преподавателя.'
      );
    }
  }, [fetchCourse, refreshPeople, resolvedCourseId, teacherIdInput]);

  const handleRemoveTeacher = useCallback(
    async (teacherId: string) => {
      if (!resolvedCourseId) {
        return;
      }

      setPeopleError(null);
      setPeopleSuccess(null);
      try {
        await courseCardApi.removeCourseTeacher(resolvedCourseId, teacherId);
        await refreshPeople();
        await fetchCourse(resolvedCourseId, true);
        setPeopleSuccess('Преподаватель удалён.');
      } catch (error) {
        setPeopleError(
          error instanceof Error
            ? error.message
            : 'Не удалось удалить преподавателя.'
        );
      }
    },
    [fetchCourse, refreshPeople, resolvedCourseId]
  );

  const handleAddEditor = useCallback(async () => {
    if (!resolvedCourseId || !editorIdInput.trim()) {
      return;
    }

    setPeopleError(null);
    setPeopleSuccess(null);
    try {
      await courseCardApi.addCourseEditor(resolvedCourseId, editorIdInput.trim());
      setEditorIdInput('');
      await refreshPeople();
      await fetchCourse(resolvedCourseId, true);
      setPeopleSuccess('Редактор добавлен.');
    } catch (error) {
      setPeopleError(
        error instanceof Error ? error.message : 'Не удалось добавить редактора.'
      );
    }
  }, [editorIdInput, fetchCourse, refreshPeople, resolvedCourseId]);

  const handleRemoveEditor = useCallback(
    async (editorId: string) => {
      if (!resolvedCourseId) {
        return;
      }

      setPeopleError(null);
      setPeopleSuccess(null);
      try {
        await courseCardApi.removeCourseEditor(resolvedCourseId, editorId);
        await refreshPeople();
        await fetchCourse(resolvedCourseId, true);
        setPeopleSuccess('Редактор удалён.');
      } catch (error) {
        setPeopleError(
          error instanceof Error ? error.message : 'Не удалось удалить редактора.'
        );
      }
    },
    [fetchCourse, refreshPeople, resolvedCourseId]
  );

  const handleLessonStateChange = useCallback(
    async (lessonId: number, state: string) => {
      setLessonActionError(null);
      setBusyLessonIds(prev => new Set(prev).add(lessonId));
      try {
        await updateLessonState(lessonId, { state });
      } catch (error) {
        setLessonActionError(
          error instanceof Error
            ? error.message
            : 'Не удалось обновить состояние урока.'
        );
      } finally {
        setBusyLessonIds(prev => {
          const next = new Set(prev);
          next.delete(lessonId);
          return next;
        });
      }
    },
    [updateLessonState]
  );

  const handleDeleteMaterial = useCallback(
    async (lessonId: number, material: FileMetaDTO) => {
      setLessonActionError(null);
      setBusyLessonIds(prev => new Set(prev).add(lessonId));
      try {
        await deleteLessonMaterial(lessonId, material.id);
      } catch (error) {
        setLessonActionError(
          error instanceof Error
            ? error.message
            : 'Не удалось удалить материал урока.'
        );
      } finally {
        setBusyLessonIds(prev => {
          const next = new Set(prev);
          next.delete(lessonId);
          return next;
        });
      }
    },
    [deleteLessonMaterial]
  );

  if (!resolvedCourseId) {
    return (
      <>
        <Header />
        <div className={styles.page}>Некорректный идентификатор курса.</div>
        <Footer />
      </>
    );
  }

  if (courseLoading || lessonsLoading) {
    return (
      <>
        <Header />
        <div className={styles.page}>Загрузка данных курса...</div>
        <Footer />
      </>
    );
  }

  if (courseForbidden) {
    const blockedTitle = 'Доступ ограничен';
    const blockedText = user
      ? 'Этот курс доступен только участникам. Запишитесь, чтобы открыть материалы.'
      : 'Этот курс доступен только авторизованным участникам.';
    const blockedButtonLabel = user ? 'Записаться' : 'Войти';
    const handleBlockedAction = () => {
      if (user) {
        handleJoin();
        return;
      }
      navigate('/auth');
    };
    return (
      <>
        <Header />
        <div className={styles.courseBlocked}>
          <div className={styles.courseBlockedCard}>
            <p className={styles.courseBlockedTitle}>{blockedTitle}</p>
            <p className={styles.courseBlockedText}>{blockedText}</p>
            <button
              type="button"
              className={styles.courseBlockedButton}
              onClick={handleBlockedAction}
            >
              {blockedButtonLabel}
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (courseError) {
    return (
      <>
        <Header />
        <div className={styles.page}>Ошибка загрузки курса: {courseError}</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.page}>
        <section className={styles.heroSection}>
        <div className={styles.heroCard}>
          <div className={styles.heroMedia}>
            <AuthImage
              src={course?.previewUrl}
              fallbackSrc={courseDetails}
              alt={course?.name || 'Курс'}
              className={styles.heroImage}
            />
          </div>
          <div className={styles.heroContent}>
            <div className={styles.heroTitleRow}>
              <h1>{course?.name || 'Курс'}</h1>
              {course?.handle && (
                <span className={styles.heroHandle}>@{course.handle}</span>
              )}
            </div>
            <p className={styles.heroDescription}>
              {course?.description || 'Описание курса появится позже.'}
            </p>
            <div className={styles.heroMeta}>
              <span className={styles.heroBadge}>
                {course?.state ?? '—'}
              </span>
              <div className={styles.heroTags}>
                {course?.tags?.length
                  ? course.tags.map(tag => (
                      <span key={tag} className={styles.heroTag}>
                        {tag}
                      </span>
                    ))
                  : (
                      <span className={styles.heroTagEmpty}>
                        Теги не указаны
                      </span>
                    )}
              </div>
            </div>
          </div>
          <div className={styles.heroActions}>
            {canJoinCourse && (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={isEnrolled ? handleLeaveCourse : handleJoin}
              >
                {isEnrolled ? 'Покинуть' : 'Вступить'}
              </button>
            )}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>Показатели курса</div>
          <div className={styles.summaryPanel}>
            <div className={styles.summaryItem}>
              <span>Уроков</span>
              <strong>{course?.lessonsCount ?? '—'}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Студентов</span>
              <strong>{course?.studentsCount ?? '—'}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Преподавателей</span>
              <strong>{course?.teachersCount ?? '—'}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Максимум</span>
              <strong>{course?.maxUsersAmount ?? '—'}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.contentGrid}>
        <div className={styles.mainColumn}>
          <div className={styles.blockCard}>
            <div className={styles.blockHeader}>Расписание и уроки</div>
            {lessonsError && (
              <div className={styles.lessonsWarning}>{lessonsError}</div>
            )}
            <Calendar />
            <LessonList canManageLessons={canManageLessons} />
          </div>

          <div className={styles.blockCard}>
            <div className={styles.blockHeader}>Все уроки</div>
            {lessonActionError && (
              <FormAlert message={lessonActionError} variant="error" />
            )}
            {sortedLessons.length === 0 ? (
              <p className={styles.blockText}>
                Уроки пока не запланированы.
              </p>
            ) : (
              <div className={styles.lessonTable}>
                {sortedLessons.map(lesson => (
                  <div key={lesson.id} className={styles.lessonCard}>
                    <div className={styles.lessonRow}>
                      <div className={styles.lessonInfo}>
                        <p className={styles.lessonName}>{lesson.name}</p>
                        <p className={styles.lessonMeta}>
                          {lesson.description || 'Описание будет добавлено позже.'}
                        </p>
                      </div>
                      <div className={styles.lessonTime}>
                        {formatLessonTime(lesson.beginAt)}
                      </div>
                    </div>
                    <div className={styles.lessonControls}>
                      <span className={styles.lessonType}>{lesson.type}</span>
                      <span className={styles.lessonType}>
                        Материалов: {lesson.materials.length}
                      </span>
                      {canManageLessons && (
                        <>
                          <select
                            className={styles.lessonStateSelect}
                            value={lesson.state}
                            onChange={event =>
                              handleLessonStateChange(lesson.id, event.target.value)
                            }
                            disabled={busyLessonIds.has(lesson.id)}
                          >
                            {LESSON_STATES.map(state => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className={styles.inlineAction}
                            onClick={() => handleEditLesson(lesson.id)}
                          >
                            Редактировать
                          </button>
                        </>
                      )}
                    </div>
                    {lesson.materials.length > 0 && (
                      <div className={styles.materialsList}>
                        {lesson.materials.map(material => (
                          <div key={material.id} className={styles.materialItem}>
                            <a
                              href={material.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={styles.materialLink}
                            >
                              {material.originalFilename}
                            </a>
                            {canManageLessons && (
                              <button
                                type="button"
                                className={styles.materialDelete}
                                onClick={() =>
                                  handleDeleteMaterial(lesson.id, material)
                                }
                                disabled={busyLessonIds.has(lesson.id)}
                              >
                                Удалить
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.blockCard}>
            <div className={styles.blockHeader}>Описание курса</div>
            <p className={styles.blockText}>
              {course?.description || 'Описание курса появится позже.'}
            </p>
          </div>

          <div className={styles.blockCard}>
            <div className={styles.blockHeader}>Детали курса</div>
            <div className={styles.detailsGrid}>
              <div>
                <p>Теги</p>
                <span>
                  {course?.tags?.length ? course.tags.join(', ') : '—'}
                </span>
              </div>
              <div>
                <p>Статус</p>
                <span>{course?.state ?? '—'}</span>
              </div>
              <div>
                <p>Максимум участников</p>
                <span>{course?.maxUsersAmount ?? '—'}</span>
              </div>
              <div>
                <p>Уроков</p>
                <span>{course?.lessonsCount ?? '—'}</span>
              </div>
              <div>
                <p>Студентов</p>
                <span>{course?.studentsCount ?? '—'}</span>
              </div>
              <div>
                <p>Преподавателей</p>
                <span>{course?.teachersCount ?? '—'}</span>
              </div>
            </div>
          </div>

          {canManageLessons && (
            <div className={styles.blockCard}>
              <div className={styles.blockHeader}>Команда и участники</div>
              {peopleError && <FormAlert message={peopleError} variant="error" />}
              {peopleSuccess && (
                <FormAlert message={peopleSuccess} variant="success" />
              )}
              <div className={styles.managementGrid}>
                <div className={styles.managementCard}>
                  <h3>Преподаватели</h3>
                  <div className={styles.managementInputRow}>
                    <input
                      type="text"
                      value={teacherIdInput}
                      onChange={event => setTeacherIdInput(event.target.value)}
                      placeholder="UUID преподавателя"
                    />
                    <button
                      type="button"
                      onClick={handleAddTeacher}
                      disabled={peopleLoading}
                    >
                      Добавить
                    </button>
                  </div>
                  <div className={styles.managementList}>
                    {courseTeachers.map(teacher => (
                      <div key={teacher.id} className={styles.managementItem}>
                        <div>
                          <strong>{teacher.fullName}</strong>
                          <span>{teacher.email}</span>
                        </div>
                        {!teacher.owner && (
                          <button
                            type="button"
                            className={styles.inlineDanger}
                            onClick={() => handleRemoveTeacher(teacher.id)}
                          >
                            Удалить
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.managementCard}>
                  <h3>Редакторы</h3>
                  <div className={styles.managementInputRow}>
                    <input
                      type="text"
                      value={editorIdInput}
                      onChange={event => setEditorIdInput(event.target.value)}
                      placeholder="UUID редактора"
                    />
                    <button
                      type="button"
                      onClick={handleAddEditor}
                      disabled={peopleLoading}
                    >
                      Добавить
                    </button>
                  </div>
                  <div className={styles.managementList}>
                    {(course?.editors ?? []).map(editor => (
                      <div key={editor.id} className={styles.managementItem}>
                        <div>
                          <strong>{editor.fullName}</strong>
                          <span>{editor.email}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.inlineDanger}
                          onClick={() => handleRemoveEditor(editor.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.managementCard}>
                  <h3>Студенты</h3>
                  <div className={styles.managementList}>
                    {courseStudents.map(enrollment => (
                      <div key={enrollment.id} className={styles.managementItem}>
                        <div>
                          <strong>{enrollment.user.fullName}</strong>
                          <span>{enrollment.user.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.managementCard}>
                  <h3>Все участники</h3>
                  <div className={styles.managementList}>
                    {courseMembers.map(enrollment => (
                      <div key={enrollment.id} className={styles.managementItem}>
                        <div>
                          <strong>{enrollment.user.fullName}</strong>
                          <span>{enrollment.user.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {canManageLessons && (
            <div className={styles.blockCard}>
              <div className={styles.blockHeader}>Настройки курса</div>
              <div className={styles.settingsGrid}>
                <label className={styles.settingsField}>
                  <span>Название курса</span>
                  <input
                    type="text"
                    value={settingsName}
                    onChange={event => setSettingsName(event.target.value)}
                  />
                </label>
                <label className={styles.settingsField}>
                  <span>Описание курса</span>
                  <textarea
                    value={settingsDescription}
                    onChange={event => setSettingsDescription(event.target.value)}
                  />
                </label>
                <label className={styles.settingsField}>
                  <span>Теги курса</span>
                  <input
                    type="text"
                    value={settingsTags}
                    onChange={event => setSettingsTags(event.target.value)}
                    placeholder="Например: IT, дизайн, frontend"
                  />
                </label>
                <label className={styles.settingsField}>
                  <span>Статус</span>
                  <select
                    value={settingsStatus}
                    onChange={event => setSettingsStatus(event.target.value)}
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </label>
              </div>
              {settingsError && (
                <FormAlert message={settingsError} variant="error" />
              )}
              {settingsSuccess && (
                <FormAlert message={settingsSuccess} variant="success" />
              )}
              <div className={styles.settingsActions}>
                <button
                  type="button"
                  className={styles.settingsButton}
                  onClick={handleSaveSettings}
                  disabled={settingsLoading}
                >
                  {settingsLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className={styles.sideColumn}>
          <NextLessonCard
            lesson={nextLesson}
            studentsCount={course?.studentsCount}
          />
          <TeachersCard teachers={teachers} />
          {(canManageLessons || canDeleteCourse) && (
            <div className={styles.sideCard}>
              <div className={styles.sideHeader}>Управление</div>
              <div className={styles.sideActions}>
                {canManageLessons && (
                  <button
                    type="button"
                    onClick={handleCreateLesson}
                    disabled={!resolvedCourseId}
                    className={styles.actionButton}
                  >
                    Создать урок
                  </button>
                )}
                {canDeleteCourse && (
                  <button
                    type="button"
                    onClick={handleDeleteCourse}
                    disabled={!resolvedCourseId || isDeleting}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                  >
                    {isDeleting ? 'Удаление...' : 'Удалить курс'}
                  </button>
                )}
              </div>
              {deleteError && (
                <div className={styles.actionError}>{deleteError}</div>
              )}
            </div>
          )}
        </aside>
        </section>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Footer />
    </>
  );
};

export default CourseDetailsPage;
