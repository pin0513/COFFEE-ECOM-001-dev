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
import MachineInquiryModal from '../components/MachineInquiryModal';
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

function GalleryViewer({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const validImages = images.filter(Boolean);
  if (validImages.length === 0) return (
    <img src="https://placehold.co/600x500/f5ede3/d4a574/webp?text=Coffee" alt={alt}
      style={{ width: '100%', borderRadius: 12, objectFit: 'cover', aspectRatio: '4/3' }} />
  );
  return (
    <div className="gallery-viewer">
      <div className="gallery-main-wrap">
        <img
          key={active}
          src={validImages[active]}
          alt={`${alt} ${active + 1}`}
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/600x500/f5ede3/d4a574/webp?text=Coffee'; }}
          className="gallery-main-img"
        />
        {validImages.length > 1 && (
          <>
            <button className="gallery-arrow gallery-arrow--prev" onClick={() => setActive(i => (i - 1 + validImages.length) % validImages.length)}>‹</button>
            <button className="gallery-arrow gallery-arrow--next" onClick={() => setActive(i => (i + 1) % validImages.length)}>›</button>
            <span className="gallery-counter">{active + 1} / {validImages.length}</span>
          </>
        )}
      </div>
      {validImages.length > 1 && (
        <div className="gallery-thumbs">
          {validImages.map((url, i) => (
            <button key={i} className={`gallery-thumb${i === active ? ' active' : ''}`} onClick={() => setActive(i)}>
              <img src={url} alt={`${alt} thumb ${i + 1}`}
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/f5ede3/d4a574/webp?text=x'; }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutEnabled, setCheckoutEnabled] = useState(true);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [selectedInstallment, setSelectedInstallment] = useState<number | null>(null);
  const [machineDirectCheckout, setMachineDirectCheckout] = useState(false);
  const [machineInstallment, setMachineInstallment] = useState(true);
  const [machineOnetime, setMachineOnetime] = useState(true);
  const [showMachineModal, setShowMachineModal] = useState(false);

  // 購買模式
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('oneTime');
  const [selectedTier, setSelectedTier] = useState<BulkTier | null>(null);
  // 研磨選項
  const [grindChoice, setGrindChoice] = useState<'whole' | 'grind'>('whole');
  const [grindLevel, setGrindLevel] = useState<string>('手沖');
  const { addToCart } = useCartStore();

  useEffect(() => {
    getSiteSettings().then(s => {
      setCheckoutEnabled(s.checkout_enabled !== 'false');
      setMachineDirectCheckout(s.machine_direct_checkout_enabled === 'true');
      setMachineInstallment(s.machine_installment_enabled !== 'false');
      setMachineOnetime(s.machine_onetime_enabled !== 'false');
    }).catch(() => {});
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

  const handleInquirySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setInquirySubmitting(true);
    setInquiryError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: fd.get('contactName') as string,
          phone: fd.get('phone') as string,
          company: fd.get('company') as string || undefined,
          message: fd.get('message') as string || undefined,
          inquiryType: 'machine-rental',
          productName: product?.name,
          quantity: parseInt(fd.get('quantity') as string) || 1,
          preferredPeriod: fd.get('preferredPeriod') as string || undefined,
        }),
      });
      if (!res.ok) throw new Error('送出失敗');
      setInquirySuccess(true);
    } catch {
      setInquiryError('送出失敗，請稍後再試或直接來電');
    } finally {
      setInquirySubmitting(false);
    }
  };

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
  const ogDesc = product ? (product.shortDescription || product.description || '品皇咖啡精選商品，涵蓋商用咖啡機（可分期租賃）與精品咖啡豆，ISO22000認證品質保證。') : '品皇咖啡精選商品，涵蓋商用咖啡機（可分期租賃）與精品咖啡豆，ISO22000認證品質保證。';
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
              {/* 左：商品圖片 + Gallery */}
              {(() => {
                const mainImg = getImageUrl(product.imageUrl) || 'https://placehold.co/600x500/f5ede3/d4a574/webp?text=Coffee';
                let gallery: string[] = [];
                try { gallery = JSON.parse(product.galleryImages || '[]'); } catch { gallery = []; }
                const allImgs = [mainImg, ...gallery.map(u => getImageUrl(u) || u)];
                return (
                  <GalleryViewer images={allImgs} alt={product.name} />
                );
              })()}

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
                          {Math.round(product.price / product.originalPrice! * 10 * 10) / 10} 折
                        </span>
                      )}
                    </div>
                  )}
                  {/* 咖啡機方案入口（免費借機說明） */}
                  {product.categoryId === 10 && (
                    <div className="price-rental-block">
                      <span className="price-rental-label">咖啡機方案</span>
                      <span className="price-rental-note">免費借機・低價租售・唯一條件：跟我們買咖啡豆</span>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                        <button
                          className="rental-inquiry-btn"
                          onClick={() => { setShowRentalModal(true); setInquirySuccess(false); setInquiryError(''); }}
                        >
                          申請方案 →
                        </button>
                        <button
                          className="rental-inquiry-btn"
                          style={{ background: 'transparent', color: '#1a1a2e', border: '1px solid #1a1a2e' }}
                          onClick={() => window.location.href = '/machine-plan'}
                        >
                          了解詳情
                        </button>
                      </div>
                    </div>
                  )}
                  {/* 刷卡分期（價格 >= 25000 才顯示） */}
                  {product.price >= 25000 && (
                    <div className="installment-block">
                      <span className="installment-label">刷卡分期</span>
                      <div className="installment-btns">
                        {[6, 12, 18, 24].map(n => (
                          <button
                            key={n}
                            className={`installment-btn${selectedInstallment === n ? ' selected' : ''}`}
                            onClick={() => setSelectedInstallment(selectedInstallment === n ? null : n)}
                          >
                            {n}期
                          </button>
                        ))}
                      </div>
                      {selectedInstallment && (
                        <span className="installment-calc">
                          每期約 NT${Math.ceil(product.price / selectedInstallment).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 加入購物車按鈕（機器直接詢購模式時隱藏） */}
                {!(machineDirectCheckout && product.categoryId === 10) && (
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
                )}

                {/* 立即詢購按鈕（咖啡機 + 直接詢購模式） */}
                {machineDirectCheckout && product.categoryId === 10 && (
                  <Button
                    size="large"
                    onClick={() => setShowMachineModal(true)}
                    style={{
                      width: '100%',
                      marginBottom: 12,
                      background: '#e8293b',
                      borderColor: '#e8293b',
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  >
                    立即詢購 / 分期申請
                  </Button>
                )}

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
                <div className="description-text" dangerouslySetInnerHTML={{ __html: product.description || '' }} />
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

      {/* 特殊方案詢問 Modal */}
      {showRentalModal && product && (
        <div className="rental-modal-backdrop" onClick={() => { setShowRentalModal(false); setInquirySuccess(false); setInquiryError(''); }}>
          <div className="rental-modal" onClick={e => e.stopPropagation()}>
            <button className="rental-modal-close" onClick={() => { setShowRentalModal(false); setInquirySuccess(false); setInquiryError(''); }}>✕</button>
            <h3 className="rental-modal-title">特殊方案詢問</h3>
            <p className="rental-modal-product">{product.name}</p>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
              如需不同台數、期數或其他客製方案，請填寫以下資料，業務將於 1 個工作日內聯繫。
            </p>
            {inquirySuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#52c41a' }}>
                <div style={{ fontSize: 32 }}>✓</div>
                <div style={{ marginTop: 8, fontWeight: 600 }}>詢問單已送出</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>我們將於 1 個工作日內與您聯繫</div>
                <button className="rental-modal-btn rental-modal-btn--line" style={{ marginTop: 16 }}
                  onClick={() => { setShowRentalModal(false); setInquirySuccess(false); }}>關閉</button>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>台數</label>
                    <input type="number" min={1} defaultValue={1} name="quantity" style={{ width: '100%', padding: '8px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>偏好期數（月）</label>
                    <select name="preferredPeriod" style={{ width: '100%', padding: '8px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14 }}>
                      <option value="">不限</option>
                      <option value="12">12 期</option>
                      <option value="24">24 期</option>
                      <option value="36">36 期</option>
                      <option value="48">48 期</option>
                      <option value="60">60 期</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>姓名 <span style={{ color: '#e8293b' }}>*</span></label>
                  <input required name="contactName" placeholder="請輸入姓名" style={{ width: '100%', padding: '8px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>聯絡電話 <span style={{ color: '#e8293b' }}>*</span></label>
                  <input required name="phone" type="tel" placeholder="請輸入電話" style={{ width: '100%', padding: '8px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>店名 / 公司</label>
                  <input name="company" placeholder="（選填）" style={{ width: '100%', padding: '8px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14 }} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>備註</label>
                  <textarea name="message" placeholder="其他需求或問題" rows={3} style={{ width: '100%', padding: '8px 10px', border: '1px solid #d9d9d9', borderRadius: 6, fontSize: 14, resize: 'none' }} />
                </div>
                {inquiryError && <p style={{ color: '#e8293b', fontSize: 13, marginBottom: 8 }}>{inquiryError}</p>}
                <button type="submit" disabled={inquirySubmitting} style={{ width: '100%', padding: '10px', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: inquirySubmitting ? 'not-allowed' : 'pointer' }}>
                  {inquirySubmitting ? '送出中...' : '送出詢問'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 咖啡機詢購 Modal */}
      {product && (
        <MachineInquiryModal
          open={showMachineModal}
          onClose={() => setShowMachineModal(false)}
          product={{ id: product.id, name: product.name, price: product.price, sku: product.sku }}
          installmentEnabled={machineInstallment}
          onetimeEnabled={machineOnetime}
        />
      )}
    </div>
    </>
  );
}
