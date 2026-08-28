import { productRepository } from '../repositories/product.repository';
import { auditService } from './audit.service';
import { AppError } from '../middleware/errorHandler';
import { Product, CreateProductInput, UpdateProductInput } from '../types/product.types';

export class ProductService {
  async getAllProducts(search?: string, activeOnly?: boolean): Promise<Product[]> {
    return productRepository.findAll(search, activeOnly);
  }

  async getProductById(id: number): Promise<Product> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new AppError('المنتج غير موجود', 404, 'PRODUCT_NOT_FOUND');
    }
    return product;
  }

  async createProduct(input: CreateProductInput, adminId?: number): Promise<Product> {
    const existing = await productRepository.findByCode(input.product_code);
    if (existing) {
      throw new AppError('كود الصنف مستخدم لمنتج آخر بالفعل', 400, 'PRODUCT_CODE_EXISTS');
    }

    if (input.purchase_price < 0 || input.selling_price < 0) {
      throw new AppError('لا يمكن أن تكون الأسعار أرقاماً سالبة', 400, 'INVALID_PRICE');
    }

    const created = await productRepository.create(input);

    await auditService.record({
      user_id: adminId || null,
      action: 'PRODUCT_CREATED',
      entity_type: 'PRODUCT',
      entity_id: created.id,
      new_values: { code: created.product_code, name: created.name, price: created.selling_price },
    });

    return created;
  }

  async updateProduct(id: number, input: UpdateProductInput, adminId?: number): Promise<Product> {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new AppError('المنتج غير موجود', 404, 'PRODUCT_NOT_FOUND');
    }

    if (
      (input.purchase_price !== undefined && input.purchase_price < 0) ||
      (input.selling_price !== undefined && input.selling_price < 0)
    ) {
      throw new AppError('لا يمكن أن تكون الأسعار أرقاماً سالبة', 400, 'INVALID_PRICE');
    }

    const updated = await productRepository.update(id, input);
    if (!updated) {
      throw new AppError('فشل تحديث بيانات المنتج', 500, 'UPDATE_FAILED');
    }

    await auditService.record({
      user_id: adminId || null,
      action: 'PRODUCT_UPDATED',
      entity_type: 'PRODUCT',
      entity_id: id,
      old_values: { name: existing.name, selling_price: existing.selling_price },
      new_values: { ...input },
    });

    return updated;
  }

  async toggleActiveStatus(id: number, adminId?: number): Promise<Product> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new AppError('المنتج غير موجود', 404, 'PRODUCT_NOT_FOUND');
    }

    const updated = await productRepository.toggleActive(id);
    if (!updated) {
      throw new AppError('فشل تغيير حالة تفعيل المنتج', 500, 'STATUS_UPDATE_FAILED');
    }

    await auditService.record({
      user_id: adminId || null,
      action: updated.is_active ? 'PRODUCT_ACTIVATED' : 'PRODUCT_DEACTIVATED',
      entity_type: 'PRODUCT',
      entity_id: id,
      new_values: { is_active: updated.is_active },
    });

    return updated;
  }

  async deleteProduct(id: number, adminId?: number): Promise<boolean> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new AppError('المنتج غير موجود', 404, 'PRODUCT_NOT_FOUND');
    }

    const deleted = await productRepository.delete(id);
    if (!deleted) {
      throw new AppError('فشل حذف المنتج', 500, 'DELETE_FAILED');
    }

    await auditService.record({
      user_id: adminId || null,
      action: 'PRODUCT_DELETED',
      entity_type: 'PRODUCT',
      entity_id: id,
      old_values: { name: product.name, code: product.product_code },
    });

    return true;
  }
}

export const productService = new ProductService();
