import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

export const attachApiLogging = (instance: AxiosInstance, tag: string = 'API') => {
  instance.interceptors.request.use(
    (config) => {
      (config as any).__startTime = Date.now();
      const method = (config.method || 'GET').toUpperCase();
      const fullUrl = `${config.baseURL || ''}${config.url || ''}`;

      console.log(`\n🚀 [${tag} HIT] -----------------------------------------`);
      console.log(`📡 URL:    ${method} ${fullUrl}`);
      if (config.params && Object.keys(config.params).length > 0) {
        console.log(`🔍 PARAMS:`, JSON.stringify(config.params, null, 2));
      }
      if (config.data) {
        if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
          console.log(`📤 BODY:   [FormData Payload]`);
        } else {
          try {
            console.log(`📤 BODY:  `, typeof config.data === 'string' ? config.data : JSON.stringify(config.data, null, 2));
          } catch {
            console.log(`📤 BODY:  `, config.data);
          }
        }
      }
      console.log(`---------------------------------------------------------\n`);

      return config;
    },
    (error) => {
      console.log(`❌ [${tag} REQUEST ERROR]:`, error.message);
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => {
      const startTime = (response.config as any)?.__startTime;
      const duration = startTime ? `(${Date.now() - startTime}ms)` : '';
      const method = (response.config.method || 'GET').toUpperCase();
      const url = response.config.url;

      console.log(`\n✅ [${tag} RESPONSE ${response.status}] ${duration} -----------------`);
      console.log(`📡 URL:    ${method} ${url}`);
      try {
        console.log(`📦 DATA:  `, JSON.stringify(response.data, null, 2));
      } catch {
        console.log(`📦 DATA:  `, response.data);
      }
      console.log(`---------------------------------------------------------\n`);

      return response;
    },
    (error) => {
      const startTime = (error.config as any)?.__startTime;
      const duration = startTime ? `(${Date.now() - startTime}ms)` : '';
      const method = (error.config?.method || 'REQUEST').toUpperCase();
      const url = error.config?.url || 'unknown';
      const status = error.response?.status ? `[STATUS ${error.response.status}]` : '[NO RESPONSE / NETWORK ERROR]';

      console.log(`\n❌ [${tag} ERROR ${status}] ${duration} ----------------`);
      console.log(`📡 URL:    ${method} ${url}`);
      console.log(`⚠️ MSG:    ${error.message}`);
      if (error.response?.data) {
        try {
          console.log(`📦 DATA:  `, JSON.stringify(error.response.data, null, 2));
        } catch {
          console.log(`📦 DATA:  `, error.response.data);
        }
      }
      console.log(`---------------------------------------------------------\n`);

      return Promise.reject(error);
    }
  );
};

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

attachApiLogging(apiInstance, 'API');

export default apiInstance;

