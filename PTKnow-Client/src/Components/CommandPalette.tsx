import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import BookIcon from '../assets/icons/book.svg';
import CalendarIcon from '../assets/icons/calendar.svg';
import LoginIcon from '../assets/icons/login.svg';
import PlusIcon from '../assets/icons/plus.svg';
import ProfileIcon from '../assets/icons/profile.svg';
import ProjectsIcon from '../assets/icons/projects.svg';
import { useAuth } from '../hooks/useAuth';
import styles from '../styles/components/CommandPalette.module.css';
import {
  formatContinueLessonTime,
  getContinueCourseState,
} from '../utils/continueCourse';

type PaletteAction = {
  id: string;
  title: string;
  description: string;
  to: string;
  icon: string;
  section: string;
  keywords: string[];
};

const normalizeRole = (role?: string | null) => {
  if (!role) {
    return '';
  }
  const upper = role.toUpperCase();
  return upper.startsWith('ROLE_') ? upper.slice(5) : upper;
};

const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const { user } = useAuth();
  const isAuthenticated = Boolean(user);
  const role = normalizeRole(user?.role);
  const canTeach = role === 'TEACHER' || role === 'ADMIN';
  const isAdmin = role === 'ADMIN';
  const continueCourse = useMemo(() => getContinueCourseState(), [isOpen]);

  const actions = useMemo<PaletteAction[]>(() => {
    const baseActions: PaletteAction[] = [
      {
        id: 'home',
        title: 'Главная',
        description: 'Вернуться на стартовую страницу проекта',
        to: '/home',
        icon: ProfileIcon,
        section: 'Основное',
        keywords: ['главная', 'home', 'старт'],
      },
      {
        id: 'courses',
        title: 'Все курсы',
        description: 'Открыть каталог курсов',
        to: '/courses',
        icon: BookIcon,
        section: 'Обучение',
        keywords: ['курсы', 'каталог', 'обучение'],
      },
      {
        id: 'events',
        title: 'Мероприятия',
        description: 'Перейти к разделу мероприятий',
        to: '/events',
        icon: CalendarIcon,
        section: 'Основное',
        keywords: ['мероприятия', 'события', 'календарь'],
      },
      {
        id: 'projects',
        title: 'Проекты',
        description: 'Открыть проекты и инициативы',
        to: '/projects',
        icon: ProjectsIcon,
        section: 'Основное',
        keywords: ['проекты', 'инициативы'],
      },
    ];

    if (!isAuthenticated) {
      baseActions.push(
        {
          id: 'login',
          title: 'Войти',
          description: 'Открыть страницу авторизации',
          to: '/auth',
          icon: LoginIcon,
          section: 'Аккаунт',
          keywords: ['вход', 'логин', 'авторизация'],
        },
        {
          id: 'register',
          title: 'Регистрация',
          description: 'Создать новый аккаунт',
          to: '/auth?mode=register',
          icon: PlusIcon,
          section: 'Аккаунт',
          keywords: ['регистрация', 'создать аккаунт'],
        }
      );
    }

    if (isAuthenticated) {
      baseActions.push(
        {
          id: 'profile',
          title: 'Мой профиль',
          description: 'Открыть профиль и настройки',
          to: '/profile',
          icon: ProfileIcon,
          section: 'Аккаунт',
          keywords: ['профиль', 'аккаунт', 'настройки'],
        },
        {
          id: 'my-courses',
          title: 'Мои курсы',
          description: 'Посмотреть свои записи на курсы',
          to: '/my-courses',
          icon: BookIcon,
          section: 'Обучение',
          keywords: ['мои курсы', 'записи', 'обучение'],
        }
      );
    }

    if (isAuthenticated && continueCourse) {
      baseActions.unshift({
        id: 'continue-course',
        title: 'Продолжить с места',
        description: continueCourse.lessonName
          ? `${continueCourse.courseName} • ${continueCourse.lessonName}`
          : continueCourse.courseName,
        to: `/course/${continueCourse.courseId}`,
        icon: BookIcon,
        section: 'Быстрые действия',
        keywords: [
          'продолжить',
          'последний курс',
          continueCourse.courseName,
          continueCourse.lessonName ?? '',
        ],
      });
    }

    if (canTeach) {
      baseActions.push({
        id: 'create-course',
        title: 'Создать курс',
        description: 'Запустить новый курс',
        to: '/create-course',
        icon: PlusIcon,
        section: 'Преподавателю',
        keywords: ['создать курс', 'новый курс', 'преподавателю'],
      });
    }

    if (isAdmin) {
      baseActions.push(
        {
          id: 'admin',
          title: 'Панель администратора',
          description: 'Открыть основные админские разделы',
          to: '/admin',
          icon: ProfileIcon,
          section: 'Администрирование',
          keywords: ['админ', 'панель', 'администрирование'],
        },
        {
          id: 'admin-users',
          title: 'Пользователи',
          description: 'Управление пользователями системы',
          to: '/admin/users',
          icon: ProfileIcon,
          section: 'Администрирование',
          keywords: ['пользователи', 'админ пользователи', 'роли'],
        }
      );
    }

    return baseActions;
  }, [canTeach, continueCourse, isAdmin, isAuthenticated]);

  const filteredActions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return actions;
    }

    return actions.filter(action => {
      const haystack = [
        action.title,
        action.description,
        action.section,
        ...action.keywords,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [actions, query]);

  const groupedActions = useMemo(() => {
    const groups = new Map<string, PaletteAction[]>();

    filteredActions.forEach(action => {
      const existing = groups.get(action.section) ?? [];
      existing.push(action);
      groups.set(action.section, existing);
    });

    return Array.from(groups.entries()).map(([section, items]) => ({
      section,
      items,
    }));
  }, [filteredActions]);

  const orderedActions = useMemo(
    () => groupedActions.flatMap(group => group.items),
    [groupedActions]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsOpen(prev => !prev);
        return;
      }

      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setQuery('');
    setActiveIndex(0);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    const activeElement = listRef.current?.querySelector<HTMLElement>(
      `[data-palette-index="${activeIndex}"]`
    );
    activeElement?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleNavigate = (action: PaletteAction) => {
    navigate(action.to);
    handleClose();
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (orderedActions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(prev => (prev + 1) % orderedActions.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(prev =>
        prev === 0 ? orderedActions.length - 1 : prev - 1
      );
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      handleNavigate(orderedActions[activeIndex]);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Быстрые команды"
        onClick={event => event.stopPropagation()}
      >
        <div className={styles.searchRow}>
          <span className={styles.searchIcon} aria-hidden="true">
            ⌘
          </span>
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Перейти к разделу, курсу или действию"
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <span className={styles.searchHint}>Esc</span>
        </div>

        <div ref={listRef} className={styles.results}>
          {groupedActions.length > 0 ? (
            groupedActions.map(group => (
                <section key={group.section} className={styles.section}>
                  <p className={styles.sectionTitle}>{group.section}</p>
                  <div className={styles.sectionList}>
                    {group.items.map(action => {
                      const itemIndex = orderedActions.findIndex(
                        item => item.id === action.id
                      );
                      const continueTime =
                        action.id === 'continue-course' && continueCourse
                          ? formatContinueLessonTime(continueCourse.lessonBeginAt)
                          : null;

                      return (
                        <button
                          key={action.id}
                          type="button"
                          className={`${styles.actionButton} ${
                            itemIndex === activeIndex ? styles.actionButtonActive : ''
                          }`}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          onClick={() => handleNavigate(action)}
                          data-palette-index={itemIndex}
                        >
                          <span className={styles.actionIconWrap}>
                            <img src={action.icon} alt="" className={styles.actionIcon} />
                          </span>
                          <span className={styles.actionContent}>
                            <span className={styles.actionTitle}>{action.title}</span>
                            <span className={styles.actionDescription}>
                              {action.description}
                            </span>
                          </span>
                          {continueTime ? (
                            <span className={styles.actionMeta}>{continueTime}</span>
                          ) : (
                            <span className={styles.actionMeta}>Enter</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))
          ) : (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Ничего не найдено</p>
              <p className={styles.emptyDescription}>
                Попробуйте другой запрос или более короткое слово
              </p>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <span>Ctrl/Cmd + K</span>
          <span>↑ ↓ для навигации</span>
          <span>Enter для перехода</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
