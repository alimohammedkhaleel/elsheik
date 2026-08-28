export type BonusType = 'FIXED' | 'PERCENTAGE' | 'TARGET_BASED';

export interface Bonus {
  id: number;
  name: string;
  description?: string | null;
  bonus_type: BonusType;
  value: number;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  criteria?: string | null;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBonusInput {
  name: string;
  description?: string;
  bonus_type: BonusType;
  value: number;
  is_active?: boolean;
  start_date?: string;
  end_date?: string;
  criteria?: string;
}
