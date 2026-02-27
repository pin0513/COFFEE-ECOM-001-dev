import { useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Space, message } from 'antd';
import { CoffeeOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Paragraph } = Typography;

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await signIn(values.email, values.password);
      message.success('登入成功！');
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      if (err.response?.status === 401) {
        message.error('帳號或密碼錯誤');
      } else {
        message.error('登入失敗，請稍後再試');
      }
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card style={{ maxWidth: 420, width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <CoffeeOutlined style={{ fontSize: 64, color: '#1890ff' }} />
          <Title level={2} style={{ margin: 0 }}>品皇咖啡</Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>後台管理系統</Paragraph>
        </Space>

        <Form form={form} layout="vertical" onFinish={handleLogin} style={{ marginTop: 24 }}>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '請輸入 Email' },
              { type: 'email', message: '請輸入有效的 Email' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '請輸入密碼' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密碼" size="large" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" size="large" block>
              登入
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
