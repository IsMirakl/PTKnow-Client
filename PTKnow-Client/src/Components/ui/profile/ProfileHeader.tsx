import { memo } from 'react';
import StatusSt from '../../../assets/icons/status_student.svg';
import DefaultAvatar from '../../../assets/icons/profile.svg';
import styles from '../../../styles/pages/ProfilePage.module.css';
import type { ProfileResponseDTO } from '../../../types/profile';
import { getAvatarUrl } from '../../../utils/fileUtils';

interface ProfileHeaderProps {
  profile: ProfileResponseDTO;
  isMyProfile: boolean;
  onEdit?: () => void;
  onLogout?: () => void;
  onCreateCourse?: () => void;
  showCreateCourse?: boolean;
}

const ProfileHeaderComponent = ({
  profile,
  isMyProfile,
  onEdit,
  onLogout,
  onCreateCourse,
  showCreateCourse,
}: ProfileHeaderProps) => {
  const avatarUrl = getAvatarUrl(profile) || DefaultAvatar;
  const statusLabel = profile.status?.toString().trim() ?? '';
  const roleLabel = profile.role?.trim() ?? '';

  return (
    <div className={styles.profileHeader}>
      <img
        src={avatarUrl}
        alt={`Аватар ${profile.fullName}`}
        className={styles.profileAvatar}
      />
      <div className={styles.profileText}>
        <p className={styles.profileName}>{profile.fullName}</p>

        {statusLabel && (
          <div className={styles.profileStatus}>
            <img src={StatusSt} alt="Статус" />
            {statusLabel}
          </div>
        )}

        {roleLabel && <div className={styles.profileRole}>{roleLabel}</div>}
      </div>

      {isMyProfile && (
        <div className={styles.profileEdit}>
          {showCreateCourse && (
            <button
              type="button"
              onClick={onCreateCourse}
              className={styles.profileCreateCourse}
            >
              Создание курса
            </button>
          )}
          <button onClick={onEdit}>Редактировать</button>
          <button onClick={onLogout} className={styles.profileLogout}>
            Выйти
          </button>
        </div>
      )}
    </div>
  );
};

export const ProfileHeader = memo(ProfileHeaderComponent);
