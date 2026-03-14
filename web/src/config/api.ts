import axios from 'axios';

// API Base URL（開發環境）
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// 檢查是否為 Demo 模式
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

// Axios Instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 圖片 URL 轉換（/uploads/... → 帶有 API host 的完整 URL）
const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || API_BASE_URL.replace(/\/api$/, '');
export const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${IMAGE_BASE_URL}${url}`;
};

// Demo 模式：安裝 Mock API Adapter（需要等待頁面載入完成）
if (isDemoMode) {
  // 延遲載入 Mock API（避免循環依賴）
  setTimeout(() => {
    import('../mocks/mockApi').then(({ installMockAdapter }) => {
      installMockAdapter(apiClient);
      console.log('🎭 Demo 模式：使用 Mock API');
    });
  }, 0);
} else {
  // 正式模式：使用真實 API

  // Request Interceptor
  apiClient.interceptors.request.use(
    (config) => {
      // 可以在這裡加入 token
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

  // Response Interceptor
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token 過期，重新登入
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}
