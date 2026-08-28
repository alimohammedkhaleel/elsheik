import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, LoginCredentials, RegisterCredentials } from '../types/auth';
import { authService } from '../services/api/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('al_sheikh_auth_token');
      if (savedToken) {
        try {
          setToken(savedToken);
          const data = await authService.getCurrentUser();
          if (data && data.user) {
            setUser(data.user);
            setPermissions(data.permissions || []);
          } else {
            localStorage.removeItem('al_sheikh_auth_token');
            setUser(null);
            setToken(null);
            setPermissions([]);
          }
        } catch {
          localStorage.removeItem('al_sheikh_auth_token');
          setUser(null);
          setToken(null);
          setPermissions([]);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<{ success: boolean; message: string }> => {
      setIsLoading(true);
      try {
        const res = await authService.login(credentials);
        if (res && res.user && res.token) {
          setUser(res.user);
          setToken(res.token);
          setPermissions(res.permissions || []);
          return { success: true, message: 'تم تسجيل الدخول بنجاح' };
        }
        return { success: false, message: 'فشل تسجيل الدخول' };
      } catch (err: unknown) {
        const errorMsg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'اسم المستخدم أو كلمة المرور غير صحيحة'
            : err instanceof Error
            ? err.message
            : 'حدث خطأ أثناء تسجيل الدخول';
        return {
          success: false,
          message: errorMsg,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<{ success: boolean; message: string }> => {
      setIsLoading(true);
      try {
        const res = await authService.register(credentials);
        return { success: true, message: res.message };
      } catch (err: unknown) {
        const errorMsg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'فشل تقديم طلب التسجيل'
            : err instanceof Error
            ? err.message
            : 'حدث خطأ أثناء التسجيل';
        return {
          success: false,
          message: errorMsg,
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setToken(null);
      setPermissions([]);
      setIsLoading(false);
    }
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.role === 'ADMIN') return true;
      return permissions.includes(permission);
    },
    [user, permissions]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permissions,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
