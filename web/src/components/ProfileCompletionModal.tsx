import { Modal, Form, Input, Button, message } from 'antd';
import { useState } from 'react';
import { useCustomerAuthStore } from '../stores/customerAuthStore';
import { API_BASE_URL } from '../config/api';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProfileCompletionModal({ open, onClose }: Props) {
  const { token, updateProfile } = useCustomerAuthStore();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: { name: string; phone: string; address: string }) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/customer/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '更新失敗');
      updateProfile({ ...values, isProfileComplete: true });
      message.success('個人資料已儲存');
      onClose();
    } catch (err: unknown) {
      message.error((err as Error).message || '儲存失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={null}
      title="完善個人資料"
      width={400}
    >
      <p style={{ color: '#666', marginBottom: 16 }}>
        為了提供更好的購物體驗，請填寫以下基本資料。
      </p>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="name" label="姓名" rules={[{ required: true, message: '請輸入姓名' }]}>
          <Input placeholder="請輸入真實姓名" size="large" />
        </Form.Item>
        <Form.Item name="phone" label="聯絡電話" rules={[{ required: true, message: '請輸入電話' }]}>
          <Input placeholder="09XX-XXX-XXX" size="large" />
        </Form.Item>
        <Form.Item name="address" label="常用收件地址" rules={[{ required: true, message: '請輸入地址' }]}>
          <Input.TextArea placeholder="縣市 + 詳細地址" rows={2} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={loading}>
            儲存並繼續
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
