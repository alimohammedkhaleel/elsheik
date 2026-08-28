import { UserRole, UserStatus, UserResponse } from './user.types';

export interface LoginInput {
  usernameOrEmail: string;
  password?: string;
}

export interface RegisterInput {
  full_name: string;
  username: string;
  email: string;
  password?: string;
  phone?: string;
  job_title?: string;
}

export interface AuthTokenPayload {
  userId: number;
  username: string;
  role: UserRole;
  status: UserStatus;
  customerId?: number | null;
}

export interface AuthResponseData {
  user: UserResponse;
  token: string;
  permissions: string[];
}
