import { ApiClient } from './client';
import { ApiResponse } from '../../types/api';
import { CreateUserInput, UpdateUserInput, User, UserRole, UserStatus } from '../../types/auth';

let mockUsersList: User[] = [
  {
    id: 1,
    full_name: 'المدير العام',
    username: 'admin',
    email: 'admin@sheikh-distribution.com',
    phone: '01011122233',
    job_title: 'مدير عام المنظومة',
    role: 'ADMIN',
    status: 'ACTIVE',
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 2,
    full_name: 'علي محمد حسن',
    username: 'ali_sales',
    email: 'ali@sheikh.com',
    phone: '01012345678',
    job_title: 'مندوب مبيعات - قطاع القاهرة',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    created_at: '2026-01-10T09:30:00Z',
    updated_at: '2026-01-10T09:30:00Z',
  },
  {
    id: 3,
    full_name: 'أحمد محمود إبراهيم',
    username: 'ahmed_sales',
    email: 'ahmed@sheikh.com',
    phone: '01198765432',
    job_title: 'مندوب مبيعات - قطاع الجيزة',
    role: 'EMPLOYEE',
    status: 'ACTIVE',
    created_at: '2026-01-15T10:15:00Z',
    updated_at: '2026-01-15T10:15:00Z',
  },
  {
    id: 4,
    full_name: 'طارق خالد عبد الرحمن',
    username: 'tarek_collector',
    email: 'tarek@sheikh.com',
    phone: '01234567890',
    job_title: 'محصل مالي ميداني',
    role: 'COLLECTOR',
    status: 'ACTIVE',
    created_at: '2026-01-20T11:00:00Z',
    updated_at: '2026-01-20T11:00:00Z',
  },
];

export class UserService {
  static async getAllUsers(filters?: {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
  }): Promise<ApiResponse<User[]>> {
    let queryParams = '';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.status) params.append('status', filters.status);
      const str = params.toString();
      if (str) queryParams = `?${str}`;
    }

    const res = await ApiClient.get<User[]>(`/admin/users${queryParams}`);
    if (res.success && res.data) {
      return res;
    }

    // Mock fallback
    let filtered = [...mockUsersList];
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    if (filters?.role) {
      filtered = filtered.filter((u) => u.role === filters.role);
    }
    if (filters?.status) {
      filtered = filtered.filter((u) => u.status === filters.status);
    }

    return {
      success: true,
      message: 'تم جلب قائمة المستخدمين',
      data: filtered,
    };
  }

  static async getUsers(): Promise<User[]> {
    const res = await this.getAllUsers();
    return res.data || [];
  }

  static async createUser(input: CreateUserInput): Promise<ApiResponse<User>> {
    const res = await ApiClient.post<User>('/admin/users', input);
    if (res.success && res.data) {
      return res;
    }

    const newUser: User = {
      id: mockUsersList.length + 1,
      full_name: input.full_name,
      username: input.username,
      email: input.email,
      phone: input.phone || null,
      job_title: input.job_title || null,
      role: input.role_code,
      status: input.status || 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockUsersList.unshift(newUser);

    return {
      success: true,
      message: 'تم إضافة المستخدم بنجاح',
      data: newUser,
    };
  }

  static async updateUser(id: number, input: UpdateUserInput): Promise<ApiResponse<User>> {
    const res = await ApiClient.put<User>(`/admin/users/${id}`, input);
    if (res.success && res.data) {
      return res;
    }

    const idx = mockUsersList.findIndex((u) => u.id === id);
    if (idx !== -1) {
      mockUsersList[idx] = {
        ...mockUsersList[idx],
        ...input,
        role: input.role_code || mockUsersList[idx].role,
        updated_at: new Date().toISOString(),
      };
      return {
        success: true,
        message: 'تم تحديث بيانات المستخدم',
        data: mockUsersList[idx],
      };
    }

    return {
      success: false,
      message: 'المستخدم غير موجود',
    };
  }

  static async updateStatus(id: number, status: UserStatus): Promise<ApiResponse<User>> {
    const res = await ApiClient.patch<User>(`/admin/users/${id}/status`, { status });
    if (res.success && res.data) {
      return res;
    }

    const idx = mockUsersList.findIndex((u) => u.id === id);
    if (idx !== -1) {
      mockUsersList[idx] = {
        ...mockUsersList[idx],
        status,
        updated_at: new Date().toISOString(),
      };
      return {
        success: true,
        message: 'تم تحديث حالة المستخدم',
        data: mockUsersList[idx],
      };
    }

    return {
      success: false,
      message: 'المستخدم غير موجود',
    };
  }

  static async updateRole(id: number, role: UserRole): Promise<ApiResponse<User>> {
    const res = await ApiClient.patch<User>(`/admin/users/${id}/role`, { role });
    if (res.success && res.data) {
      return res;
    }

    const idx = mockUsersList.findIndex((u) => u.id === id);
    if (idx !== -1) {
      mockUsersList[idx] = {
        ...mockUsersList[idx],
        role,
        updated_at: new Date().toISOString(),
      };
      return {
        success: true,
        message: 'تم تعديل دور المستخدم بنجاح',
        data: mockUsersList[idx],
      };
    }

    return {
      success: false,
      message: 'المستخدم غير موجود',
    };
  }
}

export const userService = {
  getAllUsers: UserService.getAllUsers.bind(UserService),
  getUsers: UserService.getUsers.bind(UserService),
  createUser: UserService.createUser.bind(UserService),
  updateUser: UserService.updateUser.bind(UserService),
  updateStatus: UserService.updateStatus.bind(UserService),
  updateRole: UserService.updateRole.bind(UserService),
};
