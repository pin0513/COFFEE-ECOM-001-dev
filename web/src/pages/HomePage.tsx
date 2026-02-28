import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../services/productService';
import type { Product } from '../services/productService';
import { apiClient, getImageUrl } from '../config/api';
import { getSiteSettings } from '../services/siteSettingsService';
import './HomePage.css';

interface Category {
  id: number;
  name: string;
  icon?: string;
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

// 首頁展示的 3 大分類（依 DB name 比對）
const SHOWCASE_CATEGORIES = [
  { match: '精品咖啡豆',     icon: '☕', label: '咖啡豆',   en: 'Coffee Beans' },
  { match: '咖啡機/沖煮器材', icon: '⚙️', label: '沖煮器材', en: 'Equipment'    },
  { match: '糖漿/醬料',      icon: '🍯', label: '糖漿',     en: 'Syrups'       },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [brandStoryTitle, setBrandStoryTitle] = useState('品皇咖啡的故事');
  const [brandStoryContent, setBrandStoryContent] = useState(
    '自 2010 年創立以來，品皇咖啡秉持著「專業烘焙，極致品味」的理念，精選世界各地最優質的咖啡豆，透過專業烘焙師的精湛技藝，為您呈現每一杯完美的咖啡。我們相信，好的咖啡不僅是一種飲品，更是一種生活態度，一種對品質的堅持。'
  );
  const [email, setEmail] = useState('');
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  // Intersection Observer for scroll animations
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 載入分類
  useEffect(() => {
    apiClient.get<Category[]>('/categories')
      .then(res => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // 載入精選商品
  useEffect(() => {
    getProducts({ page: 1, pageSize: 4, featured: true, isActive: true })
      .then(res => setFeaturedProducts(res.data))
      .catch(() => setFeaturedProducts([]));
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
      // TODO: Implement newsletter API
      console.log('Subscribe email:', email);
      setSubscribeSuccess(true);
      setEmail('');
      setTimeout(() => setSubscribeSuccess(false), 5000);
    }
  };

  const renderStars = (rating: number) => '⭐'.repeat(Math.min(5, Math.max(1, rating)));

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">品皇咖啡 Pin Huang Coffee</h1>
          <p className="hero-subtitle">專業烘焙，極致品味</p>
          <div className="hero-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/products')}
            >
              立即選購
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/products')}
            >
              了解更多
            </button>
          </div>
        </div>
      </section>

      {/* Categories Quick Nav — Hero 正下方，第一個入口 */}
      <section className="section categories animate-on-scroll">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">探索我們的產品</h2>
            <p className="section-subtitle">EXPLORE OUR PRODUCTS</p>
          </div>

          <div className="category-grid">
            {SHOWCASE_CATEGORIES.map(sc => {
              const cat = categories.find(c => c.name === sc.match);
              const url = cat ? `/products?categoryId=${cat.id}` : '/products';
              return (
                <div key={sc.match} className="category-card" onClick={() => navigate(url)}>
                  <div className="category-icon">{sc.icon}</div>
                  <h3 className="category-name">{sc.label}</h3>
                  <p className="category-name-en">{sc.en}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section featured-products animate-on-scroll">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">精選商品</h2>
            <p className="section-subtitle">FEATURED PRODUCTS</p>
          </div>

          <div className="product-grid">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="product-card"
                onClick={() => navigate(`/products/${product.id}`)}
              >
                <div className="product-image">
                  <img
                    src={getImageUrl(product.imageUrl) || 'https://placehold.co/400x400/f5ede3/d4a574/webp?text=Coffee'}
                    alt={product.name}
                    loading="lazy"
                  />
                </div>
                <h3 className="product-name">{product.name}</h3>
                <p className="product-price">NT$ {product.price}</p>
              </div>
            ))}
          </div>

          <div className="section-action">
            <button
              className="btn btn-outline"
              onClick={() => navigate('/products')}
            >
              查看更多商品
            </button>
          </div>
        </div>
      </section>

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
                    {store.address && <p className="store-detail">📍 {store.address}</p>}
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

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-column">
              <img
                src="/assets/images/logo/logo-dark-bg.svg"
                alt="品皇咖啡"
                className="footer-logo"
              />
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">關於我們</h4>
              <ul className="footer-links">
                <li><a href="/about">公司簡介</a></li>
                <li><a href="/products">產品分類</a></li>
                <li><a href="/quality">品質保證</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">聯絡我們</h4>
              <ul className="footer-links">
                <li><a href="/contact">聯絡方式</a></li>
                <li><a href="/faq">常見問題</a></li>
                <li><a href="/shipping">配送說明</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">社群媒體</h4>
              <ul className="footer-links">
                <li><a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a></li>
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a href="https://line.me" target="_blank" rel="noopener noreferrer">LINE</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              © 2026 Pin Huang Coffee. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
