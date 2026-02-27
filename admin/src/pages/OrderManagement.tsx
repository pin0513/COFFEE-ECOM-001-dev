import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Modal, Space, Descriptions, message, Select } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { apiClient } from '../config/api';

interface OrderItem {
  id: number;
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
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  notes: string | null;
  transferCode: string | null;
  orderDate: string;
  createdAt: string;
  itemCount: number;
}

interface OrderDetail extends Order {
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'orange',
  Paid: 'cyan',
  Processing: 'blue',
  Shipped: 'geekblue',
  Completed: 'green',
  Cancelled: 'red',
};
const STATUS_LABELS: Record<string, string> = {
  Pending: '待處理',
  Paid: '已付款',
  Processing: '處理中',
  Shipped: '已出貨',
  Completed: '已完成',
  Cancelled: '已取消',
};
const PAYMENT_LABELS: Record<string, string> = {
  Unpaid: '未付款',
  Paid: '已付款',
  Refunded: '已退款',
};
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CashOnDelivery: '貨到付款',
  BankTransfer: '銀行轉帳',
  CreditCard: '信用卡',
};

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const fetchOrders = async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/orders', { params: { page: p, pageSize } });
      setOrders(res.data.data);
      setTotal(res.data.totalCount);
    } catch {
      message.error('載入訂單失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(1); }, []);

  const handleViewDetail = async (order: Order) => {
    try {
      const res = await apiClient.get(`/orders/${order.id}`);
      setSelectedOrder(res.data);
      setModalVisible(true);
    } catch {
      message.error('載入訂單詳情失敗');
    }
  };

  const handleUpdateStatus = async (orderId: number, status: string, paymentStatus?: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status, paymentStatus });
      message.success('狀態已更新');
      fetchOrders(page);
      if (selectedOrder?.id === orderId) {
        const res = await apiClient.get(`/orders/${orderId}`);
        setSelectedOrder(res.data);
      }
    } catch {
      message.error('更新狀態失敗');
    }
  };

  const columns = [
    { title: '訂單編號', dataIndex: 'orderNumber', key: 'orderNumber', width: 160 },
    { title: '客戶', dataIndex: 'recipientName', key: 'recipientName', width: 100 },
    {
      title: '付款方式',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 110,
      render: (v: string) => PAYMENT_METHOD_LABELS[v] ?? v,
    },
    {
      title: '總金額',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 110,
      render: (v: number) => `NT$ ${v.toLocaleString()}`,
    },
    {
      title: '訂單狀態',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => <Tag color={STATUS_COLORS[v] ?? 'default'}>{STATUS_LABELS[v] ?? v}</Tag>,
    },
    {
      title: '付款狀態',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      width: 100,
      render: (v: string) => <Tag color={v === 'Paid' ? 'green' : v === 'Refunded' ? 'red' : 'orange'}>{PAYMENT_LABELS[v] ?? v}</Tag>,
    },
    {
      title: '建立時間',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString('zh-TW'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Order) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>查看</Button>
          {record.status === 'Pending' && (
            <Button type="link" onClick={() => handleUpdateStatus(record.id, 'Processing')}>確認處理</Button>
          )}
          {record.status === 'Processing' && (
            <Button type="link" onClick={() => handleUpdateStatus(record.id, 'Shipped')}>標記出貨</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="訂單管理"
      extra={<Button icon={<ReloadOutlined />} onClick={() => fetchOrders(page)}>重新整理</Button>}
    >
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          onChange: (p) => { setPage(p); fetchOrders(p); },
        }}
        scroll={{ x: 900 }}
      />

      <Modal
        title={`訂單詳情 — ${selectedOrder?.orderNumber ?? ''}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="訂單編號">{selectedOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="收件人">{selectedOrder.recipientName}</Descriptions.Item>
              <Descriptions.Item label="電話">{selectedOrder.recipientPhone}</Descriptions.Item>
              <Descriptions.Item label="地址">{selectedOrder.shippingAddress}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedOrder.customerEmail}</Descriptions.Item>
              <Descriptions.Item label="付款方式">{PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod] ?? selectedOrder.paymentMethod}</Descriptions.Item>
              {selectedOrder.transferCode && (
                <Descriptions.Item label="轉帳後5碼">
                  <strong style={{ fontSize: 18, color: '#1677ff' }}>{selectedOrder.transferCode}</strong>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="訂單狀態">
                <Space>
                  <Tag color={STATUS_COLORS[selectedOrder.status]}>{STATUS_LABELS[selectedOrder.status] ?? selectedOrder.status}</Tag>
                  <Select
                    size="small"
                    value={selectedOrder.status}
                    style={{ width: 120 }}
                    onChange={v => handleUpdateStatus(selectedOrder.id, v)}
                    options={Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                  />
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="付款狀態">
                <Space>
                  <Tag color={selectedOrder.paymentStatus === 'Paid' ? 'green' : 'orange'}>
                    {PAYMENT_LABELS[selectedOrder.paymentStatus] ?? selectedOrder.paymentStatus}
                  </Tag>
                  <Select
                    size="small"
                    value={selectedOrder.paymentStatus}
                    style={{ width: 110 }}
                    onChange={v => handleUpdateStatus(selectedOrder.id, selectedOrder.status, v)}
                    options={[
                      { value: 'Unpaid', label: '未付款' },
                      { value: 'Paid', label: '已付款' },
                      { value: 'Refunded', label: '已退款' },
                    ]}
                  />
                </Space>
              </Descriptions.Item>
              {selectedOrder.notes && (
                <Descriptions.Item label="備註">{selectedOrder.notes}</Descriptions.Item>
              )}
            </Descriptions>

            <h3 style={{ marginTop: 20 }}>訂單明細</h3>
            <Table
              columns={[
                { title: '商品名稱', dataIndex: 'productName', key: 'productName' },
                { title: 'SKU', dataIndex: 'productSku', key: 'productSku', width: 100 },
                { title: '數量', dataIndex: 'quantity', key: 'quantity', width: 70 },
                { title: '單價', dataIndex: 'unitPrice', key: 'unitPrice', width: 100, render: (v: number) => `NT$ ${v}` },
                { title: '小計', dataIndex: 'subtotal', key: 'subtotal', width: 100, render: (v: number) => `NT$ ${v}` },
              ]}
              dataSource={selectedOrder.items}
              rowKey="id"
              pagination={false}
              size="small"
            />
            <div style={{ textAlign: 'right', marginTop: 16, fontSize: 18, fontWeight: 'bold' }}>
              總計：NT$ {selectedOrder.totalAmount.toLocaleString()}
            </div>
          </>
        )}
      </Modal>
    </Card>
  );
}
