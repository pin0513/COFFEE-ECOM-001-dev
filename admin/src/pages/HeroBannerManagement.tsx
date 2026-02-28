import { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, InputNumber,
  Switch, Space, message, Upload, Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { apiClient } from '../config/api';

interface HeroBanner {
  id: number;
  title: string;
  subTitle: string | null;
  buttonText: string | null;
  buttonUrl: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function HeroBannerManagement() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [form] = Form.useForm();

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/hero-banners/all');
      setBanners(res.data || []);
    } catch {
      message.error('載入 Banner 失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleToggle = async (id: number) => {
    try {
      const res = await apiClient.patch(`/hero-banners/${id}/toggle`);
      setBanners(prev => prev.map(b => b.id === id ? { ...b, isActive: res.data.isActive } : b));
    } catch {
      message.error('更新失敗');
    }
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '確認刪除',
      content: '確定要刪除此 Banner？',
      onOk: async () => {
        try {
          await apiClient.delete(`/hero-banners/${id}`);
          message.success('Banner 已刪除');
          fetchBanners();
        } catch {
          message.error('刪除失敗');
        }
      },
    });
  };

  const handleEdit = (banner: HeroBanner) => {
    setEditingBanner(banner);
    setPreviewImageUrl(banner.imageUrl || null);
    form.setFieldsValue({
      title: banner.title,
      subTitle: banner.subTitle,
      buttonText: banner.buttonText,
      buttonUrl: banner.buttonUrl,
      imageUrl: banner.imageUrl,
      sortOrder: banner.sortOrder,
      isActive: banner.isActive,
    });
    setIsModalVisible(true);
  };

  const handleAdd = () => {
    setEditingBanner(null);
    setPreviewImageUrl(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, sortOrder: 0 });
    setIsModalVisible(true);
  };

  const getImageSrc = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const base = (apiClient.defaults.baseURL ?? '').replace(/\/api$/, '');
    return `${base}${url}`;
  };

  const handleImageUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    setImageUploading(true);
    const formData = new FormData();
    formData.append('file', file as File);
    try {
      const res = await apiClient.post('/uploads/banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url: string = res.data.url;
      form.setFieldValue('imageUrl', url);
      setPreviewImageUrl(url);
      onSuccess?.(res.data);
      message.success('圖片上傳成功');
    } catch {
      onError?.(new Error('上傳失敗'));
      message.error('圖片上傳失敗');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const payload = {
        title: values.title,
        subTitle: values.subTitle ?? '',
        buttonText: values.buttonText ?? '',
        buttonUrl: values.buttonUrl ?? '',
        imageUrl: values.imageUrl ?? '',
        sortOrder: values.sortOrder ?? 0,
        isActive: values.isActive ?? true,
      };
      if (editingBanner) {
        await apiClient.put(`/hero-banners/${editingBanner.id}`, payload);
        message.success('Banner 已更新');
      } else {
        await apiClient.post('/hero-banners', payload);
        message.success('Banner 已新增');
      }
      setIsModalVisible(false);
      fetchBanners();
    } catch {
      message.error('儲存失敗');
    }
  };

  const columns = [
    {
      title: '預覽',
      dataIndex: 'imageUrl',
      key: 'image',
      width: 120,
      render: (url: string | null) => {
        const src = getImageSrc(url);
        return src
          ? <img src={src} alt="banner" style={{ width: 100, height: 56, objectFit: 'cover', borderRadius: 4 }} />
          : <div style={{ width: 100, height: 56, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#bbb' }}>無圖</div>;
      },
    },
    { title: '標題', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '副標題',
      dataIndex: 'subTitle',
      key: 'subTitle',
      ellipsis: true,
      render: (v: string | null) => v || <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: 'CTA 按鈕',
      dataIndex: 'buttonText',
      key: 'buttonText',
      width: 120,
      render: (v: string | null) => v || <span style={{ color: '#bbb' }}>—</span>,
    },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 70 },
    {
      title: '狀態',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (val: boolean, record: HeroBanner) => (
        <Switch size="small" checked={val} onChange={() => handleToggle(record.id)} />
      ),
    },
    {
      title: '啟用狀態',
      dataIndex: 'isActive',
      key: 'isActiveTag',
      width: 80,
      render: (val: boolean) => <Tag color={val ? 'green' : 'red'}>{val ? '顯示' : '隱藏'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: unknown, record: HeroBanner) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>編輯</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>刪除</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Banner 管理（首頁輪播）"
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增 Banner</Button>}
    >
      <p style={{ color: '#666', marginBottom: 16, fontSize: 13 }}>
        管理首頁 Hero 輪播圖。拖曳排序數字決定顯示順序，支援 JPG / PNG / WebP / SVG 格式上傳。
      </p>
      <Table
        columns={columns}
        dataSource={banners}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingBanner ? '編輯 Banner' : '新增 Banner'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="主標題" name="title" rules={[{ required: true, message: '請輸入主標題' }]}>
            <Input placeholder="例：專業烘焙，極致品味" />
          </Form.Item>
          <Form.Item label="副標題" name="subTitle">
            <Input.TextArea rows={2} placeholder="留空不顯示" />
          </Form.Item>
          <Form.Item label="CTA 按鈕文字" name="buttonText">
            <Input placeholder="例：立即選購（留空不顯示按鈕）" />
          </Form.Item>
          <Form.Item label="CTA 按鈕連結" name="buttonUrl">
            <Input placeholder="例：/products（留空導向商品頁）" />
          </Form.Item>
          <Form.Item label="背景圖片 URL" name="imageUrl">
            <Input placeholder="上傳後自動填入，或手動輸入 URL" style={{ marginBottom: 8 }} />
          </Form.Item>
          <Form.Item label=" " colon={false} style={{ marginTop: -16 }}>
            <Space align="start">
              <Upload
                accept=".jpg,.jpeg,.png,.webp,.svg"
                showUploadList={false}
                customRequest={handleImageUpload}
              >
                <Button icon={imageUploading ? <LoadingOutlined /> : <UploadOutlined />} disabled={imageUploading}>
                  {imageUploading ? '上傳中...' : '上傳圖片 / SVG'}
                </Button>
              </Upload>
              {previewImageUrl && getImageSrc(previewImageUrl) && (
                <img
                  src={getImageSrc(previewImageUrl)!}
                  alt="預覽"
                  style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: 4, border: '1px solid #d9d9d9' }}
                />
              )}
            </Space>
          </Form.Item>
          <Space>
            <Form.Item label="排序" name="sortOrder" style={{ marginBottom: 0 }}>
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item label="顯示" name="isActive" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item style={{ marginTop: 16, marginBottom: 0 }}>
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
