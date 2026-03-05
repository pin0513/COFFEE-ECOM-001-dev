import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Drawer, message } from 'antd';
import { useCartStore } from '../stores/cartStore';
import { getProducts } from '../services/productService';
import type { Product } from '../services/productService';
import { apiClient, getImageUrl } from '../config/api';
import { getSiteSettings } from '../services/siteSettingsService';
import './ProductsPage.css';

interface SubCategory { id: number; name: string; productCount?: number; }
interface Category { id: number; name: string; productCount?: number; children?: SubCategory[]; }

/** 促銷倒數計時 hook
 *  > 2 天 → "X 天後截止"（靜態文字）
 *  ≤ 2 天 → 即時 "HH:MM:SS" 倒數
 *  已過期 → null（不顯示）
 */
function useCountdown(endAt: string | null | undefined): string | null {
  const calc = (): string | null => {
    if (!endAt) return null;
    const diff = new Date(endAt).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / 86400000);
    if (days >= 2) return `${days} 天後截止`;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  const [label, setLabel] = useState<string | null>(calc);
  useEffect(() => {
    if (!endAt) { setLabel(null); return; }
    const timer = setInterval(() => setLabel(calc()), 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endAt]);
  return label;
}

/** Blue Bottle 風格商品卡 */
function ProductCard({ product, onAddToCart, onNavigate, checkoutEnabled }: {
  product: Product;
  onAddToCart: (p: Product) => void;
  onNavigate: (id: number) => void;
  checkoutEnabled: boolean;
}) {
  const countdown = useCountdown(product.promotionEndAt);

  // Badge 優先序：promotionTag > bulk > featured
  let badgeClass = '';
  let badgeText = '';
  if (product.promotionTag) {
    badgeClass = 'bb-badge promo';
    badgeText = product.promotionTag;
  } else if (product.bulkOptions) {
    badgeClass = 'bb-badge bulk';
    badgeText = 'BEST SELLER';
  } else if (product.isFeatured) {
    badgeClass = 'bb-badge featured';
    badgeText = 'FEATURED';
  }

  const showCountdown = !!countdown;
  const isUrgent = showCountdown && countdown !== null && !countdown.includes('天');
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
        {showCountdown && <span className={`bb-countdown${isUrgent ? ' urgent' : ''}`}>⏱ {countdown}</span>}
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
  const [draftPromo, setDraftPromo] = useState(false);

  // 已套用的篩選
  const [filterBulk, setFilterBulk] = useState(false);
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
      if (filterPromo) params.hasPromo = true;
      if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();
      const response = await getProducts(params);
      setProducts(response.data);
    } catch {
      message.error('載入商品失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, filterBulk, filterPromo, debouncedKeyword]);

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
    setDraftPromo(filterPromo);
    setFilterDrawerOpen(true);
  };

  const applyFilter = () => {
    if (draftCatId === null) setSearchParams({});
    else setSearchParams({ categoryId: String(draftCatId) });
    setFilterBulk(draftBulk);
    setFilterPromo(draftPromo);
    setFilterDrawerOpen(false);
  };

  const clearFilter = () => {
    setDraftCatId(null);
    setDraftBulk(false);
    setDraftPromo(false);
  };

  const activeFilterCount =
    (selectedCategoryId ? 1 : 0) +
    (filterBulk ? 1 : 0) +
    (filterPromo ? 1 : 0);

  const currentCategory = categories.find(c => c.id === selectedCategoryId)
    ?? categories.flatMap(c => c.children ?? []).find(sc => sc.id === selectedCategoryId)
    ?? null;
  const pageTitle = currentCategory ? currentCategory.name : '我們的咖啡';

  const scrollToTop = () => {
    pageTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const helmetTitle = currentCategory
    ? `${currentCategory.name} | 品皇咖啡`
    : '所有商品 | 品皇咖啡';
  const helmetDesc = currentCategory
    ? `瀏覽品皇咖啡${currentCategory.name}系列，精選優質咖啡豆，品質保證。`
    : '瀏覽品皇咖啡所有商品，精選阿拉比卡單品、義式配方豆、即期特價品等。';

  return (
    <>
    <Helmet>
      <title>{helmetTitle}</title>
      <meta name="description" content={helmetDesc} />
      <meta property="og:title" content={helmetTitle} />
      <meta property="og:description" content={helmetDesc} />
      <meta property="og:url" content="https://pinhung.com/products" />
      <meta property="og:type" content="website" />
    </Helmet>
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

      {/* 分類快速篩選 Pills — 第一層 */}
      <div className="bb-category-pills">
        <button
          className={`bb-cat-pill${!selectedCategoryId ? ' active' : ''}`}
          onClick={() => setSearchParams({})}
        >
          全部
        </button>
        {categories
          .filter(c => (c.productCount ?? 0) > 0 || (c.children?.some(sc => (sc.productCount ?? 0) > 0)))
          .map(c => {
            const totalCount = (c.productCount ?? 0) + (c.children?.reduce((s, sc) => s + (sc.productCount ?? 0), 0) ?? 0);
            const isParentActive = selectedCategoryId === c.id || c.children?.some(sc => sc.id === selectedCategoryId);
            return (
              <button
                key={c.id}
                className={`bb-cat-pill${isParentActive ? ' active' : ''}`}
                onClick={() => setSearchParams({ categoryId: String(c.id) })}
              >
                {c.name} <span className="bb-cat-count">({totalCount})</span>
              </button>
            );
          })}
      </div>

      {/* 分類快速篩選 Pills — 第二層（子分類，僅當選中有 children 的父分類時顯示）*/}
      {(() => {
        const activePar = categories.find(c =>
          selectedCategoryId === c.id || c.children?.some(sc => sc.id === selectedCategoryId)
        );
        if (!activePar?.children?.length) return null;
        return (
          <div className="bb-subcategory-pills">
            <button
              className={`bb-subcat-pill${selectedCategoryId === activePar.id ? ' active' : ''}`}
              onClick={() => setSearchParams({ categoryId: String(activePar.id) })}
            >
              全部{activePar.name}
            </button>
            {activePar.children
              .filter(sc => (sc.productCount ?? 0) > 0)
              .map(sc => (
                <button
                  key={sc.id}
                  className={`bb-subcat-pill${selectedCategoryId === sc.id ? ' active' : ''}`}
                  onClick={() => setSearchParams({ categoryId: String(sc.id) })}
                >
                  {sc.name} <span className="bb-cat-count">({sc.productCount})</span>
                </button>
              ))}
          </div>
        );
      })()}

      {/* 商品 Grid */}
      {loading ? (
        <div className="bb-loading"><div className="bb-spinner" /></div>
      ) : products.length === 0 ? (
        <div className="bb-empty">
          <p>目前沒有符合條件的商品，請調整篩選條件</p>
          <button className="bb-empty-reset" onClick={() => { setSearchParams({}); setFilterBulk(false); setFilterPromo(false); }}>
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
            <Fragment key={c.id}>
              <label className="bb-filter-radio">
                <input type="radio" name="cat" checked={draftCatId === c.id} onChange={() => setDraftCatId(c.id)} />
                <span>{c.name}</span>
              </label>
              {c.children?.map(sc => (
                <label key={sc.id} className="bb-filter-radio bb-filter-radio--sub">
                  <input type="radio" name="cat" checked={draftCatId === sc.id} onChange={() => setDraftCatId(sc.id)} />
                  <span>└ {sc.name}</span>
                </label>
              ))}
            </Fragment>
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
    </>
  );
}
