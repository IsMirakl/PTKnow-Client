import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  timeout: 10000,
  withCredentials: true,
});

export type { AxiosRequestConfig } from 'axios';
