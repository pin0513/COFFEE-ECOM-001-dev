import { Layout, Typography, Card, Row, Col, Button, Badge, Select, message, Spin, Grid, BackTop } from 'antd';
import { ShoppingCartOutlined, CoffeeOutlined, UpOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCartStore } from '../stores/cartStore';
import { getProducts } from '../services/productService';
import type { Product } from '../services/productService';
import { apiClient, getImageUrl } from '../config/api';
import { getSiteSettings } from '../services/siteSettingsService';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;
const { Meta } = Card;
const { useBreakpoint } = Grid;

interface Category {
  id: number;
  name: string;
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const screens = useBreakpoint();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutEnabled, setCheckoutEnabled] = useState(true);
  const { addToCart, getTotalItems } = useCartStore();

  useEffect(() => {
    getSiteSettings().then(s => setCheckoutEnabled(s.checkout_enabled !== 'false')).catch(() => {});
  }, []);

  // URL 中的 categoryId（null 表示全部）
  const categoryIdParam = searchParams.get('categoryId');
  const selectedCategoryId = categoryIdParam ? Number(categoryIdParam) : null;

  const setSelectedCategoryId = (id: number | null) => {
    if (id === null) {
      setSearchParams({});
    } else {
      setSearchParams({ categoryId: String(id) });
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiClient.get<Category[]>('/categories');
        setCategories(res.data || []);
      } catch {
        console.error('Failed to fetch categories');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: Record<string, unknown> = { page: 1, pageSize: 100, isActive: true };
        if (selectedCategoryId) params.categoryId = selectedCategoryId;
        const response = await getProducts(params);
        setProducts(response.data);
      } catch {
        message.error('載入商品失敗，請稍後再試');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedCategoryId]);

  const handleAddToCart = (product: Product) => {
    if (!checkoutEnabled) { message.warning('網站目前暫停接受訂單'); return; }
    if (product.price === 0) { message.warning('此商品尚未設定售價'); return; }
    if (!product.isOrderable) {
      message.warning('此商品目前無法下單');
      return;
    }
    addToCart({
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      image: getImageUrl(product.imageUrl) || 'https://placehold.co/200x200/f5ede3/d4a574/webp?text=Coffee',
      description: product.shortDescription || product.description || '',
      category: product.categoryName || '',
    });
    message.success(`${product.name} 已加入購物車`);
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <Spin size="large" tip="載入商品中..." />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: screens.xs ? '0 12px' : screens.sm ? '0 20px' : '0 50px',
        height: screens.xs ? 56 : 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', color: 'white', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <CoffeeOutlined style={{ fontSize: screens.xs ? 24 : 32, marginRight: screens.xs ? 8 : 12 }} />
          <Title level={screens.xs ? 5 : 3} style={{ margin: 0, color: 'white', fontSize: screens.xs ? 16 : 20 }}>品皇咖啡</Title>
        </div>
        <Badge count={getTotalItems()} showZero>
          <Button type="primary" size={screens.xs ? 'small' : 'middle'} icon={<ShoppingCartOutlined />} onClick={() => navigate('/cart')}>
            {screens.xs ? '' : '購物車'}
          </Button>
        </Badge>
      </Header>

      <Content style={{ padding: screens.xs ? '16px' : screens.sm ? '24px' : '50px' }}>
        <div style={{ marginBottom: 30 }}>
          <Title level={2}>商品列表</Title>
          <Select
            value={selectedCategoryId ?? 'all'}
            onChange={(v) => setSelectedCategoryId(v === 'all' ? null : (v as number))}
            style={{ width: 200 }}
            options={[
              { label: '全部商品', value: 'all' },
              ...categories.map(c => ({ label: c.name, value: c.id })),
            ]}
          />
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: screens.xs ? '16px' : '50px' }}>
            <Paragraph>目前沒有商品，請稍後再來看看</Paragraph>
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {products.map(product => (
              <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                <Card
                  hoverable
                  cover={
                    <img
                      alt={product.name}
                      src={getImageUrl(product.imageUrl) || 'https://placehold.co/400x300/f5ede3/d4a574/webp?text=Coffee'}
                      style={{ height: 200, objectFit: 'cover' }}
                    />
                  }
                  actions={[
                    <Button type="link" onClick={() => navigate(`/products/${product.id}`)}>查看詳情</Button>,
                    <Button
                      type="primary"
                      onClick={() => handleAddToCart(product)}
                      disabled={!checkoutEnabled || !product.isOrderable || product.price === 0}
                    >
                      {!checkoutEnabled ? '暫停接受訂單' : product.price === 0 ? '未設定售價' : !product.isOrderable ? '暫停販售' : '加入購物車'}
                    </Button>
                  ]}
                >
                  <Meta
                    title={product.name}
                    description={
                      <>
                        {product.shortDescription && (
                          <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>
                            {product.shortDescription}
                          </Paragraph>
                        )}
                        <Title level={4} type="danger" style={{ margin: 0 }}>NT$ {product.price}</Title>
                        <Paragraph type="secondary" style={{ fontSize: 12, margin: '4px 0 0 0' }}>
                          {product.categoryName || '未分類'}
                        </Paragraph>
                      </>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Content>

      <BackTop visibilityHeight={300}>
        <div style={{
          height: 40, width: 40, lineHeight: '40px', borderRadius: '50%',
          backgroundColor: '#d4a574', color: '#fff', textAlign: 'center', fontSize: 20,
          boxShadow: '0 4px 12px rgba(212, 165, 116, 0.4)', cursor: 'pointer', transition: 'all 0.3s',
        }}>
          <UpOutlined />
        </div>
      </BackTop>
    </Layout>
  );
}
