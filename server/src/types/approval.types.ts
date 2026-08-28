export type ApprovalEntityType = 'USER' | 'CUSTOMER' | 'DATA' | 'VISIT' | 'PAYMENT' | 'INVOICE';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';

export interface ApprovalRecord {
  id: number;
  entity_type: ApprovalEntityType;
  entity_id: number;
  entity_name?: string;
  submitted_by?: number | null;
  submitter_name?: string | null;
  status: ApprovalStatus;
  reviewed_by?: number | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  review_notes?: string | null;
  details?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ReviewApprovalInput {
  decision: 'APPROVED' | 'REJECTED';
  review_notes?: string;
}
