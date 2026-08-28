import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { ResponseUtil } from '../utils/apiResponse';

export class ProductController {
  getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const search = req.query.search as string | undefined;
      const activeOnly = req.query.active === 'true' || req.query.activeOnly === 'true';
      const products = await productService.getAllProducts(search, activeOnly ? true : undefined);
      ResponseUtil.success(res, 'قائمة المنتجات والأصناف', products, 200);
    } catch (error) {
      next(error);
    }
  };

  getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await productService.getProductById(id);
      ResponseUtil.success(res, 'تفاصيل المنتج', product, 200);
    } catch (error) {
      next(error);
    }
  };

  createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = req.user?.userId || 1;
      const created = await productService.createProduct(req.body, adminId);
      ResponseUtil.success(res, 'تم إضافة المنتج بنجاح', created, 201);
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const adminId = req.user?.userId || 1;
      const updated = await productService.updateProduct(id, req.body, adminId);
      ResponseUtil.success(res, 'تم تحديث بيانات المنتج بنجاح', updated, 200);
    } catch (error) {
      next(error);
    }
  };

  toggleActiveStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const adminId = req.user?.userId || 1;
      const updated = await productService.toggleActiveStatus(id, adminId);
      ResponseUtil.success(res, 'تم تغيير حالة تفعيل المنتج بنجاح', updated, 200);
    } catch (error) {
      next(error);
    }
  };

  deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const adminId = req.user?.userId || 1;
      await productService.deleteProduct(id, adminId);
      ResponseUtil.success(res, 'تم حذف الصنف بنجاح', { id, deleted: true }, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const productController = new ProductController();
