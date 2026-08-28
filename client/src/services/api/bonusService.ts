import { apiClient } from './client';

export interface Bonus {
  id: number;
  name: string;
  description?: string | null;
  bonus_type: 'FIXED' | 'PERCENTAGE' | 'TARGET_BASED';
  value: number;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  criteria?: string | null;
  created_at: string;
}

export class BonusService {
  async getBonuses(activeOnly?: boolean): Promise<Bonus[]> {
    const endpoint = activeOnly !== undefined ? `/bonuses?activeOnly=${activeOnly}` : '/bonuses';
    const response = await apiClient.get<Bonus[]>(endpoint);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب قائمة الحوافز');
    }
    return response.data;
  }

  async getBonusById(id: number): Promise<Bonus> {
    const response = await apiClient.get<Bonus>(`/bonuses/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب تفاصيل الحافز');
    }
    return response.data;
  }

  async createBonus(data: Partial<Bonus>): Promise<Bonus> {
    const response = await apiClient.post<Bonus>('/admin/bonuses', data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل إنشاء الحافز');
    }
    return response.data;
  }

  async updateBonus(id: number, data: Partial<Bonus>): Promise<Bonus> {
    const response = await apiClient.put<Bonus>(`/admin/bonuses/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل تحديث الحافز');
    }
    return response.data;
  }

  async toggleBonusStatus(id: number, isActive: boolean): Promise<Bonus> {
    const response = await apiClient.patch<Bonus>(`/admin/bonuses/${id}/status`, { is_active: isActive });
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل تعديل حالة الحافز');
    }
    return response.data;
  }
}

export const bonusService = new BonusService();
