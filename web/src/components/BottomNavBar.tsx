import { useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import './BottomNavBar.css';

export default function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useCartStore();

  const cartCount = items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bottom-nav" aria-label="底部導覽">
      <button
        className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}
        onClick={() => navigate('/')}
        aria-label="首頁"
      >
        <span className="bottom-nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </span>
        <span className="bottom-nav-label">首頁</span>
      </button>

      <button
        className={`bottom-nav-item ${isActive('/products') ? 'active' : ''}`}
        onClick={() => navigate('/products')}
        aria-label="商品"
      >
        <span className="bottom-nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
        </span>
        <span className="bottom-nav-label">商品</span>
      </button>

      <button
        className={`bottom-nav-item ${isActive('/cart') ? 'active' : ''}`}
        onClick={() => navigate('/cart')}
        aria-label={`購物車${cartCount > 0 ? `，${cartCount} 件` : ''}`}
      >
        <span className="bottom-nav-icon bottom-nav-cart-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>
          {cartCount > 0 && (
            <span className="bottom-nav-badge" aria-hidden="true">{cartCount > 99 ? '99+' : cartCount}</span>
          )}
        </span>
        <span className="bottom-nav-label">購物車</span>
      </button>

      <button
        className="bottom-nav-item"
        onClick={() => navigate('/products')}
        aria-label="更多"
      >
        <span className="bottom-nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>
          </svg>
        </span>
        <span className="bottom-nav-label">更多</span>
      </button>
    </nav>
  );
}
