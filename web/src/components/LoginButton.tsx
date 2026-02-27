import { Button, message } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

export const LoginButton = () => {
  const { signInWithGoogle } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      message.success('登入成功！');
    } catch (error) {
      message.error('登入失敗，請稍後再試');
      console.error('Login error:', error);
    }
  };

  return (
    <Button
      type="primary"
      icon={<GoogleOutlined />}
      onClick={handleLogin}
      size="large"
    >
      使用 Google 登入
    </Button>
  );
};
