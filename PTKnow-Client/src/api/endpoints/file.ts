import { api } from '../axiosConfig';
import type { FileMetaDTO } from '../../types/CourseCard';

export const filesAPI = {
  getFile: async (fileId: string): Promise<Blob> => {
    const response = await api.get(`/v1/files/${String(fileId)}`, {
      responseType: 'blob',
    });
    return response.data;
  },
  getFileMeta: async (fileId: string): Promise<FileMetaDTO> => {
    const response = await api.get(`/v1/files/${String(fileId)}/meta`);
    return response.data;
  },
  deleteFile: async (fileId: string): Promise<void> => {
    await api.delete(`/v1/files/${String(fileId)}`);
  },
  getFileUrl: (fileId: string): string => {
    const baseUrl = api.defaults.baseURL ?? '';
    const normalizedBase = baseUrl.endsWith('/')
      ? baseUrl.slice(0, -1)
      : baseUrl;
    return `${normalizedBase}/v1/files/${String(fileId)}`;
  },
};
