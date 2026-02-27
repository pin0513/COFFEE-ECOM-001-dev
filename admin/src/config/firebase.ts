import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// 檢查是否為 Demo 模式
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

// Firebase 設定 - 從環境變數讀取
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 初始化 Firebase（如果不是 Demo 模式）
let app: ReturnType<typeof initializeApp> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (!isDemoMode) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
    console.log('✅ Firebase 初始化成功');
  } catch (error) {
    console.warn('⚠️ Firebase 初始化失敗，使用 Demo 模式', error);
  }
} else {
  console.log('🎭 Demo 模式：不使用 Firebase 認證');
}

export { auth, googleProvider };

// 允許的管理員 Email（可選功能）
const ALLOWED_ADMIN_EMAILS = import.meta.env.VITE_ALLOWED_ADMIN_EMAILS?.split(',') || [];

export const isAllowedAdmin = (email: string | null): boolean => {
  if (isDemoMode) return true; // Demo 模式：允許所有人
  if (!email) return false;
  if (ALLOWED_ADMIN_EMAILS.length === 0) return true; // 如果沒有設定白名單，允許所有人
  return ALLOWED_ADMIN_EMAILS.includes(email);
};
