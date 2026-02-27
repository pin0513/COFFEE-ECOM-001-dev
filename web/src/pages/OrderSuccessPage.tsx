import { Layout, Typography, Button, Result, Grid, BackTop } from 'antd';
import { CoffeeOutlined, UpOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const screens = useBreakpoint();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        padding: screens.xs ? '0 12px' : screens.sm ? '0 20px' : '0 50px',
        height: screens.xs ? 56 : 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <CoffeeOutlined style={{ fontSize: screens.xs ? 24 : screens.sm ? 28 : 32, marginRight: screens.xs ? 8 : 12 }} />
          <Title level={screens.xs ? 5 : screens.sm ? 4 : 3} style={{ margin: 0, color: 'white', fontSize: screens.xs ? 16 : screens.sm ? 18 : 20 }}>品皇咖啡</Title>
        </div>
      </Header>

      <Content style={{ padding: screens.xs ? '16px' : screens.sm ? '24px' : '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Result
          status="success"
          title="訂單已成立！"
          subTitle="訂單編號：MOCK-2026-02-12-001（模擬資料）感謝您的購買，我們將盡快為您處理訂單。"
          extra={[
            <Button type="primary" key="products" onClick={() => navigate('/products')}>
              繼續購物
            </Button>,
            <Button key="home" onClick={() => navigate('/')}>
              返回首頁
            </Button>
          ]}
        />
      </Content>

      {/* 回到頂端按鈕 */}
      <BackTop visibilityHeight={300}>
        <div style={{
          height: 40,
          width: 40,
          lineHeight: '40px',
          borderRadius: '50%',
          backgroundColor: '#d4a574',
          color: '#fff',
          textAlign: 'center',
          fontSize: 20,
          boxShadow: '0 4px 12px rgba(212, 165, 116, 0.4)',
          cursor: 'pointer',
          transition: 'all 0.3s',
        }}>
          <UpOutlined />
        </div>
      </BackTop>
    </Layout>
  );
}
