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
        <span className="bottom-nav-icon">🏠</span>
        <span className="bottom-nav-label">首頁</span>
      </button>

      <button
        className={`bottom-nav-item ${isActive('/products') ? 'active' : ''}`}
        onClick={() => navigate('/products')}
        aria-label="商品"
      >
        <span className="bottom-nav-icon">📦</span>
        <span className="bottom-nav-label">商品</span>
      </button>

      <button
        className={`bottom-nav-item ${isActive('/cart') ? 'active' : ''}`}
        onClick={() => navigate('/cart')}
        aria-label={`購物車${cartCount > 0 ? `，${cartCount} 件` : ''}`}
      >
        <span className="bottom-nav-icon bottom-nav-cart-icon">
          🛒
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
        <span className="bottom-nav-icon">☰</span>
        <span className="bottom-nav-label">更多</span>
      </button>
    </nav>
  );
}
