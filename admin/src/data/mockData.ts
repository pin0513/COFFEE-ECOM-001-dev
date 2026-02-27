export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  status: 'active' | 'inactive';
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  totalPrice: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  items: { productName: string; quantity: number; price: number }[];
}

export const mockProducts: Product[] = [
  { id: '1', name: '衣索比亞 耶加雪菲', price: 450, category: '咖啡豆', stock: 50, status: 'active' },
  { id: '2', name: '哥倫比亞 薇拉', price: 420, category: '咖啡豆', stock: 30, status: 'active' },
  { id: '3', name: '巴西 喜拉朵', price: 380, category: '咖啡豆', stock: 40, status: 'active' },
  { id: '4', name: 'Hario V60 手沖壺', price: 850, category: '烘焙器材', stock: 20, status: 'active' },
  { id: '5', name: '香草風味糖漿', price: 180, category: '風味糖漿', stock: 100, status: 'active' },
];

export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2026-001',
    customerName: '王小明',
    totalPrice: 1200,
    status: 'completed',
    createdAt: '2026-02-10 14:30',
    items: [
      { productName: '衣索比亞 耶加雪菲', quantity: 2, price: 450 },
      { productName: '香草風味糖漿', quantity: 1, price: 180 }
    ]
  },
  {
    id: '2',
    orderNumber: 'ORD-2026-002',
    customerName: '李美華',
    totalPrice: 850,
    status: 'processing',
    createdAt: '2026-02-11 10:15',
    items: [
      { productName: 'Hario V60 手沖壺', quantity: 1, price: 850 }
    ]
  },
  {
    id: '3',
    orderNumber: 'ORD-2026-003',
    customerName: '張大偉',
    totalPrice: 1640,
    status: 'pending',
    createdAt: '2026-02-12 09:00',
    items: [
      { productName: '哥倫比亞 薇拉', quantity: 2, price: 420 },
      { productName: '巴西 喜拉朵', quantity: 2, price: 380 }
    ]
  },
];
