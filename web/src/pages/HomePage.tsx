import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/productService';
import type { Product } from '../services/productService';
import { apiClient, getImageUrl } from '../config/api';
import { getSiteSettings } from '../services/siteSettingsService';
import './HomePage.css';

/** 倒數計時 hook（> 2天顯示天數，≤ 2天即時 HH:MM:SS，過期回 null） */
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

/** 首頁促銷商品卡（需抽出元件才能在迴圈裡使用 hook） */
function PromoCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const countdown = useCountdown(product.promotionEndAt);
  const isUrgent = countdown !== null && !countdown.includes('天');

  return (
    <div className="promo-card" onClick={onClick}>
      <div className="promo-card-image">
        <img
          src={getImageUrl(product.imageUrl) || 'https://placehold.co/200x200/f5ede3/d4a574/webp?text=Coffee'}
          alt={product.name}
          loading="lazy"
        />
        {product.promotionTag && (
          <span className="promo-badge">{product.promotionTag}</span>
        )}
        {countdown && (
          <span className={`promo-countdown${isUrgent ? ' urgent' : ''}`}>
            ⏱ {countdown}
          </span>
        )}
      </div>
      <div className="promo-card-body">
        <h3 className="promo-card-name">{product.name}</h3>
        {product.originalPrice && product.originalPrice > product.price ? (
          <div className="promo-price-group">
            <span className="promo-price-original">NT$ {product.originalPrice.toLocaleString()}</span>
            <span className="promo-price-sale">NT$ {product.price.toLocaleString()} <span className="promo-price-unit">/ {product.unit}</span></span>
          </div>
        ) : (
          <p className="promo-card-price">NT$ {product.price.toLocaleString()} <span className="promo-price-unit">/ {product.unit}</span></p>
        )}
        {product.shortDescription && (
          <p className="promo-card-desc">{product.shortDescription}</p>
        )}
      </div>
    </div>
  );
}

interface BulkTier { qty: number; label: string; discount: number; }

/** 大量購買商品卡 */
function BulkCard({ product, onClick }: { product: Product; onClick: () => void }) {
  let tiers: BulkTier[] = [];
  try {
    if (product.bulkOptions) tiers = JSON.parse(product.bulkOptions);
  } catch { /* ignore */ }

  return (
    <div className="bulk-card" onClick={onClick}>
      <div className="bulk-card-image">
        <img
          src={getImageUrl(product.imageUrl) || 'https://placehold.co/200x200/e8f4e8/4a7c59/webp?text=Bulk'}
          alt={product.name}
          loading="lazy"
        />
        <span className="bulk-badge">多買優惠</span>
      </div>
      <div className="bulk-card-body">
        <h3 className="bulk-card-name">{product.name}</h3>
        <p className="bulk-card-price">NT$ {product.price.toLocaleString()} <span className="bulk-card-unit">/ {product.unit}</span></p>
        {tiers.length > 0 && (
          <div className="bulk-tiers">
            {tiers.map((t, i) => (
              <span key={i} className="bulk-tier-pill">{t.label}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface HeroBanner {
  id: number;
  title: string;
  subTitle: string | null;
  buttonText: string | null;
  buttonUrl: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

interface Category {
  id: number;
  name: string;
  productCount: number;
}

interface Testimonial {
  id: number;
  content: string;
  authorName: string;
  rating: number;
  imageUrl?: string;
}

interface Store {
  id: number;
  name: string;
  address: string;
  phone: string;
  businessHours: string;
  imageUrl?: string;
}

// 預設 fallback banners（API 無資料時使用）
const DEFAULT_BANNERS: HeroBanner[] = [
  {
    id: 0,
    title: '世界頂級咖啡豆',
    subTitle: '精選衣索比亞、牙買加、巴拿馬等莊園直送。下單即享專業烘焙，48小時新鮮出貨。',
    buttonText: '立即選購',
    buttonUrl: '/products',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&h=700&fit=crop&q=85',
    sortOrder: 0,
  },
  {
    id: -1,
    title: '限時優惠 最低85折',
    subTitle: '本週精選咖啡豆限量特價，買越多省越多。多包組合購買享額外優惠。',
    buttonText: '搶購優惠',
    buttonUrl: '/products?hasPromo=true',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1920&h=700&fit=crop&q=85',
    sortOrder: 1,
  },
  {
    id: -2,
    title: '定期訂購 每月省更多',
    subTitle: '設定定期配送，每次自動享 9 折優惠。忘記買咖啡的日子一去不復返。',
    buttonText: '設定訂閱',
    buttonUrl: '/products',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&h=700&fit=crop&q=85',
    sortOrder: 2,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredTitle, setFeaturedTitle] = useState('精選商品');
  const [bulkProducts, setBulkProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [brandStoryTitle, setBrandStoryTitle] = useState('品皇咖啡的故事');
  const [brandStoryContent, setBrandStoryContent] = useState(
    '自 2010 年創立以來，品皇咖啡秉持著「專業烘焙，極致品味」的理念，精選世界各地最優質的咖啡豆，透過專業烘焙師的精湛技藝，為您呈現每一杯完美的咖啡。我們相信，好的咖啡不僅是一種飲品，更是一種生活態度，一種對品質的堅持。'
  );
  const [email, setEmail] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const [homeSearchKeyword, setHomeSearchKeyword] = useState('');

  // Hero 輪播
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>(DEFAULT_BANNERS);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroHovered, setHeroHovered] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slideTo = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const slideNext = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % heroBanners.length);
  }, [heroBanners.length]);

  const slidePrev = useCallback(() => {
    setCurrentSlide(prev => (prev - 1 + heroBanners.length) % heroBanners.length);
  }, [heroBanners.length]);

  // 自動播放
  useEffect(() => {
    if (heroBanners.length <= 1) return;
    autoPlayRef.current = setInterval(slideNext, 5000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [heroBanners.length, slideNext]);

  // Hover 暫停自動播放
  const handleHeroMouseEnter = () => {
    setHeroHovered(true);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };
  const handleHeroMouseLeave = () => {
    setHeroHovered(false);
    if (heroBanners.length > 1) {
      autoPlayRef.current = setInterval(slideNext, 5000);
    }
  };

  // Intersection Observer for scroll animations
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 載入 Hero Banners
  useEffect(() => {
    apiClient.get<HeroBanner[]>('/hero-banners')
      .then(res => {
        if (res.data && res.data.length > 0) {
          setHeroBanners(res.data);
          setCurrentSlide(0);
        }
      })
      .catch(() => {}); // 失敗則保留 DEFAULT_BANNERS
  }, []);

  // 載入分類
  useEffect(() => {
    apiClient.get<Category[]>('/categories')
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // 載入限時優惠商品（hasPromo）
  useEffect(() => {
    getProducts({ page: 1, pageSize: 8, hasPromo: true, isActive: true })
      .then(res => {
        if (res.data.length > 0) {
          setFeaturedProducts(res.data);
          setFeaturedTitle('限時優惠');
        } else {
          return getProducts({ page: 1, pageSize: 8, featured: true, isActive: true })
            .then(r => {
              if (r.data.length > 0) {
                setFeaturedProducts(r.data);
                setFeaturedTitle('精選商品');
              } else {
                return getProducts({ page: 1, pageSize: 8, isActive: true })
                  .then(r2 => {
                    setFeaturedProducts(r2.data);
                    setFeaturedTitle('熱門商品');
                  });
              }
            });
        }
      })
      .catch(() => setFeaturedProducts([]));
  }, []);

  // 載入大量購買商品（hasBulk=true，isOrderable，無 promotionTag，排除已在限時優惠的）
  useEffect(() => {
    getProducts({ page: 1, pageSize: 100, hasBulk: true, isActive: true })
      .then(res => {
        const promoIds = new Set(featuredProducts.map(p => p.id));
        const bulk = res.data.filter(
          p => p.isOrderable && !p.promotionTag && !promoIds.has(p.id)
        ).slice(0, 8);
        setBulkProducts(bulk);
      })
      .catch(() => setBulkProducts([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 載入評價
  useEffect(() => {
    apiClient.get<Testimonial[]>('/testimonials')
      .then(res => setTestimonials(res.data || []))
      .catch(() => setTestimonials([]));
  }, []);

  // 載入門市資訊
  useEffect(() => {
    apiClient.get<Store[]>('/stores')
      .then(res => setStores(res.data || []))
      .catch(() => setStores([]));
  }, []);

  // 載入品牌故事
  useEffect(() => {
    getSiteSettings()
      .then(settings => {
        if (settings.brand_story_title) setBrandStoryTitle(settings.brand_story_title);
        if (settings.brand_story_content) setBrandStoryContent(settings.brand_story_content);
      })
      .catch(() => {});
  }, []);

  // Scroll animations
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );
    return () => observerRef.current?.disconnect();
  }, []);

  useEffect(() => {
    const observer = observerRef.current;
    if (!observer) return;
    const elements = document.querySelectorAll('.animate-on-scroll:not(.animate-in)');
    elements.forEach((el) => observer.observe(el));
  }, [testimonials, stores, featuredProducts, bulkProducts]);

  // Newsletter subscription
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log('Subscribe email:', email);
      setSubscribeSuccess(true);
      setEmail('');
      setTimeout(() => setSubscribeSuccess(false), 5000);
    }
  };

  const renderStars = (rating: number) => '⭐'.repeat(Math.min(5, Math.max(1, rating)));

  return (
    <div className="home-page">
      {/* Hero Section — 全幅輪播，搜尋列整合在底部 */}
      <section
        className="hero-section"
        onMouseEnter={handleHeroMouseEnter}
        onMouseLeave={handleHeroMouseLeave}
      >
        {/* 輪播軌道 */}
        <div className="hero-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {heroBanners.map((banner, idx) => (
            <div key={banner.id} className="hero-slide" aria-hidden={idx !== currentSlide}>
              {banner.imageUrl ? (
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="hero-slide-bg"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                />
              ) : (
                <div className="hero-slide-bg hero-slide-bg-fallback" />
              )}
              <div className="hero-overlay" />
              <div className="hero-content">
                <h1 className="hero-title">{banner.title}</h1>
                {banner.subTitle && <p className="hero-subtitle">{banner.subTitle}</p>}
                {banner.buttonText && (
                  <button
                    className="hero-cta-btn"
                    onClick={() => navigate(banner.buttonUrl || '/products')}
                  >
                    {banner.buttonText.toUpperCase()}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 左右箭頭 */}
        {heroBanners.length > 1 && (
          <>
            <button
              className={`hero-arrow hero-arrow-left${heroHovered ? ' visible' : ''}`}
              onClick={slidePrev}
              aria-label="上一張"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className={`hero-arrow hero-arrow-right${heroHovered ? ' visible' : ''}`}
              onClick={slideNext}
              aria-label="下一張"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* 數字指示器 */}
        {heroBanners.length > 1 && (
          <div className="hero-indicators">
            {heroBanners.map((_, idx) => (
              <button
                key={idx}
                className={`hero-indicator${idx === currentSlide ? ' active' : ''}`}
                onClick={() => slideTo(idx)}
                aria-label={`第 ${idx + 1} 張`}
              >
                {String(idx + 1).padStart(2, '0')}
              </button>
            ))}
          </div>
        )}

        {/* 搜尋列 — 整合在 Hero 底部 */}
        <div className="hero-search-bar">
          <form
            className="hero-search-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (homeSearchKeyword.trim()) {
                navigate(`/products?keyword=${encodeURIComponent(homeSearchKeyword.trim())}`);
              }
            }}
          >
            <svg className="hero-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="hero-search-input"
              placeholder="搜尋商品名稱、品牌..."
              value={homeSearchKeyword}
              onChange={(e) => setHomeSearchKeyword(e.target.value)}
            />
            <button type="submit" className="hero-search-btn">搜尋</button>
          </form>
        </div>
      </section>

      {/* 快速分類 Pills */}
      {categories.filter(c => c.productCount > 0).length > 0 && (
        <section className="quick-categories-section">
          <div className="quick-categories">
            {categories
              .filter(c => c.productCount > 0)
              .map(c => (
                <button
                  key={c.id}
                  className="quick-cat-pill"
                  onClick={() => navigate(`/products?categoryId=${c.id}`)}
                >
                  {c.name} <span className="quick-cat-count">({c.productCount})</span>
                </button>
              ))}
          </div>
        </section>
      )}

      {/* 精選/促銷商品 — 永遠顯示（有資料才 render） */}
      {featuredProducts.length > 0 && (
        <section className="section promo-section animate-on-scroll">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">{featuredTitle}</h2>
              <p className="section-subtitle">
                {featuredTitle === '限時優惠' ? 'SPECIAL OFFERS' : featuredTitle === '精選商品' ? 'FEATURED PRODUCTS' : 'POPULAR PRODUCTS'}
              </p>
            </div>

            <div className="promo-grid">
              {featuredProducts.map((product) => (
                <PromoCard
                  key={product.id}
                  product={product}
                  onClick={() => navigate(`/products/${product.id}`)}
                />
              ))}
            </div>

            <div className="section-action">
              <button
                className="btn btn-outline"
                onClick={() => navigate('/products')}
              >
                查看所有商品
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 大量購買促銷 */}
      {bulkProducts.length > 0 && (
        <section className="section bulk-section animate-on-scroll">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">買越多省越多</h2>
              <p className="section-subtitle">BULK PURCHASE SAVINGS</p>
            </div>
            <div className="bulk-grid">
              {bulkProducts.map(product => (
                <BulkCard
                  key={product.id}
                  product={product}
                  onClick={() => navigate(`/products/${product.id}`)}
                />
              ))}
            </div>
            <div className="section-action">
              <button className="btn btn-outline" onClick={() => navigate('/products')}>
                查看更多商品
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Brand Story — 全幅背景，無佔位圖 */}
      <section className="section brand-story animate-on-scroll">
        <div className="brand-story-bg">
          <div className="container">
            <div className="brand-story-inner">
              <p className="brand-story-label">OUR STORY</p>
              <h2 className="brand-story-title">{brandStoryTitle}</h2>
              <p className="brand-story-text">{brandStoryContent}</p>
              <a href="/pages/about" className="brand-story-link">閱讀更多 →</a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="section testimonials animate-on-scroll">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">顧客怎麼說</h2>
              <p className="section-subtitle">CUSTOMER REVIEWS</p>
            </div>
            <div className="testimonial-grid">
              {testimonials.map(t => (
                <div key={t.id} className="testimonial-card">
                  <div className="testimonial-stars">{renderStars(t.rating)}</div>
                  <p className="testimonial-content">"{t.content}"</p>
                  <div className="testimonial-card-header">
                    {t.imageUrl && (
                      <img
                        src={getImageUrl(t.imageUrl) || ''}
                        alt={t.authorName}
                        className="testimonial-avatar"
                        loading="lazy"
                      />
                    )}
                    <p className="testimonial-author">- {t.authorName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Stores */}
      {stores.length > 0 && (
        <section className="section stores animate-on-scroll">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">門市資訊</h2>
              <p className="section-subtitle">OUR STORES</p>
            </div>
            <div className="stores-grid">
              {stores.map(store => (
                <div key={store.id} className="store-card">
                  {store.imageUrl && (
                    <img
                      src={getImageUrl(store.imageUrl) || ''}
                      alt={store.name}
                      className="store-card-image"
                      loading="lazy"
                    />
                  )}
                  <div className="store-card-body">
                    <h3 className="store-name">{store.name}</h3>
                    {store.address && (
                      <p className="store-detail">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="store-map-link"
                        >
                          📍 {store.address}
                        </a>
                      </p>
                    )}
                    {store.phone && <p className="store-detail">📞 {store.phone}</p>}
                    {store.businessHours && <p className="store-detail">🕐 {store.businessHours}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="section newsletter">
        <div className="container">
          <h2 className="newsletter-title">訂閱電子報，獲得最新優惠</h2>
          <p className="newsletter-subtitle">Subscribe for exclusive offers</p>
          {subscribeSuccess ? (
            <div className="newsletter-success">
              ✓ 訂閱成功！感謝您的訂閱
            </div>
          ) : (
            <form className="newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                className="newsletter-input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="newsletter-button">訂閱</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
