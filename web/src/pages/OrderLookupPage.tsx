import { useState } from 'react';
import { Form, Input, Button, Card, Descriptions, Tag, Table, Typography, Divider, Alert, Popconfirm, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const { Title, Text } = Typography;

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
  BankTransfer:   '銀行轉帳',
  CashOnDelivery: '貨到付款',
  ECPay:          '線上付款（綠界）',
  LinePay:        'LINE Pay',
};

interface OrderResult {
  id: number;
  orderNumber: string;
  totalAmount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  notes: string;
  transferCode: string;
  createdAt: string;
  items: { productName: string; productSku: string; unitPrice: number; quantity: number; subtotal: number }[];
}

export default function OrderLookupPage() {
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');

  // 從 URL params 預填（訂單成功頁帶過來）
  const defaultOrderNumber = searchParams.get('orderNumber') ?? '';

  const handleSearch = async (values: { orderNumber: string; email: string }) => {
    setCurrentEmail(values.email.trim());
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const params = new URLSearchParams({ orderNumber: values.orderNumber.trim(), email: values.email.trim() });
      const res = await fetch(`${API_BASE_URL}/orders/lookup?${params}`);
      const data = await res.json();
      if (!res.ok) { setError(data.message || '找不到此訂單'); return; }
      setOrder(data);
    } catch {
      setError('查詢失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 20px' }}>
      <Title level={3}>訂單查詢</Title>
      <p style={{ color: '#666', marginBottom: 24 }}>輸入您的訂單編號與結帳 Email，即可查詢訂單狀態。</p>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSearch}
          initialValues={{ orderNumber: defaultOrderNumber }}
        >
          <Form.Item
            name="orderNumber"
            label="訂單編號"
            rules={[{ required: true, message: '請輸入訂單編號' }]}
          >
            <Input placeholder="例：ORD-20260306-0001" size="large" />
          </Form.Item>
          <Form.Item
            name="email"
            label="結帳 Email"
            rules={[{ required: true, type: 'email', message: '請輸入正確的 Email' }]}
          >
            <Input placeholder="your@email.com" size="large" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              icon={<SearchOutlined />}
              loading={loading}
              block
            >
              查詢訂單
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {error && (
        <Alert type="error" message={error} style={{ marginTop: 16 }} showIcon />
      )}

      {order && (
        <Card style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>訂單 {order.orderNumber}</Title>
            <Text type="secondary">{new Date(order.createdAt).toLocaleDateString('zh-TW')}</Text>
          </div>

          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="訂單狀態">
              <Tag color={STATUS_MAP[order.status]?.color}>{STATUS_MAP[order.status]?.label ?? order.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="付款狀態">
              <Tag color={PAYMENT_STATUS_MAP[order.paymentStatus]?.color}>
                {PAYMENT_STATUS_MAP[order.paymentStatus]?.label ?? order.paymentStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="付款方式">
              {PAYMENT_METHOD_MAP[order.paymentMethod] ?? order.paymentMethod}
            </Descriptions.Item>
            {order.transferCode && (
              <Descriptions.Item label="轉帳末5碼">{order.transferCode}</Descriptions.Item>
            )}
            <Descriptions.Item label="收件人">{order.recipientName}</Descriptions.Item>
            <Descriptions.Item label="電話">{order.recipientPhone}</Descriptions.Item>
            <Descriptions.Item label="地址">{order.shippingAddress}</Descriptions.Item>
            {order.notes && <Descriptions.Item label="備註">{order.notes}</Descriptions.Item>}
          </Descriptions>

          <Divider>訂購商品</Divider>
          <Table
            dataSource={order.items}
            rowKey="productSku"
            size="small"
            pagination={false}
            columns={[
              { title: '商品', dataIndex: 'productName', key: 'productName' },
              { title: '單價', dataIndex: 'unitPrice', key: 'unitPrice', render: (v: number) => `NT$ ${v.toLocaleString()}` },
              { title: '數量', dataIndex: 'quantity', key: 'quantity', width: 60 },
              { title: '小計', dataIndex: 'subtotal', key: 'subtotal', render: (v: number) => `NT$ ${v.toLocaleString()}` },
            ]}
          />
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Text strong style={{ fontSize: 16 }}>總計：NT$ {order.totalAmount.toLocaleString()}</Text>
          </div>

          <Divider />
          {order.paymentStatus === 'Unpaid' && order.status !== 'Cancelled' ? (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {(order.paymentMethod === 'ECPay' || order.paymentMethod === 'LinePay') && (
                <Button
                  type="primary"
                  loading={actionLoading}
                  onClick={async () => {
                    setActionLoading(true);
                    try {
                      if (order.paymentMethod === 'ECPay') {
                        const r = await fetch(`${API_BASE_URL}/payment/ecpay/checkout?orderId=${order.id}`, { method: 'POST' });
                        const html = await r.text();
                        const div = document.createElement('div');
                        div.innerHTML = html;
                        document.body.appendChild(div);
                        const frm = div.querySelector('form');
                        if (frm) frm.submit();
                      } else {
                        const r = await fetch(`${API_BASE_URL}/payment/linepay/request?orderId=${order.id}`, { method: 'POST' });
                        const d = await r.json();
                        if (d.paymentUrl) window.location.href = d.paymentUrl;
                        else message.error('無法取得付款連結');
                      }
                    } finally { setActionLoading(false); }
                  }}
                >
                  繼續付款
                </Button>
              )}
              <Popconfirm
                title="確定要取消此訂單？"
                okText="確認取消"
                cancelText="返回"
                okButtonProps={{ danger: true }}
                onConfirm={async () => {
                  setActionLoading(true);
                  try {
                    const r = await fetch(`${API_BASE_URL}/orders/lookup/cancel`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ orderNumber: order.orderNumber, email: currentEmail }),
                    });
                    const d = await r.json();
                    if (!r.ok) { message.error(d.message); return; }
                    message.success('訂單已取消');
                    setOrder({ ...order, status: 'Cancelled' });
                  } finally { setActionLoading(false); }
                }}
              >
                <Button danger loading={actionLoading}>取消訂單</Button>
              </Popconfirm>
            </div>
          ) : order.paymentStatus === 'Paid' ? (
            <Alert
              type="info"
              showIcon
              message="已付款訂單如需退款，請聯絡店家"
              description={
                <span>
                  來電：<a href="tel:02-29990000">02-2999-0000</a>　或透過
                  <a href="https://line.me/ti/p/~@pinhung" target="_blank" rel="noreferrer"> LINE 客服</a>申請，退款需經商家審核。
                </span>
              }
            />
          ) : null}
        </Card>
      )}
    </div>
  );
}
