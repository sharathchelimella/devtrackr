/**
 * services/api.js – Axios Instance
 * Centralized HTTP client with interceptors for auth and error handling.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',                  // Uses VITE_API_URL if set (production), otherwise fallback to relative (development with Vite proxy)
  timeout: 30000,                // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor: Attach stored token ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('devtrackr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: Handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale token and redirect to login
      localStorage.removeItem('devtrackr_token');
      delete api.defaults.headers.common['Authorization'];
      // Only redirect if not already on auth page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
