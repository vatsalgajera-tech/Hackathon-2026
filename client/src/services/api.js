import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 12000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach JWT ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vb_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: normalize errors ─────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network / server not reachable
    if (!error.response) {
      const networkErr = new Error(
        'Cannot connect to the server. Make sure the backend is running on port 5000.'
      );
      networkErr.isNetworkError = true;
      return Promise.reject(networkErr);
    }

    // 401 — token expired / invalid
    if (error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        localStorage.removeItem('vb_token');
        localStorage.removeItem('vb_user');
        window.location.href = '/login';
      }
    }

    // Pass the server error message through
    return Promise.reject(error);
  }
);

// Helper — extract the best human-readable message from any error
export const getErrorMessage = (err) => {
  if (err?.isNetworkError) return err.message;
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.message) return err.message;
  return 'Something went wrong. Please try again.';
};

export default api;
