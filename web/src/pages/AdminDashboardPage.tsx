import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './AdminDashboardPage.css';

// 模擬數據類型
interface MetricData {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: string;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: string;
  image: string;
}

interface Order {
  id: string;
  customer: string;
  date: string;
  total: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [revenueTab, setRevenueTab] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 如果未登入，跳轉至登入頁
  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  // 模擬數據
  const metrics: MetricData[] = [
    {
      label: '總訂單數',
      value: '1,234',
      trend: '+12.5%',
      trendUp: true,
      icon: '📦',
    },
    {
      label: '今日營收',
      value: 'NT$ 45,678',
      trend: '+8.3%',
      trendUp: true,
      icon: '💰',
    },
    {
      label: '商品總數',
      value: '89',
      trend: '+3',
      trendUp: true,
      icon: '☕',
    },
    {
      label: '會員總數',
      value: '567',
      trend: '+23',
      trendUp: true,
      icon: '👥',
    },
  ];

  const topProducts: TopProduct[] = [
    {
      name: '衣索比亞 耶加雪菲',
      sales: 145,
      revenue: 'NT$ 72,500',
      image: '/assets/images/products/ethiopia-yirgacheffe.jpg',
    },
    {
      name: '哥倫比亞 薇拉',
      sales: 132,
      revenue: 'NT$ 66,000',
      image: '/assets/images/products/colombia-huila.jpg',
    },
    {
      name: '瓜地馬拉 安提瓜',
      sales: 118,
      revenue: 'NT$ 59,000',
      image: '/assets/images/products/guatemala-antigua.jpg',
    },
  ];

  const orders: Order[] = [
    {
      id: 'ORD-20260213-001',
      customer: '王小明',
      date: '2026-02-13 14:30',
      total: 'NT$ 1,500',
      status: 'completed',
    },
    {
      id: 'ORD-20260213-002',
      customer: '李小華',
      date: '2026-02-13 13:45',
      total: 'NT$ 2,300',
      status: 'processing',
    },
    {
      id: 'ORD-20260213-003',
      customer: '張小美',
      date: '2026-02-13 12:20',
      total: 'NT$ 980',
      status: 'pending',
    },
    {
      id: 'ORD-20260213-004',
      customer: '陳小強',
      date: '2026-02-13 11:00',
      total: 'NT$ 1,750',
      status: 'completed',
    },
    {
      id: 'ORD-20260213-005',
      customer: '林小芳',
      date: '2026-02-13 10:15',
      total: 'NT$ 3,200',
      status: 'cancelled',
    },
  ];

  const orderStatusData = [
    { label: '待處理', value: 15, color: '#f59e0b' },
    { label: '處理中', value: 32, color: '#3b82f6' },
    { label: '已完成', value: 48, color: '#10b981' },
    { label: '已取消', value: 5, color: '#ef4444' },
  ];

  // 營收數據（根據不同 tab 顯示不同數據）
  const revenueData = {
    day: { labels: Array.from({ length: 24 }, (_, i) => `${i}:00`), values: Array.from({ length: 24 }, () => Math.random() * 5000) },
    week: { labels: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'], values: [12000, 15000, 18000, 22000, 25000, 30000, 28000] },
    month: { labels: Array.from({ length: 30 }, (_, i) => `${i + 1}日`), values: Array.from({ length: 30 }, () => Math.random() * 30000) },
    year: { labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], values: [250000, 280000, 320000, 310000, 350000, 380000, 420000, 450000, 470000, 490000, 520000, 550000] },
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return 'badge-completed';
      case 'processing':
        return 'badge-processing';
      case 'pending':
        return 'badge-pending';
      case 'cancelled':
        return 'badge-cancelled';
      default:
        return '';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '處理中';
      case 'pending':
        return '待處理';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  return (
    <div className="admin-dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="切換側邊欄"
          >
            ☰
          </button>
          <div className="header-logo">
            <img src="/assets/images/logo/logo-light-bg.svg" alt="品皇咖啡 Logo" />
            <span>品皇咖啡 後台</span>
          </div>
        </div>
        <div className="header-right">
          <button className="header-icon-btn" aria-label="通知">
            <span className="notification-badge">3</span>
            🔔
          </button>
          <div className="user-menu-wrapper">
            <button
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="使用者選單"
            >
              <span className="user-avatar">A</span>
              <span className="user-name">Admin</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            {showUserMenu && (
              <div className="user-menu-dropdown">
                <button onClick={() => navigate('/admin/profile')}>個人資料</button>
                <button onClick={() => navigate('/admin/settings')}>系統設定</button>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="logout-btn">
                  登出
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <nav className="sidebar-nav">
            <a href="/admin" className="nav-item active">
              <span className="nav-icon">📊</span>
              {!sidebarCollapsed && <span className="nav-label">儀表板</span>}
            </a>
            <a href="/admin/orders" className="nav-item">
              <span className="nav-icon">📦</span>
              {!sidebarCollapsed && <span className="nav-label">訂單管理</span>}
            </a>
            <a href="/admin/products" className="nav-item">
              <span className="nav-icon">☕</span>
              {!sidebarCollapsed && <span className="nav-label">商品管理</span>}
            </a>
            <a href="/admin/customers" className="nav-item">
              <span className="nav-icon">👥</span>
              {!sidebarCollapsed && <span className="nav-label">會員管理</span>}
            </a>
            <a href="/admin/analytics" className="nav-item">
              <span className="nav-icon">📈</span>
              {!sidebarCollapsed && <span className="nav-label">數據分析</span>}
            </a>
            <a href="/admin/settings" className="nav-item">
              <span className="nav-icon">⚙️</span>
              {!sidebarCollapsed && <span className="nav-label">系統設定</span>}
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Key Metrics */}
          <section className="metrics-section">
            {metrics.map((metric, index) => (
              <div key={index} className="metric-card">
                <div className="metric-icon">{metric.icon}</div>
                <div className="metric-content">
                  <div className="metric-label">{metric.label}</div>
                  <div className="metric-value">{metric.value}</div>
                  <div className={`metric-trend ${metric.trendUp ? 'trend-up' : 'trend-down'}`}>
                    {metric.trendUp ? '↑' : '↓'} {metric.trend}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Charts Row 1: Revenue Chart (60%) + Top Products (40%) */}
          <div className="charts-row">
            <section className="revenue-chart-section">
              <div className="section-header">
                <h2>營收趨勢</h2>
                <div className="tab-group">
                  <button
                    className={`tab-btn ${revenueTab === 'day' ? 'active' : ''}`}
                    onClick={() => setRevenueTab('day')}
                  >
                    日
                  </button>
                  <button
                    className={`tab-btn ${revenueTab === 'week' ? 'active' : ''}`}
                    onClick={() => setRevenueTab('week')}
                  >
                    週
                  </button>
                  <button
                    className={`tab-btn ${revenueTab === 'month' ? 'active' : ''}`}
                    onClick={() => setRevenueTab('month')}
                  >
                    月
                  </button>
                  <button
                    className={`tab-btn ${revenueTab === 'year' ? 'active' : ''}`}
                    onClick={() => setRevenueTab('year')}
                  >
                    年
                  </button>
                </div>
              </div>
              <div className="chart-container">
                {/* 簡易 SVG 折線圖（不使用 Chart.js） */}
                <svg viewBox="0 0 800 300" className="line-chart">
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#d4a574" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#d4a574" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* 網格線 */}
                  {Array.from({ length: 6 }, (_, i) => (
                    <line
                      key={i}
                      x1="50"
                      y1={50 + i * 40}
                      x2="750"
                      y2={50 + i * 40}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                    />
                  ))}
                  {/* 繪製折線圖 */}
                  {(() => {
                    const data = revenueData[revenueTab];
                    const max = Math.max(...data.values);
                    const points = data.values.map((value, index) => {
                      const x = 50 + (index / (data.values.length - 1)) * 700;
                      const y = 250 - (value / max) * 200;
                      return `${x},${y}`;
                    }).join(' ');
                    const areaPoints = `50,250 ${points} ${50 + 700},250`;
                    return (
                      <>
                        <polyline
                          points={areaPoints}
                          fill="url(#areaGradient)"
                        />
                        <polyline
                          points={points}
                          fill="none"
                          stroke="#d4a574"
                          strokeWidth="3"
                        />
                        {data.values.map((value, index) => {
                          const x = 50 + (index / (data.values.length - 1)) * 700;
                          const y = 250 - (value / max) * 200;
                          return (
                            <circle
                              key={index}
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#d4a574"
                              stroke="#ffffff"
                              strokeWidth="2"
                            />
                          );
                        })}
                      </>
                    );
                  })()}
                  {/* X 軸標籤 */}
                  {revenueData[revenueTab].labels.map((label, index) => {
                    if (index % Math.ceil(revenueData[revenueTab].labels.length / 7) === 0) {
                      const x = 50 + (index / (revenueData[revenueTab].values.length - 1)) * 700;
                      return (
                        <text
                          key={index}
                          x={x}
                          y="280"
                          textAnchor="middle"
                          fontSize="12"
                          fill="#6b7280"
                        >
                          {label}
                        </text>
                      );
                    }
                    return null;
                  })}
                </svg>
              </div>
            </section>

            <section className="top-products-section">
              <div className="section-header">
                <h2>熱銷商品</h2>
              </div>
              <div className="top-products-list">
                {topProducts.map((product, index) => (
                  <div key={index} className="top-product-item">
                    <div className="product-rank">{index + 1}</div>
                    <img src={product.image} alt={product.name} className="product-image" />
                    <div className="product-info">
                      <div className="product-name">{product.name}</div>
                      <div className="product-stats">
                        <span>銷量 {product.sales}</span>
                        <span>{product.revenue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Charts Row 2: Order Status Pie (40%) + Recent Orders (60%) */}
          <div className="charts-row">
            <section className="order-status-section">
              <div className="section-header">
                <h2>訂單狀態分佈</h2>
              </div>
              <div className="pie-chart-container">
                {/* 簡易 SVG 圓餅圖 */}
                <svg viewBox="0 0 200 200" className="pie-chart">
                  {(() => {
                    const total = orderStatusData.reduce((sum, item) => sum + item.value, 0);
                    let currentAngle = -90; // 從頂部開始
                    return orderStatusData.map((item, index) => {
                      const percentage = (item.value / total) * 100;
                      const angle = (percentage / 100) * 360;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + angle;
                      currentAngle = endAngle;

                      const startX = 100 + 70 * Math.cos((startAngle * Math.PI) / 180);
                      const startY = 100 + 70 * Math.sin((startAngle * Math.PI) / 180);
                      const endX = 100 + 70 * Math.cos((endAngle * Math.PI) / 180);
                      const endY = 100 + 70 * Math.sin((endAngle * Math.PI) / 180);
                      const largeArc = angle > 180 ? 1 : 0;

                      return (
                        <path
                          key={index}
                          d={`M 100 100 L ${startX} ${startY} A 70 70 0 ${largeArc} 1 ${endX} ${endY} Z`}
                          fill={item.color}
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="pie-legend">
                  {orderStatusData.map((item, index) => (
                    <div key={index} className="legend-item">
                      <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                      <span className="legend-label">{item.label}</span>
                      <span className="legend-value">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="recent-orders-section">
              <div className="section-header">
                <h2>最近訂單</h2>
                <button className="view-all-btn" onClick={() => navigate('/admin/orders')}>
                  查看全部
                </button>
              </div>
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>訂單編號</th>
                      <th>客戶</th>
                      <th>日期</th>
                      <th>金額</th>
                      <th>狀態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="order-id">{order.id}</td>
                        <td>{order.customer}</td>
                        <td>{order.date}</td>
                        <td className="order-total">{order.total}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Quick Actions */}
          <section className="quick-actions-section">
            <div className="section-header">
              <h2>快速操作</h2>
            </div>
            <div className="quick-actions-grid">
              <button className="quick-action-btn" onClick={() => navigate('/admin/orders/new')}>
                <span className="action-icon">➕</span>
                <span className="action-label">新增訂單</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/admin/products/new')}>
                <span className="action-icon">☕</span>
                <span className="action-label">新增商品</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/admin/customers/new')}>
                <span className="action-icon">👤</span>
                <span className="action-label">新增會員</span>
              </button>
              <button className="quick-action-btn" onClick={() => navigate('/admin/reports')}>
                <span className="action-icon">📄</span>
                <span className="action-label">查看報表</span>
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
