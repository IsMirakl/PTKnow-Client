import { useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';

import { CourseList } from '../Components/CourseList';
import Footer from '../Components/Footer';
import Header from '../Components/Header';
import { useAuth } from '../hooks/useAuth';
import { useMyEnrollments } from '../hooks/useMyEnrollments';
import styles from '../styles/pages/MyCoursesPage.module.css';
import {
  formatContinueLessonTime,
  getContinueCourseState,
} from '../utils/continueCourse';

const MyCoursesPage: React.FC = () => {
  const { user } = useAuth();
  const { enrolledCourses, teachingCourses, loading, error } = useMyEnrollments();
  const continueCourse = useMemo(() => getContinueCourseState(), []);
  const continueTime = formatContinueLessonTime(continueCourse?.lessonBeginAt);

  const allMyCourses = useMemo(() => {
    const byId = new Map<number, (typeof enrolledCourses)[number]>();

    enrolledCourses.forEach(course => {
      byId.set(course.id, course);
    });

    teachingCourses.forEach(course => {
      if (!byId.has(course.id)) {
        byId.set(course.id, course);
      }
    });

    return Array.from(byId.values());
  }, [enrolledCourses, teachingCourses]);

  const courseCards = useMemo(
    () =>
      allMyCourses.map(course => ({
        id: course.id,
        name: course.name,
        previewUrl: course.previewUrl,
        tags: [],
        description: '',
      })),
    [allMyCourses]
  );

  const enrolledCourseIds = useMemo(
    () => enrolledCourses.map(course => course.id),
    [enrolledCourses]
  );

  if (!user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.heroLabel}>Личный кабинет</p>
            <h1 className={styles.heroTitle}>Мои курсы</h1>
            <p className={styles.heroDescription}>
              Здесь собраны и курсы, на которые вы записаны, и курсы, которые вы ведете
            </p>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{enrolledCourses.length}</span>
              <span className={styles.statLabel}>записей на курсы</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{teachingCourses.length}</span>
              <span className={styles.statLabel}>курсов в ведении</span>
            </div>
          </div>
        </section>

        {continueCourse && (
          <section className={styles.resumeSection}>
            <Link
              to={`/course/${continueCourse.courseId}`}
              className={styles.continueCard}
            >
              <div className={styles.continueContent}>
                <p className={styles.continueLabel}>Продолжить с места</p>
                <h2 className={styles.continueTitle}>{continueCourse.courseName}</h2>
                <p className={styles.continueDescription}>
                  {continueCourse.lessonName
                    ? `Ближайший ориентир: ${continueCourse.lessonName}`
                    : 'Вернуться к последнему открытому курсу'}
                </p>
              </div>
              <div className={styles.continueMeta}>
                <span className={styles.continueTime}>
                  {continueTime ?? 'Можно открыть прямо сейчас'}
                </span>
                <span className={styles.continueAction}>Продолжить →</span>
              </div>
            </Link>
          </section>
        )}

        <section className={styles.catalogSection}>
          <CourseList
            showLoadMore={false}
            courses={courseCards}
            isLoading={loading}
            error={error}
            enrolledCourseIds={enrolledCourseIds}
            emptyTitle="У вас пока нет ни записей, ни курсов в ведении"
            emptyDescription="Когда вы запишетесь на курс или начнете вести свой, он появится здесь"
          />
        </section>
      </main>
      <Footer />
    </>
  );
};

export default MyCoursesPage;
