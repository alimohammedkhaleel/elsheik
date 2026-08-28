import { apiClient } from './client';
import { User, LoginCredentials, RegisterCredentials, AuthResponseData } from '../../types/auth';

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponseData> {
    const response = await apiClient.post<AuthResponseData>('/auth/login', credentials);
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل تسجيل الدخول');
    }
    if (response.data.token) {
      localStorage.setItem('al_sheikh_auth_token', response.data.token);
    }
    return response.data;
  }

  async register(credentials: RegisterCredentials): Promise<{ message: string; user?: User }> {
    const response = await apiClient.post<User>('/auth/register', credentials);
    if (!response.success) {
      throw new Error(response.message || 'فشل إنشاء الحساب');
    }
    return {
      message: response.message || 'تم تقديم طلب إنشاء الحساب بنجاح، الحساب في انتظار مراجعة واعتماد مدير النظام.',
      user: response.data,
    };
  }

  async getCurrentUser(): Promise<{ user: User; permissions: string[] }> {
    const token = localStorage.getItem('al_sheikh_auth_token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    const response = await apiClient.get<{ user: User; permissions: string[] }>('/auth/me');
    if (!response.success || !response.data) {
      throw new Error(response.message || 'فشل استرجاع بيانات المستخدم');
    }
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network failure on logout
    } finally {
      localStorage.removeItem('al_sheikh_auth_token');
    }
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<null>('/auth/forgot-password', { email });
    if (!response.success) {
      throw new Error(response.message || 'فشل إرسال طلب استعادة الحساب');
    }
    return { message: response.message || 'تم إرسال طلب استعادة الحساب بنجاح' };
  }
}

export const authService = new AuthService();
