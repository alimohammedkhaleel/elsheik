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

  private static async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    
    if (response.status === 401) {
      // Token expired or invalid
      this.removeToken();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    if (contentType && contentType.includes('application/json')) {
      try {
        const data: ApiResponse<T> = await response.json();
        return data;
      } catch {
        // Fallthrough if json parsing fails
      }
    }

    const text = await response.text();
    return {
      success: response.ok,
      message: response.ok ? 'تمت العملية بنجاح' : (text || `خطأ في الخادم (${response.status})`),
      error: !response.ok ? { code: `HTTP_${response.status}`, details: text } : undefined,
    };
  }

  static async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      return await this.handleResponse<T>(response);
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

      return await this.handleResponse<T>(response);
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

      return await this.handleResponse<T>(response);
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

      return await this.handleResponse<T>(response);
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

      return await this.handleResponse<T>(response);
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
