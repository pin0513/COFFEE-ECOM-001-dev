import { useState, useEffect, useCallback } from 'react';
import {
  Table, Tag, Button, Modal, Form, Input, Select,
  Space, message, Descriptions, Timeline, Divider
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

const API_URL = (import.meta as { env: { VITE_API_URL?: string } }).env.VITE_API_URL || 'http://localhost:5000';

function fmtDate(d?: string | null, withTime = false) {
  if (!d) return '—';
  const dt = new Date(d);
  if (withTime) return dt.toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  return dt.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// Convert ISO date to yyyy-MM-dd for input[type=date]
function toDateInput(d?: string | null): string {
  if (!d) return '';
  return d.substring(0, 10);
}

interface MachinePlan { id: number; name: string; category: string; isActive: boolean; }

interface Subscription {
  id: number;
  contactName: string;
  phone: string;
  email?: string;
  company?: string;
  machinePlanId?: number;
  planName?: string;
  billingCycle: string;
  startDate?: string;
  renewalDate?: string;
  status: string;
  internalNotes?: string;
  changeHistory?: string;
  sourceInquiryId?: number;
  createdAt: string;
  updatedAt: string;
}

interface HistoryEntry { date: string; action: string; fromPlan?: string; toPlan?: string; note: string; }

const STATUS_COLORS: Record<string, string> = {
  pending: 'orange', active: 'green', suspended: 'red', cancelled: 'default',
};
const STATUS_LABELS: Record<string, string> = {
  pending: '待簽約', active: '租用中', suspended: '暫停', cancelled: '已結束',
};
const CYCLE_LABELS: Record<string, string> = {
  monthly: '月租', quarterly: '季租', annual: '年租',
};

export default function BusinessCrmManagement() {
  const token = localStorage.getItem('admin_token') || '';
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<MachinePlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState<number | undefined>(undefined);

  const [detailModal, setDetailModal] = useState(false);
  const [detailData, setDetailData] = useState<Subscription | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editForm] = Form.useForm();
  const [noteForm] = Form.useForm();
  const [noteLoading, setNoteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const [createModal, setCreateModal] = useState(false);
  const [createForm] = Form.useForm();

  const fetchPlans = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/admin/machine-plans`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPlans(data);
  }, [token]);

  const fetchSubs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', pageSize: '100' });
      if (filterStatus) params.set('status', filterStatus);
      if (filterPlan) params.set('planId', String(filterPlan));
      const res = await fetch(`${API_URL}/api/admin/subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubs(data.data || []);
      setTotal(data.totalCount || 0);
    } catch {
      message.error('載入失敗');
    } finally {
      setLoading(false);
    }
  }, [token, filterStatus, filterPlan]);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);
  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const openDetail = async (record: Subscription) => {
    setDetailModal(true);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${record.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Subscription = await res.json();
      setDetailData(data);
      editForm.setFieldsValue({
        machinePlanId: data.machinePlanId,
        billingCycle: data.billingCycle,
        status: data.status,
        startDate: toDateInput(data.startDate),
        renewalDate: toDateInput(data.renewalDate),
        internalNotes: data.internalNotes || '',
        historyNote: '',
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateSub = async () => {
    const values = editForm.getFieldsValue();
    if (!detailData) return;
    setEditLoading(true);
    try {
      await fetch(`${API_URL}/api/admin/subscriptions/${detailData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          machinePlanId: values.machinePlanId ?? null,
          billingCycle: values.billingCycle,
          status: values.status,
          startDate: values.startDate ? new Date(values.startDate).toISOString() : null,
          renewalDate: values.renewalDate ? new Date(values.renewalDate).toISOString() : null,
          internalNotes: values.internalNotes,
          historyNote: values.historyNote,
        }),
      });
      message.success('已更新');
      setDetailModal(false);
      fetchSubs();
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddNote = async () => {
    const values = noteForm.getFieldsValue();
    if (!values.note?.trim() || !detailData) return;
    setNoteLoading(true);
    try {
      await fetch(`${API_URL}/api/admin/subscriptions/${detailData.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note: values.note.trim() }),
      });
      message.success('備忘已記錄');
      noteForm.resetFields();
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${detailData.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDetailData(await res.json());
    } finally {
      setNoteLoading(false);
    }
  };

  const handleCreate = async () => {
    const values = await createForm.validateFields();
    await fetch(`${API_URL}/api/admin/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        contactName: values.contactName,
        phone: values.phone,
        email: values.email,
        company: values.company,
        machinePlanId: values.machinePlanId ?? null,
        billingCycle: values.billingCycle ?? 'monthly',
        status: 'pending',
        internalNotes: values.internalNotes,
      }),
    });
    message.success('客戶已建立');
    setCreateModal(false);
    createForm.resetFields();
    fetchSubs();
  };

  const parseHistory = (raw?: string | null): HistoryEntry[] => {
    try { return JSON.parse(raw || '[]'); } catch { return []; }
  };

  const activeCount = subs.filter(s => s.status === 'active').length;
  const pendingCount = subs.filter(s => s.status === 'pending').length;

  const columns: ColumnsType<Subscription> = [
    {
      title: '客戶',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.company || r.contactName}</div>
          {r.company && <div style={{ fontSize: 12, color: '#888' }}>{r.contactName}</div>}
        </div>
      ),
      width: 150,
    },
    { title: '電話', dataIndex: 'phone', width: 120, render: (v: string) => <a href={`tel:${v}`}>{v}</a> },
    {
      title: '方案', dataIndex: 'planName', width: 140,
      render: (v?: string) => v ? <Tag color="blue">{v}</Tag> : <span style={{ color: '#bbb' }}>—</span>,
    },
    {
      title: '計費', dataIndex: 'billingCycle', width: 80,
      render: (v: string) => CYCLE_LABELS[v] || v,
    },
    {
      title: '狀態', dataIndex: 'status', width: 90,
      render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{STATUS_LABELS[v] || v}</Tag>,
    },
    {
      title: '續約日', dataIndex: 'renewalDate', width: 110,
      render: (v?: string) => fmtDate(v),
    },
    {
      title: '操作', width: 80, fixed: 'right',
      render: (_, record) => <Button size="small" onClick={() => openDetail(record)}>詳情</Button>,
    },
  ];

  const history = parseHistory(detailData?.changeHistory);

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>
          商業客戶 CRM
          {activeCount > 0 && <Tag color="green" style={{ marginLeft: 8 }}>{activeCount} 租用中</Tag>}
          {pendingCount > 0 && <Tag color="orange" style={{ marginLeft: 8 }}>{pendingCount} 待簽約</Tag>}
        </h2>
        <Space wrap style={{ marginLeft: 'auto' }}>
          <Select
            placeholder="狀態篩選"
            allowClear
            style={{ width: 110 }}
            value={filterStatus || undefined}
            onChange={v => setFilterStatus(v || '')}
            options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <Select
            placeholder="方案篩選"
            allowClear
            style={{ width: 140 }}
            value={filterPlan}
            onChange={v => setFilterPlan(v)}
            options={plans.map(p => ({ value: p.id, label: p.name }))}
          />
          <Button onClick={fetchSubs}>重新整理</Button>
          <Button type="primary" onClick={() => { setCreateModal(true); createForm.resetFields(); createForm.setFieldsValue({ billingCycle: 'monthly' }); }}>新增客戶</Button>
        </Space>
      </div>

      <div style={{ marginBottom: 12, color: '#888', fontSize: 13 }}>共 {total} 筆</div>

      <Table
        columns={columns}
        dataSource={subs}
        rowKey="id"
        loading={loading}
        scroll={{ x: 800 }}
        pagination={{ total, pageSize: 100, showSizeChanger: false }}
        rowClassName={r => r.status === 'pending' ? 'crm-row-pending' : ''}
      />

      {/* 詳情 / 編輯 Modal */}
      <Modal
        title="客戶訂閱詳情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        onOk={handleUpdateSub}
        okText="儲存更新"
        cancelText="關閉"
        confirmLoading={editLoading}
        width={700}
      >
        {detailLoading && <div style={{ textAlign: 'center', padding: 32 }}>載入中…</div>}
        {detailData && !detailLoading && (
          <>
            <Descriptions size="small" bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="公司">{detailData.company || '—'}</Descriptions.Item>
              <Descriptions.Item label="聯絡人">{detailData.contactName}</Descriptions.Item>
              <Descriptions.Item label="電話"><a href={`tel:${detailData.phone}`}>{detailData.phone}</a></Descriptions.Item>
              <Descriptions.Item label="Email">{detailData.email || '—'}</Descriptions.Item>
              <Descriptions.Item label="建立日">{fmtDate(detailData.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="最後更新">{fmtDate(detailData.updatedAt, true)}</Descriptions.Item>
            </Descriptions>

            <Divider>方案 / 狀態</Divider>
            <Form form={editForm} layout="vertical">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Form.Item name="machinePlanId" label="目前方案（升/降級請說明原因）">
                  <Select
                    allowClear
                    placeholder="選擇方案"
                    options={plans.map(p => ({ value: p.id, label: p.name }))}
                  />
                </Form.Item>
                <Form.Item name="billingCycle" label="計費週期">
                  <Select options={Object.entries(CYCLE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
                </Form.Item>
                <Form.Item name="status" label="狀態">
                  <Select options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
                </Form.Item>
                <Form.Item name="historyNote" label="換方案/狀態說明">
                  <Input placeholder="客戶主動要求升級，電話確認完成" />
                </Form.Item>
                <Form.Item name="startDate" label="開始日期">
                  <Input type="date" />
                </Form.Item>
                <Form.Item name="renewalDate" label="續約日期">
                  <Input type="date" />
                </Form.Item>
              </div>
              <Form.Item name="internalNotes" label="內部備忘錄">
                <Input.TextArea rows={3} placeholder="長期客戶，信用良好，主動詢問擴廠..." />
              </Form.Item>
            </Form>

            <Divider>快速新增備忘</Divider>
            <Form form={noteForm} layout="inline" style={{ marginBottom: 16 }}>
              <Form.Item name="note" style={{ flex: 1 }}>
                <Input placeholder="記錄今日聯繫、合約更新、設備異常等..." />
              </Form.Item>
              <Form.Item>
                <Button loading={noteLoading} onClick={handleAddNote}>記錄</Button>
              </Form.Item>
            </Form>

            {history.length > 0 && (
              <>
                <Divider>異動歷史</Divider>
                <Timeline
                  items={[...history].reverse().map(h => ({
                    color: h.action === 'plan_change' ? 'blue' : 'gray',
                    children: (
                      <div style={{ fontSize: 13 }}>
                        <div style={{ color: '#888', fontSize: 12 }}>{fmtDate(h.date, true)}</div>
                        {h.action === 'plan_change'
                          ? <div><strong>方案異動：</strong>{h.fromPlan} → {h.toPlan}</div>
                          : <div><strong>備忘</strong></div>}
                        {h.note && <div style={{ color: '#555' }}>{h.note}</div>}
                      </div>
                    ),
                  }))}
                />
              </>
            )}
          </>
        )}
      </Modal>

      {/* 新增客戶 Modal */}
      <Modal
        title="新增商業客戶"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        onOk={handleCreate}
        okText="建立"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="company" label="公司 / 店名">
              <Input placeholder="品皇咖啡合作夥伴" />
            </Form.Item>
            <Form.Item name="contactName" label="聯絡人" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="電話" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input />
            </Form.Item>
            <Form.Item name="machinePlanId" label="方案">
              <Select allowClear placeholder="選擇方案" options={plans.map(p => ({ value: p.id, label: p.name }))} />
            </Form.Item>
            <Form.Item name="billingCycle" label="計費週期">
              <Select options={Object.entries(CYCLE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            </Form.Item>
          </div>
          <Form.Item name="internalNotes" label="備忘">
            <Input.TextArea rows={2} placeholder="由詢問單轉入，進行中..." />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`.crm-row-pending { background: #fffbe6; }`}</style>
    </div>
  );
}
