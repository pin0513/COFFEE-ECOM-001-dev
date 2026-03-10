import { useEffect, useState } from 'react';
import { Table, Tag, Typography, Button, Modal, Descriptions, Divider, Empty, Spin, Alert, message, Popconfirm } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuthStore } from '../stores/customerAuthStore';
import { API_BASE_URL } from '../config/api';

const { Title, Text } = Typography;

interface OrderItem {
  productId: number;
  productName: string;
  productSku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  recipientName: string;
  shippingAddress: string;
  orderDate: string;
  createdAt: string;
  itemCount: number;
}

interface OrderDetail extends Order {
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  recipientPhone: string;
  notes: string;
  transferCode: string;
  items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  Pending:    { label: '待確認', color: 'orange' },
  Confirmed:  { label: '已確認', color: 'blue' },
  Processing: { label: '處理中', color: 'geekblue' },
  Shipped:    { label: '已出貨', color: 'cyan' },
  Delivered:  { label: '已到貨', color: 'green' },
  Cancelled:  { label: '已取消', color: 'red' },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  Unpaid:  { label: '待付款', color: 'orange' },
  Paid:    { label: '已付款', color: 'green' },
  Refunded:{ label: '已退款', color: 'red' },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  BankTransfer:    '銀行轉帳',
  CashOnDelivery:  '貨到付款',
  ECPay:           '線上付款（綠界）',
  LinePay:         'LINE Pay',
};

export default function MyOrdersPage() {
  const { token, isLoggedIn } = useCustomerAuthStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = () => {
    fetch(`${API_BASE_URL}/customer/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setOrders(d.data ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!isLoggedIn) { navigate('/'); return; }
    fetchOrders();
    setLoading(false);
  }, [isLoggedIn, token, navigate]);

  const openDetail = async (id: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/customer/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      setDetail(d);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!detail) return;
    setActionLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/customer/orders/${detail.id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (!r.ok) { message.error(d.message); return; }
      message.success('訂單已取消');
      setDetailOpen(false);
      fetchOrders();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRepay = async () => {
    if (!detail) return;
    setActionLoading(true);
    try {
      if (detail.paymentMethod === 'ECPay') {
        const r = await fetch(`${API_BASE_URL}/payment/ecpay/checkout?orderId=${detail.id}`, { method: 'POST' });
        const html = await r.text();
        const div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div);
        const form = div.querySelector('form');
        if (form) form.submit();
      } else if (detail.paymentMethod === 'LinePay') {
        const r = await fetch(`${API_BASE_URL}/payment/linepay/request?orderId=${detail.id}`, { method: 'POST' });
        const d = await r.json();
        if (d.paymentUrl) window.location.href = d.paymentUrl;
        else message.error('無法取得付款連結');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { title: '訂單編號', dataIndex: 'orderNumber', key: 'orderNumber',
      render: (v: string, r: Order) => <Button type="link" style={{ padding: 0 }} onClick={() => openDetail(r.id)}>{v}</Button> },
    { title: '日期', dataIndex: 'createdAt', key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleDateString('zh-TW') },
    { title: '金額', dataIndex: 'totalAmount', key: 'totalAmount',
      render: (v: number) => `NT$ ${v.toLocaleString()}` },
    { title: '訂單狀態', dataIndex: 'status', key: 'status',
      render: (v: string) => <Tag color={STATUS_MAP[v]?.color ?? 'default'}>{STATUS_MAP[v]?.label ?? v}</Tag> },
    { title: '付款狀態', dataIndex: 'paymentStatus', key: 'paymentStatus',
      render: (v: string) => <Tag color={PAYMENT_STATUS_MAP[v]?.color ?? 'default'}>{PAYMENT_STATUS_MAP[v]?.label ?? v}</Tag> },
    { title: '', key: 'action',
      render: (_: unknown, r: Order) => <Button size="small" onClick={() => openDetail(r.id)}>查看</Button> },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
      <Title level={3}>我的訂單</Title>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : orders.length === 0 ? (
        <Empty description="目前沒有訂單" />
      ) : (
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: t => `共 ${t} 筆` }}
          scroll={{ x: 600 }}
        />
      )}

      <Modal
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        title={`訂單詳情 ${detail?.orderNumber ?? ''}`}
        width={600}
      >
        {detailLoading || !detail ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="訂單狀態">
                <Tag color={STATUS_MAP[detail.status]?.color}>{STATUS_MAP[detail.status]?.label ?? detail.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="付款狀態">
                <Tag color={PAYMENT_STATUS_MAP[detail.paymentStatus]?.color}>{PAYMENT_STATUS_MAP[detail.paymentStatus]?.label ?? detail.paymentStatus}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="付款方式">{PAYMENT_METHOD_MAP[detail.paymentMethod] ?? detail.paymentMethod}</Descriptions.Item>
              {detail.transferCode && <Descriptions.Item label="轉帳末5碼">{detail.transferCode}</Descriptions.Item>}
              <Descriptions.Item label="收件人">{detail.recipientName}</Descriptions.Item>
              <Descriptions.Item label="電話">{detail.recipientPhone}</Descriptions.Item>
              <Descriptions.Item label="地址">{detail.shippingAddress}</Descriptions.Item>
              {detail.notes && <Descriptions.Item label="備註">{detail.notes}</Descriptions.Item>}
            </Descriptions>

            <Divider>訂購商品</Divider>
            <Table
              dataSource={detail.items}
              rowKey="productSku"
              size="small"
              pagination={false}
              columns={[
                { title: '商品', dataIndex: 'productName', key: 'productName' },
                { title: '單價', dataIndex: 'unitPrice', key: 'unitPrice', render: (v: number) => `NT$ ${v}` },
                { title: '數量', dataIndex: 'quantity', key: 'quantity' },
                { title: '小計', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => `NT$ ${v.toLocaleString()}` },
              ]}
            />
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Text strong style={{ fontSize: 16 }}>總計：NT$ {detail.totalAmount.toLocaleString()}</Text>
            </div>

            <Divider />
            {detail.paymentStatus === 'Unpaid' && detail.status !== 'Cancelled' ? (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                {(detail.paymentMethod === 'ECPay' || detail.paymentMethod === 'LinePay') && (
                  <Button type="primary" loading={actionLoading} onClick={handleRepay}>
                    繼續付款
                  </Button>
                )}
                <Popconfirm
                  title="確定要取消此訂單？"
                  okText="確認取消"
                  cancelText="返回"
                  okButtonProps={{ danger: true }}
                  onConfirm={handleCancel}
                >
                  <Button danger loading={actionLoading}>取消訂單</Button>
                </Popconfirm>
              </div>
            ) : detail.paymentStatus === 'Paid' ? (
              <Alert
                type="info"
                showIcon
                message="已付款訂單如需退款，請聯絡店家"
                description={
                  <span>
                    來電：<a href="tel:02-29821282">02-29821282</a>　或透過
                    <a href="https://line.me/ti/p/~@pinhung" target="_blank" rel="noreferrer"> LINE 客服</a>申請，退款需經商家審核。
                  </span>
                }
              />
            ) : null}
          </>
        )}
      </Modal>
    </div>
  );
}
