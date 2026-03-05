import { Button, Result } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import type { Order } from '../services/orderService';

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order as Order | undefined;

  const orderNumber = order?.orderNumber ?? '—';
  const totalAmount = order?.totalAmount ?? 0;

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <Result
        status="success"
        title="訂單已成立！"
        subTitle={
          <div>
            <div>訂單編號：<strong>{orderNumber}</strong></div>
            {totalAmount > 0 && <div>訂單金額：<strong>NT${totalAmount.toLocaleString()}</strong></div>}
            <div style={{ marginTop: 8, color: '#888' }}>感謝您的購買，我們將盡快為您處理訂單。</div>
          </div>
        }
        extra={[
          <Button type="primary" key="products" onClick={() => navigate('/products')}>
            繼續購物
          </Button>,
          <Button key="home" onClick={() => navigate('/')}>
            返回首頁
          </Button>
        ]}
      />
    </div>
  );
}
