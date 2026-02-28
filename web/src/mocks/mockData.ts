import type { Product } from '../services/productService';
import type { Order } from '../services/orderService';
import type { Customer } from '../services/customerService';

/**
 * Mock 商品資料
 */
export const mockProducts: Product[] = [
  {
    id: 1,
    sku: 'COFFEE-001',
    name: '衣索比亞 耶加雪菲',
    shortDescription: '花香與檸檬調性，來自非洲高海拔產區',
    description: '來自非洲高海拔產區，帶有花香和檸檬調性',
    price: 450,
    stockQuantity: 100,
    categoryId: 1,
    categoryName: '精品咖啡豆',
    imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
    isFeatured: true,
    isActive: true,
    isOrderable: true,
    inventoryEnabled: false,
    unit: '磅',
    specData: null,
    categorySpecTemplate: null,
    bulkOptions: null,
    subscriptionOptions: null,
    parentProductId: null,
    variantLabel: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    sku: 'COFFEE-002',
    name: '哥倫比亞 蕙蘭',
    shortDescription: '柔和順口，堅果與巧克力風味',
    description: '柔和順口，帶有堅果和巧克力風味',
    price: 380,
    stockQuantity: 150,
    categoryId: 1,
    categoryName: '精品咖啡豆',
    imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400',
    isFeatured: true,
    isActive: true,
    isOrderable: true,
    inventoryEnabled: false,
    unit: '磅',
    specData: null,
    categorySpecTemplate: null,
    bulkOptions: null,
    subscriptionOptions: null,
    parentProductId: null,
    variantLabel: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    sku: 'COFFEE-003',
    name: '肯亞 AA',
    shortDescription: '濃郁飽滿，黑醋栗與紅酒香氣',
    description: '濃郁飽滿，帶有黑醋栗和紅酒香氣',
    price: 520,
    stockQuantity: 80,
    categoryId: 1,
    categoryName: '精品咖啡豆',
    imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400',
    isFeatured: false,
    isActive: true,
    isOrderable: true,
    inventoryEnabled: false,
    unit: '磅',
    specData: null,
    categorySpecTemplate: null,
    bulkOptions: null,
    subscriptionOptions: null,
    parentProductId: null,
    variantLabel: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 4,
    sku: 'COFFEE-004',
    name: '巴西 聖保羅',
    shortDescription: '經典義式咖啡豆，適合製作濃縮咖啡',
    description: '經典義式咖啡豆，適合製作濃縮咖啡',
    price: 350,
    stockQuantity: 200,
    categoryId: 1,
    categoryName: '精品咖啡豆',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
    isFeatured: false,
    isActive: true,
    isOrderable: true,
    inventoryEnabled: false,
    unit: '磅',
    specData: null,
    categorySpecTemplate: null,
    bulkOptions: null,
    subscriptionOptions: null,
    parentProductId: null,
    variantLabel: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 5,
    sku: 'DRIP-001',
    name: '掛耳咖啡禮盒（10入）',
    shortDescription: '精選四款咖啡豆，隨時享受手沖咖啡',
    description: '精選四款咖啡豆，隨時享受手沖咖啡',
    price: 680,
    stockQuantity: 50,
    categoryId: 2,
    categoryName: '即溶/二合一/三合一',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    isFeatured: true,
    isActive: true,
    isOrderable: true,
    inventoryEnabled: false,
    unit: '盒',
    specData: null,
    categorySpecTemplate: null,
    bulkOptions: null,
    subscriptionOptions: null,
    parentProductId: null,
    variantLabel: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 6,
    sku: 'EQUIP-001',
    name: 'Hario V60 手沖壺',
    shortDescription: '經典手沖器具，精準控制水流',
    description: '經典手沖器具，精準控制水流',
    price: 1200,
    stockQuantity: 30,
    categoryId: 3,
    categoryName: '咖啡機/沖煮器材',
    imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400',
    isFeatured: false,
    isActive: true,
    isOrderable: true,
    inventoryEnabled: false,
    unit: '個',
    specData: null,
    categorySpecTemplate: null,
    bulkOptions: null,
    subscriptionOptions: null,
    parentProductId: null,
    variantLabel: null,
    createdAt: new Date().toISOString(),
  },
];

/**
 * Mock 客戶資料（儲存在 localStorage）
 */
let mockCustomers: Customer[] = [];
let customerIdCounter = 1;

export const getMockCustomers = (): Customer[] => {
  try {
    const stored = localStorage.getItem('mockCustomers');
    if (stored) {
      mockCustomers = JSON.parse(stored);
      customerIdCounter = Math.max(...mockCustomers.map(c => c.id), 0) + 1;
    }
  } catch (e) {
    console.warn('無法讀取 mock customers:', e);
  }
  return mockCustomers;
};

export const saveMockCustomer = (customer: Customer): Customer => {
  mockCustomers.push(customer);
  try {
    localStorage.setItem('mockCustomers', JSON.stringify(mockCustomers));
  } catch (e) {
    console.warn('無法儲存 mock customers:', e);
  }
  return customer;
};

export const getNextCustomerId = (): number => {
  return customerIdCounter++;
};

/**
 * Mock 訂單資料（儲存在 localStorage）
 */
let mockOrders: Order[] = [];
let orderIdCounter = 1;
let orderNumberCounter = 1000;

export const getMockOrders = (): Order[] => {
  try {
    const stored = localStorage.getItem('mockOrders');
    if (stored) {
      mockOrders = JSON.parse(stored);
      orderIdCounter = Math.max(...mockOrders.map(o => o.id), 0) + 1;
      orderNumberCounter = Math.max(...mockOrders.map(o => parseInt(o.orderNumber.replace('ORD-', ''))), 1000) + 1;
    }
  } catch (e) {
    console.warn('無法讀取 mock orders:', e);
  }
  return mockOrders;
};

export const saveMockOrder = (order: Order): Order => {
  mockOrders.push(order);
  try {
    localStorage.setItem('mockOrders', JSON.stringify(mockOrders));
  } catch (e) {
    console.warn('無法儲存 mock orders:', e);
  }
  return order;
};

export const getNextOrderId = (): number => {
  return orderIdCounter++;
};

export const getNextOrderNumber = (): string => {
  return `ORD-${orderNumberCounter++}`;
};

/**
 * 初始化 Mock 資料
 */
export const initMockData = () => {
  getMockCustomers();
  getMockOrders();
  console.log('🎭 Mock 資料已初始化');
};
