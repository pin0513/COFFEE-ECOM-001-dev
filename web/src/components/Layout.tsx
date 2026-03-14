import { type ReactNode, useState, useEffect, useMemo } from 'react';
import { Dropdown, Avatar, message } from 'antd';
import { UserOutlined, LogoutOutlined, ProfileOutlined, OrderedListOutlined } from '@ant-design/icons';

interface FooterLink { label: string; url: string; }
interface NavCategory { id: number; name: string; isActive: boolean; sortOrder: number; }
import { useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useCustomerAuthStore } from '../stores/customerAuthStore';
import { apiClient } from '../config/api';
import { getSiteSettings } from '../services/siteSettingsService';
import type { SiteSettings } from '../services/siteSettingsService';
import BottomNavBar from './BottomNavBar';
import LoginModal from './LoginModal';
import ProfileCompletionModal from './ProfileCompletionModal';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCartStore();
  const { isLoggedIn, customer, clearAuth } = useCustomerAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [settings, setSettings] = useState<Partial<SiteSettings>>();
  const [navCategories, setNavCategories] = useState<NavCategory[]>([]);

  const cartItemCount = items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  const isActive = (path: string) => location.pathname === path;

  // 登入後若資料不完整，彈出填資料 Modal
  useEffect(() => {
    if (isLoggedIn && customer && !customer.isProfileComplete) {
      setShowProfileModal(true);
    }
  }, [isLoggedIn, customer]);

  useEffect(() => {
    getSiteSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    apiClient.get<NavCategory[]>('/categories')
      .then(res => {
        const cats = res.data.filter(c => c.isActive !== false);
        cats.sort((a, b) => a.sortOrder - b.sortOrder);
        setNavCategories(cats);
      })
      .catch(() => {});
  }, []);

  const siteName = settings?.site_name || '品皇咖啡';
  const lineUrl = settings?.line_client_url || '';
  const footerText = settings?.footer_text || `© 2026 ${siteName}. All rights reserved.`;
  const facebookUrl = settings?.footer_social_facebook || '';
  const instagramUrl = settings?.footer_social_instagram || '';

  const shoppingLinks = useMemo<FooterLink[]>(() => {
    try { return JSON.parse(settings?.footer_links_shopping || '[]'); } catch { return []; }
  }, [settings?.footer_links_shopping]);

  const serviceLinks = useMemo<FooterLink[]>(() => {
    try { return JSON.parse(settings?.footer_links_service || '[]'); } catch { return []; }
  }, [settings?.footer_links_service]);

  // Mobile 二層選單：點父項展開子選單（不跳轉）；桌面版 hover CSS 處理
  const handleFlyoutParentClick = (key: string, desktopPath: string) => {
    if (mobileMenuOpen) {
      setOpenMobileSubmenu(prev => prev === key ? null : key);
    } else {
      navigate(desktopPath);
    }
  };

  const closeMobileMenu = () => { setMobileMenuOpen(false); setOpenMobileSubmenu(null); };

  const handleFooterLink = (url: string) => {
    if (!url) return;
    if (url.startsWith('/')) { navigate(url); }
    else { window.open(url, '_blank', 'noopener,noreferrer'); }
  };

  return (
    <div className="layout">
      <header className="site-header">
        <div className="header-container">
          <div className="header-left">
            <button className="mobile-menu-toggle" onClick={() => { setMobileMenuOpen(v => !v); setOpenMobileSubmenu(null); }} aria-label="Toggle menu">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <h1 className="site-logo" onClick={() => navigate('/')}>{siteName}</h1>
          </div>

          <nav className={`main-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <button className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>首頁</button>

            {/* 咖啡機專區 — 桌面版 hover flyout；行動版用 mobile-submenu */}
            <div className="nav-item-with-flyout">
              <button
                className={`nav-link nav-link--expandable ${location.pathname === '/products' && new URLSearchParams(location.search).get('categoryId') === '10' ? 'active' : ''}`}
                onClick={() => handleFlyoutParentClick('machine', '/products?categoryId=10')}
              >
                咖啡機專區
                <span className={`nav-arrow${openMobileSubmenu === 'machine' ? ' nav-arrow--open' : ''}`}>›</span>
              </button>
              {/* 桌面版 flyout（CSS hover 控制，行動版 display:none） */}
              <div className="nav-flyout nav-flyout--machine">
                <button className="nav-flyout-item nav-flyout-item--all" onClick={() => { navigate('/products?categoryId=10'); closeMobileMenu(); }}>全部咖啡機</button>
                <div className="nav-flyout-section-label">使用場景</div>
                <button className="nav-flyout-item" onClick={() => { navigate('/products?categoryId=10&q=辦公室'); closeMobileMenu(); }}>辦公室 / 企業</button>
                <button className="nav-flyout-item" onClick={() => { navigate('/products?categoryId=10&q=早午餐'); closeMobileMenu(); }}>早午餐店 / 咖啡廳</button>
                <button className="nav-flyout-item" onClick={() => { navigate('/products?categoryId=10&q=飯店'); closeMobileMenu(); }}>飯店 / 旅館</button>
                <button className="nav-flyout-item" onClick={() => { navigate('/products?categoryId=10&q=場館'); closeMobileMenu(); }}>各式場館</button>
                <button className="nav-flyout-item" onClick={() => { navigate('/products?categoryId=10&q=烘焙'); closeMobileMenu(); }}>烘焙坊 / 甜點店</button>
                <div className="nav-flyout-divider" />
                <button className="nav-flyout-item nav-flyout-item--cta" onClick={() => { navigate('/business'); closeMobileMenu(); }}>分期 / 租賃詢購 →</button>
              </div>
              {/* 行動版子選單（JS 條件渲染，獨立 DOM 不繼承 flyout CSS） */}
              {openMobileSubmenu === 'machine' && mobileMenuOpen && (
                <div className="mobile-submenu">
                  <button className="mobile-submenu-item mobile-submenu-item--bold" onClick={() => { navigate('/products?categoryId=10'); closeMobileMenu(); }}>全部咖啡機</button>
                  <div className="mobile-submenu-label">使用場景</div>
                  <button className="mobile-submenu-item" onClick={() => { navigate('/products?categoryId=10&q=辦公室'); closeMobileMenu(); }}>辦公室 / 企業</button>
                  <button className="mobile-submenu-item" onClick={() => { navigate('/products?categoryId=10&q=早午餐'); closeMobileMenu(); }}>早午餐店 / 咖啡廳</button>
                  <button className="mobile-submenu-item" onClick={() => { navigate('/products?categoryId=10&q=飯店'); closeMobileMenu(); }}>飯店 / 旅館</button>
                  <button className="mobile-submenu-item" onClick={() => { navigate('/products?categoryId=10&q=場館'); closeMobileMenu(); }}>各式場館</button>
                  <button className="mobile-submenu-item" onClick={() => { navigate('/products?categoryId=10&q=烘焙'); closeMobileMenu(); }}>烘焙坊 / 甜點店</button>
                  <button className="mobile-submenu-item mobile-submenu-item--cta" onClick={() => { navigate('/business'); closeMobileMenu(); }}>分期 / 租賃詢購 →</button>
                </div>
              )}
            </div>

            {/* 商品 — 桌面版 hover flyout；行動版用 mobile-submenu */}
            <div className="nav-item-with-flyout">
              <button
                className={`nav-link nav-link--expandable ${isActive('/products') ? 'active' : ''}`}
                onClick={() => handleFlyoutParentClick('products', '/products')}
              >
                商品
                <span className={`nav-arrow${openMobileSubmenu === 'products' ? ' nav-arrow--open' : ''}`}>›</span>
              </button>
              <div className="nav-flyout">
                <button className="nav-flyout-item" onClick={() => { navigate('/products'); closeMobileMenu(); }}>全部商品</button>
                {navCategories.map(c => (
                  <button key={c.id} className="nav-flyout-item" onClick={() => { navigate(`/products?categoryId=${c.id}`); closeMobileMenu(); }}>
                    {c.name}
                  </button>
                ))}
              </div>
              {openMobileSubmenu === 'products' && mobileMenuOpen && (
                <div className="mobile-submenu">
                  <button className="mobile-submenu-item mobile-submenu-item--bold" onClick={() => { navigate('/products'); closeMobileMenu(); }}>全部商品</button>
                  {navCategories.map(c => (
                    <button key={c.id} className="mobile-submenu-item" onClick={() => { navigate(`/products?categoryId=${c.id}`); closeMobileMenu(); }}>
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 服務 — 桌面版 hover flyout；行動版用 mobile-submenu */}
            <div className="nav-item-with-flyout">
              <button
                className={`nav-link nav-link--expandable ${location.pathname.startsWith('/pages/machine-service') || location.pathname.startsWith('/pages/rental-plan') || location.pathname.startsWith('/pages/bulk-order') || location.pathname.startsWith('/pages/used-machines') || location.pathname.startsWith('/pages/machine-repair') ? 'active' : ''}`}
                onClick={() => handleFlyoutParentClick('service', '/pages/machine-service')}
              >
                服務
                <span className={`nav-arrow${openMobileSubmenu === 'service' ? ' nav-arrow--open' : ''}`}>›</span>
              </button>
              <div className="nav-flyout">
                <button className="nav-flyout-item" onClick={() => { navigate('/pages/machine-service'); closeMobileMenu(); }}>機器使用說明與服務</button>
                <button className="nav-flyout-item" onClick={() => { navigate('/pages/rental-plan'); closeMobileMenu(); }}>純租/租購機方案</button>
                <button className="nav-flyout-item" onClick={() => { navigate('/pages/bulk-order'); closeMobileMenu(); }}>商用/批發咖啡豆特惠方案</button>
                <button className="nav-flyout-item" onClick={() => { navigate('/pages/used-machines'); closeMobileMenu(); }}>中古展示機特惠</button>
                <button className="nav-flyout-item" onClick={() => { navigate('/pages/machine-repair'); closeMobileMenu(); }}>咖啡機維修服務</button>
              </div>
              {openMobileSubmenu === 'service' && mobileMenuOpen && (
                <div className="mobile-submenu">
                  <button className="mobile-submenu-item" onClick={() => { navigate('/pages/machine-service'); closeMobileMenu(); }}>機器使用說明與服務</button>
                  <button className="mobile-submenu-item" onClick={() => { navigate('/pages/rental-plan'); closeMobileMenu(); }}>純租/租購機方案</button>
                  <button className="mobile-submenu-item" onClick={() => { navigate('/pages/bulk-order'); closeMobileMenu(); }}>商用/批發咖啡豆特惠方案</button>
                  <button className="mobile-submenu-item" onClick={() => { navigate('/pages/used-machines'); closeMobileMenu(); }}>中古展示機特惠</button>
                  <button className="mobile-submenu-item" onClick={() => { navigate('/pages/machine-repair'); closeMobileMenu(); }}>咖啡機維修服務</button>
                </div>
              )}
            </div>

            <button className={`nav-link ${location.pathname.startsWith('/pages/about') ? 'active' : ''}`} onClick={() => { navigate('/pages/about'); setMobileMenuOpen(false); }}>關於我們</button>
            <button className={`nav-link ${location.pathname.startsWith('/pages/faq') ? 'active' : ''}`} onClick={() => { navigate('/pages/faq'); setMobileMenuOpen(false); }}>常見問答</button>
            <button className={`nav-link ${location.pathname.startsWith('/pages/contact') ? 'active' : ''}`} onClick={() => { navigate('/pages/contact'); setMobileMenuOpen(false); }}>聯絡我們</button>
            <a className="nav-link" href="https://coffee88.com.tw/km" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)}>咖啡知識地圖</a>
          </nav>

          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isLoggedIn && customer ? (
              <Dropdown
                menu={{
                  items: [
                    { key: 'name', label: customer.name, disabled: true },
                    { type: 'divider' },
                    {
                      key: 'profile',
                      icon: <ProfileOutlined />,
                      label: '完善資料',
                      onClick: () => setShowProfileModal(true),
                    },
                    {
                      key: 'orders',
                      icon: <OrderedListOutlined />,
                      label: '我的訂單',
                      onClick: () => navigate('/my-orders'),
                    },
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: '登出',
                      onClick: () => {
                        clearAuth();
                        message.success('已登出');
                      },
                    },
                  ],
                }}
                placement="bottomRight"
              >
                <Avatar
                  icon={<UserOutlined />}
                  style={{ cursor: 'pointer', background: '#d4a574' }}
                />
              </Dropdown>
            ) : (
              <button
                className="nav-link"
                onClick={() => setShowLoginModal(true)}
                style={{ fontSize: 13 }}
              >
                登入 / 註冊
              </button>
            )}
            <button className="cart-button" onClick={() => navigate('/cart')} aria-label="購物車">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <main className="site-main site-main--with-bottom-nav">{children}</main>

      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-section">
              <h3 className="footer-title">{siteName}</h3>
              <p className="footer-description">{settings?.site_subtitle || '優質原料・專業加工・熱忱服務'}</p>
            </div>
            <div className="footer-section">
              <h4 className="footer-heading">購物資訊</h4>
              <ul className="footer-links">
                {shoppingLinks.length > 0
                  ? shoppingLinks.map((link, i) => (
                      <li key={i}><button onClick={() => handleFooterLink(link.url)}>{link.label}</button></li>
                    ))
                  : <>
                      <li><button onClick={() => navigate('/products')}>商品列表</button></li>
                      <li><button onClick={() => navigate('/cart')}>購物車</button></li>
                    </>
                }
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-heading">客戶服務</h4>
              <ul className="footer-links">
                {serviceLinks.length > 0
                  ? serviceLinks.map((link, i) => (
                      <li key={i}><button onClick={() => handleFooterLink(link.url)}>{link.label}</button></li>
                    ))
                  : <>
                      <li><button onClick={() => navigate('/pages/contact')}>聯絡我們</button></li>
                      <li><button onClick={() => navigate('/pages/about')}>關於我們</button></li>
                    </>
                }
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-heading">關注我們</h4>
              <div className="social-links">
                {facebookUrl && (
                  <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <span className="social-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                      </svg>
                    </span>
                  </a>
                )}
                {instagramUrl && (
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <span className="social-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                        <circle cx="12" cy="12" r="4"/>
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                      </svg>
                    </span>
                  </a>
                )}
                {lineUrl && (
                  <a href={lineUrl} target="_blank" rel="noopener noreferrer" aria-label="LINE">
                    <span className="social-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                      </svg>
                    </span>
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="copyright">{footerText}</p>
          </div>
        </div>
      </footer>

      {lineUrl && (
        <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="line-float-btn" aria-label="LINE 客服" title="LINE 客服">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
        </a>
      )}

      {mobileMenuOpen && <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />}

      <BottomNavBar />

      <LoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <ProfileCompletionModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}
