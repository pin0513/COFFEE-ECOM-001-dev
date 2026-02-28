import { useEffect, useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Switch, Space, message, Popconfirm, Tag, Typography, Upload
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { apiClient } from '../config/api';

const { TextArea } = Input;
const { Title } = Typography;

interface Testimonial {
  id: number;
  content: string;
  authorName: string;
  rating: number;
  imageUrl?: string;
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
}

interface TestimonialForm {
  content: string;
  authorName: string;
  rating: number;
  imageUrl: string;
  isVisible: boolean;
  sortOrder: number;
}

export default function TestimonialManagement() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm<TestimonialForm>();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState('');

  const getImageSrc = (url: string | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = (apiClient.defaults.baseURL ?? '').replace(/\/api$/, '');
    return `${base}${url}`;
  };

  const handleAvatarUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    setAvatarUploading(true);
    const formData = new FormData();
    formData.append('file', file as File);
    try {
      const res = await apiClient.post<{ url: string }>('/uploads/testimonials', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.url;
      form.setFieldValue('imageUrl', url);
      setPreviewAvatar(url);
      onSuccess?.(res.data);
      message.success('頭像上傳成功');
    } catch {
      onError?.(new Error('上傳失敗'));
      message.error('頭像上傳失敗');
    } finally {
      setAvatarUploading(false);
    }
  };

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Testimonial[]>('/testimonials/all');
      setTestimonials(res.data || []);
    } catch {
      message.error('載入評價失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTestimonials(); }, []);

  const handleCreate = () => {
    form.resetFields();
    form.setFieldsValue({ rating: 5, isVisible: true, sortOrder: 0, imageUrl: '' });
    setPreviewAvatar('');
    setEditingId(null);
    setModalOpen(true);
  };

  const handleEdit = (record: Testimonial) => {
    form.setFieldsValue({
      content: record.content,
      authorName: record.authorName,
      rating: record.rating,
      imageUrl: record.imageUrl || '',
      isVisible: record.isVisible,
      sortOrder: record.sortOrder,
    });
    setPreviewAvatar(record.imageUrl || '');
    setEditingId(record.id);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/testimonials/${id}`);
      message.success('評價已刪除');
      fetchTestimonials();
    } catch {
      message.error('刪除失敗');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await apiClient.patch(`/testimonials/${id}/toggle`);
      fetchTestimonials();
    } catch {
      message.error('操作失敗');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await apiClient.put(`/testimonials/${editingId}`, values);
        message.success('評價已更新');
      } else {
        await apiClient.post('/testimonials', values);
        message.success('評價已新增');
      }
      setModalOpen(false);
      fetchTestimonials();
    } catch {
      message.error('儲存失敗');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: '頭像',
      dataIndex: 'imageUrl',
      width: 70,
      render: (url: string | undefined) => {
        const src = getImageSrc(url);
        return src
          ? <img src={src} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '50%' }} />
          : null;
      },
    },
    {
      title: '作者',
      dataIndex: 'authorName',
      width: 100,
    },
    {
      title: '星級',
      dataIndex: 'rating',
      width: 80,
      render: (rating: number) => '⭐'.repeat(rating),
    },
    {
      title: '內容',
      dataIndex: 'content',
      ellipsis: true,
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      width: 70,
    },
    {
      title: '顯示',
      dataIndex: 'isVisible',
      width: 80,
      render: (visible: boolean, record: Testimonial) => (
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
      render: (_: unknown, record: Testimonial) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="確定刪除？" onConfirm={() => handleDelete(record.id)} okText="確定" cancelText="取消">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>評價管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增評價</Button>
      </div>

      <Table
        columns={columns}
        dataSource={testimonials}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20 }}
        size="middle"
      />

      <Modal
        title={editingId ? '編輯評價' : '新增評價'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="儲存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="content" label="評價內容" rules={[{ required: true, message: '請輸入評價內容' }]}>
            <TextArea rows={3} placeholder="顧客評價內容..." />
          </Form.Item>
          <Form.Item name="authorName" label="作者" rules={[{ required: true, message: '請輸入作者名稱' }]}>
            <Input placeholder="如：李先生" />
          </Form.Item>
          <Form.Item name="imageUrl" label="顧客頭像" hidden>
            <Input />
          </Form.Item>
          <Form.Item label="上傳顧客頭像">
            <Space align="start">
              <Upload
                accept=".jpg,.jpeg,.png,.webp"
                showUploadList={false}
                customRequest={handleAvatarUpload}
              >
                <Button icon={avatarUploading ? <LoadingOutlined /> : <UploadOutlined />} disabled={avatarUploading}>
                  {avatarUploading ? '上傳中...' : '上傳頭像'}
                </Button>
              </Upload>
              {previewAvatar && getImageSrc(previewAvatar) && (
                <img
                  src={getImageSrc(previewAvatar)!}
                  alt="頭像預覽"
                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '50%', border: '1px solid #d9d9d9' }}
                />
              )}
            </Space>
          </Form.Item>
          <Form.Item name="rating" label="星級（1-5）" rules={[{ required: true }]}>
            <InputNumber min={1} max={5} style={{ width: '100%' }} />
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
