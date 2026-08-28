export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'COLLECTOR' | 'CUSTOMER';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'REJECTED';

export interface User {
  id: number;
  full_name: string;
  username: string;
  email: string;
  password_hash?: string;
  phone?: string | null;
  job_title?: string | null;
  role_code: UserRole;
  status: UserStatus;
  customer_id?: number | null;
  rejection_reason?: string | null;
  approved_by?: number | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserResponse {
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

export interface CreateUserInput {
  full_name: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  job_title?: string;
  role_code: UserRole;
  status?: UserStatus;
  customer_id?: number | null;
}

export interface UpdateUserInput {
  full_name?: string;
  email?: string;
  phone?: string;
  job_title?: string;
  role_code?: UserRole;
  status?: UserStatus;
  customer_id?: number | null;
}

