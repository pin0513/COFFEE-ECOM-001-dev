import { apiClient } from '../config/api';

export interface Product {
  id: number;
  sku: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  stockQuantity: number;
  categoryId: number | null;
  categoryName: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  isOrderable: boolean;
  inventoryEnabled: boolean;
  unit: string;
  specData: string | null;
  categorySpecTemplate: string | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  isActive?: boolean;
  featured?: boolean;
}

export const getProducts = async (params?: GetProductsParams): Promise<PaginatedResponse<Product>> => {
  const response = await apiClient.get<PaginatedResponse<Product>>('/products', { params });
  return response.data;
};

export const getProductById = async (id: number): Promise<Product> => {
  const response = await apiClient.get<Product>(`/products/${id}`);
  return response.data;
};
