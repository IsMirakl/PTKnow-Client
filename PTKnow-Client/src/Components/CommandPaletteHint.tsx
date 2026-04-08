import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import styles from '../styles/components/CommandPaletteHint.module.css';

const HINT_STORAGE_KEY = 'commandPaletteHintPending';

const CommandPaletteHint: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsVisible(false);
      return;
    }

    if (sessionStorage.getItem(HINT_STORAGE_KEY) !== 'true') {
      return;
    }

    setIsVisible(true);
    sessionStorage.removeItem(HINT_STORAGE_KEY);

    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [location.pathname, user]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.hint} role="status" aria-live="polite">
      <span className={styles.badge}>Ctrl + K</span>
      <span className={styles.text}>Открывает быстрый поиск по разделам и действиям</span>
      <button
        type="button"
        className={styles.closeButton}
        onClick={() => setIsVisible(false)}
        aria-label="Закрыть подсказку"
      >
        ×
      </button>
    </div>
  );
};

export default CommandPaletteHint;
