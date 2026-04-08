import { useEffect } from 'react';

import styles from '../../../styles/components/ErrorModal.module.css';

interface ErrorModalProps {
  title?: string;
  message: string | null;
  isOpen: boolean;
  onClose: () => void;
  buttonLabel?: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  title = 'Что-то пошло не так',
  message,
  isOpen,
  onClose,
  buttonLabel = 'Понятно',
}) => {
  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !message) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="error-modal-title"
        onClick={event => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Закрыть сообщение"
        >
          ×
        </button>

        <div className={styles.iconWrap} aria-hidden="true">
          <span className={styles.icon}>!</span>
        </div>

        <h2 id="error-modal-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.message}>{message}</p>

        <button type="button" className={styles.actionButton} onClick={onClose}>
          {buttonLabel}
        </button>
      </div>
    </div>
  );
};
