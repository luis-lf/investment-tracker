import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token when implemented
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login when auth is implemented
          message.error('Session expired. Please login again.');
          // window.location.href = '/login';
          break;
        case 403:
          message.error('You do not have permission to perform this action.');
          break;
        case 404:
          message.error('Requested resource not found.');
          break;
        case 422:
        case 400:
          message.error(data.message || 'Invalid request data.');
          break;
        case 500:
          message.error('Server error. Please try again later.');
          break;
        default:
          message.error(data.message || 'An unexpected error occurred.');
      }
    } else if (error.request) {
      // Request was made but no response
      message.error('Network error. Please check your connection.');
    } else {
      // Something else happened
      message.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// Generic request wrapper
export const request = async <T>(
  config: AxiosRequestConfig
): Promise<T> => {
  const response = await api.request<T>(config);
  return response as unknown as T;
};

// Convenience methods
export const get = <T>(url: string, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: 'GET', url });

export const post = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
) => request<T>({ ...config, method: 'POST', url, data });

export const put = <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
) => request<T>({ ...config, method: 'PUT', url, data });

export const del = <T>(url: string, config?: AxiosRequestConfig) =>
  request<T>({ ...config, method: 'DELETE', url });

export default api;
