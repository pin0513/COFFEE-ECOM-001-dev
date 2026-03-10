import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { getProducts } from '../services/productService';
import type { Product } from '../services/productService';
import { apiClient, getImageUrl } from '../config/api';
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

/** 我是誰？場景導入區塊 */
function ScenarioSection({ onNavigate }: { onNavigate: (path: string) => void }) {
  const scenarios = [
    {
      title: '在家享用',
      desc: '為自己選一支每天喝的豆',
      cta: '開始選購',
      link: '/products',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
    },
    {
      title: '大量採購・飯店餐飲',
      desc: '20 箱以上享批發優惠，含專屬配送與顧問服務',
      cta: '了解合作方案',
      link: '/business#bulk',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/>
        </svg>
      ),
    },
    {
      title: '咖啡機租賃方案',
      desc: '從辦公室到星級飯店，機器 × 豆源 × 維護一站搞定',
      cta: '查看方案',
      link: '/business',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      ),
    },
  ];

  return (
    <section className="scenario-section">
      <div className="container">
        <h2 className="scenario-heading">選擇你的咖啡需求</h2>
        <div className="scenario-cards">
          {scenarios.map(s => (
            <div key={s.title} className="scenario-card" onClick={() => onNavigate(s.link)}>
              <span className="scenario-icon">{s.icon}</span>
              <div className="scenario-card-body">
                <h3 className="scenario-card-title">{s.title}</h3>
                <p className="scenario-card-desc">{s.desc}</p>
                <span className="scenario-cta">{s.cta} →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** 沖煮情境 全幅分隔橫幅 */
function BrewBanner() {
  return (
    <div className="brew-banner">
      <div className="brew-banner-inner">
        <p className="brew-banner-text">烘好三天內出貨，趁新鮮最香</p>
        <p className="brew-banner-sub">每一包都是為你而烘</p>
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
    title: '源自 1989，嘉義工藝烘焙',
    subTitle: 'ISO 三重認證嚴格把關，七十款精選直售無差價。零售批發，皆以同等品質服務。',
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
];

export default function HomePage() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredTitle, setFeaturedTitle] = useState('精選商品');
  const [bulkProducts, setBulkProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
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



  const renderStars = (rating: number) => '⭐'.repeat(Math.min(5, Math.max(1, rating)));

  return (
    <>
    <Helmet>
      <title>品皇咖啡 | 咖啡豆批發・咖啡機租賃・代工加工 | 嘉義1989</title>
      <meta name="description" content="品皇咖啡（后政企業，1989年創立）嘉義烘焙廠直售。提供咖啡豆批發零售、咖啡機租賃、食品代工加工、咖啡研發服務。ISO22000/HACCP/ISO9001認證，70款以上任選。" />
      <meta property="og:title" content="品皇咖啡 | 咖啡豆批發・咖啡機租賃・代工加工" />
      <meta property="og:description" content="品皇咖啡（后政企業，1989年創立）嘉義烘焙廠直售。提供咖啡豆批發零售、咖啡機租賃、食品代工加工、咖啡研發服務。ISO22000/HACCP/ISO9001認證。" />
      <meta property="og:url" content="https://pinhung.com/" />
      <meta property="og:type" content="website" />
    </Helmet>
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

      {/* 我是誰？場景導入 */}
      <ScenarioSection onNavigate={navigate} />

      {/* 精選/促銷商品 — 永遠顯示（有資料才 render） */}
      {featuredProducts.length > 0 && (
        <section className="section promo-section animate-on-scroll">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">{featuredTitle === '限時優惠' ? '本月精選' : featuredTitle}</h2>
              <p className="section-subtitle">依你的喜好探索</p>
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
                繼續探索
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 沖煮情境橫幅 */}
      <BrewBanner />

      {/* 新手入門推薦 */}
      {bulkProducts.length > 0 && (
        <section className="section bulk-section animate-on-scroll">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">新手入門推薦</h2>
              <p className="section-subtitle">第一包買什麼？這裡有答案</p>
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
                繼續探索
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="section testimonials animate-on-scroll">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">他們喝了怎麼說</h2>
              <p className="section-subtitle">真實顧客評價</p>
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

      {/* CoffeeKM 咖啡知識地圖 */}
      <section className="coffeekm-section animate-on-scroll">
        <div className="coffeekm-bg">
          <div className="container">
            <div className="coffeekm-inner">
              <div className="coffeekm-text">
                <p className="coffeekm-label">深度咖啡知識平台</p>
                <h2 className="coffeekm-title">咖啡知識地圖</h2>
                <p className="coffeekm-desc">
                  從產區風土到沖煮技法，從品種圖鑑到烘焙曲線，一站式咖啡知識探索平台，讓你喝懂每一杯咖啡的故事。
                </p>
                <div className="coffeekm-tags">
                  <span className="coffeekm-tag">🌍 產區故事</span>
                  <span className="coffeekm-tag">☕ 沖煮技法</span>
                  <span className="coffeekm-tag">🌱 品種圖鑑</span>
                  <span className="coffeekm-tag">🔥 烘焙知識</span>
                </div>
                <a href="https://coffeekm.pinhung.com" target="_blank" rel="noopener noreferrer" className="coffeekm-cta">
                  探索咖啡知識地圖 →
                </a>
              </div>
              <div className="coffeekm-visual">
                <div className="coffeekm-card-mini">
                  <div className="coffeekm-card-mini-icon">🗺️</div>
                  <p className="coffeekm-card-mini-title">互動產區地圖</p>
                  <p className="coffeekm-card-mini-desc">點擊地圖探索各地咖啡風味</p>
                </div>
                <div className="coffeekm-card-mini">
                  <div className="coffeekm-card-mini-icon">📖</div>
                  <p className="coffeekm-card-mini-title">知識文章庫</p>
                  <p className="coffeekm-card-mini-desc">深度咖啡知識，持續更新</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

    </div>
    </>
  );
}
