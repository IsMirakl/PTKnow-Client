import { memo } from 'react';
import StatusSt from '../../../assets/icons/status_student.svg';
import styles from '../../../styles/pages/ProfilePage.module.css';
import type { ProfileResponseDTO } from '../../../types/profile';

interface ProfileContacts {
  profile: ProfileResponseDTO;
}

const ProfileContactsItemComponent = ({ profile }: ProfileContacts) => {
  const email = profile.email || '';
  if (!email) {
    return null;
  }

  return (
    <div className={styles.profileInfo}>
      <p className={styles.profileInfoTitle}>Контактная информация</p>
      <hr />

      <div className={styles.profileContacts}>
        <div className={styles.profileEmail}>
          <div className={styles.profileContactsIcon}>
            <img src={StatusSt} alt="" />
          </div>
          <div className={styles.emailTextWrapper}>
            <p>Email</p>
            <p>{email}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProfileContactsItem = memo(ProfileContactsItemComponent);
