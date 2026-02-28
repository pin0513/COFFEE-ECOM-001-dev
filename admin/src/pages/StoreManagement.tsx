import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Switch, Space, message, Popconfirm, Tag, Typography
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { apiClient } from '../config/api';

const { TextArea } = Input;
const { Title } = Typography;

interface Store {
  id: number;
  name: string;
  address: string;
  phone: string;
  businessHours: string;
  isVisible: boolean;
  sortOrder: number;
}

interface StoreForm {
  name: string;
  address: string;
  phone: string;
  businessHours: string;
  isVisible: boolean;
  sortOrder: number;
}

export default function StoreManagement() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm<StoreForm>();

  const fetchStores = async () => {
    setLoading(true);
    try {
      // 後台需要看全部（包含隱藏的），使用 /api/stores?all=true
      // 目前 API 公開端點只回傳 isVisible=true，這裡直接呼叫公開端點
      // Phase 3 可改為後台專用端點
      const res = await apiClient.get<Store[]>('/stores');
      setStores(res.data || []);
    } catch {
      message.error('載入門市失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({ isVisible: true, sortOrder: 0 });
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEdit = (record: Store) => {
    form.setFieldsValue({
      name: record.name,
      address: record.address,
      phone: record.phone,
      businessHours: record.businessHours,
      isVisible: record.isVisible,
      sortOrder: record.sortOrder,
    });
    setEditingId(record.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/stores/${id}`);
      message.success('門市已刪除');
      fetchStores();
    } catch {
      message.error('刪除失敗');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await apiClient.patch(`/stores/${id}/toggle`);
      fetchStores();
    } catch {
      message.error('操作失敗');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await apiClient.put(`/stores/${editingId}`, values);
        message.success('門市已更新');
      } else {
        await apiClient.post('/stores', values);
        message.success('門市已新增');
      }
      setModalOpen(false);
      fetchStores();
    } catch {
      message.error('儲存失敗');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '門市名稱', dataIndex: 'name', width: 150 },
    { title: '地址', dataIndex: 'address', ellipsis: true },
    { title: '電話', dataIndex: 'phone', width: 130 },
    {
      title: '營業時間',
      dataIndex: 'businessHours',
      width: 180,
      ellipsis: true,
    },
    { title: '排序', dataIndex: 'sortOrder', width: 70 },
    {
      title: '顯示',
      dataIndex: 'isVisible',
      width: 80,
      render: (visible: boolean, record: Store) => (
        <Switch
          checked={visible}
          onChange={() => handleToggle(record.id)}
          checkedChildren="顯示"
          unCheckedChildren="隱藏"
        />
      ),
    },
    {
      title: '狀態',
      dataIndex: 'isVisible',
      width: 80,
      render: (visible: boolean) => (
        <Tag color={visible ? 'green' : 'default'}>{visible ? '上架' : '下架'}</Tag>
      ),
    },
    {
      title: '操作',
      width: 120,
      render: (_: unknown, record: Store) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="確定刪除此門市？" onConfirm={() => handleDelete(record.id)} okText="確定" cancelText="取消">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>門市管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增門市</Button>
      </div>

      <Table
        columns={columns}
        dataSource={stores}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      <Modal
        title={editingId ? '編輯門市' : '新增門市'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="儲存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="門市名稱" rules={[{ required: true, message: '請輸入門市名稱' }]}>
            <Input placeholder="如：品皇咖啡 三重本店" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="新北市三重區..." />
          </Form.Item>
          <Form.Item name="phone" label="電話">
            <Input placeholder="02-2999-0000" />
          </Form.Item>
          <Form.Item name="businessHours" label="營業時間">
            <TextArea rows={2} placeholder="週一至週六 09:00–18:00" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序（數字越小越前）">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isVisible" label="是否顯示" valuePropName="checked">
            <Switch checkedChildren="顯示" unCheckedChildren="隱藏" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
