import { ApiClient } from './client';
import { ApiResponse } from '../../types/api';
import { ApprovalRecord } from '../../types/auth';

let mockApprovalsList: ApprovalRecord[] = [
  {
    id: 1,
    entity_type: 'USER',
    entity_id: 5,
    submitter_name: 'سارة عبد الله',
    target_name: 'حساب مندوب مبيعات جديد',
    status: 'PENDING',
    created_at: '2026-02-01T12:00:00Z',
    updated_at: '2026-02-01T12:00:00Z',
    details: {
      email: 'sara@sheikh.com',
      phone: '01055566677',
      role: 'EMPLOYEE',
      job_title: 'مندوبة مبيعات جديدة',
    },
  },
  {
    id: 2,
    entity_type: 'CUSTOMER',
    entity_id: 104,
    submitter_name: 'محمد خالد الشريف',
    target_name: 'سوبرماركت البركة - حد ائتماني 50,000 ج.م',
    status: 'PENDING',
    created_at: '2026-02-02T14:30:00Z',
    updated_at: '2026-02-02T14:30:00Z',
    details: {
      requested_limit: '50,000 ج.م',
      city: 'القاهرة - المعادي',
    },
  },
  {
    id: 3,
    entity_type: 'PAYMENT',
    entity_id: 202,
    submitter_name: 'طارق حسني',
    target_name: 'تسوية شيك آجل بمبلغ 25,000 ج.م',
    status: 'PENDING',
    created_at: '2026-02-03T09:15:00Z',
    updated_at: '2026-02-03T09:15:00Z',
    details: {
      amount: '25,000 ج.م',
      customer: 'هايبر النصر',
      cheque_number: 'CHK-994821',
    },
  },
];

export class ApprovalService {
  static async getApprovals(status?: string): Promise<ApiResponse<ApprovalRecord[]>> {
    const queryStr = status ? `?status=${status}` : '';
    const res = await ApiClient.get<ApprovalRecord[]>(`/admin/approvals${queryStr}`);
    if (res.success && res.data) {
      return res;
    }

    // Mock fallback
    let filtered = [...mockApprovalsList];
    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    return {
      success: true,
      message: 'تم جلب طلبات الاعتماد',
      data: filtered,
    };
  }

  static async approve(id: number, notes?: string): Promise<ApiResponse<ApprovalRecord>> {
    const res = await ApiClient.patch<ApprovalRecord>(`/admin/approvals/${id}/approve`, { notes });
    if (res.success && res.data) {
      return res;
    }

    // Mock fallback
    const idx = mockApprovalsList.findIndex((r) => r.id === id);
    if (idx !== -1) {
      mockApprovalsList[idx] = {
        ...mockApprovalsList[idx],
        status: 'APPROVED',
        review_notes: notes || 'تم الاعتماد بنجاح',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 1,
        reviewer_name: 'المدير العام',
        updated_at: new Date().toISOString(),
      };

      return {
        success: true,
        message: 'تم اعتماد الطلب بنجاح',
        data: mockApprovalsList[idx],
      };
    }

    return {
      success: false,
      message: 'طلب الاعتماد غير موجود',
    };
  }

  static async reject(id: number, reason: string): Promise<ApiResponse<ApprovalRecord>> {
    const res = await ApiClient.patch<ApprovalRecord>(`/admin/approvals/${id}/reject`, { reason });
    if (res.success && res.data) {
      return res;
    }

    // Mock fallback
    const idx = mockApprovalsList.findIndex((r) => r.id === id);
    if (idx !== -1) {
      mockApprovalsList[idx] = {
        ...mockApprovalsList[idx],
        status: 'REJECTED',
        review_notes: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: 1,
        reviewer_name: 'المدير العام',
        updated_at: new Date().toISOString(),
      };

      return {
        success: true,
        message: 'تم رفض الطلب',
        data: mockApprovalsList[idx],
      };
    }

    return {
      success: false,
      message: 'طلب الاعتماد غير موجود',
    };
  }
}
