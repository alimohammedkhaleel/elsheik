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
  updated_at: string;
}

export interface CreateProductInput {
  product_code: string;
  name: string;
  description?: string;
  unit?: string;
  purchase_price: number;
  selling_price: number;
  is_active?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  unit?: string;
  purchase_price?: number;
  selling_price?: number;
  is_active?: boolean;
}
