import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AdminLoginPage.css';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  // 如果已登入，跳轉至儀表板
  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  // 載入記住的帳號（如果有）
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  // 欄位驗證
  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case 'username':
        if (!value.trim()) return '請輸入帳號';
        return '';
      case 'password':
        if (!value.trim()) return '請輸入密碼';
        return '';
      default:
        return '';
    }
  };

  // onBlur 即時驗證
  const handleBlur = (fieldName: 'username' | 'password', value: string) => {
    const error = validateField(fieldName, value);
    setFieldErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  // 登入處理
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    // 驗證所有欄位
    const usernameError = validateField('username', username);
    const passwordError = validateField('password', password);

    if (usernameError || passwordError) {
      setFieldErrors({
        username: usernameError,
        password: passwordError,
      });
      return;
    }

    // 清除欄位錯誤
    setFieldErrors({});
    setIsLoading(true);

    try {
      // 模擬 API 請求延遲
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 此頁面為佔位頁面，實際管理後台請使用 /admin 專用入口
      const success = false;

      if (success) {
        // 處理「記住我」
        if (rememberMe) {
          localStorage.setItem('rememberedUsername', username);
        } else {
          localStorage.removeItem('rememberedUsername');
        }

        // 顯示成功 Toast
        showToast('success', '登入成功');

        // 跳轉至儀表板
        navigate('/admin');
      } else {
        // 登入失敗
        setErrorMessage('帳號或密碼錯誤，請檢查後重新嘗試');
        setPassword(''); // 清除密碼欄位
        setIsLoading(false);
      }
    } catch (error) {
      setErrorMessage('網路連線失敗，請檢查網路連線後重試');
      setIsLoading(false);
    }
  };

  // Toast 通知
  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string
  ) => {
    const toast = document.createElement('div');
    toast.className = `login-toast login-toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${
        type === 'success'
          ? '✓'
          : type === 'error'
          ? '✕'
          : type === 'warning'
          ? '⚠'
          : 'ℹ'
      }</span>
      <span class="toast-message">${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  };

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-card">
          {/* Logo */}
          <div className="logo">
            <img
              src="/assets/images/logo/logo-light-bg.svg"
              alt="品皇咖啡 Logo"
            />
          </div>

          {/* 標題 */}
          <h1 className="login-title">後台管理系統</h1>
          <p className="login-subtitle">ADMIN PORTAL</p>

          <div className="divider"></div>

          {/* 錯誤訊息（卡片內顯示） */}
          {errorMessage && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 登入表單 */}
          <form onSubmit={handleSubmit}>
            {/* 帳號輸入框 */}
            <div className="form-group">
              <label htmlFor="username">帳號</label>
              <input
                id="username"
                type="text"
                placeholder="請輸入帳號"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={(e) => handleBlur('username', e.target.value)}
                className={fieldErrors.username ? 'error' : ''}
                autoComplete="username"
              />
              {fieldErrors.username && (
                <span className="field-error">{fieldErrors.username}</span>
              )}
            </div>

            {/* 密碼輸入框 */}
            <div className="form-group">
              <label htmlFor="password">密碼</label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={(e) => handleBlur('password', e.target.value)}
                  className={fieldErrors.password ? 'error' : ''}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="field-error">{fieldErrors.password}</span>
              )}
            </div>

            {/* 記住我 */}
            <div className="form-group-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">記住我</span>
              </label>
            </div>

            {/* 登入按鈕 */}
            <button
              type="submit"
              className="btn-login"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  登入中...
                </>
              ) : (
                '登入 Login'
              )}
            </button>
          </form>

          {/* 忘記密碼連結 */}
          <a
            href="#"
            className="forgot-password"
            onClick={(e) => {
              e.preventDefault();
              alert('忘記密碼功能尚未實作');
            }}
          >
            忘記密碼？
          </a>
        </div>
      </div>
    </div>
  );
}
