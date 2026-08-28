import React from 'react';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { LoginPage } from '../pages/Login/LoginPage';
import { UsersPage } from '../pages/Users/UsersPage';
import { ApprovalsPage } from '../pages/Approvals/ApprovalsPage';
import { CustomersPage } from '../pages/Customers/CustomersPage';
import { CustomerDetailsPage } from '../pages/Customers/CustomerDetailsPage';
import { InvoicesPage } from '../pages/Invoices/InvoicesPage';
import { PaymentsPage } from '../pages/Payments/PaymentsPage';
import { ProductsPage } from '../pages/Products/ProductsPage';
import { BonusesPage } from '../pages/Bonuses/BonusesPage';
import { LeaderboardPage } from '../pages/Leaderboard/LeaderboardPage';
import { CustomerPortalLayout } from '../pages/CustomerPortal/CustomerPortalLayout';
import { AuthLayout } from '../layouts/AuthLayout/AuthLayout';
import { NAVIGATION_ITEMS } from '../constants/navigation';
import { useAuth } from '../context/AuthContext';

interface RouteHandlerProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const getPageTitle = (path: string): string => {
  if (path === '/login') return 'تسجيل الدخول';
  if (path === '/') return 'لوحة التحكم';
  if (path === '/customers') return 'سجل العملاء ومناطق التوزيع';
  if (path.startsWith('/customers/')) return 'ملف العميل وكشف الحساب';
  if (path === '/invoices') return 'سجل الفواتير والمبيعات';
  if (path === '/payments') return 'سندات التحصيل والمقبوضات';
  if (path === '/products') return 'دليل المنتجات والأسعار';
  if (path === '/bonuses') return 'نظام الحوافز والمكافآت';
  if (path === '/leaderboard') return 'لوحة الشرف — التميز في المبيعات والتحصيل';
  if (path === '/approvals') return 'مركز الاعتمادات والموافقات';
  if (path === '/users') return 'إدارة المستخدمين والموظفين';
  if (path.startsWith('/customer/portal')) return 'بوابة العميل الذكية';

  const item = NAVIGATION_ITEMS.find((nav) => nav.path === path);
  if (item) return item.label;

  return 'مؤسسة الشيخ';
};

export const RouteRenderer: React.FC<RouteHandlerProps> = ({
  currentPath,
  onNavigate,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // 1. Auth / Login Route
  if (currentPath === '/login') {
    return (
      <AuthLayout>
        <LoginPage onBackToDashboard={() => onNavigate('/')} />
      </AuthLayout>
    );
  }

  // 2. Authentication Gate: If unauthenticated, route to Login
  if (!isLoading && !isAuthenticated) {
    return (
      <AuthLayout>
        <LoginPage onBackToDashboard={() => onNavigate('/')} />
      </AuthLayout>
    );
  }

  // 3. Customer Portal routes — redirect CUSTOMER role here
  if (currentPath.startsWith('/customer/portal') || user?.role === 'CUSTOMER') {
    return <CustomerPortalLayout currentPath={currentPath} onNavigate={onNavigate} />;
  }

  // 4. Customer Details Subroute: /customers/:id
  if (currentPath.startsWith('/customers/')) {
    const parts = currentPath.split('/');
    const custId = parseInt(parts[2], 10);
    if (!isNaN(custId)) {
      return <CustomerDetailsPage customerId={custId} onNavigate={onNavigate} />;
    }
  }

  // 5. Main Dashboard Route
  if (currentPath === '/') {
    return <DashboardPage onNavigate={onNavigate} />;
  }

  // 6. Customers List Route
  if (currentPath === '/customers') {
    return <CustomersPage onNavigate={onNavigate} />;
  }

  // 7. Invoices Route
  if (currentPath === '/invoices') {
    return <InvoicesPage onNavigate={onNavigate} />;
  }

  // 8. Payments Route
  if (currentPath === '/payments') {
    return <PaymentsPage onNavigate={onNavigate} />;
  }

  // 9. Products Route
  if (currentPath === '/products') {
    return <ProductsPage />;
  }

  // 10. Bonuses Route
  if (currentPath === '/bonuses') {
    return <BonusesPage />;
  }

  // 11. Leaderboard Route
  if (currentPath === '/leaderboard') {
    return <LeaderboardPage />;
  }

  // 12. Users Management Route
  if (currentPath === '/users') {
    return <UsersPage />;
  }

  // 13. Approvals Center Route
  if (currentPath === '/approvals') {
    return <ApprovalsPage />;
  }

  // Default fallback to Dashboard
  return <DashboardPage onNavigate={onNavigate} />;
};
