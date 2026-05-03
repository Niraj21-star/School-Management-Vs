import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://my-backend.onrender.com',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let hasEmittedUnauthorized = false;

export const resetUnauthorizedGuard = () => {
  hasEmittedUnauthorized = false;
};

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');

      if (!hasEmittedUnauthorized && typeof window !== 'undefined') {
        hasEmittedUnauthorized = true;
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    return Promise.reject(error);
  }
);

export default API;