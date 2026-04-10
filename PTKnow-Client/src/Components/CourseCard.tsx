import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';

import defaultImg from '../assets/image/2.jpg';
import { useAuth } from '../hooks/useAuth';
import styles from '../styles/components/Card.module.css';
import type { CourseDTO } from '../types/CourseCard';
import { normalizeRole } from '../utils/roleUtils';
import { getFileUrl } from '../utils/fileUtils';
import { AuthImage } from './AuthImage';

type CourseCardData = Pick<CourseDTO, 'id' | 'name'> & {
  previewUrl?: string | null;
  tags?: string[];
  description?: string;
};

interface CourseCardProps extends CourseCardData {
  enrolledCourseIds?: Set<number> | null;
}

const CourseCardComponent: React.FC<CourseCardProps> = ({
  id,
  name,
  tags = [],
  description = '',
  previewUrl,
  enrolledCourseIds,
}) => {
  const { user } = useAuth();
  const isGuest = !user;
  const isEnrolled = useMemo(
    () => enrolledCourseIds?.has(id) ?? false,
    [enrolledCourseIds, id]
  );
  const normalizedRole = normalizeRole(user?.role);
  const resolvedPreviewUrl = useMemo(
    () => getFileUrl(previewUrl ?? undefined),
    [previewUrl]
  );
  const shouldSkipEnroll =
    isGuest ||
    normalizedRole === 'ADMIN' ||
    normalizedRole === 'TEACHER' ||
    (normalizedRole === 'STUDENT' && isEnrolled);
  const detailsLink = shouldSkipEnroll
    ? `/course/${id}`
    : `/course/${id}/register`;

  return (
    <div className={styles.cardContainer}>
      <div className={styles.imageContainer}>
        <AuthImage
          src={resolvedPreviewUrl}
          fallbackSrc={defaultImg}
          alt={name}
          className={styles.cardImage}
        />
      </div>

      <div className={styles.bodyCard}>
        {tags.length > 0 && (
          <div className={styles.tagsWrapper}>
            {tags.map((tag, index) => (
              <span key={index} className={styles.tagContainer}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <h2 className={styles.cardTitle}>{name}</h2>
        <p className={styles.cardDescription}>
          {description || 'Описание курса появится позже.'}
        </p>
      </div>

      <div className={styles.buttonContainer}>
        <Link to={detailsLink} className={styles.cardButton}>
          {isGuest ? 'Необходимо зарегистрироваться' : 'Подробнее'}
        </Link>
      </div>
    </div>
  );
};

export const CourseCard = memo(CourseCardComponent);
