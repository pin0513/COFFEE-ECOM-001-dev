import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { Product } from '../services/productService';
import type { Order, CreateOrderDto } from '../services/orderService';
import type { Customer, CreateCustomerDto } from '../services/customerService';
import {
  mockProducts,
  getMockOrders,
  getMockCustomers,
  saveMockOrder,
  saveMockCustomer,
  getNextOrderId,
  getNextOrderNumber,
  getNextCustomerId,
  initMockData,
} from './mockData';

/**
 * Mock API 回應延遲（模擬網路請求）
 */
const MOCK_DELAY = 300;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 模擬分頁回應
 */
const createPaginatedResponse = <T>(
  data: T[],
  page: number = 1,
  pageSize: number = 10
): { data: T[]; page: number; pageSize: number; totalCount: number; totalPages: number } => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedData = data.slice(start, end);

  return {
    data: paginatedData,
    page,
    pageSize,
    totalCount: data.length,
    totalPages: Math.ceil(data.length / pageSize),
  };
};

/**
 * Mock API 處理器
 */
const handleMockRequest = async (config: InternalAxiosRequestConfig): Promise<any> => {
  await delay(MOCK_DELAY);

  const { method = 'get', url = '', data } = config;
  const urlLower = url.toLowerCase();

  console.log(`🎭 Mock API: ${method.toUpperCase()} ${url}`);

  // ==================== Products API ====================
  if (urlLower.includes('/products')) {
    // GET /products/:id
    if (method === 'get' && /\/products\/\d+$/.test(urlLower)) {
      const id = parseInt(url.split('/').pop()!);
      const product = mockProducts.find(p => p.id === id);

      if (!product) {
        throw {
          response: {
            status: 404,
            data: { message: 'Product not found' },
          },
        };
      }

      return {
        data: product,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }

    // GET /products (list)
    if (method === 'get') {
      const params = config.params || {};
      let filteredProducts = [...mockProducts];

      // 篩選
      if (params.categoryId) {
        filteredProducts = filteredProducts.filter(p => p.categoryId === params.categoryId);
      }
      if (params.isFeatured !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.isFeatured === params.isFeatured);
      }
      if (params.isActive !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.isActive === params.isActive);
      }
      if (params.searchKeyword) {
        const keyword = params.searchKeyword.toLowerCase();
        filteredProducts = filteredProducts.filter(p =>
          p.name.toLowerCase().includes(keyword) ||
          (p.description && p.description.toLowerCase().includes(keyword))
        );
      }

      const response = createPaginatedResponse(
        filteredProducts,
        params.page || 1,
        params.pageSize || 10
      );

      return {
        data: response,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }

    // POST /products (create)
    if (method === 'post') {
      const newProduct: Product = {
        id: mockProducts.length + 1,
        ...data,
        createdAt: new Date().toISOString(),
      };
      mockProducts.push(newProduct);

      return {
        data: newProduct,
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      };
    }

    // PUT /products/:id (update)
    if (method === 'put' && /\/products\/\d+$/.test(urlLower)) {
      const id = parseInt(url.split('/').pop()!);
      const index = mockProducts.findIndex(p => p.id === id);

      if (index === -1) {
        throw {
          response: {
            status: 404,
            data: { message: 'Product not found' },
          },
        };
      }

      mockProducts[index] = {
        ...mockProducts[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      return {
        data: mockProducts[index],
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }

    // DELETE /products/:id (soft delete)
    if (method === 'delete' && /\/products\/\d+$/.test(urlLower)) {
      const id = parseInt(url.split('/').pop()!);
      const index = mockProducts.findIndex(p => p.id === id);

      if (index === -1) {
        throw {
          response: {
            status: 404,
            data: { message: 'Product not found' },
          },
        };
      }

      mockProducts[index].isActive = false;

      return {
        data: null,
        status: 204,
        statusText: 'No Content',
        headers: {},
        config,
      };
    }
  }

  // ==================== Customers API ====================
  if (urlLower.includes('/customers')) {
    // POST /customers (create)
    if (method === 'post') {
      const customers = getMockCustomers();
      const customerData = data as CreateCustomerDto;

      // 檢查 email 是否已存在
      const existing = customers.find(c => c.email === customerData.email);
      if (existing) {
        // 返回現有客戶（模擬 getOrCreateCustomer 行為）
        return {
          data: existing,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      const newCustomer: Customer = {
        id: getNextCustomerId(),
        displayName: customerData.displayName,
        email: customerData.email,
        phone: customerData.phone || null,
        address: customerData.address || null,
        firebaseUid: customerData.firebaseUid || null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };

      saveMockCustomer(newCustomer);

      return {
        data: newCustomer,
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      };
    }
  }

  // ==================== Orders API ====================
  if (urlLower.includes('/orders')) {
    // GET /orders/:id
    if (method === 'get' && /\/orders\/\d+$/.test(urlLower)) {
      const id = parseInt(url.split('/').pop()!);
      const orders = getMockOrders();
      const order = orders.find(o => o.id === id);

      if (!order) {
        throw {
          response: {
            status: 404,
            data: { message: 'Order not found' },
          },
        };
      }

      return {
        data: order,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }

    // GET /orders (list)
    if (method === 'get') {
      const params = config.params || {};
      let filteredOrders = [...getMockOrders()];

      // 篩選
      if (params.customerId) {
        filteredOrders = filteredOrders.filter(o => o.customerId === params.customerId);
      }
      if (params.status) {
        filteredOrders = filteredOrders.filter(o => o.status === params.status);
      }
      if (params.paymentStatus) {
        filteredOrders = filteredOrders.filter(o => o.paymentStatus === params.paymentStatus);
      }

      // 排序（最新的在前面）
      filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const response = createPaginatedResponse(
        filteredOrders,
        params.page || 1,
        params.pageSize || 10
      );

      return {
        data: response,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }

    // POST /orders (create)
    if (method === 'post') {
      const orderData = data as CreateOrderDto;
      const customers = getMockCustomers();
      const customer = customers.find(c => c.email === orderData.customerEmail) || customers[0];

      if (!customer) {
        throw {
          response: {
            status: 400,
            data: { message: 'Customer not found' },
          },
        };
      }

      // 計算訂單項目
      const items = orderData.items.map(item => {
        const product = mockProducts.find(p => p.id === item.productId);
        if (!product) {
          throw {
            response: {
              status: 400,
              data: { message: `Product ${item.productId} not found` },
            },
          };
        }

        const unitPrice = product.price;
        const discount = item.discount || 0;
        const subtotal = unitPrice * item.quantity - discount;

        return {
          productId: item.productId,
          productName: product.name,
          productSku: product.sku,
          unitPrice,
          quantity: item.quantity,
          discount,
          subtotal,
        };
      });

      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      const discountAmount = orderData.discountAmount || 0;
      const finalAmount = totalAmount - discountAmount;

      const newOrder: Order = {
        id: getNextOrderId(),
        orderNumber: getNextOrderNumber(),
        customerId: customer.id,
        customerName: customer.displayName,
        customerEmail: customer.email,
        totalAmount,
        discountAmount,
        finalAmount,
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentMethod: orderData.paymentMethod || null,
        recipientName: orderData.recipientName,
        recipientPhone: orderData.recipientPhone,
        shippingAddress: orderData.shippingAddress,
        notes: orderData.notes || null,
        createdAt: new Date().toISOString(),
        paidAt: null,
        shippedAt: null,
        completedAt: null,
        cancelledAt: null,
        items,
      };

      saveMockOrder(newOrder);

      return {
        data: newOrder,
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      };
    }

    // PATCH /orders/:id/status (update status)
    if (method === 'patch' && /\/orders\/\d+\/status$/.test(urlLower)) {
      const id = parseInt(url.split('/').slice(-2, -1)[0]);
      const orders = getMockOrders();
      const index = orders.findIndex(o => o.id === id);

      if (index === -1) {
        throw {
          response: {
            status: 404,
            data: { message: 'Order not found' },
          },
        };
      }

      orders[index] = {
        ...orders[index],
        status: data.status,
      };

      // 根據狀態更新時間戳
      if (data.status === 'paid') {
        orders[index].paidAt = new Date().toISOString();
        orders[index].paymentStatus = 'paid';
      } else if (data.status === 'shipped') {
        orders[index].shippedAt = new Date().toISOString();
      } else if (data.status === 'completed') {
        orders[index].completedAt = new Date().toISOString();
      } else if (data.status === 'cancelled') {
        orders[index].cancelledAt = new Date().toISOString();
      }

      return {
        data: orders[index],
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }
  }

  // 未匹配的路由
  throw {
    response: {
      status: 404,
      data: { message: 'Mock API route not found' },
    },
  };
};

/**
 * 自訂錯誤類別，用於攔截請求
 */
class MockResponseError extends Error {
  mockResponse: any;

  constructor(mockResponse: any) {
    super('Mock response');
    this.mockResponse = mockResponse;
    this.name = 'MockResponseError';
  }
}

/**
 * 安裝 Mock API Adapter
 */
export const installMockAdapter = (axiosInstance: AxiosInstance) => {
  initMockData();

  // 攔截請求，改用 mock handler
  axiosInstance.interceptors.request.use(
    async (config) => {
      try {
        const mockResponse = await handleMockRequest(config);
        // 拋出特殊錯誤，包含 mock 回應
        throw new MockResponseError(mockResponse);
      } catch (error: any) {
        if (error instanceof MockResponseError) {
          // 這是 mock 回應
          throw error;
        }
        // 其他錯誤（例如 mock handler 拋出的錯誤）
        throw error;
      }
    },
    (error) => Promise.reject(error)
  );

  // 攔截回應，返回 mock 資料
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      // 檢查是否是 mock 回應錯誤
      if (error instanceof MockResponseError) {
        return Promise.resolve(error.mockResponse);
      }
      return Promise.reject(error);
    }
  );

  console.log('✅ Mock API Adapter 已安裝');
};
