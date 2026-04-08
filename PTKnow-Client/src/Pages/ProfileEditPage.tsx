import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import Footer from '../Components/Footer';
import Header from '../Components/Header';
import { useProfile } from '../hooks/useProfile';
import { getAvatarUrl } from '../utils/fileUtils';
import styles from '../styles/pages/ProfileEditPage.module.css';

const ProfileEditPage: React.FC = () => {
  const MAX_AVATAR_SIZE_MB = 5;
  const MAX_AVATAR_SIZE = MAX_AVATAR_SIZE_MB * 1024 * 1024;
  const MAX_AVATAR_UPLOAD_SIZE_MB = 1;
  const MAX_AVATAR_UPLOAD_SIZE = MAX_AVATAR_UPLOAD_SIZE_MB * 1024 * 1024;
  const MAX_AVATAR_DIMENSION = 512;
  const navigate = useNavigate();
  const {
    profile,
    loading,
    error,
    getMyProfile,
    replaceProfile,
    updateAvatar,
    clearError,
  } = useProfile();
  const [formData, setFormData] = useState({
    fullName: '',
    handle: '',
    summary: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const currentAvatarUrl = profile ? getAvatarUrl(profile) ?? undefined : undefined;

  useEffect(() => {
    getMyProfile();
  }, [getMyProfile]);

  useEffect(() => {
    if (!profile) return;
    setFormData({
      fullName: profile.fullName ?? '',
      handle: profile.handle ?? '',
      summary: profile.summary ?? '',
    });
  }, [profile]);

  useEffect(() => {
    if (!avatarPreview) return;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const handleChange = useCallback(
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const { name, value } = event.target;
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      clearError();
      setIsSubmitting(true);
      try {
        await replaceProfile({
          fullName: formData.fullName.trim(),
          handle: formData.handle.trim(),
          summary: formData.summary.trim(),
        });
        navigate('/profile');
      } finally {
        setIsSubmitting(false);
      }
    },
    [clearError, formData, navigate, replaceProfile]
  );

  const loadImage = useCallback((file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Не удалось прочитать изображение.'));
      };
      image.src = objectUrl;
    });
  }, []);

  const encodeCanvas = useCallback(
    (canvas: HTMLCanvasElement, type: string, quality: number) => {
      return new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, type, quality);
      });
    },
    []
  );

  const prepareAvatarFile = useCallback(
    async (file: File): Promise<File> => {
      const image = await loadImage(file);
      const { width, height } = image;
      const scale = Math.min(1, MAX_AVATAR_DIMENSION / Math.max(width, height));
      const targetWidth = Math.max(1, Math.round(width * scale));
      const targetHeight = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Ваш браузер не поддерживает обработку изображений.');
      }
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

      if (
        file.size <= MAX_AVATAR_UPLOAD_SIZE &&
        width === targetWidth &&
        height === targetHeight
      ) {
        return file;
      }

      const candidates = [
        { type: 'image/webp', quality: 0.85 },
        { type: 'image/jpeg', quality: 0.85 },
        { type: 'image/jpeg', quality: 0.75 },
        { type: 'image/jpeg', quality: 0.65 },
      ];

      let bestBlob: Blob | null = null;
      for (const candidate of candidates) {
        const blob = await encodeCanvas(canvas, candidate.type, candidate.quality);
        if (!blob) {
          continue;
        }
        bestBlob = blob;
        if (blob.size <= MAX_AVATAR_UPLOAD_SIZE) {
          break;
        }
      }

      if (!bestBlob) {
        throw new Error('Не удалось подготовить изображение.');
      }

      if (bestBlob.size > MAX_AVATAR_UPLOAD_SIZE) {
        throw new Error(
          `Не удалось уменьшить изображение до ${MAX_AVATAR_UPLOAD_SIZE_MB} МБ.`
        );
      }

      const extension = bestBlob.type === 'image/webp' ? 'webp' : 'jpg';
      return new File([bestBlob], `avatar.${extension}`, { type: bestBlob.type });
    },
    [
      MAX_AVATAR_DIMENSION,
      MAX_AVATAR_UPLOAD_SIZE,
      MAX_AVATAR_UPLOAD_SIZE_MB,
      encodeCanvas,
      loadImage,
    ]
  );

  const handleAvatarChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setAvatarError(null);
      if (!file.type.startsWith('image/')) {
        setAvatarError('Выберите изображение в формате PNG, JPG или WEBP.');
        event.target.value = '';
        return;
      }
      if (file.size > MAX_AVATAR_SIZE) {
        setAvatarError(
          `Размер файла не должен превышать ${MAX_AVATAR_SIZE_MB} МБ.`
        );
        event.target.value = '';
        return;
      }
      setIsAvatarUploading(true);
      clearError();
      try {
        const preparedFile = await prepareAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(preparedFile));
        await updateAvatar(preparedFile);
      } catch (uploadError) {
        const message =
          uploadError instanceof Error
            ? uploadError.message
            : 'Не удалось загрузить изображение.';
        setAvatarError(message);
        event.target.value = '';
      } finally {
        setIsAvatarUploading(false);
      }
    },
    [
      clearError,
      prepareAvatarFile,
      updateAvatar,
      MAX_AVATAR_SIZE,
      MAX_AVATAR_SIZE_MB,
    ]
  );

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h1 className={styles.title}>Редактирование профиля</h1>
              <p className={styles.subtitle}>
                Обновите имя, ник и описание для вашего профиля.
              </p>
            </div>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => navigate('/profile')}
            >
              Назад
            </button>
          </div>

          {loading && (
            <div className={styles.stateMessage}>Загрузка профиля...</div>
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.avatarBlock}>
              <div className={styles.avatarPreviewWrapper}>
                <img
                  src={avatarPreview || currentAvatarUrl}
                  alt="Аватар"
                  className={styles.avatarPreview}
                />
              </div>
              <label className={styles.avatarUpload}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={isAvatarUploading}
                />
                {isAvatarUploading ? 'Загрузка...' : 'Загрузить аватар'}
              </label>
              {avatarError && (
                <div className={styles.errorMessage}>{avatarError}</div>
              )}
            </div>

            <label className={styles.field}>
              <span>Полное имя</span>
              <input
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Иванов Иван"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Handle</span>
              <input
                name="handle"
                type="text"
                value={formData.handle}
                onChange={handleChange}
                placeholder="ivanov"
                required
              />
            </label>

            <label className={`${styles.field} ${styles.summaryField}`}>
              <span>О себе</span>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                placeholder="Коротко о себе и своих интересах"
                rows={5}
              />
            </label>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => navigate('/profile')}
              >
                Отменить
              </button>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProfileEditPage;
