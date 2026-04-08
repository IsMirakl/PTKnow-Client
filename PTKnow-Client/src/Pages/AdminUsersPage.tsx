import { useCallback, useEffect, useState } from 'react';

import Footer from '../Components/Footer';
import Header from '../Components/Header';
import { usersApi } from '../api';
import type { AdminUserDTO } from '../types/user';
import styles from '../styles/pages/AdminUsersPage.module.css';

const ROLE_OPTIONS = ['GUEST', 'STUDENT', 'TEACHER', 'ADMIN'] as const;
const STATUS_OPTIONS = ['ACTIVE', 'BLOCKED'] as const;
const PAGE_SIZE = 20;

const SORT_OPTIONS = [
  { value: 'registeredAt,desc', label: 'Сначала новые' },
  { value: 'registeredAt,asc', label: 'Сначала старые' },
  { value: 'email,asc', label: 'Email A-Z' },
  { value: 'role,asc', label: 'Роль A-Z' },
  { value: 'status,asc', label: 'Статус A-Z' },
] as const;

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserDTO[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('registeredAt,desc');
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await usersApi.getUsers({
        page,
        size: PAGE_SIZE,
        sort,
        q: submittedQuery || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(data.items);
      setHasNext(data.hasNext);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, sort, statusFilter, submittedQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const clearSaving = useCallback((userId: string) => {
    setSavingIds(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  }, []);

  const handleSelectUser = useCallback(async (userId: string) => {
    setDetailLoading(true);
    setError(null);

    try {
      const data = await usersApi.getUserById(userId);
      setSelectedUser(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Не удалось загрузить пользователя.'
      );
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleRoleChange = useCallback(
    async (user: AdminUserDTO, nextRole: string) => {
      if (user.role === nextRole) {
        return;
      }

      setSavingIds(prev => new Set(prev).add(user.id));
      setError(null);

      try {
        const updated = await usersApi.updateUserRole(user.id, { role: nextRole });
        setUsers(prev => prev.map(item => (item.id === updated.id ? updated : item)));
        setSelectedUser(prev => (prev?.id === updated.id ? updated : prev));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Не удалось обновить роль пользователя.'
        );
      } finally {
        clearSaving(user.id);
      }
    },
    [clearSaving]
  );

  const handleStatusChange = useCallback(
    async (user: AdminUserDTO, nextStatus: string) => {
      if (user.status === nextStatus) {
        return;
      }

      setSavingIds(prev => new Set(prev).add(user.id));
      setError(null);

      try {
        const updated = await usersApi.updateUserStatus(user.id, {
          status: nextStatus,
        });
        setUsers(prev => prev.map(item => (item.id === updated.id ? updated : item)));
        setSelectedUser(prev => (prev?.id === updated.id ? updated : prev));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Не удалось обновить статус пользователя.'
        );
      } finally {
        clearSaving(user.id);
      }
    },
    [clearSaving]
  );

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Управление пользователями</h1>
              <p className={styles.subtitle}>
                Используйте поиск, фильтры и меняйте роли и статусы пользователей.
              </p>
            </div>
            <button className={styles.refreshButton} onClick={fetchUsers} type="button">
              Обновить
            </button>
          </div>

          <form
            className={styles.filters}
            onSubmit={event => {
              event.preventDefault();
              setSubmittedQuery(searchQuery.trim());
              setPage(0);
            }}
          >
            <input
              className={styles.searchInput}
              type="search"
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Поиск по имени или email"
            />
            <select
              className={styles.filterSelect}
              value={roleFilter}
              onChange={event => {
                setRoleFilter(event.target.value);
                setPage(0);
              }}
            >
              <option value="">Все роли</option>
              {ROLE_OPTIONS.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={event => {
                setStatusFilter(event.target.value);
                setPage(0);
              }}
            >
              <option value="">Все статусы</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              className={styles.filterSelect}
              value={sort}
              onChange={event => {
                setSort(event.target.value);
                setPage(0);
              }}
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button className={styles.searchButton} type="submit">
              Найти
            </button>
          </form>

          {loading && <div className={styles.stateMessage}>Загрузка...</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.contentGrid}>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>Пользователь</span>
                <span>Handle</span>
                <span>Email</span>
                <span>Роль / статус</span>
              </div>

              {users.map(user => (
                <div key={user.id} className={styles.tableRow}>
                  <button
                    type="button"
                    className={styles.userInfoButton}
                    onClick={() => handleSelectUser(user.id)}
                  >
                    <div className={styles.userName}>{user.fullName}</div>
                    <div className={styles.userMeta}>ID: {user.id}</div>
                  </button>
                  <div className={styles.cellMuted}>{user.profileHandle}</div>
                  <div className={styles.cellMuted}>{user.email}</div>
                  <div>
                    <select
                      className={styles.roleSelect}
                      value={user.role}
                      onChange={event => handleRoleChange(user, event.target.value)}
                      disabled={savingIds.has(user.id)}
                    >
                      {ROLE_OPTIONS.map(role => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <select
                      className={styles.roleSelect}
                      value={user.status}
                      onChange={event => handleStatusChange(user, event.target.value)}
                      disabled={savingIds.has(user.id)}
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    {savingIds.has(user.id) && (
                      <span className={styles.savingHint}>Сохранение...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <aside className={styles.detailCard}>
              <div className={styles.detailTitle}>Карточка пользователя</div>
              {detailLoading && (
                <div className={styles.stateMessage}>Загрузка данных...</div>
              )}
              {!detailLoading && !selectedUser && (
                <div className={styles.detailEmpty}>
                  Выберите пользователя из списка, чтобы открыть детали.
                </div>
              )}
              {selectedUser && (
                <div className={styles.detailList}>
                  <div className={styles.detailItem}>
                    <span>Имя</span>
                    <strong>{selectedUser.fullName}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Email</span>
                    <strong>{selectedUser.email}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Handle</span>
                    <strong>{selectedUser.profileHandle || '—'}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Роль</span>
                    <strong>{selectedUser.role}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Статус</span>
                    <strong>{selectedUser.status}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Провайдер</span>
                    <strong>{selectedUser.authProvider}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <span>Дата регистрации</span>
                    <strong>{selectedUser.registeredAt}</strong>
                  </div>
                  <div className={styles.detailItem}>
                    <span>ID</span>
                    <strong className={styles.breakWord}>{selectedUser.id}</strong>
                  </div>
                </div>
              )}
            </aside>
          </div>

          <div className={styles.pagination}>
            <button
              className={styles.paginationButton}
              type="button"
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              disabled={page === 0 || loading}
            >
              Назад
            </button>
            <span className={styles.paginationInfo}>
              Страница {totalPages === 0 ? 0 : page + 1} из {Math.max(totalPages, 1)}
            </span>
            <button
              className={styles.paginationButton}
              type="button"
              onClick={() => setPage(prev => prev + 1)}
              disabled={!hasNext || loading}
            >
              Далее
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AdminUsersPage;
