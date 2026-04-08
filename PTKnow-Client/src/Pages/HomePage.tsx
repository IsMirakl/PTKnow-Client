import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import Footer from '../Components/Footer';
import Header from '../Components/Header';
import BookIcon from '../assets/icons/book.svg';
import ProfileIcon from '../assets/icons/profile.svg';
import PlusIcon from '../assets/icons/plus.svg';
import Logotype from '../assets/logo/Logotype.svg';
import { useAuth } from '../hooks/useAuth';
import styles from '../styles/pages/HomePage.module.css';
import {
  formatContinueLessonTime,
  getContinueCourseState,
} from '../utils/continueCourse';

type HomeLink = {
  to: string;
  title: string;
  description: string;
  icon: string;
};

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role ?? '';
  const isAuthenticated = Boolean(user);
  const canTeach = role === 'TEACHER' || role === 'ADMIN';
  const isAdmin = role === 'ADMIN';
  const continueCourse = useMemo(() => getContinueCourseState(), []);
  const continueTime = formatContinueLessonTime(continueCourse?.lessonBeginAt);

  const links: HomeLink[] = [
    {
      to: '/courses',
      title: 'Все курсы',
      description: 'Перейти к каталогу и выбрать подходящее направление.',
      icon: BookIcon,
    },
    ...(isAuthenticated
      ? [
          {
            to: '/profile',
            title: 'Мой профиль',
            description: 'Открыть профиль, проверить данные и настройки.',
            icon: ProfileIcon,
          },
          {
            to: '/my-courses',
            title: 'Мои курсы',
            description: 'Посмотреть свои записи и рабочие курсы.',
            icon: BookIcon,
          },
        ]
      : [
          {
            to: '/auth?mode=register',
            title: 'Зарегистрироваться',
            description: 'Создать аккаунт и открыть доступ к учебным разделам.',
            icon: PlusIcon,
          },
        ]),
    ...(canTeach
      ? [
          {
            to: '/create-course',
            title: 'Создать курс',
            description: 'Запустить новый курс и настроить его структуру.',
            icon: PlusIcon,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            to: '/admin',
            title: 'Панель администратора',
            description: 'Управлять пользователями и служебными разделами.',
            icon: ProfileIcon,
          },
        ]
      : []),
  ];

  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroBrand}>
            <img className={styles.logo} src={Logotype} alt="PTKnow" />
            <div className={styles.heroText}>
              <p className={styles.projectLabel}>PTKnow</p>
              <h1 className={styles.title}>Добро пожаловать!</h1>
              <p className={styles.subtitle}>
                {isAuthenticated
                  ? 'Выберите нужный раздел и продолжайте работу в своем ритме.'
                  : 'Зарегистрируйтесь, чтобы открыть личный профиль, курсы и доступ к учебному пространству.'}
              </p>
            </div>
          </div>

          <div className={styles.questionCard}>
            <div className={styles.questionIcon} aria-hidden="true">
              ?
            </div>
            <div>
              <p className={styles.questionLabel}>Первый шаг</p>
              <p className={styles.questionText}>
                Начнем грызть гранит науки вместе?
              </p>
            </div>
          </div>

          {isAuthenticated && continueCourse && (
            <Link
              to={`/course/${continueCourse.courseId}`}
              className={styles.continueCard}
            >
              <div className={styles.continueContent}>
                <p className={styles.continueLabel}>Продолжить с места</p>
                <h2 className={styles.continueTitle}>{continueCourse.courseName}</h2>
                <p className={styles.continueDescription}>
                  {continueCourse.lessonName
                    ? `Следующий ориентир: ${continueCourse.lessonName}`
                    : 'Вернуться в последний открытый курс'}
                </p>
              </div>
              <div className={styles.continueMeta}>
                <span className={styles.continueTime}>
                  {continueTime ?? 'В любое удобное время'}
                </span>
                <span className={styles.continueAction}>Открыть курс →</span>
              </div>
            </Link>
          )}
        </section>

        <section className={styles.linksSection}>
          <h2 className={styles.linksTitle}>Разделы</h2>
          <div className={styles.linksGrid}>
            {links.map(link => (
              <Link key={link.to} to={link.to} className={styles.linkCard}>
                <span className={styles.linkIconWrap}>
                  <img src={link.icon} alt="" className={styles.linkIcon} />
                </span>
                <div className={styles.linkContent}>
                  <h3 className={styles.linkTitle}>{link.title}</h3>
                  <p className={styles.linkDescription}>{link.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default HomePage;
