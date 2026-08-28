export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'COLLECTOR' | 'CUSTOMER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';

export interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  phone?: string | null;
  job_title?: string | null;
  role: UserRole;
  status: UserStatus;
  customer_id?: number | null;
  rejection_reason?: string | null;
  approved_by?: number | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}


export interface LoginCredentials {
  usernameOrEmail: string;
  password?: string;
}

export interface RegisterCredentials {
  full_name: string;
  username: string;
  email: string;
  phone?: string;
  job_title?: string;
  password?: string;
}

export interface AuthResponseData {
  user: User;
  token: string;
  permissions: string[];
}

export interface CreateUserInput {
  full_name: string;
  username: string;
  email: string;
  password?: string;
  phone?: string;
  job_title?: string;
  role_code: UserRole;
  status?: UserStatus;
}

export interface UpdateUserInput {
  full_name?: string;
  email?: string;
  phone?: string;
  job_title?: string;
  role_code?: UserRole;
  status?: UserStatus;
}

export interface ApprovalRecord {
  id: number;
  entity_type: 'USER' | 'CUSTOMER' | 'DATA' | 'VISIT' | 'PAYMENT' | 'INVOICE';
  entity_id: number;
  submitted_by?: number;
  submitter_name?: string;
  target_name?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVIEW';
  reviewed_by?: number;
  reviewer_name?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  details?: Record<string, unknown>;
}
