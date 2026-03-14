import { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Select, Input, Button, Modal, Form, message, Tooltip, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const API_URL = (import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:5000';

interface Inquiry {
  id: number;
  contactName: string;
  phone: string;
  email?: string;
  company?: string;
  inquiryType: string;
  selectedPlan?: string;
  message?: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
  productName?: string;
  quantity?: number;
  preferredPeriod?: string;
}

const TYPE_LABELS: Record<string, string> = {
  'bulk': '大量採購',
  'hotel-restaurant': '飯店餐飲',
  'machine-rental': '咖啡機租賃',
  'general': '一般詢問',
};

const STATUS_COLORS: Record<string, string> = {
  'new': 'red',
  'contacted': 'blue',
  'closed': 'default',
};

const STATUS_LABELS: Record<string, string> = {
  'new': '未處理',
  'contacted': '已聯繫',
  'closed': '已結案',
};

export default function InquiryManagement() {
  const token = localStorage.getItem('admin_token') || '';
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [editModal, setEditModal] = useState<{ open: boolean; record?: Inquiry }>({ open: false });
  const [form] = Form.useForm();

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('type', filterType);
      const res = await fetch(`${API_URL}/api/admin/inquiries?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setInquiries(data.data || []);
      setTotal(data.totalCount || 0);
    } catch {
      message.error('載入失敗');
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus, filterType]);

  useEffect(() => { fetchInquiries(); }, [fetchInquiries]);

  const openEdit = (record: Inquiry) => {
    setEditModal({ open: true, record });
    form.setFieldsValue({ status: record.status, adminNote: record.adminNote || '' });
  };

  const handleSave = async () => {
    const values = form.getFieldsValue();
    if (!editModal.record) return;
    try {
      await fetch(`${API_URL}/api/admin/inquiries/${editModal.record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(values),
      });
      message.success('已更新');
      setEditModal({ open: false });
      fetchInquiries();
    } catch {
      message.error('更新失敗');
    }
  };

  const columns: ColumnsType<Inquiry> = [
    {
      title: '時間',
      dataIndex: 'createdAt',
      width: 150,
      render: (v: string) => new Date(v).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    },
    {
      title: '狀態',
      dataIndex: 'status',
      width: 90,
      render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{STATUS_LABELS[v] || v}</Tag>,
    },
    {
      title: '類型',
      dataIndex: 'inquiryType',
      width: 110,
      render: (v: string) => <Tag>{TYPE_LABELS[v] || v}</Tag>,
    },
    {
      title: '聯絡人',
      dataIndex: 'contactName',
      width: 100,
    },
    {
      title: '電話',
      dataIndex: 'phone',
      width: 120,
      render: (v: string) => <a href={`tel:${v}`}>{v}</a>,
    },
    {
      title: '公司 / 店名',
      dataIndex: 'company',
      width: 140,
      render: (v?: string) => v || '—',
    },
    {
      title: '有興趣方案',
      dataIndex: 'selectedPlan',
      width: 130,
      render: (v?: string) => v || '—',
    },
    {
      title: '商品',
      dataIndex: 'productName',
      width: 160,
      render: (v: string) => v || '-',
    },
    {
      title: '台數',
      dataIndex: 'quantity',
      width: 60,
      render: (v: number) => v || 1,
    },
    {
      title: '偏好期數',
      dataIndex: 'preferredPeriod',
      width: 80,
      render: (v: string) => v || '-',
    },
    {
      title: '需求說明',
      dataIndex: 'message',
      ellipsis: true,
      render: (v?: string) => v ? <Tooltip title={v}><span>{v}</span></Tooltip> : '—',
    },
    {
      title: '備註',
      dataIndex: 'adminNote',
      width: 120,
      render: (v?: string) => v ? <Tooltip title={v}><span style={{ color: '#888' }}>{v}</span></Tooltip> : '—',
    },
    {
      title: '操作',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button size="small" onClick={() => openEdit(record)}>處理</Button>
      ),
    },
  ];

  const newCount = inquiries.filter(i => i.status === 'new').length;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>
          商業詢問管理
          {newCount > 0 && <Tag color="red" style={{ marginLeft: 8 }}>{newCount} 筆未處理</Tag>}
        </h2>
        <Space wrap style={{ marginLeft: 'auto' }}>
          <Select
            placeholder="狀態篩選"
            allowClear
            style={{ width: 120 }}
            value={filterStatus || undefined}
            onChange={v => setFilterStatus(v || '')}
            options={[
              { value: 'new', label: '未處理' },
              { value: 'contacted', label: '已聯繫' },
              { value: 'closed', label: '已結案' },
            ]}
          />
          <Select
            placeholder="類型篩選"
            allowClear
            style={{ width: 130 }}
            value={filterType || undefined}
            onChange={v => setFilterType(v || '')}
            options={Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Button onClick={fetchInquiries}>重新整理</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={inquiries}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1100 }}
        pagination={{ total, pageSize: 100, showSizeChanger: false }}
        rowClassName={r => r.status === 'new' ? 'inquiry-row-new' : ''}
      />

      <Modal
        title="處理詢問單"
        open={editModal.open}
        onCancel={() => setEditModal({ open: false })}
        onOk={handleSave}
        okText="儲存"
        cancelText="取消"
      >
        {editModal.record && (
          <div style={{ marginBottom: 16, fontSize: 13, color: '#555', lineHeight: 1.7 }}>
            <div><strong>聯絡人：</strong>{editModal.record.contactName}</div>
            <div><strong>電話：</strong><a href={`tel:${editModal.record.phone}`}>{editModal.record.phone}</a></div>
            {editModal.record.email && <div><strong>Email：</strong>{editModal.record.email}</div>}
            {editModal.record.company && <div><strong>公司：</strong>{editModal.record.company}</div>}
            {editModal.record.productName && <div><strong>商品：</strong>{editModal.record.productName}</div>}
            {editModal.record.quantity && <div><strong>台數：</strong>{editModal.record.quantity}</div>}
            {editModal.record.preferredPeriod && <div><strong>偏好期數：</strong>{editModal.record.preferredPeriod} 個月</div>}
            {editModal.record.selectedPlan && <div><strong>有興趣方案：</strong>{editModal.record.selectedPlan}</div>}
            {editModal.record.message && (
              <div><strong>需求說明：</strong>
                <div style={{ background: '#f5f5f5', padding: '8px 12px', marginTop: 4, borderRadius: 4 }}>
                  {editModal.record.message}
                </div>
              </div>
            )}
          </div>
        )}
        <Form form={form} layout="vertical">
          <Form.Item name="status" label="狀態">
            <Select options={[
              { value: 'new', label: '未處理' },
              { value: 'contacted', label: '已聯繫' },
              { value: 'closed', label: '已結案' },
            ]} />
          </Form.Item>
          <Form.Item name="adminNote" label="內部備註">
            <Input.TextArea rows={3} placeholder="例如：已於 3/10 聯繫，對辦公室方案有興趣..." />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`.inquiry-row-new { background: #fff8f8; }`}</style>
    </div>
  );
}
