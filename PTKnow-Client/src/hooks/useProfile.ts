import { useState, useCallback } from 'react';
import type { ProfileResponseDTO, ProfileUpdateDTO } from '../types/profile';
import { profileApi } from '../api';

export const useProfile = () => {
  const [profile, setProfile] = useState<ProfileResponseDTO | null>();
  const [profiles, setProfiles] = useState<ProfileResponseDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>();
  const [notFound, setNotFound] = useState(false);

  const getResponseStatus = (err: unknown) => {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const response = err as { response?: { status?: number } };
      return response.response?.status;
    }
    return undefined;
  };

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (typeof err === 'object' && err !== null && 'response' in err) {
      const response = err as {
        response?: { data?: { message?: string } | string; status?: number };
      };
      const status = response.response?.status;
      if (status === 409) {
        console.error('Profile fetch conflict (409):', response.response);
        return 'Ошибка сервера. Попробуйте позже.';
      }
      const data = response.response?.data;
      if (typeof data === 'string') {
        return status ? `${data} (${status})` : data;
      }
      if (
        data &&
        typeof data === 'object' &&
        'message' in data &&
        data.message
      ) {
        return status ? `${data.message} (${status})` : data.message;
      }
      return status ? `${fallback} (${status})` : fallback;
    }
    if (err instanceof Error) {
      return err.message || fallback;
    }
    return fallback;
  };

  const getMyProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await profileApi.getMyProfile();
      setProfile(data);
    } catch (err) {
      const message = getErrorMessage(err, 'Ошибка загрузки профиля');
      setError(message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const getProfileByHandle = useCallback(async (handle: string) => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const data = await profileApi.getProfileByHandle(handle);
      setProfile(data);
    } catch (err) {
      const status = getResponseStatus(err);
      if (status === 404) {
        setNotFound(true);
        setProfile(null);
        setError(null);
        return;
      }
      const message = getErrorMessage(err, 'Ошибка загрузки профиля');
      setError(message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAvatar = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const data = await profileApi.updateAvatar(file);
      setProfile(data);
    } catch (err) {
      const message = getErrorMessage(err, 'Ошибка обновления аватарки');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: ProfileUpdateDTO) => {
    setLoading(true);
    setError(null);

    try {
      const updatedProfile = await profileApi.updateProfile(data);
      setProfile(prev => (prev ? { ...prev, ...updatedProfile } : null));
      return updatedProfile;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ошибка обновления профиля';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const replaceProfile = useCallback(async (data: ProfileUpdateDTO) => {
    setLoading(true);
    setError(null);

    try {
      const updatedProfile = await profileApi.replaceProfile(data);
      setProfile(updatedProfile);
      return updatedProfile;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Ошибка обновления профиля';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProfiles = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await profileApi.searchProfiles(query.trim() || undefined);
      setProfiles(data);
      return data;
    } catch (err) {
      const message = getErrorMessage(err, 'Ошибка поиска профилей');
      setError(message);
      setProfiles([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    profile,
    profiles,
    loading,
    error,
    notFound,
    getMyProfile,
    getProfileByHandle,
    updateAvatar,
    updateProfile,
    replaceProfile,
    searchProfiles,
    clearError,
  };
};
