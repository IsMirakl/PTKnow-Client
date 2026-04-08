import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import IconBook from '../assets/icons/book.svg';
import Header from '../Components/Header';
import { CourseList } from '../Components/CourseList';
import Footer from '../Components/Footer';
import { ProfileContactsItem } from '../Components/ui/profile/ProfileContactsItem';
import { ProfileHeader } from '../Components/ui/profile/ProfileHeader';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import styles from '../styles/pages/ProfilePage.module.css';
import { normalizeRole } from '../utils/roleUtils';

export const ProfilePage = () => {
  const { handle } = useParams<{ handle: string }>();
  const { profile, loading, error, notFound, getProfileByHandle, getMyProfile } =
    useProfile();
  const { logout } = useAuth();
  const [isMyProfile, setIsMyProfile] = useState(false);
  const navigate = useNavigate();
  const contactEmail = profile?.email || '';

  useEffect(() => {
    if (handle) {
      setIsMyProfile(false);
      getProfileByHandle(handle);
    } else {
      setIsMyProfile(true);
      getMyProfile();
    }
  }, [handle, getProfileByHandle, getMyProfile]);

  if (loading) {
    return (
      <>
        <Header />
        <div className={styles.container}>
          <div className={styles.profileCard}>
            <div className={styles.profileSkeletonHeader}>
              <div className={styles.profileSkeletonAvatar} />
              <div className={styles.profileSkeletonMain}>
                <div className={styles.profileSkeletonName} />
                <div className={styles.profileSkeletonHandle} />
                <div className={styles.profileSkeletonBadges}>
                  <span className={styles.profileSkeletonBadge} />
                  <span className={styles.profileSkeletonBadgeShort} />
                </div>
              </div>
              <div className={styles.profileSkeletonActions}>
                <span className={styles.profileSkeletonAction} />
                <span className={styles.profileSkeletonActionShort} />
              </div>
            </div>

            <div className={styles.profileSkeletonInfo}>
              <div className={styles.profileSkeletonSectionTitle} />
              <div className={styles.profileSkeletonLine} />
              <div className={styles.profileSkeletonLine} />
              <div className={styles.profileSkeletonLineShort} />
            </div>

            <div className={styles.profileSkeletonContacts}>
              <div className={styles.profileSkeletonContactItem}>
                <span className={styles.profileSkeletonContactIcon} />
                <div className={styles.profileSkeletonContactText}>
                  <span className={styles.profileSkeletonContactLabel} />
                  <span className={styles.profileSkeletonContactValue} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.coursesAttendTitle}>
            <div className={styles.courseAttendIcon}>
              <img src={IconBook} alt="" />
            </div>
            <h3>Курсы, которые я посещаю</h3>
          </div>
          <div className={styles.profileMyCourse}>
            <CourseList showLoadMore={false} isLoading limit={3} />
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <div className="error">
        <div>Ошибка: {error}</div>
      </div>
    );
  }

  if (handle && notFound) {
    return (
      <>
        <Header />
        <div className={styles.container}>
          <div className={styles.profileNotFound}>
            <h2>Пользователь не найден</h2>
            <p>Проверьте правильность ссылки на профиль.</p>
            <button
              type="button"
              className={styles.profileNotFoundButton}
              onClick={() => navigate('/home')}
            >
              На главную
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!profile) return null;

  const enrolledCourses = profile.enrolledCourses ?? [];
  const enrolledCourseCards = enrolledCourses.map(course => ({
    id: course.id,
    name: course.name,
    previewUrl: course.previewUrl,
    tags: [],
    description: '',
  }));
  const enrolledCourseIds = enrolledCourses.map(course => course.id);
  const normalizedRole = normalizeRole(profile.role);
  const canCreateCourse =
    isMyProfile && (normalizedRole === 'ADMIN' || normalizedRole === 'TEACHER');

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.profileCard}>
          <ProfileHeader
            profile={profile}
            isMyProfile={isMyProfile}
            onEdit={() => navigate('/profile/edit')}
            onLogout={logout}
            showCreateCourse={canCreateCourse}
            onCreateCourse={() => navigate('/create-course')}
          />

          {profile.summary?.trim() && (
            <div
              className={`${styles.profileAbout} ${
                contactEmail ? '' : styles.profileAboutLast
              }`}
            >
              <p className={styles.profileAboutTitle}>О себе</p>
              <p className={styles.profileAboutText}>{profile.summary.trim()}</p>
            </div>
          )}

          <ProfileContactsItem profile={profile} />
        </div>
        <div className={styles.coursesAttendTitle}>
          <div className={styles.courseAttendIcon}>
            <img src={IconBook} alt="" />
          </div>
          <h3>Курсы, которые я посещаю</h3>
        </div>
        <div className={styles.profileMyCourse}>
          {enrolledCourseCards.length === 0 ? (
            <p className={styles.profileEmptyCourses}>Пока нет записей на курсы.</p>
          ) : (
            <CourseList
              limit={3}
              showLoadMore={false}
              courses={enrolledCourseCards}
              enrolledCourseIds={enrolledCourseIds}
            />
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};
