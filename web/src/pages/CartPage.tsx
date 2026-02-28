import { Layout, Typography, Button, Badge, Card, List, InputNumber, Empty, Divider, Grid, BackTop, Alert, Tag } from 'antd';
import { ShoppingCartOutlined, CoffeeOutlined, DeleteOutlined, LeftOutlined, UpOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import type { CartItem } from '../stores/cartStore';
import { useState, useEffect } from 'react';
import { getSiteSettings } from '../services/siteSettingsService';

const { Header, Content } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function CartPage() {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const { items, updateQuantity, removeFromCart, getTotalPrice, getTotalItems } = useCartStore();
  const [checkoutEnabled, setCheckoutEnabled] = useState(true);

  useEffect(() => {
    getSiteSettings().then(s => setCheckoutEnabled(s.checkout_enabled !== 'false')).catch(() => {});
  }, []);

  const handleCheckout = () => {
    if (items.length === 0) return;
    if (!checkoutEnabled) return;
    navigate('/checkout');
  };

  const renderPurchaseModeBadge = (item: CartItem) => {
    if (item.purchaseMode === 'bulk' && item.discountRate) {
      return <Tag color="orange" style={{ marginLeft: 4 }}>大量購買 -{item.discountRate}%</Tag>;
    }
    if (item.purchaseMode === 'subscription') {
      return (
        <>
          <Tag color="green" style={{ marginLeft: 4 }}>
            定期訂購{item.subscriptionFrequency ? ` ${item.subscriptionFrequency}` : ''}
            {item.discountRate ? ` -${item.discountRate}%` : ''}
          </Tag>
          <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>將與您確認配送時程</div>
        </>
      );
    }
    return null;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: screens.xs ? '0 12px' : screens.sm ? '0 20px' : '0 50px',
        height: screens.xs ? 56 : 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <CoffeeOutlined style={{ fontSize: screens.xs ? 24 : screens.sm ? 28 : 32, marginRight: screens.xs ? 8 : 12 }} />
          <Title level={screens.xs ? 5 : screens.sm ? 4 : 3} style={{ margin: 0, color: 'white', fontSize: screens.xs ? 16 : screens.sm ? 18 : 20 }}>品皇咖啡</Title>
        </div>
        <Badge count={getTotalItems()} showZero>
          <ShoppingCartOutlined style={{ fontSize: screens.xs ? 20 : screens.sm ? 22 : 24, color: 'white' }} />
        </Badge>
      </Header>

      <Content style={{ padding: screens.xs ? '16px' : screens.sm ? '24px' : '50px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Button
          icon={<LeftOutlined />}
          onClick={() => navigate('/products')}
          style={{ marginBottom: 20 }}
        >
          繼續購物
        </Button>

        <Title level={2}>購物車</Title>

        {items.length === 0 ? (
          <Card>
            <Empty description="購物車是空的" />
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Button type="primary" onClick={() => navigate('/products')}>
                去選購商品
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <Card>
              <List
                itemLayout="horizontal"
                dataSource={items}
                renderItem={(item) => (
                  <List.Item
                    actions={screens.xs ? undefined : [
                      <InputNumber
                        key="quantity"
                        min={1}
                        max={99}
                        value={item.quantity}
                        onChange={(val) => updateQuantity(item.id, val || 1)}
                      />,
                      <Button
                        key="remove"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeFromCart(item.id)}
                      >
                        移除
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<img src={item.image} alt={item.name} style={{ width: screens.xs ? 60 : 80, height: screens.xs ? 60 : 80, objectFit: 'cover', borderRadius: 4 }} />}
                      title={<span style={{ fontSize: screens.xs ? 14 : 16 }}>{item.name}</span>}
                      description={
                        <div>
                          <div style={{ fontSize: screens.xs ? 12 : 14 }}>
                            {item.originalPrice && item.originalPrice > item.price ? (
                              <>
                                <span style={{ textDecoration: 'line-through', color: '#bbb', marginRight: 6 }}>
                                  NT$ {item.originalPrice}
                                </span>
                                <span>NT$ {item.price}</span>
                              </>
                            ) : (
                              <span>NT$ {item.price}</span>
                            )}
                          </div>
                          <div>{renderPurchaseModeBadge(item)}</div>
                          {screens.xs && (
                            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                              <InputNumber
                                size="small"
                                min={1}
                                max={99}
                                value={item.quantity}
                                onChange={(val) => updateQuantity(item.id, val || 1)}
                                style={{ width: 70 }}
                              />
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => removeFromCart(item.id)}
                              >
                                移除
                              </Button>
                            </div>
                          )}
                        </div>
                      }
                    />
                    <div style={{ marginRight: screens.xs ? 0 : 20, marginTop: screens.xs ? 8 : 0 }}>
                      <strong style={{ fontSize: screens.xs ? 14 : 16 }}>NT$ {item.price * item.quantity}</strong>
                    </div>
                  </List.Item>
                )}
              />

              <Divider />

              <div style={{ textAlign: 'right' }}>
                <Title level={4}>
                  總計：<span style={{ color: '#ff4d4f' }}>NT$ {getTotalPrice()}</span>
                </Title>
                {!checkoutEnabled && (
                  <Alert
                    type="warning"
                    message="網站目前暫停接受訂單，如有需要請直接聯絡客服"
                    style={{ marginBottom: 16, textAlign: 'left' }}
                  />
                )}
                <Button
                  type="primary"
                  size="large"
                  onClick={handleCheckout}
                  disabled={!checkoutEnabled}
                >
                  {checkoutEnabled ? '前往結帳' : '暫停接受訂單'}
                </Button>
              </div>
            </Card>
          </>
        )}
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
