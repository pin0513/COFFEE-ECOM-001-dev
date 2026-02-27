import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminProductManagementPage.css';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive';
  image: string;
  description: string;
  specifications: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
}

const mockProducts: Product[] = [
  {
    id: 'P001',
    name: 'Ethiopia Yirgacheffe',
    sku: 'COFFEE-ETH-001',
    category: '咖啡豆',
    price: 680,
    stock: 45,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
    description: '衣索比亞耶加雪菲，帶有花香與果香',
    specifications: '產地: 衣索比亞\n烘焙度: 中淺焙\n風味: 花香、柑橘、莓果',
    seoTitle: 'Ethiopia Yirgacheffe 衣索比亞耶加雪菲咖啡豆',
    seoDescription: '來自衣索比亞的耶加雪菲咖啡豆，帶有花香與果香',
    seoKeywords: '咖啡豆, 衣索比亞, 耶加雪菲, 精品咖啡',
  },
  {
    id: 'P002',
    name: 'Colombia Supremo',
    sku: 'COFFEE-COL-001',
    category: '咖啡豆',
    price: 620,
    stock: 8,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400',
    description: '哥倫比亞極選豆，均衡醇厚',
    specifications: '產地: 哥倫比亞\n烘焙度: 中焙\n風味: 堅果、焦糖、巧克力',
    seoTitle: 'Colombia Supremo 哥倫比亞極選咖啡豆',
    seoDescription: '哥倫比亞極選豆，均衡醇厚，帶有堅果與焦糖香氣',
    seoKeywords: '咖啡豆, 哥倫比亞, 精品咖啡',
  },
  {
    id: 'P003',
    name: 'Hario V60 手沖壺',
    sku: 'EQUIP-HAR-001',
    category: '器具',
    price: 1280,
    stock: 15,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400',
    description: 'Hario V60 不鏽鋼手沖壺',
    specifications: '容量: 600ml\n材質: 不鏽鋼\n產地: 日本',
    seoTitle: 'Hario V60 手沖壺 600ml 不鏽鋼',
    seoDescription: 'Hario V60 不鏽鋼手沖壺，容量 600ml，日本製造',
    seoKeywords: '手沖壺, Hario, V60, 咖啡器具',
  },
  {
    id: 'P004',
    name: '香草糖漿',
    sku: 'SYRUP-VAN-001',
    category: '糖漿',
    price: 220,
    stock: 3,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
    description: '天然香草糖漿',
    specifications: '容量: 750ml\n成分: 天然香草、蔗糖\n保存期限: 12個月',
    seoTitle: '香草糖漿 750ml 天然香草風味',
    seoDescription: '天然香草糖漿，750ml，適合咖啡與飲品調味',
    seoKeywords: '糖漿, 香草, 咖啡糖漿',
  },
];

function AdminProductManagementPage() {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit'>('create');
  const [activeDrawerTab, setActiveDrawerTab] = useState('basic');
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockAction, setStockAction] = useState<'add' | 'subtract' | 'set'>('add');
  const [stockAmount, setStockAmount] = useState('');
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState<Product>({
    id: '',
    name: '',
    sku: '',
    category: '咖啡豆',
    price: 0,
    stock: 0,
    status: 'active',
    image: '',
    description: '',
    specifications: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
  });

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const openCreateDrawer = () => {
    setDrawerMode('create');
    setFormData({
      id: '',
      name: '',
      sku: '',
      category: '咖啡豆',
      price: 0,
      stock: 0,
      status: 'active',
      image: '',
      description: '',
      specifications: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
    });
    setActiveDrawerTab('basic');
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (product: Product) => {
    setDrawerMode('edit');
    setFormData({ ...product });
    setActiveDrawerTab('basic');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value,
    }));
  };

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    showToast('success', drawerMode === 'create' ? '產品新增成功' : '產品更新成功');
    closeDrawer();
  };

  const openStockModal = (product: Product) => {
    setCurrentProduct(product);
    setStockAction('add');
    setStockAmount('');
    setIsStockModalOpen(true);
  };

  const closeStockModal = () => {
    setIsStockModalOpen(false);
    setCurrentProduct(null);
  };

  const handleStockAdjust = () => {
    showToast('success', '庫存調整成功');
    closeStockModal();
  };

  const handleBulkPublish = () => {
    if (selectedProducts.length === 0) {
      showToast('warning', '請先選擇產品');
      return;
    }
    showToast('success', `已批次上架 ${selectedProducts.length} 個產品`);
    setSelectedProducts([]);
  };

  const handleBulkUnpublish = () => {
    if (selectedProducts.length === 0) {
      showToast('warning', '請先選擇產品');
      return;
    }
    showToast('success', `已批次下架 ${selectedProducts.length} 個產品`);
    setSelectedProducts([]);
  };

  const handleBulkDelete = () => {
    if (selectedProducts.length === 0) {
      showToast('warning', '請先選擇產品');
      return;
    }
    if (confirm(`確定要刪除 ${selectedProducts.length} 個產品嗎？此操作無法復原。`)) {
      showToast('success', `已刪除 ${selectedProducts.length} 個產品`);
      setSelectedProducts([]);
    }
  };

  const handleExport = () => {
    showToast('success', '匯出成功');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = () => {
      showToast('success', '匯入成功');
    };
    input.click();
  };

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  const getStockStatus = (stock: number): 'low' | 'medium' | 'normal' => {
    if (stock <= 10) return 'low';
    if (stock <= 20) return 'medium';
    return 'normal';
  };

  // Filter products
  const filteredProducts = mockProducts.filter((product) => {
    // Category tab filter
    if (activeTab !== 'all' && product.category !== activeTab) return false;

    // Category dropdown filter
    if (categoryFilter !== 'all' && product.category !== categoryFilter) return false;

    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      return (
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="admin-product-management">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-logo">{sidebarCollapsed ? 'BB' : 'Blue Bottle'}</h1>
        </div>
        <nav className="sidebar-nav">
          <a href="/admin/dashboard" className="nav-item">
            <span className="nav-icon">📊</span>
            {!sidebarCollapsed && <span className="nav-label">儀表板</span>}
          </a>
          <a href="/admin/orders" className="nav-item">
            <span className="nav-icon">📦</span>
            {!sidebarCollapsed && <span className="nav-label">訂單管理</span>}
          </a>
          <a href="/admin/products" className="nav-item active">
            <span className="nav-icon">☕</span>
            {!sidebarCollapsed && <span className="nav-label">商品管理</span>}
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={`admin-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <button className="toggle-sidebar-btn" onClick={toggleSidebar}>
              ☰
            </button>
            <h2 className="page-title">商品管理</h2>
          </div>
          <div className="header-right">
            <button className="logout-btn" onClick={handleLogout}>
              登出
            </button>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="breadcrumb">
          <span className="breadcrumb-item">管理後台</span>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-item active">商品管理</span>
        </div>

        {/* Toolbar */}
        <div className="product-toolbar">
          <div className="toolbar-left">
            <div className="search-bar">
              <input
                type="text"
                placeholder="搜尋商品名稱或 SKU..."
                value={searchText}
                onChange={handleSearch}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>
            <select
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              className="category-filter"
            >
              <option value="all">所有分類</option>
              <option value="咖啡豆">咖啡豆</option>
              <option value="器具">器具</option>
              <option value="糖漿">糖漿</option>
            </select>
          </div>
          <div className="toolbar-right">
            <button className="btn-secondary" onClick={handleImport}>
              匯入
            </button>
            <button className="btn-secondary" onClick={handleExport}>
              匯出
            </button>
            <button className="btn-primary" onClick={openCreateDrawer}>
              + 新增商品
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          <button
            className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabChange('all')}
          >
            全部
          </button>
          <button
            className={`tab-item ${activeTab === '咖啡豆' ? 'active' : ''}`}
            onClick={() => handleTabChange('咖啡豆')}
          >
            咖啡豆
          </button>
          <button
            className={`tab-item ${activeTab === '器具' ? 'active' : ''}`}
            onClick={() => handleTabChange('器具')}
          >
            器具
          </button>
          <button
            className={`tab-item ${activeTab === '糖漿' ? 'active' : ''}`}
            onClick={() => handleTabChange('糖漿')}
          >
            糖漿
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-count">已選擇 {selectedProducts.length} 個商品</span>
            <button className="bulk-btn" onClick={handleBulkPublish}>
              批次上架
            </button>
            <button className="bulk-btn" onClick={handleBulkUnpublish}>
              批次下架
            </button>
            <button className="bulk-btn bulk-btn-danger" onClick={handleBulkDelete}>
              批次刪除
            </button>
          </div>
        )}

        {/* Products Table */}
        <div className="products-table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      selectedProducts.length > 0 &&
                      selectedProducts.length === filteredProducts.length
                    }
                  />
                </th>
                <th>商品圖片</th>
                <th>商品名稱</th>
                <th>SKU</th>
                <th>分類</th>
                <th>價格</th>
                <th>庫存</th>
                <th>狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <tr key={product.id}>
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                    />
                  </td>
                  <td>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="product-image"
                    />
                  </td>
                  <td className="product-name">{product.name}</td>
                  <td className="product-sku">{product.sku}</td>
                  <td>{product.category}</td>
                  <td className="product-price">NT$ {product.price.toLocaleString()}</td>
                  <td>
                    <span className={`stock-badge stock-${getStockStatus(product.stock)}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${product.status}`}>
                      {product.status === 'active' ? '上架中' : '已下架'}
                    </span>
                  </td>
                  <td className="actions-col">
                    <button
                      className="action-btn"
                      onClick={() => openEditDrawer(product)}
                      title="編輯"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => openStockModal(product)}
                      title="調整庫存"
                    >
                      📦
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              上一頁
            </button>
            <span className="page-info">
              第 {currentPage} 頁，共 {totalPages} 頁
            </span>
            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              下一頁
            </button>
          </div>
        )}
      </main>

      {/* Product Drawer */}
      {isDrawerOpen && (
        <>
          <div className="drawer-overlay" onClick={closeDrawer}></div>
          <div className="product-drawer">
            <div className="drawer-header">
              <h3>{drawerMode === 'create' ? '新增商品' : '編輯商品'}</h3>
              <button className="close-drawer-btn" onClick={closeDrawer}>
                ✕
              </button>
            </div>

            <div className="drawer-tabs">
              <button
                className={`drawer-tab ${activeDrawerTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveDrawerTab('basic')}
              >
                基本資訊
              </button>
              <button
                className={`drawer-tab ${activeDrawerTab === 'specs' ? 'active' : ''}`}
                onClick={() => setActiveDrawerTab('specs')}
              >
                規格
              </button>
              <button
                className={`drawer-tab ${activeDrawerTab === 'seo' ? 'active' : ''}`}
                onClick={() => setActiveDrawerTab('seo')}
              >
                SEO
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="drawer-form">
              {activeDrawerTab === 'basic' && (
                <div className="drawer-content">
                  <div className="form-group">
                    <label>商品名稱 *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>SKU *</label>
                    <input
                      type="text"
                      name="sku"
                      value={formData.sku}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>分類 *</label>
                    <select name="category" value={formData.category} onChange={handleFormChange}>
                      <option value="咖啡豆">咖啡豆</option>
                      <option value="器具">器具</option>
                      <option value="糖漿">糖漿</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>價格 (NT$) *</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleFormChange}
                        min="0"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>庫存 *</label>
                      <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleFormChange}
                        min="0"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>狀態</label>
                    <select name="status" value={formData.status} onChange={handleFormChange}>
                      <option value="active">上架中</option>
                      <option value="inactive">已下架</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>商品圖片</label>
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleFormChange}
                      placeholder="圖片 URL"
                    />
                  </div>
                  <div className="form-group">
                    <label>商品描述</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleFormChange}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {activeDrawerTab === 'specs' && (
                <div className="drawer-content">
                  <div className="form-group">
                    <label>規格說明</label>
                    <textarea
                      name="specifications"
                      value={formData.specifications}
                      onChange={handleFormChange}
                      rows={10}
                      placeholder="產地: 衣索比亞&#10;烘焙度: 中淺焙&#10;風味: 花香、柑橘、莓果"
                    />
                  </div>
                </div>
              )}

              {activeDrawerTab === 'seo' && (
                <div className="drawer-content">
                  <div className="form-group">
                    <label>SEO 標題</label>
                    <input
                      type="text"
                      name="seoTitle"
                      value={formData.seoTitle}
                      onChange={handleFormChange}
                      placeholder="建議長度 50-60 字元"
                    />
                  </div>
                  <div className="form-group">
                    <label>SEO 描述</label>
                    <textarea
                      name="seoDescription"
                      value={formData.seoDescription}
                      onChange={handleFormChange}
                      rows={3}
                      placeholder="建議長度 150-160 字元"
                    />
                  </div>
                  <div className="form-group">
                    <label>SEO 關鍵字</label>
                    <input
                      type="text"
                      name="seoKeywords"
                      value={formData.seoKeywords}
                      onChange={handleFormChange}
                      placeholder="關鍵字1, 關鍵字2, 關鍵字3"
                    />
                  </div>
                </div>
              )}

              <div className="drawer-footer">
                <button type="button" className="btn-secondary" onClick={closeDrawer}>
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  {drawerMode === 'create' ? '新增' : '儲存'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Stock Adjustment Modal */}
      {isStockModalOpen && currentProduct && (
        <>
          <div className="modal-overlay" onClick={closeStockModal}></div>
          <div className="stock-modal">
            <div className="modal-header">
              <h3>調整庫存</h3>
              <button className="close-modal-btn" onClick={closeStockModal}>
                ✕
              </button>
            </div>
            <div className="modal-content">
              <p className="modal-product-name">{currentProduct.name}</p>
              <p className="modal-current-stock">目前庫存: {currentProduct.stock}</p>

              <div className="stock-action-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="stockAction"
                    value="add"
                    checked={stockAction === 'add'}
                    onChange={() => setStockAction('add')}
                  />
                  <span>增加庫存</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="stockAction"
                    value="subtract"
                    checked={stockAction === 'subtract'}
                    onChange={() => setStockAction('subtract')}
                  />
                  <span>減少庫存</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="stockAction"
                    value="set"
                    checked={stockAction === 'set'}
                    onChange={() => setStockAction('set')}
                  />
                  <span>設定庫存</span>
                </label>
              </div>

              <div className="form-group">
                <label>數量</label>
                <input
                  type="number"
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  min="0"
                  placeholder="請輸入數量"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeStockModal}>
                取消
              </button>
              <button className="btn-primary" onClick={handleStockAdjust}>
                確認調整
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminProductManagementPage;
