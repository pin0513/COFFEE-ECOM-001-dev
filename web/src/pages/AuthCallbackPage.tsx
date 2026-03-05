import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import { useCustomerAuthStore } from '../stores/customerAuthStore';
import { API_BASE_URL } from '../config/api';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useCustomerAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      message.error(`登入失敗：${error}`);
      navigate('/');
      return;
    }

    if (!token) {
      navigate('/');
      return;
    }

    // 用 token 取得完整 profile
    fetch(`${API_BASE_URL}/customer/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(profile => {
        setAuth(token, profile);
        message.success(`歡迎，${profile.name}！`);
        const returnUrl = sessionStorage.getItem('returnUrl') || '/';
        sessionStorage.removeItem('returnUrl');
        navigate(returnUrl);
      })
      .catch(() => {
        message.error('登入驗證失敗，請重試');
        navigate('/');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <Spin size="large" tip="登入中..." />
    </div>
  );
}
