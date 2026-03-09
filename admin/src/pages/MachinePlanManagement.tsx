import { useState, useEffect, useCallback } from 'react';
import { Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Switch, Space, message, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const API_URL = (import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:5000';

interface MachinePlan {
  id: number;
  name: string;
  category: string;
  description?: string;
  tag?: string;
  tagColor?: string;
  targetDesc?: string;
  badge?: string;
  depositNote?: string;
  monthlyPrice?: number;
  quarterlyPrice?: number;
  annualPrice?: number;
  depositAmount?: number;
  features?: string;
  isActive: boolean;
  sortOrder: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  office: '辦公室',
  cafe: '餐飲/咖啡廳',
  hotel: '飯店/星級',
};

const CATEGORY_COLORS: Record<string, string> = {
  office: 'blue',
  cafe: 'orange',
  hotel: 'gold',
};

function formatPrice(v?: number) {
  if (v == null) return '客製報價';
  return `NT$ ${v.toLocaleString()}`;
}

export default function MachinePlanManagement() {
  const token = localStorage.getItem('admin_token') || '';
  const [plans, setPlans] = useState<MachinePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModal, setEditModal] = useState<{ open: boolean; record?: MachinePlan }>({ open: false });
  const [form] = Form.useForm();

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/machine-plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPlans(data);
    } catch {
      message.error('載入失敗');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const openCreate = () => {
    setEditModal({ open: true });
    form.resetFields();
    form.setFieldsValue({ isActive: true, category: 'office', sortOrder: 0, tagColor: 'default' });
  };

  const openEdit = (record: MachinePlan) => {
    setEditModal({ open: true, record });
    let features: string[] = [];
    try { if (record.features) features = JSON.parse(record.features); } catch { /* ignore */ }
    form.setFieldsValue({
      name: record.name,
      category: record.category,
      description: record.description,
      tag: record.tag,
      tagColor: record.tagColor || 'default',
      targetDesc: record.targetDesc,
      badge: record.badge,
      depositNote: record.depositNote,
      monthlyPrice: record.monthlyPrice,
      quarterlyPrice: record.quarterlyPrice,
      annualPrice: record.annualPrice,
      depositAmount: record.depositAmount,
      featuresText: features.join('\n'),
      isActive: record.isActive,
      sortOrder: record.sortOrder,
    });
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const featuresArr = (values.featuresText || '')
      .split('\n').map((s: string) => s.trim()).filter(Boolean);
    const body = {
      name: values.name,
      category: values.category,
      description: values.description,
      tag: values.tag || null,
      tagColor: values.tagColor || null,
      targetDesc: values.targetDesc || null,
      badge: values.badge || null,
      depositNote: values.depositNote || null,
      monthlyPrice: values.monthlyPrice ?? null,
      quarterlyPrice: values.quarterlyPrice ?? null,
      annualPrice: values.annualPrice ?? null,
      depositAmount: values.depositAmount ?? null,
      features: JSON.stringify(featuresArr),
      isActive: values.isActive,
      sortOrder: values.sortOrder ?? 0,
    };
    const isEdit = !!editModal.record;
    const url = isEdit
      ? `${API_URL}/api/admin/machine-plans/${editModal.record!.id}`
      : `${API_URL}/api/admin/machine-plans`;
    await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    message.success(isEdit ? '已更新' : '已新增');
    setEditModal({ open: false });
    fetchPlans();
  };

  const toggleActive = async (id: number) => {
    await fetch(`${API_URL}/api/admin/machine-plans/${id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchPlans();
  };

  const columns: ColumnsType<MachinePlan> = [
    { title: '排序', dataIndex: 'sortOrder', width: 60, sorter: (a, b) => a.sortOrder - b.sortOrder },
    {
      title: '方案名稱', dataIndex: 'name', width: 150,
      render: (v, r) => <><div style={{ fontWeight: 600 }}>{v}</div><div style={{ fontSize: 12, color: '#888' }}>{r.description}</div></>,
    },
    {
      title: '類別', dataIndex: 'category', width: 110,
      render: (v: string) => <Tag color={CATEGORY_COLORS[v] || 'default'}>{CATEGORY_LABELS[v] || v}</Tag>,
    },
    { title: '月租費', dataIndex: 'monthlyPrice', width: 110, render: formatPrice },
    { title: '季租費', dataIndex: 'quarterlyPrice', width: 110, render: formatPrice },
    { title: '年租費', dataIndex: 'annualPrice', width: 110, render: formatPrice },
    { title: '押金', dataIndex: 'depositAmount', width: 100, render: formatPrice },
    {
      title: '狀態', dataIndex: 'isActive', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '啟用' : '停用'}</Tag>,
    },
    {
      title: '操作', width: 130, fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEdit(record)}>編輯</Button>
          <Popconfirm title={record.isActive ? '確定停用？' : '確定啟用？'} onConfirm={() => toggleActive(record.id)}>
            <Button size="small" danger={record.isActive}>{record.isActive ? '停用' : '啟用'}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0 }}>咖啡機方案管理</h2>
        <Button type="primary" style={{ marginLeft: 'auto' }} onClick={openCreate}>新增方案</Button>
        <Button onClick={fetchPlans}>重新整理</Button>
      </div>

      <Table
        columns={columns}
        dataSource={plans}
        rowKey="id"
        loading={loading}
        scroll={{ x: 900 }}
        pagination={false}
      />

      <Modal
        title={editModal.record ? '編輯方案' : '新增方案'}
        open={editModal.open}
        onCancel={() => setEditModal({ open: false })}
        onOk={handleSave}
        okText="儲存"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="name" label="方案名稱" rules={[{ required: true }]}>
              <Input placeholder="辦公室基本款" />
            </Form.Item>
            <Form.Item name="category" label="類別" rules={[{ required: true }]}>
              <Select options={Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            </Form.Item>
          </div>
          <Form.Item name="description" label="簡短說明">
            <Input placeholder="適合 10–30 人辦公室..." />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="tag" label="標籤文字">
              <Input placeholder="最受歡迎" />
            </Form.Item>
            <Form.Item name="tagColor" label="標籤顏色">
              <Select options={[
                { value: 'hot', label: '熱銷紅 (hot)' },
                { value: 'upgrade', label: '升級藍 (upgrade)' },
                { value: 'cafe', label: '咖啡廳綠 (cafe)' },
                { value: 'hotel', label: '飯店金 (hotel)' },
                { value: 'default', label: '預設灰 (default)' },
              ]} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="targetDesc" label="目標客群描述">
              <Input placeholder="10 ~ 30 人辦公室" />
            </Form.Item>
            <Form.Item name="badge" label="推薦 Badge（留空=不顯示）">
              <Input placeholder="推薦方案" />
            </Form.Item>
          </div>
          <Form.Item name="depositNote" label="押金說明">
            <Input placeholder="免押金 / 押金 NT$ 10,000 / 客製報價" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="monthlyPrice" label="月租費（NT$，留空=客製報價）">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="2800" />
            </Form.Item>
            <Form.Item name="quarterlyPrice" label="季租費（NT$）">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="7900" />
            </Form.Item>
            <Form.Item name="annualPrice" label="年租費（NT$）">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="28800" />
            </Form.Item>
            <Form.Item name="depositAmount" label="押金（NT$）">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="5000" />
            </Form.Item>
          </div>
          <Form.Item name="featuresText" label="方案特色（每行一項）">
            <Input.TextArea rows={4} placeholder={'全自動研磨沖煮\n每月 2 公斤精品豆\n定期保養維護'} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="sortOrder" label="排序（小在前）">
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="isActive" label="狀態" valuePropName="checked">
              <Switch checkedChildren="啟用" unCheckedChildren="停用" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
