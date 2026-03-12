import { apiClient } from '../config/api';

export interface OrderItem {
  productId: number;
  productName: string | null;
  productSku: string | null;
  unitPrice: number;
  quantity: number;
  discount: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string | null;
  customerEmail: string | null;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  notes: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
}

export interface CreateOrderItem {
  productId: number;
  quantity: number;
  discount?: number;
}

export interface CreateOrderDto {
  customerEmail: string;
  items: CreateOrderItem[];
  discountAmount?: number;
  paymentMethod?: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  notes?: string;
  transferCode?: string;
}

export interface UpdateOrderStatusDto {
  status: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface GetOrdersParams {
  page?: number;
  pageSize?: number;
  customerId?: number;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * 取得訂單列表（分頁）
 */
export const getOrders = async (params?: GetOrdersParams): Promise<PaginatedResponse<Order>> => {
  const response = await apiClient.get<PaginatedResponse<Order>>('/orders', { params });
  return response.data;
};

/**
 * 根據 ID 取得訂單
 */
export const getOrderById = async (id: number): Promise<Order> => {
  const response = await apiClient.get<Order>(`/orders/${id}`);
  return response.data;
};

/**
 * 建立訂單
 */
export const createOrder = async (data: CreateOrderDto): Promise<Order> => {
  const response = await apiClient.post<Order>('/orders', data);
  return response.data;
};

/**
 * 更新訂單狀態
 */
export const updateOrderStatus = async (id: number, data: UpdateOrderStatusDto): Promise<Order> => {
  const response = await apiClient.patch<Order>(`/orders/${id}/status`, data);
  return response.data;
};

/**
 * 刪除訂單（軟刪除）
 */
export const deleteOrder = async (id: number): Promise<void> => {
  await apiClient.delete(`/orders/${id}`);
};

/**
 * 建立 ECPay 結帳 Form HTML
 */
export const createEcpayCheckout = async (orderId: number, installmentPeriod?: number): Promise<{ formHtml: string }> => {
  let url = `/payment/ecpay/checkout?orderId=${orderId}`;
  if (installmentPeriod && installmentPeriod > 0) url += `&installmentPeriod=${installmentPeriod}`;
  const response = await apiClient.post<{ formHtml: string }>(url);
  return response.data;
};

/**
 * 建立 LINE Pay 付款請求，取得 paymentUrl
 */
export const createLinePayRequest = async (orderId: number): Promise<{ paymentUrl: string }> => {
  const response = await apiClient.post<{ paymentUrl: string }>(`/payment/linepay/request?orderId=${orderId}`);
  return response.data;
};
