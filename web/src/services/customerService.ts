import { apiClient } from '../config/api';

export interface Customer {
  id: number;
  displayName: string;
  email: string;
  phone: string | null;
  address: string | null;
  firebaseUid: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCustomerDto {
  displayName: string;
  email: string;
  phone?: string;
  address?: string;
  firebaseUid?: string;
}

/**
 * 建立客戶
 */
export const createCustomer = async (data: CreateCustomerDto): Promise<Customer> => {
  const response = await apiClient.post<Customer>('/customers', data);
  return response.data;
};

/**
 * 根據 Email 取得或建立客戶
 */
export const getOrCreateCustomer = async (data: CreateCustomerDto): Promise<Customer> => {
  try {
    // 嘗試建立客戶
    return await createCustomer(data);
  } catch (error: any) {
    // 如果客戶已存在，這裡可以改為查詢客戶
    // 目前簡化處理，直接拋出錯誤
    throw error;
  }
};
