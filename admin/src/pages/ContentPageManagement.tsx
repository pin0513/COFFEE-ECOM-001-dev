import { useEffect, useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, InputNumber,
  Switch, Space, message, Tag, Tooltip,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { apiClient } from '../config/api';

interface ContentPage {
  id: number;
  slug: string;
  titleZhTW: string;
  bodyZhTW: string;
  isPublished: boolean;
  sortOrder: number;
  updatedAt: string | null;
}

export default function ContentPageManagement() {
  const [pages, setPages] = useState<ContentPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPage, setEditingPage] = useState<ContentPage | null>(null);
  const [form] = Form.useForm();

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/pages/all');
      setPages(res.data || []);
    } catch {
      message.error('載入內容頁失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleDelete = async (id: number, slug: string) => {
    Modal.confirm({
      title: '確認刪除',
      content: `確定要刪除「${slug}」頁面嗎？此操作無法復原。`,
      okType: 'danger',
      onOk: async () => {
        try {
          await apiClient.delete(`/pages/${id}`);
          message.success('頁面已刪除');
          fetchPages();
        } catch {
          message.error('刪除失敗');
        }
      },
    });
  };

  const openCreate = () => {
    setEditingPage(null);
    form.resetFields();
    form.setFieldsValue({ isPublished: true, sortOrder: 0 });
    setIsModalVisible(true);
  };

  const openEdit = (page: ContentPage) => {
    setEditingPage(page);
    form.setFieldsValue({
      slug: page.slug,
      titleZhTW: page.titleZhTW,
      bodyZhTW: page.bodyZhTW,
      isPublished: page.isPublished,
      sortOrder: page.sortOrder,
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingPage) {
        await apiClient.put(`/pages/${editingPage.id}`, {
          titleZhTW: values.titleZhTW,
          bodyZhTW: values.bodyZhTW,
          isPublished: values.isPublished,
          sortOrder: values.sortOrder,
        });
        message.success('內容頁已更新');
      } else {
        await apiClient.post('/pages', {
          slug: values.slug?.trim().toLowerCase(),
          titleZhTW: values.titleZhTW,
          bodyZhTW: values.bodyZhTW,
          isPublished: values.isPublished,
          sortOrder: values.sortOrder,
        });
        message.success('內容頁已新增');
      }
      setIsModalVisible(false);
      fetchPages();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('儲存失敗，請檢查欄位');
      }
    }
  };

  const webBaseUrl = import.meta.env.VITE_WEB_URL || 'http://localhost:5173';

  const columns = [
    { title: 'Slug（URL）', dataIndex: 'slug', key: 'slug',
      render: (slug: string) => (
        <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
          /pages/{slug}
        </code>
      )
    },
    { title: '頁面標題', dataIndex: 'titleZhTW', key: 'titleZhTW' },
    { title: '排序', dataIndex: 'sortOrder', key: 'sortOrder', width: 70 },
    {
      title: '狀態', dataIndex: 'isPublished', key: 'isPublished', width: 90,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '已發佈' : '草稿'}</Tag>,
    },
    {
      title: '最後更新', dataIndex: 'updatedAt', key: 'updatedAt', width: 160,
      render: (v: string | null) => v ? new Date(v).toLocaleString('zh-TW') : '—',
    },
    {
      title: '操作', key: 'action', width: 160,
      render: (_: unknown, record: ContentPage) => (
        <Space>
          <Tooltip title="前台預覽">
            <Button
              size="small" icon={<EyeOutlined />}
              onClick={() => window.open(`${webBaseUrl}/pages/${record.slug}`, '_blank')}
            />
          </Tooltip>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>編輯</Button>
          <Button
            size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, record.slug)}
          >刪除</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="靜態內容頁管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增頁面
        </Button>
      }
    >
      <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
        管理網站各靜態頁面（關於我們、常見問題、配送說明等）的內容。內容支援 Markdown 語法。
      </p>
      <Table
        columns={columns}
        dataSource={pages}
        loading={loading}
        rowKey="id"
        pagination={false}
      />

      <Modal
        title={editingPage ? `編輯頁面：${editingPage.slug}` : '新增內容頁'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={editingPage ? '儲存' : '新增'}
        cancelText="取消"
        width={800}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical">
          {!editingPage && (
            <Form.Item
              label="Slug（頁面 URL 識別碼，僅限英文小寫與連字號）"
              name="slug"
              rules={[
                { required: true, message: '請輸入 Slug' },
                { pattern: /^[a-z0-9-]+$/, message: '僅允許英文小寫、數字與連字號' },
              ]}
            >
              <Input prefix="/pages/" placeholder="例如：about、faq、shipping" />
            </Form.Item>
          )}

          {editingPage && (
            <Form.Item label="Slug">
              <code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: 4 }}>
                /pages/{editingPage.slug}
              </code>
            </Form.Item>
          )}

          <Form.Item
            label="頁面標題（中文）"
            name="titleZhTW"
            rules={[{ required: true, message: '請輸入頁面標題' }]}
          >
            <Input placeholder="例如：關於我們、常見問題" />
          </Form.Item>

          <Form.Item
            label="頁面內容（支援 Markdown 語法）"
            name="bodyZhTW"
            rules={[{ required: true, message: '請輸入頁面內容' }]}
          >
            <Input.TextArea
              rows={18}
              placeholder={`## 標題\n\n正文內容，支援 Markdown...\n\n- 清單項目 1\n- 清單項目 2\n\n**粗體** *斜體*`}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 24 }}>
            <Form.Item label="發佈狀態" name="isPublished" valuePropName="checked">
              <Switch checkedChildren="已發佈" unCheckedChildren="草稿" />
            </Form.Item>
            <Form.Item label="排序（越小越前）" name="sortOrder">
              <InputNumber min={0} max={999} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </Card>
  );
}
