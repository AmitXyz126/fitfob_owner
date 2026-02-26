import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const apiInstance = axios.create({
 
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiInstance.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().user?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiInstance;
