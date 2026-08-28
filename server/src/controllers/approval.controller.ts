import { Request, Response, NextFunction } from 'express';
import { approvalService } from '../services/approval.service';
import { ResponseUtil } from '../utils/apiResponse';
import { ApprovalStatus } from '../types/approval.types';

export class ApprovalController {
  getApprovals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = req.query.status as ApprovalStatus | undefined;
      const records = await approvalService.getApprovals(status);
      ResponseUtil.success(res, 'قائمة طلبات الاعتماد', records, 200);
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const reviewerId = req.user?.userId || 1;
      const { notes } = req.body;
      const updated = await approvalService.approve(id, reviewerId, notes);
      ResponseUtil.success(res, 'تم اعتماد الطلب بنجاح', updated, 200);
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const reviewerId = req.user?.userId || 1;
      const { reason } = req.body;
      const updated = await approvalService.reject(id, reviewerId, reason);
      ResponseUtil.success(res, 'تم رفض الطلب', updated, 200);
    } catch (error) {
      next(error);
    }
  };
}

export const approvalController = new ApprovalController();
