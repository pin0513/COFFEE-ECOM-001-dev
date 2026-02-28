import { create } from 'zustand';

export type PurchaseMode = 'oneTime' | 'bulk' | 'subscription';

export interface CartItem {
  id: string;              // productId + ":" + purchaseMode (複合唯一 key)
  productId: string;       // 原始商品 ID
  name: string;
  price: number;           // 已套用折扣後的價格
  originalPrice: number;   // 原始售價
  image: string;
  category: string;
  description: string;
  quantity: number;
  purchaseMode: PurchaseMode;
  discountRate?: number;           // 折扣百分比（bulk 用）
  subscriptionFrequency?: string;  // 訂購頻率（subscription 用）
}

// 向下相容：舊版 addToCart 參數（一次購買，無購買模式）
export interface AddToCartParams {
  id: string;
  productId?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  purchaseMode?: PurchaseMode;
  discountRate?: number;
  subscriptionFrequency?: string;
}

interface CartStore {
  items: CartItem[];
  addToCart: (params: AddToCartParams) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],

  addToCart: (params) => {
    const purchaseMode = params.purchaseMode ?? 'oneTime';
    const cartId = params.id;
    const items = get().items;
    const existingItem = items.find(item => item.id === cartId);

    const newItem: CartItem = {
      id: cartId,
      productId: params.productId ?? params.id,
      name: params.name,
      price: params.price,
      originalPrice: params.originalPrice ?? params.price,
      image: params.image,
      category: params.category,
      description: params.description,
      quantity: 1,
      purchaseMode,
      discountRate: params.discountRate,
      subscriptionFrequency: params.subscriptionFrequency,
    };

    if (existingItem) {
      set({
        items: items.map(item =>
          item.id === cartId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      set({ items: [...items, newItem] });
    }
  },

  removeFromCart: (cartId) => {
    set({ items: get().items.filter(item => item.id !== cartId) });
  },

  updateQuantity: (cartId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(cartId);
      return;
    }
    set({
      items: get().items.map(item =>
        item.id === cartId ? { ...item, quantity } : item
      )
    });
  },

  clearCart: () => {
    set({ items: [] });
  },

  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  }
}));
