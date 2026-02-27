import { useState } from 'react';
import './AdminOrderManagementPage.css';

// 訂單類型定義
interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shipping?: {
    method: string;
    address: string;
    recipient: string;
    phone: string;
  };
  payment?: {
    method: string;
    status: string;
    paidAt: string;
  };
  notes?: string;
}

// 狀態標籤
const statusTabs = [
  { key: 'all', label: '全部', count: 382 },
  { key: 'pending', label: '待處理', count: 45 },
  { key: 'processing', label: '處理中', count: 123 },
  { key: 'shipped', label: '已出貨', count: 156 },
  { key: 'completed', label: '已完成', count: 58 },
];

export default function AdminOrderManagementPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 模擬訂單資料
  const mockOrders: Order[] = Array.from({ length: 50 }, (_, i) => ({
    id: `ORD-${String(i + 1).padStart(8, '0')}`,
    customer: {
      name: ['陳小明', '林大華', '王美麗', '張志豪', '李雅婷'][i % 5],
      phone: `0912-${String(i).padStart(3, '0')}-${String(i).padStart(3, '0')}`,
      email: `user${i}@example.com`,
    },
    amount: Math.floor(Math.random() * 3000) + 500,
    status: ['pending', 'processing', 'shipped', 'completed', 'cancelled'][
      Math.floor(Math.random() * 5)
    ] as Order['status'],
    createdAt: new Date(2026, 1, 13, 10 + (i % 12), i % 60).toISOString(),
    items: [
      {
        name: '衣索比亞 耶加雪菲',
        quantity: Math.floor(Math.random() * 3) + 1,
        price: 500,
      },
      {
        name: '哥倫比亞 薇拉',
        quantity: Math.floor(Math.random() * 2) + 1,
        price: 450,
      },
    ],
    shipping: {
      method: '宅配',
      address: '台北市信義區信義路五段 7 號',
      recipient: ['陳小明', '林大華', '王美麗', '張志豪', '李雅婷'][i % 5],
      phone: `0912-${String(i).padStart(3, '0')}-${String(i).padStart(3, '0')}`,
    },
    payment: {
      method: '信用卡',
      status: 'paid',
      paidAt: new Date(2026, 1, 13, 10 + (i % 12), (i + 2) % 60).toISOString(),
    },
    notes: i % 3 === 0 ? '請於下午 2-5 點配送' : undefined,
  }));

  // 篩選訂單
  const filteredOrders = mockOrders.filter((order) => {
    // 狀態篩選
    if (activeTab !== 'all' && order.status !== activeTab) return false;

    // 搜尋篩選
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      return (
        order.id.toLowerCase().includes(searchLower) ||
        order.customer.name.toLowerCase().includes(searchLower) ||
        order.customer.phone.includes(searchText)
      );
    }

    return true;
  });

  // 分頁
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 全選/取消全選
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(paginatedOrders.map((o) => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  // 選擇單筆訂單
  const handleSelectOrder = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    }
  };

  // 開啟訂單詳情
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  // 關閉訂單詳情
  const handleCloseDrawer = () => {
    setSelectedOrder(null);
  };

  // 取得狀態樣式
  const getStatusBadgeClass = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'badge-pending';
      case 'processing':
        return 'badge-processing';
      case 'shipped':
        return 'badge-shipped';
      case 'completed':
        return 'badge-completed';
      case 'cancelled':
        return 'badge-cancelled';
      default:
        return '';
    }
  };

  // 取得狀態文字
  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return '待處理';
      case 'processing':
        return '處理中';
      case 'shipped':
        return '已出貨';
      case 'completed':
        return '已完成';
      case 'cancelled':
        return '已取消';
      default:
        return status;
    }
  };

  // 格式化日期時間
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
    return { time, date: dateStr };
  };

  return (
    <div className="admin-order-management-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span>首頁</span>
        <span className="separator">›</span>
        <span className="current">訂單管理</span>
      </div>

      {/* Page Title */}
      <h1 className="page-title">訂單管理</h1>

      {/* Search & Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="search"
            placeholder="搜尋訂單編號、顧客名稱、電話..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <button className="filter-btn">
          <span className="icon">⚙️</span>
          進階篩選
        </button>
        <div className="date-range-picker">
          <span className="icon">📅</span>
          <span>2026-02-01 ~ 2026-02-13</span>
        </div>
        <button className="export-btn">
          <span className="icon">💾</span>
          匯出
        </button>
        <button className="print-btn">
          <span className="icon">🖨️</span>
          列印
        </button>
      </div>

      {/* Status Tabs */}
      <div className="status-tabs">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            className={`status-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.key);
              setCurrentPage(1);
            }}
          >
            <div className="tab-label">{tab.label}</div>
            <div className="tab-count">{tab.count}</div>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={
                    paginatedOrders.length > 0 &&
                    paginatedOrders.every((o) => selectedOrders.includes(o.id))
                  }
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th>訂單編號</th>
              <th>顧客</th>
              <th>金額</th>
              <th>狀態</th>
              <th>日期</th>
              <th className="actions-col">操作</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((order) => {
              const { time, date } = formatDateTime(order.createdAt);
              return (
                <tr key={order.id} onClick={() => handleViewOrder(order)}>
                  <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                    />
                  </td>
                  <td className="order-id">{order.id}</td>
                  <td className="customer-info">
                    <div className="customer-name">{order.customer.name}</div>
                    <div className="customer-phone">{order.customer.phone}</div>
                  </td>
                  <td className="order-amount">NT$ {order.amount.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </td>
                  <td className="order-date">
                    <div className="time">{time}</div>
                    <div className="date">{date}</div>
                  </td>
                  <td className="actions-col" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="action-btn"
                      onClick={() =>
                        setShowActionMenu(showActionMenu === order.id ? null : order.id)
                      }
                    >
                      ⋯
                    </button>
                    {showActionMenu === order.id && (
                      <div className="action-menu">
                        <button onClick={() => handleViewOrder(order)}>👁️ 查看詳情</button>
                        <button>✏️ 編輯</button>
                        <button>📦 標記出貨</button>
                        <button>✅ 標記完成</button>
                        <button>🖨️ 列印</button>
                        <button className="danger">❌ 取消訂單</button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="bulk-actions">
          <span className="selected-count">已選 {selectedOrders.length} 筆</span>
          <button className="bulk-action-btn">
            <span className="icon">📦</span>
            標記為已出貨
          </button>
          <button className="bulk-action-btn secondary">
            <span className="icon">🖨️</span>
            批次列印
          </button>
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <div className="pagination-info">
          顯示 {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, filteredOrders.length)} 筆，共{' '}
          {filteredOrders.length} 筆
        </div>
        <div className="pagination-controls">
          <button
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ‹ 上一頁
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            下一頁 ›
          </button>
        </div>
      </div>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <>
          <div className="drawer-overlay" onClick={handleCloseDrawer}></div>
          <div className="order-detail-drawer">
            <div className="drawer-header">
              <h2>訂單詳情</h2>
              <button className="close-btn" onClick={handleCloseDrawer}>
                ✕
              </button>
            </div>
            <div className="drawer-content">
              {/* 基本資訊 */}
              <div className="detail-section">
                <div className="detail-row">
                  <span className="label">訂單編號：</span>
                  <span className="value">{selectedOrder.id}</span>
                </div>
                <div className="detail-row">
                  <span className="label">訂單日期：</span>
                  <span className="value">
                    {new Date(selectedOrder.createdAt).toLocaleString('zh-TW')}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">目前狀態：</span>
                  <span
                    className={`status-badge ${getStatusBadgeClass(selectedOrder.status)}`}
                  >
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
              </div>

              <div className="divider"></div>

              {/* 顧客資訊 */}
              <div className="detail-section">
                <h3>顧客資訊</h3>
                <div className="detail-row">
                  <span className="label">姓名：</span>
                  <span className="value">{selectedOrder.customer.name}</span>
                </div>
                <div className="detail-row">
                  <span className="label">電話：</span>
                  <span className="value">{selectedOrder.customer.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Email：</span>
                  <span className="value">{selectedOrder.customer.email}</span>
                </div>
              </div>

              <div className="divider"></div>

              {/* 配送資訊 */}
              {selectedOrder.shipping && (
                <>
                  <div className="detail-section">
                    <h3>配送資訊</h3>
                    <div className="detail-row">
                      <span className="label">配送方式：</span>
                      <span className="value">{selectedOrder.shipping.method}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">配送地址：</span>
                      <span className="value">{selectedOrder.shipping.address}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">收件人：</span>
                      <span className="value">{selectedOrder.shipping.recipient}</span>
                    </div>
                  </div>
                  <div className="divider"></div>
                </>
              )}

              {/* 訂單明細 */}
              <div className="detail-section">
                <h3>訂單明細</h3>
                {selectedOrder.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-name">
                      {index + 1}. {item.name} x{item.quantity}
                    </div>
                    <div className="item-price">
                      NT$ {item.price.toLocaleString()} x{item.quantity} = NT${' '}
                      {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="divider"></div>

              {/* 金額計算 */}
              <div className="detail-section">
                <h3>金額計算</h3>
                <div className="amount-row">
                  <span className="label">小計：</span>
                  <span className="value">NT$ {selectedOrder.amount.toLocaleString()}</span>
                </div>
                <div className="amount-row">
                  <span className="label">運費：</span>
                  <span className="value">NT$ 0</span>
                </div>
                <div className="amount-row total">
                  <span className="label">總計：</span>
                  <span className="value">NT$ {selectedOrder.amount.toLocaleString()}</span>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="drawer-actions">
                <button className="action-btn primary">
                  <span className="icon">📦</span>
                  標記為已出貨
                </button>
                <button className="action-btn primary">
                  <span className="icon">✅</span>
                  標記為已完成
                </button>
                <button className="action-btn secondary">
                  <span className="icon">🖨️</span>
                  列印訂單
                </button>
                <button className="action-btn danger">
                  <span className="icon">❌</span>
                  取消訂單
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
