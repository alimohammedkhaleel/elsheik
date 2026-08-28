import { apiClient } from './client';

export interface Product {
  id: number;
  product_code: string;
  name: string;
  description?: string | null;
  unit: string;
  purchase_price: number;
  selling_price: number;
  is_active: boolean;
  created_at: string;
}

export class ProductService {
  async getProducts(search?: string, activeOnly?: boolean): Promise<Product[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (activeOnly !== undefined) params.append('activeOnly', String(activeOnly));

    const qs = params.toString();
    const endpoint = `/products${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<Product[]>(endpoint);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب قائمة الأصناف');
    }
    return response.data;
  }

  async getProductById(id: number): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب تفاصيل الصنف');
    }
    return response.data;
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await apiClient.post<Product>('/admin/products', data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل إضافة الصنف');
    }
    return response.data;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const response = await apiClient.put<Product>(`/admin/products/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل تحديث الصنف');
    }
    return response.data;
  }

  async toggleProductStatus(id: number, isActive: boolean): Promise<Product> {
    const response = await apiClient.patch<Product>(`/admin/products/${id}/status`, { is_active: isActive });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل تعديل حالة الصنف');
    }
    return response.data;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const response = await apiClient.delete<{ id: number; deleted: boolean }>(`/admin/products/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'فشل حذف الصنف');
    }
    return true;
  }
}

export const productService = new ProductService();
