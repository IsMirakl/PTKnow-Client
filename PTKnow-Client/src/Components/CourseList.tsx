import { useCallback, useMemo, useState } from 'react';

import { useCourse } from '../hooks/useCourse';
import styles from '../styles/components/CourseList.module.css';
import { CourseCard } from './CourseCard';

interface CourseListProps {
  limit?: number;
  showLoadMore?: boolean;
  courses?: Array<{
    id: number;
    name: string;
    previewUrl?: string | null;
    tags?: string[];
    description?: string;
  }>;
  isLoading?: boolean;
  error?: string | null;
  enrolledCourseIds?: number[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export const CourseList: React.FC<CourseListProps> = ({
  limit,
  showLoadMore = true,
  courses,
  isLoading,
  error,
  enrolledCourseIds,
  emptyTitle = 'Пока нет курсов',
  emptyDescription = 'Здесь появятся доступные направления, как только они будут опубликованы.',
}) => {
  const shouldUseApi = !courses;
  const { course, loading, error: courseError } = useCourse({
    enabled: shouldUseApi,
  });
  const [visibleCount, setVisibleCount] = useState(limit || 6);

  const displayCourses = useMemo(() => courses ?? course, [courses, course]);
  const visibleCourses = useMemo(
    () => displayCourses.slice(0, visibleCount),
    [displayCourses, visibleCount]
  );
  const displayLoading = useMemo(
    () => (typeof isLoading === 'boolean' ? isLoading : courses ? false : loading),
    [isLoading, courses, loading]
  );
  const displayError = useMemo(
    () => (typeof error === 'string' ? error : courses ? null : courseError),
    [error, courses, courseError]
  );
  const enrolledIds = useMemo(
    () => (enrolledCourseIds ? new Set(enrolledCourseIds) : null),
    [enrolledCourseIds]
  );

  const handleShowMore = useCallback(() => {
    setVisibleCount(prev => prev + (limit || 6));
  }, [limit]);

  if (displayLoading) {
    return (
      <div className={styles.courseList} aria-label="Загрузка курсов">
        {Array.from({ length: limit || 6 }).map((_, index) => (
          <div key={index} className={styles.skeletonCard} aria-hidden="true">
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonBody}>
              <div className={styles.skeletonTags}>
                <span className={styles.skeletonTag} />
                <span className={styles.skeletonTag} />
              </div>
              <div className={styles.skeletonTitle} />
              <div className={styles.skeletonTitleShort} />
              <div className={styles.skeletonText} />
              <div className={styles.skeletonText} />
              <div className={styles.skeletonTextShort} />
            </div>
            <div className={styles.skeletonFooter}>
              <div className={styles.skeletonButton} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayError) {
    return <div className={styles.error}>Ошибка загрузки курсов: {displayError}</div>;
  }

  if (displayCourses.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyTitle}>{emptyTitle}</h3>
        <p className={styles.emptyDescription}>{emptyDescription}</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.courseList}>
        {visibleCourses.map(courseItem => (
          <CourseCard
            key={courseItem.id}
            {...courseItem}
            enrolledCourseIds={enrolledIds}
          />
        ))}
      </div>

      {showLoadMore && displayCourses.length > visibleCount && (
        <button className={styles.showMoreButton} onClick={handleShowMore}>
          Показать еще ({displayCourses.length - visibleCount})
        </button>
      )}
    </>
  );
};
