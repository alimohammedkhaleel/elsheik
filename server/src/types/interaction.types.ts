export type InteractionType = 'VISIT' | 'CALL' | 'NOTE' | 'FOLLOW_UP' | 'CUSTOMER_SERVICE';

export interface CustomerInteraction {
  id: number;
  customer_id: number;
  employee_id: number;
  employee_name?: string;
  interaction_type: InteractionType;
  interaction_date: string;
  summary: string;
  notes?: string | null;
  follow_up_date?: string | null;
  status: string;
  created_at: string;
}

export interface CreateInteractionInput {
  customer_id: number;
  interaction_type: InteractionType;
  summary: string;
  interaction_date?: string;
  notes?: string;
  follow_up_date?: string | null;
  status?: string;
}
