import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, message } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  CoffeeOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  AppstoreOutlined,
  StarOutlined,
  EnvironmentOutlined,
  PictureOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import Dashboard from './Dashboard';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import AdminManagement from './AdminManagement';
import SiteSettings from './SiteSettings';
import CategoryManagement from './CategoryManagement';
import TestimonialManagement from './TestimonialManagement';
import StoreManagement from './StoreManagement';
import HeroBannerManagement from './HeroBannerManagement';
import ContentPageManagement from './ContentPageManagement';
import CustomerManagement from './CustomerManagement';

const { Header, Sider, Content } = Layout;

export default function AdminLayout() {
  const [selectedKey, setSelectedKey] = useState('orders');
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      signOut();
      message.success('已登出');
    } catch {
      message.error('登出失敗');
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.name || user?.email,
      disabled: true,
    },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '登出', onClick: handleLogout },
  ];

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard': return <Dashboard />;
      case 'products': return <ProductManagement />;
      case 'orders': return <OrderManagement />;
      case 'categories': return <CategoryManagement />;
      case 'admins': return <AdminManagement />;
      case 'settings': return <SiteSettings />;
      case 'testimonials': return <TestimonialManagement />;
      case 'stores': return <StoreManagement />;
      case 'hero-banners': return <HeroBannerManagement />;
      case 'content-pages': return <ContentPageManagement />;
      case 'customers': return <CustomerManagement />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'white',
        }}>
          <CoffeeOutlined style={{ fontSize: 28 }} />
          <span style={{ marginLeft: 10, fontSize: 16, fontWeight: 'bold' }}>後台管理</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={({ key }) => setSelectedKey(key)}
          items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: '儀表板' },
            { key: 'products', icon: <ShoppingOutlined />, label: '商品管理' },
            { key: 'categories', icon: <AppstoreOutlined />, label: '分類管理' },
            { key: 'orders', icon: <ShoppingCartOutlined />, label: '訂單管理' },
            { key: 'customers', icon: <UserOutlined />, label: '會員管理' },
            { key: 'hero-banners', icon: <PictureOutlined />, label: 'Banner 管理' },
            { key: 'testimonials', icon: <StarOutlined />, label: '評價管理' },
            { key: 'stores', icon: <EnvironmentOutlined />, label: '門市管理' },
            { key: 'content-pages', icon: <FileTextOutlined />, label: '內容頁管理' },
            { key: 'admins', icon: <TeamOutlined />, label: '管理員管理' },
            { key: 'settings', icon: <SettingOutlined />, label: '網站設定' },
          ]}
        />
      </Sider>

      <Layout>
        <Header style={{
          padding: '0 24px', background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0 }}>品皇咖啡 - 後台管理系統</h2>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
              <span>{user?.name || '管理員'}</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}
