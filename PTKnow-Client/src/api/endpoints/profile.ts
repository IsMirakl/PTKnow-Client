import type { ProfileResponseDTO, ProfileUpdateDTO } from '../../types/profile';
import { api } from '../axiosConfig';

export const profileApi = {
  getProfile: async (): Promise<ProfileResponseDTO> => {
    const response = await api.get('/v1/profile');
    return response.data;
  },
  getMyProfile: async (): Promise<ProfileResponseDTO> => {
    const response = await api.get('/v1/profile/me');
    return response.data;
  },
  getProfileByHandle: async (handle: string): Promise<ProfileResponseDTO> => {
    const response = await api.get(`/v1/profile/${handle}`);
    return response.data;
  },
  getProfileById: async (userId: string): Promise<ProfileResponseDTO> => {
    const response = await api.get(`/v1/profile/id/${userId}`);
    return response.data;
  },
  searchProfiles: async (
    q?: string,
    page = 0,
    size = 20,
    sort = 'fullName,asc'
  ): Promise<ProfileResponseDTO[]> => {
    const response = await api.get('/v1/profile/search', {
      params: { q, page, size, sort },
    });
    const payload = response.data as unknown;
    if (payload && typeof payload === 'object' && 'items' in payload) {
      const data = payload as { items?: ProfileResponseDTO[] };
      return Array.isArray(data.items) ? data.items : [];
    }
    return [];
  },
  updateAvatar: async (file: File): Promise<ProfileResponseDTO> => {
    const formData = new FormData();
    formData.append('file', file, file.name || 'avatar');

    const response = await api.post('/v1/profile/avatar', formData);
    return response.data;
  },
  deleteAvatar: async (): Promise<void> => {
    await api.delete('/v1/profile/avatar');
  },
  updateProfile: async (data: ProfileUpdateDTO): Promise<ProfileResponseDTO> => {
    const response = await api.patch('/v1/profile', data);
    return response.data;
  },
  replaceProfile: async (data: ProfileUpdateDTO): Promise<ProfileResponseDTO> => {
    const response = await api.put('/v1/profile', data);
    return response.data;
  },
};
