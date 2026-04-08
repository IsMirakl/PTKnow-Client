import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

import BookIcon from '../assets/icons/book.svg';
import CalendarIcon from '../assets/icons/calendar.svg';
import LoginIcon from '../assets/icons/login.svg';
import ProfileIcon from '../assets/icons/profile.svg';
import ProjectsIcon from '../assets/icons/projects.svg';
import Logotype from '../assets/logo/Logotype.svg';
import { useAuth } from '../hooks/useAuth';
import RequiredAuth from '../routes/RequiredAuth';
import RequiredRole from '../routes/RequiredRole';
import styles from '../styles/components/Header.module.css';
import { formatShortName } from '../utils/formatName';
import { getFileUrl } from '../utils/fileUtils';

const ROUTES = {
  HOME: '/home',
  AUTH: '/auth',
  COURSES: '/courses',
  MY_COURSES: '/my-courses',
  EVENTS: '/events',
  PROJECTS: '/projects',
  PROFILE: '/profile',
  ADMIN: '/admin',
} as const;

interface NavItem {
  to: string;
  label: string;
  icon: string;
  authOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.COURSES, label: 'Все курсы', icon: BookIcon },
  { to: ROUTES.MY_COURSES, label: 'Мои курсы', icon: ProfileIcon, authOnly: true },
  { to: ROUTES.EVENTS, label: 'Мероприятия', icon: CalendarIcon },
  { to: ROUTES.PROJECTS, label: 'Проекты', icon: ProjectsIcon },
];

const Header: React.FC = () => {
  const location = useLocation();
  const isAuthPage = useMemo(
    () => location.pathname === '/auth' || location.pathname === '/register',
    [location.pathname]
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const { user, logout } = useAuth();
  const isAuthenticated = Boolean(user);
  const displayName = useMemo(
    () => (user ? formatShortName(user.fullName) : ''),
    [user]
  );
  const avatarUrl = useMemo(
    () => (user?.avatarUrl ? getFileUrl(user.avatarUrl) : null),
    [user]
  );

  const handleLogout = useCallback(async () => {
    await logout();
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    window.location.href = ROUTES.HOME;
  }, [logout]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleNavLinkClick = useCallback(() => {
    closeMobileMenu();
  }, [closeMobileMenu]);

  const renderDesktopNavItem = (item: NavItem) => {
    const content = (
      <li key={item.label}>
        <NavLink
          to={item.to}
          className={({ isActive }) =>
            isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
          }
        >
          <span className={styles.navIconWrap}>
            <img src={item.icon} alt="" className={styles.navIcon} />
          </span>
          {item.label}
        </NavLink>
      </li>
    );

    if (item.authOnly) {
      return (
        <RequiredAuth key={item.label} redirectTo={null}>
          {content}
        </RequiredAuth>
      );
    }

    return content;
  };

  const renderMobileNavItem = (item: NavItem) => {
    const content = (
      <li key={item.label} className={styles.mobileNavItem}>
        <NavLink
          to={item.to}
          className={({ isActive }) =>
            isActive ? `${styles.mobileNavLink} ${styles.active}` : styles.mobileNavLink
          }
          onClick={handleNavLinkClick}
        >
          <span className={styles.navIconWrap}>
            <img src={item.icon} alt="" className={styles.navIcon} />
          </span>
          {item.label}
        </NavLink>
      </li>
    );

    if (item.authOnly) {
      return (
        <RequiredAuth key={item.label} redirectTo={null}>
          {content}
        </RequiredAuth>
      );
    }

    return content;
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.headerLogo}>
          <Link to={ROUTES.HOME} className={styles.brandLink} onClick={closeMobileMenu}>
            <img src={Logotype} alt="Логотип ПТК знания" className={styles.brandLogo} />
            <span className={styles.brandTitle}>ПТК знания</span>
          </Link>
        </div>

        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {NAV_ITEMS.map(renderDesktopNavItem)}
            <RequiredRole roles="ADMIN" redirectTo={null}>
              <li>
                <NavLink
                  to={ROUTES.ADMIN}
                  className={({ isActive }) =>
                    isActive ? `${styles.navLink} ${styles.active}` : styles.navLink
                  }
                >
                  <span className={styles.navIconWrap}>
                    <img src={ProfileIcon} alt="" className={styles.navIcon} />
                  </span>
                  Админ
                </NavLink>
              </li>
            </RequiredRole>
          </ul>
        </nav>

        <div className={styles.authSection}>
          {isAuthenticated ? (
            <div ref={profileMenuRef} className={styles.profileSection}>
              <Link
                to={ROUTES.PROFILE}
                className={styles.profileLink}
                onClick={() => setIsProfileMenuOpen(false)}
              >
                <div className={styles.userInfo}>
                  <img
                    src={avatarUrl || Logotype}
                    className={styles.userAvatar}
                    alt={displayName ? `Аватар ${displayName}` : 'Аватар пользователя'}
                  />
                </div>
                <div>
                  {displayName && <p className={styles.userName}>{displayName}</p>}
                  {user?.handle && <p className={styles.handleName}>{user.handle}</p>}
                </div>
              </Link>
              <button
                type="button"
                className={`${styles.profileToggle} ${
                  isProfileMenuOpen ? styles.profileToggleOpen : ''
                }`}
                aria-label="Открыть меню профиля"
                aria-expanded={isProfileMenuOpen}
                onClick={() => setIsProfileMenuOpen(prev => !prev)}
              >
                <span className={styles.profileChevron} aria-hidden="true" />
              </button>

              <div
                className={`${styles.profileDropdown} ${
                  isProfileMenuOpen ? styles.profileDropdownOpen : ''
                }`}
              >
                <Link
                  to={ROUTES.PROFILE}
                  className={styles.profileDropdownLink}
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  Профиль
                </Link>
                <button
                  type="button"
                  className={styles.profileDropdownLogout}
                  onClick={handleLogout}
                >
                  Выйти
                </button>
              </div>
            </div>
          ) : (
            !isAuthPage && (
              <Link to={ROUTES.AUTH} className={styles.loginButton}>
                Войти
              </Link>
            )
          )}
        </div>

        <div className={styles.mobileQuickAction}>
          {isAuthenticated ? (
            <Link
              to={ROUTES.PROFILE}
              className={styles.mobileProfileButton}
              onClick={closeMobileMenu}
              aria-label="Открыть профиль"
            >
              <img
                src={avatarUrl || Logotype}
                className={styles.mobileProfileAvatar}
                alt=""
              />
            </Link>
          ) : (
            !isAuthPage && (
              <Link
                to={ROUTES.AUTH}
                className={styles.mobileProfileButton}
                onClick={closeMobileMenu}
                aria-label="Войти"
              >
                <img src={LoginIcon} className={styles.mobileProfileIcon} alt="" />
              </Link>
            )
          )}
        </div>

        <button
          className={`${styles.burgerButton} ${isMobileMenuOpen ? styles.active : ''}`}
          onClick={toggleMobileMenu}
          aria-label="Открыть меню"
        >
          <span className={styles.burgerLine}></span>
          <span className={styles.burgerLine}></span>
          <span className={styles.burgerLine}></span>
        </button>
      </div>

      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.active : ''}`}>
        <ul className={styles.mobileNavList}>
          {NAV_ITEMS.map(renderMobileNavItem)}
          <RequiredRole roles="ADMIN" redirectTo={null}>
            <li className={styles.mobileNavItem}>
              <NavLink
                to={ROUTES.ADMIN}
                className={({ isActive }) =>
                  isActive ? `${styles.mobileNavLink} ${styles.active}` : styles.mobileNavLink
                }
                onClick={handleNavLinkClick}
              >
                <span className={styles.navIconWrap}>
                  <img src={ProfileIcon} alt="" className={styles.navIcon} />
                </span>
                Админ
              </NavLink>
            </li>
          </RequiredRole>
        </ul>

        <div className={styles.mobileAuthSection}>
          {isAuthenticated ? (
            <div className={styles.mobileProfileSection}>
              <Link
                to={ROUTES.PROFILE}
                className={styles.mobileNavLink}
                onClick={handleNavLinkClick}
              >
                <span className={styles.navIconWrap}>
                  <img src={ProfileIcon} alt="" className={styles.navIcon} />
                </span>
                Профиль
              </Link>
              <button
                onClick={handleLogout}
                className={styles.mobileNavLink}
                style={{ background: 'none', border: 'none', textAlign: 'left' }}
              >
                <span className={styles.navIconWrap}>
                  <img src={ProfileIcon} alt="" className={styles.navIcon} />
                </span>
                Выйти
              </button>
            </div>
          ) : (
            !isAuthPage && (
              <Link
                to={ROUTES.AUTH}
                className={styles.mobileLoginButton}
                onClick={handleNavLinkClick}
              >
                Войти
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
