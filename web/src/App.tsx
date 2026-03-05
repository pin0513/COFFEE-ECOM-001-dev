import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import PagesPage from './pages/PagesPage';
import PaymentReturnPage from './pages/PaymentReturnPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

/** 所有頁面共用的 Layout wrapper（Header + Footer + LINE 浮動按鈕） */
function AppLayout() {
  return <Layout><Outlet /></Layout>;
}

function App() {
  return (
    <ConfigProvider locale={zhTW}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success" element={<OrderSuccessPage />} />
              <Route path="/pages/:slug" element={<PagesPage />} />
              <Route path="/payment/return" element={<PaymentReturnPage />} />
              <Route path="/payment/cancel" element={<PaymentReturnPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
