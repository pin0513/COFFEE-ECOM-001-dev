import { Typography, Button, InputNumber, message, Grid, Spin, BackTop, Radio, Select } from 'antd';
import { ShoppingCartOutlined, LeftOutlined, UpOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { getProductById, getProductVariants } from '../services/productService';
import type { Product, ProductVariant } from '../services/productService';
import { useCartStore } from '../stores/cartStore';
import type { PurchaseMode } from '../stores/cartStore';
import { getImageUrl } from '../config/api';
import { getSiteSettings } from '../services/siteSettingsService';
import './ProductDetailPage.css';

interface SpecField {
  key: string;
  label: string;
  type: string;
}

interface BulkTier {
  qty: number;
  label: string;
  discount: number;
}


const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutEnabled, setCheckoutEnabled] = useState(true);

  // 購買模式
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('oneTime');
  const [selectedTier, setSelectedTier] = useState<BulkTier | null>(null);
  // 研磨選項
  const [grindChoice, setGrindChoice] = useState<'whole' | 'grind'>('whole');
  const [grindLevel, setGrindLevel] = useState<string>('手沖');
  const { addToCart } = useCartStore();

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
        setPurchaseMode('oneTime');
        setSelectedTier(null);

        // 取得變體
        if (data.parentProductId || data.variantLabel) {
          try {
            const variantData = await getProductVariants(parseInt(id));
            setVariants(variantData.filter(v => v.variantLabel));
          } catch { setVariants([]); }
        } else {
          setVariants([]);
        }
      } catch {
        message.error('載入商品失敗');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const bulkTiers: BulkTier[] = product?.bulkOptions ? (() => {
    try { return JSON.parse(product.bulkOptions); } catch { return []; }
  })() : [];

  const hasBulk = bulkTiers.length > 0;

  // 計算折扣後價格
  const getFinalPrice = (): number => {
    if (!product) return 0;
    if (purchaseMode === 'bulk' && selectedTier) {
      return Math.round(product.price * (1 - selectedTier.discount / 100));
    }
    return product.price;
  };

  const finalPrice = getFinalPrice();
  const hasDiscount = product && finalPrice < product.price;

  const handlePurchaseModeChange = (mode: PurchaseMode) => {
    setPurchaseMode(mode);
    if (mode !== 'bulk') setSelectedTier(null);
  };

  const getGrindOption = (): string | undefined => {
    if (!product?.hasGrindOption) return undefined;
    return grindChoice === 'whole' ? '不研磨（整豆）' : `研磨-${grindLevel}`;
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!checkoutEnabled) { message.warning('網站目前暫停接受訂單'); return; }
    if (product.price === 0) { message.warning('此商品尚未設定售價'); return; }
    if (purchaseMode === 'bulk' && !selectedTier) { message.warning('請選擇大量購買方案'); return; }

    const grindOption = getGrindOption();
    const grindSuffix = grindOption ? `:${grindOption}` : '';
    const cartId = `${product.id}:${purchaseMode}${purchaseMode === 'bulk' && selectedTier ? `:${selectedTier.qty}` : ''}${grindSuffix}`;

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: cartId,
        productId: product.id.toString(),
        name: product.name,
        price: finalPrice,
        originalPrice: product.price,
        image: getImageUrl(product.imageUrl) || 'https://placehold.co/400x400/f5ede3/d4a574/webp?text=Coffee',
        category: product.categoryName || '',
        description: product.shortDescription || product.description || '',
        purchaseMode,
        discountRate: purchaseMode === 'bulk' ? selectedTier?.discount : undefined,
        requirePrePayment: product.requirePrePayment,
        grindOption,
      });
    }

    message.success(`${product.name} x${quantity} 已加入購物車`);
    setQuantity(1);
  };

  const canOrder = (p: Product) => checkoutEnabled && p.isOrderable && p.price > 0;

  // 解析規格 chips
  const parseSpecChips = (p: Product) => {
    if (!p.categorySpecTemplate || !p.specData) return null;
    try {
      const fields: SpecField[] = JSON.parse(p.categorySpecTemplate);
      const data: Record<string, string> = JSON.parse(p.specData);
      const entries = fields.filter(f => data[f.key]).map(f => ({ label: f.label, value: data[f.key] }));
      return entries.length > 0 ? entries : null;
    } catch { return null; }
  };

  const getAddToCartLabel = (p: Product) => {
    if (!checkoutEnabled) return '網站暫停接受訂單';
    if (p.price === 0) return '尚未設定售價';
    if (!p.isOrderable) return '暫停販售';
    if (purchaseMode === 'bulk' && !selectedTier) return '請先選擇方案';
    return '加入購物車';
  };

  const ogImage = product ? (getImageUrl(product.imageUrl) || 'https://pinhung.com/uploads/og-cover.jpg') : 'https://pinhung.com/uploads/og-cover.jpg';
  const ogTitle = product ? `${product.name} | 品皇咖啡` : '商品詳情 | 品皇咖啡';
  const ogDesc = product ? (product.shortDescription || product.description || '品皇咖啡精選優質咖啡豆，品質保證。') : '品皇咖啡精選優質咖啡豆，品質保證。';
  const productJsonLd = product ? JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: ogDesc,
    image: ogImage,
    brand: { '@type': 'Brand', name: '品皇咖啡' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'TWD',
      price: product.price,
      availability: product.isOrderable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://pinhung.com/products/${product.id}`,
    },
  }) : null;

  return (
    <>
    {product && (
      <Helmet>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDesc} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDesc} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={`https://pinhung.com/products/${product.id}`} />
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={String(product.price)} />
        <meta property="product:price:currency" content="TWD" />
        {productJsonLd && <script type="application/ld+json">{productJsonLd}</script>}
      </Helmet>
    )}
    <div style={{ padding: screens.xs ? '16px' : '50px' }}>
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
          <>
            {/* 主區：圖片 + 資訊 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: screens.xs ? '1fr' : '1fr 1fr',
              gap: screens.xs ? 24 : 48,
              alignItems: 'start',
            }}>
              {/* 左：商品圖片 */}
              <div>
                <img
                  src={getImageUrl(product.imageUrl) || 'https://placehold.co/600x500/f5ede3/d4a574/webp?text=Coffee'}
                  alt={product.name}
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x500/f5ede3/d4a574/webp?text=Coffee'; }}
                  style={{ width: '100%', borderRadius: 12, objectFit: 'cover', aspectRatio: '4/3' }}
                />
              </div>

              {/* 右：產品資訊 */}
              <div>
                {product.categoryName && (
                  <p style={{ fontSize: 12, color: '#d4a574', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    {product.categoryName}
                  </p>
                )}
                <Title level={2} style={{ marginBottom: 8, lineHeight: 1.3 }}>{product.name}</Title>

                {product.brand && (
                  <p style={{ fontSize: 13, color: '#7a6254', marginBottom: 8 }}>品牌：{product.brand}</p>
                )}

                {product.shortDescription && (
                  <p style={{ fontSize: 15, color: '#b5895a', marginBottom: 16, fontStyle: 'italic' }}>
                    {product.shortDescription}
                  </p>
                )}

                {/* 變體選擇器 */}
                {variants.length > 0 && (
                  <div className="variants-section">
                    <div className="variants-label">選擇規格</div>
                    <div className="variant-grid">
                      {variants.map(v => (
                        <div
                          key={v.id}
                          className={`variant-card${v.id === product.id ? ' selected' : ''}${!v.isOrderable ? ' out-of-order' : ''}`}
                          onClick={() => v.isOrderable && navigate(`/products/${v.id}`)}
                        >
                          <div className="variant-label">{v.variantLabel}</div>
                          <div className="variant-price">NT$ {v.price.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 購買模式 */}
                {hasBulk && (
                  <div className="purchase-mode-section">
                    <div className="purchase-mode-label">購買方式</div>
                    <div className="purchase-mode-selector">
                      <div
                        className={`purchase-mode-option${purchaseMode === 'oneTime' ? ' selected' : ''}`}
                        onClick={() => handlePurchaseModeChange('oneTime')}
                      >
                        <div className="mode-title">一次購買</div>
                        <div className="mode-subtitle">NT$ {product.price.toLocaleString()}</div>
                      </div>

                      <div
                        className={`purchase-mode-option${purchaseMode === 'bulk' ? ' selected' : ''}`}
                        onClick={() => handlePurchaseModeChange('bulk')}
                      >
                        <div className="mode-title">大量購買</div>
                        <div className="mode-subtitle">最高省 {Math.max(...bulkTiers.map(t => t.discount))}%</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 大量購買方案 */}
                {purchaseMode === 'bulk' && hasBulk && (
                  <div className="bulk-section">
                    <div className="bulk-section-label">選擇方案</div>
                    <div className="bulk-tier-grid">
                      {bulkTiers.map(tier => (
                        <div
                          key={tier.qty}
                          className={`bulk-tier-card${selectedTier?.qty === tier.qty ? ' selected' : ''}`}
                          onClick={() => setSelectedTier(tier)}
                        >
                          <div className="bulk-tier-label">{tier.label}</div>
                          <div className="bulk-discount-badge">-{tier.discount}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 研磨選項 */}
                {product.hasGrindOption && (
                  <div style={{ margin: '16px 0', padding: '12px 16px', background: '#faf7f4', borderRadius: 8, border: '1px solid #e8d5c0' }}>
                    <div style={{ fontWeight: 600, marginBottom: 10, color: '#5d3a1a' }}>研磨選項</div>
                    <Radio.Group value={grindChoice} onChange={e => setGrindChoice(e.target.value)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <Radio value="whole">不研磨（整豆）</Radio>
                      <Radio value="grind">需要研磨</Radio>
                    </Radio.Group>
                    {grindChoice === 'grind' && (
                      <div style={{ marginTop: 10 }}>
                        <span style={{ marginRight: 8, fontSize: 13, color: '#666' }}>研磨刻度：</span>
                        <Select
                          value={grindLevel}
                          onChange={setGrindLevel}
                          style={{ width: 140 }}
                          options={[
                            { label: '美式（粗研磨）', value: '美式' },
                            { label: '手沖（中研磨）', value: '手沖' },
                            { label: '虹吸（中細研磨）', value: '虹吸' },
                            { label: '義式（細研磨）', value: '義式' },
                            { label: '摩卡壺（細研磨）', value: '摩卡壺' },
                            { label: '法式壓濾（粗研磨）', value: '法式壓濾' },
                            { label: '冷萃（粗研磨）', value: '冷萃' },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 數量 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '20px 0' }}>
                  <span style={{ fontWeight: 600, color: '#555' }}>數量：</span>
                  <InputNumber
                    min={1}
                    max={99}
                    value={quantity}
                    onChange={(v) => setQuantity(v || 1)}
                    disabled={!product.isOrderable}
                  />
                  <span style={{ fontSize: 13, color: '#999' }}>{product.unit}</span>
                </div>

                {/* 價格顯示 */}
                <div className="price-block">
                  {/* 市售原廠參考價（劃線） */}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="price-market-ref">
                      市售參考 <span className="price-market-strike">NT$ {product.originalPrice.toLocaleString()}</span>
                    </div>
                  )}
                  {hasDiscount ? (
                    <>
                      <div className="price-original">NT$ {product.price.toLocaleString()}</div>
                      <div className="price-final">NT$ {finalPrice.toLocaleString()}</div>
                      <div className="price-savings">
                        省下 NT$ {(product.price - finalPrice).toLocaleString()}（-{selectedTier?.discount}%）
                      </div>
                    </>
                  ) : (
                    <div className="price-final">
                      NT$ {product.price.toLocaleString()}
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="price-discount-badge">
                          {Math.round((1 - product.price / product.originalPrice) * 100 * 10) / 10} 折優惠
                        </span>
                      )}
                    </div>
                  )}
                  {/* 月租方案（從 specData 讀取） */}
                  {(() => {
                    try {
                      const spec = JSON.parse(product.specData || '{}') as Record<string, string>;
                      if (spec.monthlyRental) return (
                        <div className="price-rental-block">
                          <span className="price-rental-label">月租方案</span>
                          <span className="price-rental-value">{spec.monthlyRental}</span>
                          <span className="price-rental-note">含設備維護・到期可買斷</span>
                        </div>
                      );
                    } catch { /* ignore */ }
                    return null;
                  })()}
                </div>

                {/* 加入購物車按鈕 */}
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleAddToCart}
                  disabled={!canOrder(product) || (purchaseMode === 'bulk' && !selectedTier)}
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  {getAddToCartLabel(product)}
                </Button>

              </div>
            </div>

            {/* 商品規格（Chip 風格） */}
            {(() => {
              const specs = parseSpecChips(product);
              return specs ? (
                <div className="spec-chips-section">
                  <div className="spec-chips-title">商品規格</div>
                  <div className="spec-chips">
                    {specs.map(s => (
                      <div key={s.label} className="spec-chip">
                        <span className="spec-chip-label">{s.label}</span>
                        <span className="spec-chip-value">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            {/* 商品說明 */}
            {product.description && (
              <div className="description-section">
                <div className="description-title">商品說明</div>
                <div className="description-text">{product.description}</div>
              </div>
            )}
          </>
        )}
      <BackTop visibilityHeight={300}>
        <div style={{
          height: 40, width: 40, lineHeight: '40px', borderRadius: '50%',
          backgroundColor: '#d4a574', color: '#fff', textAlign: 'center', fontSize: 20,
          boxShadow: '0 4px 12px rgba(212, 165, 116, 0.4)', cursor: 'pointer',
        }}>
          <UpOutlined />
        </div>
      </BackTop>
    </div>
    </>
  );
}
