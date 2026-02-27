import { useEffect, useState } from 'react';
import { Button, Card, message, Spin } from 'antd';
import { getProducts } from '../services/productService';

/**
 * 測試頁面 - 驗證 Mock API 是否正常運作
 * 訪問 http://localhost:5173/test 查看
 */
export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const testMockApi = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🧪 開始測試 Mock API...');
      const response = await getProducts({ page: 1, pageSize: 10 });

      console.log('✅ Mock API 測試成功:', response);
      setProducts(response.data);
      message.success(`成功載入 ${response.data.length} 個商品`);
    } catch (err: any) {
      console.error('❌ Mock API 測試失敗:', err);
      setError(err.message || 'Unknown error');
      message.error('Mock API 測試失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 頁面載入時自動測試
    testMockApi();
  }, []);

  return (
    <div style={{ padding: 50 }}>
      <Card title="Mock API 測試頁面">
        <h3>測試狀態</h3>
        {loading && <Spin />}
        {error && <div style={{ color: 'red' }}>錯誤: {error}</div>}

        <h3 style={{ marginTop: 20 }}>商品列表 ({products.length} 個)</h3>
        {products.map(product => (
          <div key={product.id} style={{ marginBottom: 10 }}>
            {product.id}. {product.name} - NT$ {product.price}
          </div>
        ))}

        <Button
          type="primary"
          onClick={testMockApi}
          loading={loading}
          style={{ marginTop: 20 }}
        >
          重新測試
        </Button>

        <div style={{ marginTop: 30, padding: 20, background: '#f0f0f0', borderRadius: 4 }}>
          <h4>檢查項目：</h4>
          <ul>
            <li>✅ Demo 模式: {import.meta.env.VITE_DEMO_MODE === 'true' ? '已啟用' : '未啟用'}</li>
            <li>✅ API Base URL: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5112/api'}</li>
            <li>✅ Mock API Adapter: 檢查瀏覽器 Console</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
