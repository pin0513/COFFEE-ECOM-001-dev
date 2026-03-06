import { useState } from 'react';
import { Modal, Tabs, Form, Input, Button, Divider, message } from 'antd';
import { useCustomerAuthStore } from '../stores/customerAuthStore';
import type { CustomerProfile } from '../stores/customerAuthStore';
import { API_BASE_URL } from '../config/api';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const res = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '請求失敗');
  return data as T;
}

interface AuthResponse {
  token: string;
  customer: CustomerProfile;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { setAuth } = useCustomerAuthStore();
  const [activeTab, setActiveTab] = useState<string>('login');
  const [loading, setLoading] = useState(false);

  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();

  const handleLoginSuccess = (data: AuthResponse) => {
    setAuth(data.token, data.customer);
    message.success(`歡迎回來，${data.customer.name}！`);
    onClose();
  };

  const handleLogin = async (values: { phone: string; password: string }) => {
    setLoading(true);
    try {
      const data = await apiPost<AuthResponse>('/auth/customer/login', { phone: values.phone.trim(), password: values.password });
      handleLoginSuccess(data);
    } catch (err: unknown) {
      message.error((err as Error).message || '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { name: string; phone: string; password: string; botCode: string }) => {
    if (values.botCode !== '1234') {
      message.error('防機器人碼錯誤，請輸入正確的 4 位數字');
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ token: string; customer: AuthResponse['customer'] }>(
        '/auth/customer/register',
        { name: values.name, phone: values.phone.trim(), password: values.password }
      );
      handleLoginSuccess(res);
    } catch (err: unknown) {
      message.error((err as Error).message || '註冊失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleLineLogin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/customer/line-url`);
      const data = await res.json();
      window.location.href = data.url;
    } catch {
      message.error('LINE 登入初始化失敗');
    }
  };

  const socialButtons = (
    <div style={{ marginTop: 16 }}>
      <Divider plain>或使用社群帳號</Divider>
      <Button
        block
        onClick={handleLineLogin}
        style={{ background: '#06C755', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" style={{ marginRight: 6 }}>
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
        </svg>
        LINE 登入
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="會員登入 / 註冊"
      width={400}
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'login',
            label: '登入',
            children: (
              <>
                <Form form={loginForm} layout="vertical" onFinish={handleLogin} style={{ marginTop: 8 }}>
                  <Form.Item name="phone" label="手機號碼" rules={[{ required: true, message: '請輸入手機號碼' }]}>
                    <Input placeholder="0912345678" size="large" />
                  </Form.Item>
                  <Form.Item name="password" label="密碼" rules={[{ required: true, message: '請輸入密碼' }]}>
                    <Input.Password placeholder="請輸入密碼" size="large" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                      登入
                    </Button>
                  </Form.Item>
                </Form>
                {socialButtons}
              </>
            ),
          },
          {
            key: 'register',
            label: '註冊',
            children: (
              <>
                <Form form={registerForm} layout="vertical" onFinish={handleRegister} style={{ marginTop: 8 }}>
                  <Form.Item name="name" label="姓名" rules={[{ required: true, message: '請輸入姓名' }]}>
                    <Input placeholder="請輸入真實姓名" size="large" />
                  </Form.Item>
                  <Form.Item name="phone" label="手機號碼" rules={[{ required: true, message: '請輸入手機號碼' }]}>
                    <Input placeholder="0912345678" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="密碼"
                    rules={[{ required: true, min: 6, message: '密碼至少 6 個字元' }]}
                  >
                    <Input.Password placeholder="至少 6 個字元" size="large" />
                  </Form.Item>
                  <Form.Item
                    name="botCode"
                    label="防機器人碼"
                    rules={[{ required: true, message: '請輸入防機器人碼' }]}
                    extra="請輸入：1234"
                  >
                    <Input placeholder="4 位數字" size="large" maxLength={4} />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                      註冊
                    </Button>
                  </Form.Item>
                </Form>
                {socialButtons}
              </>
            ),
          },
        ]}
      />
    </Modal>
  );
}
