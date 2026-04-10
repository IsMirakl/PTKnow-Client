import { useEffect, useMemo } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import Footer from '../Components/Footer';
import Header from '../Components/Header';
import { AuthImage } from '../Components/AuthImage';
import { FormAlert } from '../Components/ui/forms/FormAlert';
import { useAuth } from '../hooks/useAuth';
import { useLesson } from '../hooks/useLessons';
import styles from '../styles/pages/LessonDetailsPage.module.css';

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const LessonDetailsPage: React.FC = () => {
  const { courseId: courseIdParam, lessonId: lessonIdParam } = useParams<{
    courseId: string;
    lessonId: string;
  }>();
  const parsedCourseId = courseIdParam ? Number(courseIdParam) : null;
  const parsedLessonId = lessonIdParam ? Number(lessonIdParam) : null;
  const courseId = Number.isFinite(parsedCourseId) ? parsedCourseId : null;
  const lessonId = Number.isFinite(parsedLessonId) ? parsedLessonId : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lesson, loading, error, getLessonById } = useLesson();

  useEffect(() => {
    if (lessonId) {
      getLessonById(lessonId).catch(fetchError => {
        console.error('Error fetching lesson details:', fetchError);
      });
    }
  }, [getLessonById, lessonId]);

  const canEditLesson = useMemo(() => {
    if (!user || !lesson) return false;
    const normalizedRole = user.role?.toUpperCase() ?? '';
    return normalizedRole === 'ADMIN' || normalizedRole === 'TEACHER' || user.id === lesson.owner?.id;
  }, [lesson, user]);

  if (!courseId || !lessonId) {
    return <Navigate to="/home" replace />;
  }

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.breadcrumbs}>
            <Link to="/courses">Курсы</Link>
            <span>/</span>
            <Link to={`/course/${courseId}`}>Курс</Link>
            <span>/</span>
            <span>{lesson?.name ?? 'Урок'}</span>
          </div>

          {loading && <div className={styles.stateCard}>Загрузка урока...</div>}

          {!loading && error && (
            <div className={styles.stateCard}>
              <FormAlert message={error} variant="error" />
            </div>
          )}

          {!loading && !error && lesson && (
            <>
              <section className={styles.hero}>
                <div className={styles.heroMain}>
                  <div className={styles.heroBadges}>
                    <span className={styles.badge}>{lesson.state}</span>
                    <span className={styles.badgeSecondary}>{lesson.type}</span>
                  </div>
                  <h1 className={styles.title}>{lesson.name}</h1>
                  <p className={styles.description}>
                    {lesson.description || 'Описание урока будет добавлено позже.'}
                  </p>
                  <div className={styles.metaGrid}>
                    <div className={styles.metaCard}>
                      <span className={styles.metaLabel}>Начало</span>
                      <strong>{formatDateTime(lesson.beginAt)}</strong>
                    </div>
                    <div className={styles.metaCard}>
                      <span className={styles.metaLabel}>Окончание</span>
                      <strong>{formatDateTime(lesson.endsAt)}</strong>
                    </div>
                    <div className={styles.metaCard}>
                      <span className={styles.metaLabel}>Курс</span>
                      <strong>{lesson.course?.name ?? '—'}</strong>
                    </div>
                  </div>
                </div>

                <aside className={styles.heroAside}>
                  <div className={styles.ownerCard}>
                    {lesson.owner?.avatarUrl ? (
                      <AuthImage
                        src={lesson.owner.avatarUrl}
                        alt={lesson.owner.fullName}
                        className={styles.ownerAvatar}
                      />
                    ) : (
                      <div className={styles.ownerAvatarFallback}>
                        {lesson.owner?.fullName?.slice(0, 2).toUpperCase() ?? 'У'}
                      </div>
                    )}
                    <div className={styles.ownerInfo}>
                      <span className={styles.ownerLabel}>Ведёт занятие</span>
                      <strong>{lesson.owner?.fullName ?? 'Преподаватель'}</strong>
                      <span>{lesson.owner?.email ?? lesson.owner?.handle ?? '—'}</span>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.secondaryAction}
                      onClick={() => navigate(`/course/${courseId}`)}
                    >
                      Назад к курсу
                    </button>
                    {canEditLesson && (
                      <button
                        type="button"
                        className={styles.primaryAction}
                        onClick={() =>
                          navigate(`/courses/${courseId}/lessons/${lesson.id}/edit`)
                        }
                      >
                        Редактировать урок
                      </button>
                    )}
                  </div>
                </aside>
              </section>

              <section className={styles.contentGrid}>
                <article className={styles.contentCard}>
                  <div className={styles.cardHeader}>Материалы и содержание</div>
                  {lesson.contentMd?.trim() ? (
                    <div className={styles.markdown}>
                      <ReactMarkdown>{lesson.contentMd}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className={styles.emptyText}>
                      Для этого урока пока не добавлено текстовое содержание.
                    </p>
                  )}
                </article>

                <aside className={styles.materialsCard}>
                  <div className={styles.cardHeader}>Файлы урока</div>
                  {lesson.materials.length > 0 ? (
                    <div className={styles.materialsList}>
                      {lesson.materials.map(material => (
                        <a
                          key={material.id}
                          href={material.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.materialItem}
                        >
                          <span className={styles.materialName}>
                            {material.originalFilename}
                          </span>
                          <span className={styles.materialMeta}>
                            {Math.max(1, Math.round(material.size / 1024))} КБ
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyText}>
                      Дополнительные материалы к уроку пока не загружены.
                    </p>
                  )}
                </aside>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default LessonDetailsPage;
