import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { useProfile } from '../hooks/useProfile';
import { getAvatarUrl } from '../utils/fileUtils';
import DefaultAvatar from '../assets/icons/profile.svg';
import styles from '../styles/pages/ProfileSearchPage.module.css';

const ProfileSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const { profiles, loading, error, searchProfiles } = useProfile();

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setHasSearched(true);
      await searchProfiles(query);
    },
    [query, searchProfiles]
  );

  return (
    <>
      <Header />
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.hero}>
            <h1 className={styles.title}>Поиск профилей</h1>
            <p className={styles.subtitle}>
              Найдите пользователя по имени или handle.
            </p>
          </div>

          <form className={styles.searchForm} onSubmit={handleSubmit}>
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              className={styles.searchInput}
              placeholder="Например: Иван Петров или ivanov"
            />
            <button type="submit" className={styles.searchButton}>
              {loading ? 'Поиск...' : 'Найти'}
            </button>
          </form>

          {error && <div className={styles.stateMessage}>{error}</div>}

          {!loading && hasSearched && profiles.length === 0 && !error && (
            <div className={styles.stateMessage}>Ничего не найдено.</div>
          )}

          <div className={styles.results}>
            {profiles.map(profile => (
              <Link
                key={profile.handle}
                to={`/profile/${profile.handle}`}
                className={styles.card}
              >
                <img
                  src={getAvatarUrl(profile) || DefaultAvatar}
                  alt={profile.fullName}
                  className={styles.avatar}
                />
                <div className={styles.cardBody}>
                  <div className={styles.name}>{profile.fullName}</div>
                  <div className={styles.handle}>@{profile.handle}</div>
                  {profile.summary?.trim() && (
                    <div className={styles.summary}>{profile.summary}</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ProfileSearchPage;
