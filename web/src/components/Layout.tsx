import { type ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { getSiteSettings } from '../services/siteSettingsService';
import type { SiteSettings } from '../services/siteSettingsService';
import BottomNavBar from './BottomNavBar';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});

  const cartItemCount = items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    getSiteSettings().then(setSettings).catch(() => {});
  }, []);

  const siteName = settings.site_name || '品皇咖啡';
  const lineUrl = settings.line_client_url || '';
  const footerText = settings.footer_text || `© 2026 ${siteName}. All rights reserved.`;
  const contactPhone = settings.contact_phone || '';
  const contactAddress = settings.contact_address || '';

  return (
    <div className="layout">
      <header className="site-header">
        <div className="header-container">
          <div className="header-left">
            <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">☰</button>
            <h1 className="site-logo" onClick={() => navigate('/')}>{siteName}</h1>
          </div>

          <nav className={`main-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <button className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => { navigate('/'); setMobileMenuOpen(false); }}>首頁</button>
            <button className={`nav-link ${isActive('/products') ? 'active' : ''}`} onClick={() => { navigate('/products'); setMobileMenuOpen(false); }}>商品</button>
            <button className={`nav-link ${location.pathname.startsWith('/pages/about') ? 'active' : ''}`} onClick={() => { navigate('/pages/about'); setMobileMenuOpen(false); }}>關於我們</button>
            <button className={`nav-link ${location.pathname.startsWith('/pages/contact') ? 'active' : ''}`} onClick={() => { navigate('/pages/contact'); setMobileMenuOpen(false); }}>聯絡我們</button>
          </nav>

          <div className="header-right">
            <button className="cart-button" onClick={() => navigate('/cart')} aria-label="購物車">
              🛒{cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
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
              <p className="footer-description">{settings.site_subtitle || '專業烘焙，極致品味'}</p>
              {contactPhone && <p className="footer-description">📞 {contactPhone}</p>}
              {contactAddress && <p className="footer-description">📍 {contactAddress}</p>}
            </div>
            <div className="footer-section">
              <h4 className="footer-heading">購物資訊</h4>
              <ul className="footer-links">
                <li><button onClick={() => navigate('/products')}>商品列表</button></li>
                <li><button onClick={() => navigate('/cart')}>購物車</button></li>
                <li><button onClick={() => navigate('/pages/shipping')}>配送說明</button></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-heading">客戶服務</h4>
              <ul className="footer-links">
                <li><button onClick={() => navigate('/pages/contact')}>聯絡我們</button></li>
                <li><button onClick={() => navigate('/pages/faq')}>常見問題</button></li>
                <li><button onClick={() => navigate('/pages/about')}>關於我們</button></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4 className="footer-heading">關注我們</h4>
              <div className="social-links">
                <a href="#" aria-label="Facebook"><span className="social-icon">📘</span></a>
                <a href="#" aria-label="Instagram"><span className="social-icon">📷</span></a>
                {lineUrl && <a href={lineUrl} target="_blank" rel="noopener noreferrer" aria-label="LINE"><span className="social-icon">💬</span></a>}
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
    </div>
  );
}
