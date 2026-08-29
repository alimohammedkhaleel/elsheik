import { apiClient } from './client';
import { CustomerInteraction, InteractionType } from '../../types/financial';

export interface CreateInteractionInput {
  customer_id: number;
  interaction_type: InteractionType;
  interaction_date?: string;
  summary: string;       // PRIMARY field the server validates
  notes?: string;        // optional extended notes
  follow_up_date?: string;
  is_resolved?: boolean;
}

export class InteractionService {
  async getByCustomer(customerId: number): Promise<CustomerInteraction[]> {
    const response = await apiClient.get<CustomerInteraction[]>(`/customers/${customerId}/interactions`);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل جلب سجل التفاعلات والزيارات');
    }
    return response.data;
  }

  async createInteraction(input: CreateInteractionInput): Promise<CustomerInteraction> {
    const response = await apiClient.post<CustomerInteraction>(
      `/customers/${input.customer_id}/interactions`,
      input
    );
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل تسجيل التفاعل / الزيارة');
    }
    return response.data;
  }

  async deleteInteraction(customerId: number, interactionId: number): Promise<void> {
    const response = await apiClient.delete<null>(
      `/customers/${customerId}/interactions/${interactionId}`
    );
    if (!response.success) {
      throw new Error(response.message || 'فشل حذف الملاحظة');
    }
  }

  async deleteAllInteractions(customerId: number): Promise<void> {
    const response = await apiClient.delete<null>(
      `/customers/${customerId}/interactions`
    );
    if (!response.success) {
      throw new Error(response.message || 'فشل حذف جميع الملاحظات');
    }
  }
}

export const interactionService = new InteractionService();
