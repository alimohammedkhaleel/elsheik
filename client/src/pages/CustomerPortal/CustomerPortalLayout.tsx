import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CustomerPortalOverviewPage } from './CustomerPortalOverviewPage';
import { CustomerPortalInvoicesPage } from './CustomerPortalInvoicesPage';
import { CustomerPortalStatementPage } from './CustomerPortalStatementPage';
import { CustomerPortalSalesPage } from './CustomerPortalSalesPage';
import { CustomerPortalProfilePage } from './CustomerPortalProfilePage';
import './CustomerPortal.css';

interface CustomerPortalLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const CustomerPortalLayout: React.FC<CustomerPortalLayoutProps> = ({
  currentPath,
  onNavigate,
}) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onNavigate('/login');
  };

  const navLinks = [
    { path: '/customer/portal', label: 'الرئيسية' },
    { path: '/customer/portal/invoices', label: 'فواتيري' },
    { path: '/customer/portal/statement', label: 'كشف الحساب' },
    { path: '/customer/portal/sales', label: 'طلباتي' },
    { path: '/customer/portal/profile', label: 'حسابي' },
  ];

  const renderPage = () => {
    if (currentPath === '/customer/portal/invoices') return <CustomerPortalInvoicesPage />;
    if (currentPath === '/customer/portal/statement') return <CustomerPortalStatementPage />;
    if (currentPath === '/customer/portal/sales') return <CustomerPortalSalesPage />;
    if (currentPath === '/customer/portal/profile') return <CustomerPortalProfilePage />;
    return <CustomerPortalOverviewPage onNavigate={onNavigate} />;
  };

  return (
    <div className="portal-layout">
      {/* Portal Top Header */}
      <header className="portal-header">
        <div className="portal-header-container">
          <div className="portal-brand">
            <div className="portal-logo-badge">ش</div>
            <div className="portal-brand-text">
              <h1>بوابة العملاء — مؤسسة الشيخ</h1>
              <p>متابعة الفواتير والحسابات والمعاملات المالية</p>
            </div>
          </div>

          <div className="portal-user-section">
            <div className="portal-user-chip">
              <div className="portal-user-avatar">
                {user?.full_name ? user.full_name.charAt(0) : 'ع'}
              </div>
              <span className="portal-user-name">{user?.full_name || 'العميل'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="portal-btn portal-btn-secondary"
              title="تسجيل الخروج"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="portal-nav-bar">
        <div className="portal-nav-container">
          {navLinks.map((link) => {
            const isActive = currentPath === link.path ||
              (link.path === '/customer/portal' && currentPath === '/customer/portal');
            return (
              <button
                key={link.path}
                onClick={() => onNavigate(link.path)}
                className={`portal-nav-btn ${isActive ? 'portal-nav-active' : ''}`}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Page Content */}
      <main className="portal-main-content">
        {renderPage()}
      </main>

      {/* Portal Footer */}
      <footer className="portal-footer">
        <p>مؤسسة الشيخ لإدارة وتوزيع البضائع — جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};
