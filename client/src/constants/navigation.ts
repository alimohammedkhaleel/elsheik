import {
  LayoutDashboard,
  Users,
  FileCheck,
  Building,
  FileText,
  CreditCard,
  Package,
  Award,
  Trophy,
  LayoutGrid,
} from 'lucide-react';
import { UserRole } from '../types/auth';

export interface AppNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ElementType;
  allowedRoles?: UserRole[];
  section?: 'STAFF' | 'CUSTOMER';
}

export const NAVIGATION_ITEMS: AppNavItem[] = [
  // ===== Staff Navigation =====
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    path: '/',
    icon: LayoutDashboard,
    allowedRoles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'COLLECTOR'],
  },
  {
    id: 'customers',
    label: 'سجل العملاء',
    path: '/customers',
    icon: Building,
    allowedRoles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'COLLECTOR'],
  },
  {
    id: 'invoices',
    label: 'الفواتير والمبيعات',
    path: '/invoices',
    icon: FileText,
    allowedRoles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'COLLECTOR'],
  },
  {
    id: 'payments',
    label: 'سندات التحصيل',
    path: '/payments',
    icon: CreditCard,
    allowedRoles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'COLLECTOR'],
  },
  {
    id: 'products',
    label: 'المنتجات والأسعار',
    path: '/products',
    icon: Package,
    allowedRoles: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
  },
  {
    id: 'bonuses',
    label: 'الحوافز والمكافآت',
    path: '/bonuses',
    icon: Award,
    allowedRoles: ['ADMIN', 'MANAGER'],
  },
  {
    id: 'leaderboard',
    label: 'لوحة الشرف',
    path: '/leaderboard',
    icon: Trophy,
    allowedRoles: ['ADMIN', 'MANAGER', 'EMPLOYEE', 'COLLECTOR'],
  },
  {
    id: 'approvals',
    label: 'مركز الاعتمادات والموافقات',
    path: '/approvals',
    icon: FileCheck,
    allowedRoles: ['ADMIN', 'MANAGER'],
  },
  {
    id: 'users',
    label: 'إدارة الموظفين والمستخدمين',
    path: '/users',
    icon: Users,
    allowedRoles: ['ADMIN'],
  },

  // ===== Customer Portal Navigation =====
  {
    id: 'customer-portal',
    label: 'بوابة العميل — الرئيسية',
    path: '/customer/portal',
    icon: LayoutGrid,
    allowedRoles: ['CUSTOMER'],
    section: 'CUSTOMER',
  },
];
