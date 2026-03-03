import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Drawer, message } from 'antd';
import { useCartStore } from '../stores/cartStore';
import { getProducts } from '../services/productService';
import type { Product } from '../services/productService';
import { apiClient, getImageUrl } from '../config/api';
import { getSiteSettings } from '../services/siteSettingsService';
import './ProductsPage.css';

interface Category { id: number; name: string; productCount?: number; }

/** 促銷倒數計時 hook */
function useCountdown(endAt: string | null | undefined): string {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!endAt) { setRemaining(''); return; }
    const tick = () => {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining('已截止'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [endAt]);
  return remaining;
}

/** Blue Bottle 風格商品卡 */
function ProductCard({ product, onAddToCart, onNavigate, checkoutEnabled }: {
  product: Product;
  onAddToCart: (p: Product) => void;
  onNavigate: (id: number) => void;
  checkoutEnabled: boolean;
}) {
  const countdown = useCountdown(product.promotionEndAt);

  // Badge 優先序：promotionTag > bulk > subscription > featured
  let badgeClass = '';
  let badgeText = '';
  if (product.promotionTag) {
    badgeClass = 'bb-badge promo';
    badgeText = product.promotionTag;
  } else if (product.bulkOptions) {
    badgeClass = 'bb-badge bulk';
    badgeText = 'BEST SELLER';
  } else if (product.subscriptionOptions) {
    badgeClass = 'bb-badge sub';
    badgeText = 'SUBSCRIBE';
  } else if (product.isFeatured) {
    badgeClass = 'bb-badge featured';
    badgeText = 'FEATURED';
  }

  const showCountdown = product.promotionEndAt && countdown && countdown !== '已截止';
  const canAddToCart = checkoutEnabled && product.isOrderable && product.price > 0;
  const imgSrc = getImageUrl(product.imageUrl) || 'https://placehold.co/600x700/f0ece4/c5a882/webp?text=Coffee';

  const addBtnLabel = !checkoutEnabled
    ? '暫停接受訂單'
    : product.price === 0
      ? '未設定售價'
      : !product.isOrderable
        ? '暫停販售'
        : 'ADD TO CART';

  return (
    <div className="bb-card">
      {/* 圖片區 — 點擊進入詳情 */}
      <div className="bb-card-image" onClick={() => onNavigate(product.id)}>
        <img src={imgSrc} alt={product.name} loading="lazy" />
        {badgeText && <span className={badgeClass}>{badgeText}</span>}
        {showCountdown && <span className="bb-countdown">⏱ {countdown}</span>}
      </div>

      {/* 文字區 */}
      <div className="bb-card-body">
        <div className="bb-card-name-row">
          <span className="bb-card-name" onClick={() => onNavigate(product.id)}>
            {product.name}
          </span>
          <div className="bb-card-price-col">
            {product.originalPrice && product.originalPrice > product.price ? (
              <>
                <span className="bb-card-price-original">NT${product.originalPrice.toLocaleString()}</span>
                <span className="bb-card-price-sale">NT${product.price.toLocaleString()}<span className="bb-card-unit"> / {product.unit}</span></span>
              </>
            ) : (
              <span className="bb-card-price">NT${product.price.toLocaleString()}<span className="bb-card-unit"> / {product.unit}</span></span>
            )}
          </div>
        </div>
        {product.categoryName && (
          <div className="bb-card-sub">{product.categoryName}</div>
        )}
        {product.shortDescription && (
          <div className="bb-card-tagline">{product.shortDescription}</div>
        )}
        <button
          className={`bb-add-btn${!canAddToCart ? ' disabled' : ''}`}
          disabled={!canAddToCart}
          onClick={(e) => { e.stopPropagation(); if (canAddToCart) onAddToCart(product); }}
        >
          {addBtnLabel}
        </button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutEnabled, setCheckoutEnabled] = useState(true);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const pageTopRef = useRef<HTMLDivElement>(null);

  // 搜尋
  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('keyword') || '');
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchParams.get('keyword') || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 草稿篩選（Drawer 內操作，Apply 才生效）
  const [draftCatId, setDraftCatId] = useState<number | null>(null);
  const [draftBulk, setDraftBulk] = useState(false);
  const [draftSub, setDraftSub] = useState(false);
  const [draftPromo, setDraftPromo] = useState(false);

  // 已套用的篩選
  const [filterBulk, setFilterBulk] = useState(false);
  const [filterSub, setFilterSub] = useState(false);
  const [filterPromo, setFilterPromo] = useState(searchParams.get('hasPromo') === 'true');

  const { addToCart } = useCartStore();

  const categoryIdParam = searchParams.get('categoryId');
  const selectedCategoryId = categoryIdParam ? Number(categoryIdParam) : null;

  useEffect(() => {
    getSiteSettings().then(s => setCheckoutEnabled(s.checkout_enabled !== 'false')).catch(() => {});
  }, []);

  // 搜尋 debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedKeyword(searchKeyword), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchKeyword]);

  // Scroll-to-top visibility
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    apiClient.get<Category[]>('/categories').then(res => setCategories(res.data || [])).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page: 1, pageSize: 100, isActive: true };
      if (selectedCategoryId) params.categoryId = selectedCategoryId;
      if (filterBulk) params.hasBulk = true;
      if (filterSub) params.hasSub = true;
      if (filterPromo) params.hasPromo = true;
      if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();
      const response = await getProducts(params);
      setProducts(response.data);
    } catch {
      message.error('載入商品失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, filterBulk, filterSub, filterPromo, debouncedKeyword]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleAddToCart = (product: Product) => {
    if (!checkoutEnabled) { message.warning('網站目前暫停接受訂單'); return; }
    if (product.price === 0) { message.warning('此商品尚未設定售價'); return; }
    if (!product.isOrderable) { message.warning('此商品目前無法下單'); return; }
    addToCart({
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      image: getImageUrl(product.imageUrl) || '',
      description: product.shortDescription || '',
      category: product.categoryName || '',
      requirePrePayment: product.requirePrePayment,
    });
    message.success(`${product.name} 已加入購物車`);
  };

  // 開啟 Drawer，同步草稿狀態
  const openFilter = () => {
    setDraftCatId(selectedCategoryId);
    setDraftBulk(filterBulk);
    setDraftSub(filterSub);
    setDraftPromo(filterPromo);
    setFilterDrawerOpen(true);
  };

  const applyFilter = () => {
    if (draftCatId === null) setSearchParams({});
    else setSearchParams({ categoryId: String(draftCatId) });
    setFilterBulk(draftBulk);
    setFilterSub(draftSub);
    setFilterPromo(draftPromo);
    setFilterDrawerOpen(false);
  };

  const clearFilter = () => {
    setDraftCatId(null);
    setDraftBulk(false);
    setDraftSub(false);
    setDraftPromo(false);
  };

  const activeFilterCount =
    (selectedCategoryId ? 1 : 0) +
    (filterBulk ? 1 : 0) +
    (filterSub ? 1 : 0) +
    (filterPromo ? 1 : 0);

  const currentCategory = categories.find(c => c.id === selectedCategoryId);
  const pageTitle = currentCategory ? currentCategory.name : '我們的咖啡';

  const scrollToTop = () => {
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bb-products-page">
      {/* 頁面頂部錨點（scroll-to-top 目標） */}
      <div ref={pageTopRef} />

      {/* 頁面標題列 */}
      <div className="bb-page-header">
        <div className="bb-page-header-inner">
          <h1 className="bb-page-title">{pageTitle}</h1>
          <button className="bb-filter-btn" onClick={openFilter}>
            FILTER
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="4" y1="12" x2="20" y2="12"/>
              <line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
            {activeFilterCount > 0 && <span className="bb-filter-count">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      {/* 搜尋框 */}
      <div className="bb-search-wrapper">
        <div className="bb-search-box">
          <svg className="bb-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="bb-search-input"
            placeholder="搜尋商品名稱、品牌..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          {searchKeyword && (
            <button className="bb-search-clear" onClick={() => setSearchKeyword('')} aria-label="清除搜尋">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 分類快速篩選 Pills */}
      <div className="bb-category-pills">
        <button
          className={`bb-cat-pill${!selectedCategoryId ? ' active' : ''}`}
          onClick={() => setSearchParams({})}
        >
          全部
        </button>
        {categories
          .filter(c => (c.productCount ?? 0) > 0)
          .map(c => (
            <button
              key={c.id}
              className={`bb-cat-pill${selectedCategoryId === c.id ? ' active' : ''}`}
              onClick={() => setSearchParams({ categoryId: String(c.id) })}
            >
              {c.name} <span className="bb-cat-count">({c.productCount})</span>
            </button>
          ))}
      </div>

      {/* 商品 Grid */}
      {loading ? (
        <div className="bb-loading"><div className="bb-spinner" /></div>
      ) : products.length === 0 ? (
        <div className="bb-empty">
          <p>目前沒有符合條件的商品，請調整篩選條件</p>
          <button className="bb-empty-reset" onClick={() => { setSearchParams({}); setFilterBulk(false); setFilterSub(false); setFilterPromo(false); }}>
            清除篩選
          </button>
        </div>
      ) : (
        <div className="bb-grid">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onNavigate={id => navigate(`/products/${id}`)}
              checkoutEnabled={checkoutEnabled}
            />
          ))}
        </div>
      )}

      {/* Filter 抽屜（Blue Bottle 風格） */}
      <Drawer
        title={<span style={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: 16 }}>Filter</span>}
        placement="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        width={360}
        styles={{ body: { padding: '24px', paddingBottom: 100 } }}
        footer={
          <div className="bb-drawer-footer">
            <button className="bb-drawer-clear" onClick={clearFilter}>CLEAR ALL</button>
            <button className="bb-drawer-apply" onClick={applyFilter}>
              APPLY{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>
        }
      >
        {/* 分類 */}
        <div className="bb-filter-section">
          <div className="bb-filter-section-title">分類</div>
          <label className="bb-filter-radio">
            <input type="radio" name="cat" checked={draftCatId === null} onChange={() => setDraftCatId(null)} />
            <span>全部商品</span>
          </label>
          {categories.map(c => (
            <label key={c.id} className="bb-filter-radio">
              <input type="radio" name="cat" checked={draftCatId === c.id} onChange={() => setDraftCatId(c.id)} />
              <span>{c.name}</span>
            </label>
          ))}
        </div>

        {/* 購買模式 */}
        <div className="bb-filter-section">
          <div className="bb-filter-section-title">購買模式</div>
          <label className="bb-filter-checkbox">
            <input type="checkbox" checked={draftBulk} onChange={e => setDraftBulk(e.target.checked)} />
            <span>多買優惠</span>
          </label>
          <label className="bb-filter-checkbox">
            <input type="checkbox" checked={draftSub} onChange={e => setDraftSub(e.target.checked)} />
            <span>可訂閱</span>
          </label>
          <label className="bb-filter-checkbox">
            <input type="checkbox" checked={draftPromo} onChange={e => setDraftPromo(e.target.checked)} />
            <span>促銷特惠</span>
          </label>
        </div>
      </Drawer>

      {/* Scroll-to-top button */}
      {showScrollTop && (
        <button
          className="bb-scroll-top"
          onClick={scrollToTop}
          aria-label="回到頂部"
          title="回到篩選區"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="18 15 12 9 6 15"/>
          </svg>
        </button>
      )}
    </div>
  );
}
