import { Layout, Typography, Button, Badge, Row, Col, Image, InputNumber, message, Grid, Spin, BackTop, Descriptions, Tag } from 'antd';
import { ShoppingCartOutlined, CoffeeOutlined, LeftOutlined, UpOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getProductById } from '../services/productService';
import type { Product } from '../services/productService';
import { useCartStore } from '../stores/cartStore';
import { getImageUrl } from '../config/api';
import { getSiteSettings } from '../services/siteSettingsService';

interface SpecField {
  key: string;
  label: string;
  type: string;
}

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutEnabled, setCheckoutEnabled] = useState(true);
  const { addToCart, getTotalItems } = useCartStore();

  useEffect(() => {
    getSiteSettings().then(s => setCheckoutEnabled(s.checkout_enabled !== 'false')).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await getProductById(parseInt(id));
        setProduct(data);
      } catch {
        message.error('載入商品失敗');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!checkoutEnabled) { message.warning('網站目前暫停接受訂單'); return; }
    if (product.price === 0) { message.warning('此商品尚未設定售價'); return; }
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: product.id.toString(),
        name: product.name,
        price: product.price,
        image: getImageUrl(product.imageUrl) || 'https://placehold.co/400x400/f5ede3/d4a574/webp?text=Coffee',
        description: product.shortDescription || product.description || '',
        category: product.categoryName || '',
      });
    }
    message.success(`${product.name} x${quantity} 已加入購物車`);
    setQuantity(1);
  };

  // 判斷是否可加入購物車
  const canOrder = (p: Product) => checkoutEnabled && p.isOrderable && p.price > 0;

  // 解析 spec 資料
  const parseSpec = (p: Product) => {
    if (!p.categorySpecTemplate || !p.specData) return null;
    try {
      const fields: SpecField[] = JSON.parse(p.categorySpecTemplate);
      const data: Record<string, string> = JSON.parse(p.specData);
      const entries = fields.filter(f => data[f.key]).map(f => ({ label: f.label, value: data[f.key] }));
      return entries.length > 0 ? entries : null;
    } catch { return null; }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: screens.xs ? '0 12px' : '0 50px', height: screens.xs ? 56 : 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <CoffeeOutlined style={{ fontSize: screens.xs ? 24 : 32, marginRight: 12 }} />
          <Title level={screens.xs ? 5 : 3} style={{ margin: 0, color: 'white', fontSize: screens.xs ? 16 : 20 }}>品皇咖啡</Title>
        </div>
        <Badge count={getTotalItems()} showZero>
          <Button type="primary" size={screens.xs ? 'small' : 'middle'} icon={<ShoppingCartOutlined />} onClick={() => navigate('/cart')}>
            {screens.xs ? '' : '購物車'}
          </Button>
        </Badge>
      </Header>

      <Content style={{ padding: screens.xs ? '16px' : '50px' }}>
        <Button icon={<LeftOutlined />} onClick={() => navigate('/products')} style={{ marginBottom: 24 }}>
          返回商品列表
        </Button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : !product ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Paragraph>找不到此商品</Paragraph>
            <Button type="primary" onClick={() => navigate('/products')}>返回商品列表</Button>
          </div>
        ) : (
          <Row gutter={[48, 32]}>
            <Col xs={24} md={12}>
              <Image
                src={getImageUrl(product.imageUrl) || 'https://placehold.co/600x500/f5ede3/d4a574/webp?text=Coffee'}
                alt={product.name}
                style={{ width: '100%', borderRadius: 8 }}
                fallback="https://placehold.co/600x500/f5ede3/d4a574/webp?text=Coffee"
              />
            </Col>

            <Col xs={24} md={12}>
              {product.categoryName && (
                <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 4 }}>
                  {product.categoryName}
                </Paragraph>
              )}
              <Title level={2} style={{ marginBottom: 8 }}>{product.name}</Title>

              {product.shortDescription && (
                <Paragraph style={{ fontSize: 16, color: '#555', marginBottom: 16 }}>
                  {product.shortDescription}
                </Paragraph>
              )}

              <Title level={2} type="danger" style={{ marginBottom: 24 }}>
                NT$ {product.price.toLocaleString()}
              </Title>

              {product.description && (
                <div style={{ marginBottom: 24 }}>
                  <Title level={5}>商品說明</Title>
                  <Paragraph>{product.description}</Paragraph>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <span>數量：</span>
                <InputNumber
                  min={1}
                  max={99}
                  value={quantity}
                  onChange={(v) => setQuantity(v || 1)}
                  disabled={!product.isOrderable}
                />
                <span style={{ fontSize: 13, color: '#999' }}>{product.unit}</span>
              </div>

              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
                disabled={!canOrder(product)}
                style={{ width: '100%' }}
              >
                {!checkoutEnabled ? '網站暫停接受訂單' : product.price === 0 ? '尚未設定售價' : product.isOrderable ? '加入購物車' : '暫停販售'}
              </Button>

              {/* 商品規格 */}
              {(() => {
                const specs = parseSpec(product);
                return specs ? (
                  <div style={{ marginTop: 24 }}>
                    <Title level={5}>商品規格</Title>
                    <Descriptions bordered column={1} size="small">
                      {specs.map(s => (
                        <Descriptions.Item key={s.label} label={s.label}>
                          <Tag color="default">{s.value}</Tag>
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  </div>
                ) : null;
              })()}
            </Col>
          </Row>
        )}
      </Content>

      <BackTop visibilityHeight={300}>
        <div style={{
          height: 40, width: 40, lineHeight: '40px', borderRadius: '50%',
          backgroundColor: '#d4a574', color: '#fff', textAlign: 'center', fontSize: 20,
          boxShadow: '0 4px 12px rgba(212, 165, 116, 0.4)', cursor: 'pointer',
        }}>
          <UpOutlined />
        </div>
      </BackTop>
    </Layout>
  );
}
