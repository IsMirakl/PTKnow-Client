import { memo } from 'react';

import { AuthImage } from '../../AuthImage';
import { useAuth } from '../../../hooks/useAuth';
import type { CourseTeacherDTO } from '../../../types/CourseCard';
import styles from '../../../styles/components/TeachersCard.module.css';

interface TeachersCardProps {
  teachers: CourseTeacherDTO[];
}

const getInitials = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return '—';
  const parts = trimmed.split(' ');
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
};

const TeachersCardComponent: React.FC<TeachersCardProps> = ({ teachers }) => {
  const { user } = useAuth();

  return (
    <div className={styles.card}>
      <div className={styles.header}>Преподаватели</div>
      {teachers.length === 0 ? (
        <p className={styles.empty}>Данные о преподавателях появятся позже.</p>
      ) : (
        <div className={styles.list}>
          {teachers.map(teacher => {
            const name =
              teacher.fullName || teacher.profileHandle || teacher.email || '—';
            const isCurrentUser = Boolean(user && teacher.id === user.id);

            return (
              <div key={teacher.id} className={styles.teacherRow}>
                {isCurrentUser && user?.avatarUrl ? (
                  <AuthImage
                    src={user.avatarUrl}
                    alt={name}
                    className={styles.avatarImage}
                  />
                ) : (
                  <div className={styles.avatar}>{getInitials(name)}</div>
                )}
                <div className={styles.teacherInfo}>
                  <span className={styles.teacherName}>{name}</span>
                  <span className={styles.teacherRole}>
                    {teacher.owner ? 'Автор курса' : 'Преподаватель'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const TeachersCard = memo(TeachersCardComponent);
