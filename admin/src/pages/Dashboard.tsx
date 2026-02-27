import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import { ShoppingOutlined, WarningOutlined } from '@ant-design/icons';
import { apiClient } from '../config/api';

interface ProductStat {
  total: number;
  active: number;
  nearExpiry: number;
}

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stockQuantity: number;
  inventoryEnabled: boolean;
  isOrderable: boolean;
}

export default function Dashboard() {
  const [stats, setStats] = useState<ProductStat>({ total: 0, active: 0, nearExpiry: 0 });
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get('/products', { params: { pageSize: 500 } });
        const products = res.data.data || [];
        const total = res.data.totalCount || products.length;
        const active = products.filter((p: LowStockProduct) => p.isOrderable).length;
        // 庫存警示僅追蹤 inventoryEnabled=true 的商品
        const inventoryProducts = products.filter((p: LowStockProduct) => p.inventoryEnabled);
        const nearExpiry = inventoryProducts.filter((p: LowStockProduct) => p.stockQuantity <= 10).length;
        setStats({ total, active, nearExpiry });
        setLowStockProducts(inventoryProducts.filter((p: LowStockProduct) => p.stockQuantity <= 10).slice(0, 5));
      } catch (e) {
        console.error('Failed to fetch dashboard data', e);
      }
    };
    fetchData();
  }, []);

  const columns = [
    { title: '商品名稱', dataIndex: 'name', key: 'name' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    {
      title: '庫存',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 80,
      render: (qty: number) => <Tag color={qty <= 5 ? 'red' : 'orange'}>{qty}</Tag>,
    },
  ];

  return (
    <>
      <h1 style={{ marginBottom: 24 }}>儀表板</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="商品總數"
              value={stats.total}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="可下單商品"
              value={stats.active}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="庫存不足（追蹤中）"
              value={stats.nearExpiry}
              prefix={<WarningOutlined />}
              valueStyle={{ color: stats.nearExpiry > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {lowStockProducts.length > 0 && (
        <Row style={{ marginTop: 24 }}>
          <Col xs={24} lg={12}>
            <Card title="庫存警示（已啟用追蹤、庫存 ≤ 10）">
              <Table
                columns={columns}
                dataSource={lowStockProducts}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      )}
    </>
  );
}
