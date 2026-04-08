import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { courseCardApi } from '../api';
import Footer from '../Components/Footer';
import Header from '../Components/Header';
import { FormAlert } from '../Components/ui/forms/FormAlert';
import { useAuth } from '../hooks/useAuth';
import { useMyEnrollments } from '../hooks/useMyEnrollments';
import styles from '../styles/pages/CourseRegisterPage.module.css';
import { normalizeRole } from '../utils/roleUtils';

const CourseRegisterPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const parsedCourseId = courseId ? Number(courseId) : null;
  const resolvedCourseId = Number.isFinite(parsedCourseId) ? parsedCourseId : null;
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { enrolledCourses, loading: enrollmentsLoading } = useMyEnrollments();

  const isAlreadyEnrolled = useMemo(
    () =>
      !!resolvedCourseId &&
      enrolledCourses.some(course => course.id === resolvedCourseId),
    [enrolledCourses, resolvedCourseId]
  );
  const normalizedRole = normalizeRole(user?.role);

  useEffect(() => {
    if (!resolvedCourseId || !user) {
      return;
    }
    if (normalizedRole === 'ADMIN' || normalizedRole === 'TEACHER') {
      navigate(`/course/${resolvedCourseId}`, { replace: true });
      return;
    }
    if (!enrollmentsLoading && normalizedRole === 'STUDENT' && isAlreadyEnrolled) {
      navigate(`/course/${resolvedCourseId}`, { replace: true });
    }
  }, [
    enrollmentsLoading,
    isAlreadyEnrolled,
    navigate,
    normalizedRole,
    resolvedCourseId,
    user,
  ]);

  const handleEnroll = useCallback(async () => {
    if (!resolvedCourseId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await courseCardApi.enrollInCourse(resolvedCourseId);
      navigate(`/course/${resolvedCourseId}`);
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = err as {
          response?: { status?: number; data?: { message?: string } | string };
        };
        const status = response.response?.status;
        if (status === 401) {
          navigate('/home', { replace: true });
          return;
        }
        const data = response.response?.data;
        if (typeof data === 'string' && data.trim()) {
          setError(data);
          return;
        }
        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          data.message
        ) {
          setError(String(data.message));
          return;
        }
      }

      setError('Не удалось записаться на курс. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, navigate, resolvedCourseId]);

  if (!resolvedCourseId) {
    return <Navigate to="/home" replace />;
  }

  return (
    <>
      <Header />
      <main className={styles.container}>
        <div className={styles.card}>
          <h1>Запись на курс</h1>
          <p>
            Подтвердите запись, чтобы получить доступ к полной информации о курсе.
          </p>
          {error && <FormAlert message={error} variant="error" />}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleEnroll}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Запись...' : 'Записаться'}
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => navigate(`/course/${resolvedCourseId}`)}
            >
              Назад
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default CourseRegisterPage;
