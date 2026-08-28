import { ApiResponse } from '../../types/api';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'al_sheikh_auth_token';

export class ApiClient {
  static getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  static setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignore storage errors
    }
  }

  static removeToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
  }

  private static getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ في الاتصال بالخادم',
        error: {
          code: 'NETWORK_ERROR',
          details: error,
        },
      };
    }
  }

  static async post<T, B = unknown>(endpoint: string, body?: B): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ في الاتصال بالخادم',
        error: {
          code: 'NETWORK_ERROR',
          details: error,
        },
      };
    }
  }

  static async put<T, B = unknown>(endpoint: string, body?: B): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ في الاتصال بالخادم',
        error: {
          code: 'NETWORK_ERROR',
          details: error,
        },
      };
    }
  }

  static async patch<T, B = unknown>(endpoint: string, body?: B): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ في الاتصال بالخادم',
        error: {
          code: 'NETWORK_ERROR',
          details: error,
        },
      };
    }
  }

  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'حدث خطأ في الاتصال بالخادم',
        error: {
          code: 'NETWORK_ERROR',
          details: error,
        },
      };
    }
  }
}

export const apiClient = {
  get: <T>(endpoint: string) => ApiClient.get<T>(endpoint),
  post: <T, B = unknown>(endpoint: string, body?: B) => ApiClient.post<T, B>(endpoint, body),
  put: <T, B = unknown>(endpoint: string, body?: B) => ApiClient.put<T, B>(endpoint, body),
  patch: <T, B = unknown>(endpoint: string, body?: B) => ApiClient.patch<T, B>(endpoint, body),
  delete: <T>(endpoint: string) => ApiClient.delete<T>(endpoint),
};
