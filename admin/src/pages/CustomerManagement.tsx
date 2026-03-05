import { useState, useEffect } from 'react';
import { Card, Table, Tag, Input, Button, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { apiClient } from '../config/api';

interface Customer {
  id: number;
  customerNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  type: string;
  isActive: boolean;
  createdAt: string;
  orderCount: number;
}

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchCustomers = async (p = page, kw = keyword) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/customers', { params: { page: p, pageSize: 20, keyword: kw || undefined } });
      setCustomers(res.data.data || res.data.Data || []);
      setTotal(res.data.totalCount || res.data.TotalCount || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []); // eslint-disable-line

  const handleSearch = () => {
    setPage(1);
    setKeyword(searchInput);
    fetchCustomers(1, searchInput);
  };

  const columns = [
    { title: '會員編號', dataIndex: 'customerNumber', key: 'customerNumber', width: 110 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 120 },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 200 },
    { title: '電話', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '訂單數', dataIndex: 'orderCount', key: 'orderCount', width: 80, align: 'right' as const },
    {
      title: '狀態',
      key: 'isActive',
      width: 80,
      render: (_: unknown, c: Customer) =>
        c.isActive ? <Tag color="green">正常</Tag> : <Tag color="red">停用</Tag>,
    },
    {
      title: '加入日期',
      key: 'createdAt',
      width: 160,
      render: (_: unknown, c: Customer) =>
        new Date(c.createdAt).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    },
  ];

  return (
    <Card
      title={`會員管理（共 ${total} 位）`}
      extra={
        <Space>
          <Input
            placeholder="搜尋姓名 / Email"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            suffix={<SearchOutlined onClick={handleSearch} style={{ cursor: 'pointer' }} />}
          />
          <Button icon={<ReloadOutlined />} onClick={() => { setSearchInput(''); setKeyword(''); setPage(1); fetchCustomers(1, ''); }}>
            重置
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={customers}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          showSizeChanger: false,
          onChange: (p) => { setPage(p); fetchCustomers(p); },
        }}
      />
    </Card>
  );
}
