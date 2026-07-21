/**
 * Typed API client with automatic 401 token refresh.
 * Uses axios under the hood; tokens are stored in httpOnly cookies
 * (set by Next.js API routes, not directly readable by JS).
 */
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,  // send cookies with every request
  headers: { 'Content-Type': 'application/json' },
});

// ——— Request interceptor: attach access token from cookie-readable header ———
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // The access token is read from the server-set cookie via API Route /api/auth/token
  // In CSR context, we pass the token via a JS-readable short-lived storage approach.
  // The server-side token exchange is handled in Next.js Route Handlers.
  const token = typeof window !== 'undefined' ? sessionStorage.getItem('_at') : null;
  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ——— Response interceptor: refresh on 401 ———
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call Next.js route handler to refresh token (it has the httpOnly refresh token)
        const refreshResp = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken = refreshResp.data.access;
        sessionStorage.setItem('_at', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Refresh failed — redirect to login
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('_at');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
