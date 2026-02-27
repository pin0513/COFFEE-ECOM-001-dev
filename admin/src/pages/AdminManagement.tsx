import { useEffect, useState } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, Space, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { apiClient } from '../config/api';

interface Admin {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admins');
      setAdmins(res.data || []);
    } catch {
      message.error('載入管理員列表失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleAdd = () => {
    setEditingAdmin(null);
    form.resetFields();
    form.setFieldsValue({ role: 'admin', isActive: true });
    setIsModalVisible(true);
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    form.setFieldsValue({ name: admin.name, role: admin.role, isActive: admin.isActive });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (editingAdmin) {
        await apiClient.put(`/admins/${editingAdmin.id}`, values);
        message.success('管理員已更新');
      } else {
        await apiClient.post('/admins', values);
        message.success('管理員已新增');
      }
      setIsModalVisible(false);
      fetchAdmins();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      message.error(e.response?.data?.message || '儲存失敗');
    }
  };

  const handleToggleActive = async (admin: Admin) => {
    try {
      await apiClient.put(`/admins/${admin.id}`, { isActive: !admin.isActive });
      message.success(`管理員已${admin.isActive ? '停用' : '啟用'}`);
      fetchAdmins();
    } catch {
      message.error('操作失敗');
    }
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: '角色', dataIndex: 'role', key: 'role', width: 100,
      render: (role: string) => <Tag color={role === 'superadmin' ? 'purple' : 'blue'}>{role}</Tag>,
    },
    {
      title: '狀態', dataIndex: 'isActive', key: 'isActive', width: 80,
      render: (val: boolean, record: Admin) => (
        <Switch size="small" checked={val} onChange={() => handleToggleActive(record)} />
      ),
    },
    {
      title: '建立時間', dataIndex: 'createdAt', key: 'createdAt', width: 160,
      render: (v: string) => new Date(v).toLocaleDateString('zh-TW'),
    },
    {
      title: '操作', key: 'action', width: 80,
      render: (_: unknown, record: Admin) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>編輯</Button>
      ),
    },
  ];

  return (
    <Card
      title="管理員管理"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增管理員</Button>}
    >
      <Table columns={columns} dataSource={admins} rowKey="id" loading={loading} pagination={false} />

      <Modal
        title={editingAdmin ? '編輯管理員' : '新增管理員'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!editingAdmin && (
            <Form.Item label="Email" name="email" rules={[
              { required: true, message: '請輸入 Email' },
              { type: 'email', message: '請輸入有效 Email' },
            ]}>
              <Input />
            </Form.Item>
          )}
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '請輸入姓名' }]}>
            <Input />
          </Form.Item>
          {!editingAdmin && (
            <Form.Item label="密碼" name="password" rules={[
              { required: true, message: '請輸入密碼' },
              { min: 6, message: '密碼至少 6 位' },
            ]}>
              <Input.Password />
            </Form.Item>
          )}
          {editingAdmin && (
            <Form.Item label="新密碼（留空不修改）" name="password">
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item label="角色" name="role">
            <Select options={[
              { label: '管理員', value: 'admin' },
              { label: '超級管理員', value: 'superadmin' },
            ]} />
          </Form.Item>
          {editingAdmin && (
            <Form.Item label="啟用" name="isActive" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setIsModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">儲存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
