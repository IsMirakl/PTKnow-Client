import { memo, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

import { filesAPI } from '../../../api/endpoints/file';
import { useLesson } from '../../../hooks/useLessons';
import { useLessonStore } from '../../../stores/scheduleStore';
import type { LessonDTO } from '../../../types/lesson';
import { formatFullDate, formatTime } from '../../../utils/dateUtils';
import styles from '../../../styles/components/LessonCard.module.css';

interface Props {
  lesson: LessonDTO;
  canManageLessons?: boolean;
}

const LessonCardComponent = ({ lesson, canManageLessons = false }: Props) => {
  const { selectedDate } = useLessonStore();
  const { deleteLesson } = useLesson();
  const navigate = useNavigate();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [markdownText, setMarkdownText] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const begin = useMemo(() => new Date(lesson.beginAt), [lesson.beginAt]);
  const end = useMemo(() => new Date(lesson.endsAt), [lesson.endsAt]);
  const date = useMemo(() => new Date(selectedDate), [selectedDate]);
  const markdownMaterial = useMemo(() => {
    const materials = Array.isArray(lesson.materials) ? lesson.materials : [];
    return materials.find(material => {
      const fileName = material.originalFilename?.toLowerCase() ?? '';
      const contentType = material.contentType?.toLowerCase() ?? '';
      return (
        contentType.includes('markdown') ||
        fileName.endsWith('.md') ||
        fileName.endsWith('.markdown')
      );
    });
  }, [lesson.materials]);

  const hasMarkdownPreview = !!lesson.contentMd?.trim() || !!markdownMaterial;

  const handleDelete = async () => {
    if (deleteLoading) {
      return;
    }
    const confirmed = window.confirm('Удалить урок?');
    if (!confirmed) {
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteLesson(lesson.id);
    } catch (error) {
      console.error('Ошибка удаления урока:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePreviewToggle = async () => {
    if (!hasMarkdownPreview) {
      return;
    }

    if (isPreviewOpen) {
      setIsPreviewOpen(false);
      return;
    }

    setPreviewError(null);
    setIsPreviewOpen(true);

    if (markdownText) {
      return;
    }

    if (lesson.contentMd?.trim()) {
      setMarkdownText(lesson.contentMd);
      return;
    }

    if (!markdownMaterial) {
      setPreviewError('Markdown-файл не найден.');
      return;
    }

    setPreviewLoading(true);
    try {
      const blob = await filesAPI.getFile(markdownMaterial.id);
      const text = await blob.text();
      setMarkdownText(text);
    } catch (error) {
      console.error('Ошибка загрузки markdown файла:', error);
      setPreviewError('Не удалось загрузить markdown файл.');
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <p className={styles.date}>{formatFullDate(date)}</p>

      <div className={styles.card}>
        <div className={styles.left}>
          <div className={styles.topRow}>
            <span className={styles.typeBadge}>{lesson.type}</span>
            <span className={styles.stateBadge}>{lesson.state}</span>
          </div>
          <h3 className={styles.title}>{lesson.name}</h3>
          <p className={styles.description}>{lesson.description}</p>
          <Link
            to={`/courses/${lesson.courseId}/lessons/${lesson.id}`}
            className={styles.openLink}
          >
            Открыть страницу урока
          </Link>
        </div>

        <div className={styles.metaColumn}>
          <div className={styles.time}>
            {formatTime(begin)}-{formatTime(end)}
          </div>
          <div className={styles.actions}>
            {hasMarkdownPreview && (
              <button
                type="button"
                className={styles.previewButton}
                onClick={handlePreviewToggle}
                disabled={previewLoading}
              >
                {previewLoading
                  ? 'Загрузка...'
                  : isPreviewOpen
                    ? 'Скрыть'
                    : 'Быстрый просмотр'}
              </button>
            )}
            {canManageLessons && (
              <>
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() =>
                    navigate(`/courses/${lesson.courseId}/lessons/${lesson.id}/edit`)
                  }
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={handleDelete}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Удаление...' : 'Удалить'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {isPreviewOpen && hasMarkdownPreview && (
        <div className={styles.preview}>
          {previewError && (
            <div className={styles.previewError}>{previewError}</div>
          )}
          {!previewError && markdownText && (
            <ReactMarkdown>{markdownText}</ReactMarkdown>
          )}
        </div>
      )}
    </div>
  );
};

export const LessonCard = memo(LessonCardComponent);
