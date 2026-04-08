import { api } from '../axiosConfig';
import type {
  AdminUserDTO,
  UpdateUserRoleDTO,
  UpdateUserStatusDTO,
} from '../../types/user';
import type { PageResponseDTO } from '../../types/common';

export interface UsersListParams {
  page?: number;
  size?: number;
  sort?: string;
  q?: string;
  role?: string;
  status?: string;
}

export const usersApi = {
  getUsers: async (
    params?: UsersListParams
  ): Promise<PageResponseDTO<AdminUserDTO>> => {
    const response = await api.get('/v1/users', {
      params,
    });
    const payload = response.data as Partial<PageResponseDTO<AdminUserDTO>>;

    return {
      items: Array.isArray(payload.items) ? payload.items : [],
      page: typeof payload.page === 'number' ? payload.page : params?.page ?? 0,
      size: typeof payload.size === 'number' ? payload.size : params?.size ?? 20,
      totalItems:
        typeof payload.totalItems === 'number'
          ? payload.totalItems
          : Array.isArray(payload.items)
            ? payload.items.length
            : 0,
      totalPages:
        typeof payload.totalPages === 'number'
          ? payload.totalPages
          : Array.isArray(payload.items) && payload.items.length > 0
            ? 1
            : 0,
      hasNext: Boolean(payload.hasNext),
    };
  },
  getUserById: async (id: string): Promise<AdminUserDTO> => {
    const response = await api.get(`/v1/users/${id}`);
    return response.data;
  },
  updateUserStatus: async (
    id: string,
    data: UpdateUserStatusDTO
  ): Promise<AdminUserDTO> => {
    const response = await api.patch(`/v1/users/${id}/status`, data);
    return response.data;
  },
  updateUserRole: async (
    id: string,
    data: UpdateUserRoleDTO
  ): Promise<AdminUserDTO> => {
    const response = await api.patch(`/v1/users/${id}/role`, data);
    return response.data;
  },
};
