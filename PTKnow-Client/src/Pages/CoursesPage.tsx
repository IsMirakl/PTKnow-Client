import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import Footer from '../Components/Footer';
import Header from '../Components/Header';
import { CourseList } from '../Components/CourseList';
import { Dropdown } from '../Components/ui/forms/Dropdown';
import { courseCardApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import { useMyEnrollments } from '../hooks/useMyEnrollments';
import type { CourseDTO } from '../types/CourseCard';
import styles from '../styles/pages/CoursesPage.module.css';

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'id,desc', label: 'Сначала новые' },
  { value: 'name,asc', label: 'По названию A-Z' },
  { value: 'name,desc', label: 'По названию Z-A' },
  { value: 'state,asc', label: 'По статусу' },
] as const;

const STATE_OPTIONS = [
  { value: '', label: 'Все статусы' },
  { value: 'PUBLISHED', label: 'Опубликованные' },
  { value: 'DRAFT', label: 'Черновики' },
  { value: 'ARCHIVED', label: 'Архивные' },
] as const;

const CoursesPage: React.FC = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [sort, setSort] = useState('id,desc');
  const [page, setPage] = useState(0);
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [suggestions, setSuggestions] = useState<CourseDTO[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const { enrolledCourses } = useMyEnrollments();
  const { user } = useAuth();

  const canFilterByState = user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const enrolledIds = useMemo(
    () => enrolledCourses.map(course => course.id),
    [enrolledCourses]
  );
  const showHandleAutocomplete =
    searchQuery.trim().startsWith('@') && searchQuery.trim().length > 1;

  useEffect(() => {
    if (!canFilterByState && selectedState) {
      setSelectedState('');
    }
  }, [canFilterByState, selectedState]);

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmittedQuery(searchQuery.trim());
      setPage(0);
      setSuggestions([]);
    },
    [searchQuery]
  );

  useEffect(() => {
    let cancelled = false;

    const loadCourses = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await courseCardApi.getAllCourses({
          page,
          size: PAGE_SIZE,
          sort,
          q: submittedQuery || undefined,
          state: canFilterByState ? selectedState || undefined : undefined,
        });

        if (cancelled) {
          return;
        }

        setCourses(response.items);
        setHasNext(response.hasNext);
        setTotalPages(response.totalPages);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Не удалось загрузить курсы.'
          );
          setCourses([]);
          setHasNext(false);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      cancelled = true;
    };
  }, [canFilterByState, page, selectedState, sort, submittedQuery]);

  useEffect(() => {
    if (!showHandleAutocomplete) {
      setSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }

    let cancelled = false;
    const query = searchQuery.trim();

    const timeoutId = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const response = await courseCardApi.getAllCourses({
          page: 0,
          size: 5,
          sort: 'name,asc',
          q: query,
          state: canFilterByState ? selectedState || undefined : undefined,
        });

        if (!cancelled) {
          setSuggestions(response.items);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
        }
      } finally {
        if (!cancelled) {
          setSuggestionsLoading(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [canFilterByState, searchQuery, selectedState, showHandleAutocomplete]);

  return (
    <>
      <Header />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.heroLabel}>Каталог курсов</p>
            <h1 className={styles.heroTitle}>Подберите направление для обучения</h1>
            <p className={styles.heroDescription}>
              Ищите курсы по названию или через @КороткоеИмя
            </p>
          </div>

          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
            <div className={styles.searchInputWrap}>
              <span className={styles.searchIcon} aria-hidden="true">
                ⌕
              </span>
              <input
                className={styles.searchInput}
                type="search"
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="Поиск по названию курса или @КороткоеИмя"
              />

              {showHandleAutocomplete && (
                <div className={styles.suggestions}>
                  {suggestionsLoading ? (
                    <div className={styles.suggestionState}>Поиск курсов...</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map(course => (
                      <Link
                        key={course.id}
                        to={`/course/${course.id}`}
                        className={styles.suggestionItem}
                        onClick={() => setSuggestions([])}
                      >
                        <span className={styles.suggestionName}>{course.name}</span>
                        <span className={styles.suggestionHandle}>@{course.handle}</span>
                      </Link>
                    ))
                  ) : (
                    <div className={styles.suggestionState}>
                      Совпадений по короткому имени не найдено
                    </div>
                  )}
                </div>
              )}
            </div>
            <button className={styles.searchButton} type="submit">
              Найти
            </button>
          </form>

          <div className={styles.controlsRow}>
            {canFilterByState && (
              <Dropdown
                className={styles.select}
                value={selectedState}
                options={STATE_OPTIONS.map(option => ({ ...option }))}
                onChange={value => {
                  setSelectedState(value);
                  setPage(0);
                }}
              />
            )}

            <Dropdown
              className={styles.select}
              value={sort}
              options={SORT_OPTIONS.map(option => ({ ...option }))}
              onChange={value => {
                setSort(value);
                setPage(0);
              }}
            />
          </div>
        </section>

        <section className={styles.catalogSection}>
          <CourseList
            key={`courses-${location.key}-${page}-${selectedState}-${sort}-${submittedQuery}`}
            courses={courses}
            isLoading={loading}
            error={error}
            showLoadMore={false}
            enrolledCourseIds={enrolledIds}
            emptyTitle="Курсы не найдены"
            emptyDescription="Попробуйте изменить поисковый запрос или параметры сортировки."
          />

          <div className={styles.pagination}>
            <button
              className={styles.paginationButton}
              type="button"
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              disabled={page === 0 || loading}
              aria-label="Предыдущая страница"
            >
              ←
            </button>
            <span className={styles.paginationInfo}>
              {totalPages === 0 ? '0 / 1' : `${page + 1} / ${Math.max(totalPages, 1)}`}
            </span>
            <button
              className={styles.paginationButton}
              type="button"
              onClick={() => setPage(prev => prev + 1)}
              disabled={!hasNext || loading}
              aria-label="Следующая страница"
            >
              →
            </button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default CoursesPage;
