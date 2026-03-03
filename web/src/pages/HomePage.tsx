import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/productService';
import type { Product } from '../services/productService';
import { apiClient, getImageUrl } from '../config/api';
import { getSiteSettings } from '../services/siteSettingsService';
import './HomePage.css';

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
    title: '品皇咖啡',
    subTitle: '專業烘焙，極致品味。精選世界各地優質咖啡豆。',
    buttonText: '立即選購',
    buttonUrl: '/products',
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&h=700&fit=crop&q=85',
    sortOrder: 0,
  },
  {
    id: -1,
    title: '限時促銷特賣',
    subTitle: '精選咖啡豆限量折扣，把握最後機會。',
    buttonText: '查看優惠',
    buttonUrl: '/products',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1920&h=700&fit=crop&q=85',
    sortOrder: 1,
  },
  {
    id: -2,
    title: '訂閱享更多優惠',
    subTitle: '定期訂購享折扣，每次配送省更多。',
    buttonText: '了解訂閱',
    buttonUrl: '/products',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&h=700&fit=crop&q=85',
    sortOrder: 2,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
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

  // 載入限時優惠商品（hasPromo 優先，fallback isFeatured）
  useEffect(() => {
    getProducts({ page: 1, pageSize: 8, hasPromo: true, isActive: true })
      .then(res => {
        if (res.data.length > 0) {
          setPromoProducts(res.data);
        } else {
          return getProducts({ page: 1, pageSize: 8, featured: true, isActive: true })
            .then(r => setPromoProducts(r.data));
        }
      })
      .catch(() => setPromoProducts([]));
  }, []);

  // 載入評價（動態，從 API 取得）
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

  // 載入品牌故事（從 site-settings 取得）
  useEffect(() => {
    getSiteSettings()
      .then(settings => {
        if (settings.brand_story_title) setBrandStoryTitle(settings.brand_story_title);
        if (settings.brand_story_content) setBrandStoryContent(settings.brand_story_content);
      })
      .catch(() => {});
  }, []);

  // Scroll animations — mount 時建立 observer，stores/testimonials 載入後補 observe
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
  }, [testimonials, stores]);

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
      {/* Hero Section — Blue Bottle 風格全幅輪播 */}
      <section
        className="hero-section"
        onMouseEnter={handleHeroMouseEnter}
        onMouseLeave={handleHeroMouseLeave}
      >
        {/* 輪播軌道 */}
        <div className="hero-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {heroBanners.map((banner, idx) => (
            <div key={banner.id} className="hero-slide" aria-hidden={idx !== currentSlide}>
              {/* 背景圖 */}
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
              {/* 底部深色 gradient overlay */}
              <div className="hero-overlay" />
              {/* 文字區（左下） */}
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

        {/* 左右箭頭（hover 才顯示） */}
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

        {/* 數字指示器（右下角，Blue Bottle 風格） */}
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
      </section>

      {/* 搜尋列 — Hero 下方 */}
      <section className="hero-search-section">
        <div className="container">
          <form
            className="hero-search-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (homeSearchKeyword.trim()) {
                navigate(`/products?keyword=${encodeURIComponent(homeSearchKeyword.trim())}`);
              }
            }}
          >
            <input
              type="text"
              className="hero-search-input"
              placeholder="搜尋商品名稱、品牌..."
              value={homeSearchKeyword}
              onChange={(e) => setHomeSearchKeyword(e.target.value)}
            />
            <button type="submit" className="hero-search-btn" aria-label="搜尋">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>
        </div>
      </section>

      {/* 快速分類 Pills — Hero 下方 */}
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

      {/* 限時優惠 */}
      {promoProducts.length > 0 && (
        <section className="section promo-section animate-on-scroll">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">限時優惠</h2>
              <p className="section-subtitle">SPECIAL OFFERS</p>
            </div>

            <div className="promo-grid">
              {promoProducts.map((product) => (
                <div
                  key={product.id}
                  className="promo-card"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  <div className="promo-card-image">
                    <img
                      src={getImageUrl(product.imageUrl) || 'https://placehold.co/200x200/f5ede3/d4a574/webp?text=Coffee'}
                      alt={product.name}
                      loading="lazy"
                    />
                    {product.promotionTag && (
                      <span className="promo-badge">{product.promotionTag}</span>
                    )}
                  </div>
                  <div className="promo-card-body">
                    <h3 className="promo-card-name">{product.name}</h3>
                    <p className="promo-card-price">NT$ {product.price.toLocaleString()}</p>
                    {product.shortDescription && (
                      <p className="promo-card-desc">{product.shortDescription}</p>
                    )}
                  </div>
                </div>
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

      {/* Brand Story */}
      <section className="section brand-story animate-on-scroll">
        <div className="container">
          <div className="brand-story-grid">
            <div className="brand-story-image">
              <img
                src="https://placehold.co/600x400/8c6236/ffffff/webp?text=Coffee+Roasting"
                alt="Coffee Roasting"
                loading="lazy"
              />
            </div>
            <div className="brand-story-content">
              <h2 className="brand-story-title">{brandStoryTitle}</h2>
              <p className="brand-story-text">{brandStoryContent}</p>
              <a href="/about" className="brand-story-link">閱讀更多</a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials — 動態，空陣列時不顯示 */}
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

      {/* Stores — 動態，空陣列時不顯示 */}
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
