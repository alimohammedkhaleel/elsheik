import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  TrendingUp,
  CreditCard,
  Wallet,
  FileCheck,
  Building,
  PlusCircle,
  Receipt,
  ArrowLeft,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/api/dashboardService';
import { DashboardSummaryData, TopBuyerCustomer } from '../../types/financial';
import './DashboardPage.css';

interface DashboardPageProps {
  onNavigate?: (path: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [summary, setSummary] = useState<DashboardSummaryData>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalSales: 0,
    totalCollections: 0,
    totalOutstandingBalance: 0,
    pendingApprovalsCount: 0,
  });

  const [topBuyers, setTopBuyers] = useState<TopBuyerCustomer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [sumData, buyersData] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getTopBuyers(),
      ]);
      setSummary(sumData);
      setTopBuyers(buyersData || []);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val: number) => {
    return Number(val || 0).toLocaleString('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ج.م';
  };

  return (
    <div className="dashboard-content-area">
      {/* Welcome & Business Header */}
      <div className="sheikh-card dashboard-welcome-card">
        <div className="welcome-brand-row">
          <div className="welcome-text-col">
            <h1 className="welcome-title">لوحة مؤشرات الأعمال والأداء المركزي</h1>
            <p className="welcome-desc">
              مرحباً بك، <strong>{user?.full_name}</strong> ({user?.job_title || user?.role}). إليك ملخص مؤشرات المبيعات والعملاء والتحصيلات حتى اليوم.
            </p>
          </div>
          <div className="welcome-date-badge">
            <Calendar size={15} />
            <span>{new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Real Business KPIs 6-Card Grid */}
      <div className="business-kpi-grid">
        {/* 1. Total Customers */}
        <div className="sheikh-card kpi-stat-card">
          <div className="kpi-card-header">
            <span className="kpi-label">إجمالي العملاء</span>
            <div className="kpi-icon-wrap icon-bg-blue">
              <Users size={20} />
            </div>
          </div>
          <div className="kpi-value">{isLoading ? '...' : summary.totalCustomers}</div>
          <div className="kpi-sub">
            <span className="text-muted">العدد الإجمالي المسجل بالمنظومة</span>
          </div>
        </div>

        {/* 2. Active Customers */}
        <div className="sheikh-card kpi-stat-card">
          <div className="kpi-card-header">
            <span className="kpi-label">العملاء النشطون</span>
            <div className="kpi-icon-wrap icon-bg-green">
              <UserCheck size={20} />
            </div>
          </div>
          <div className="kpi-value">{isLoading ? '...' : summary.activeCustomers}</div>
          <div className="kpi-sub">
            <span className="text-success">حسابات نشطة ومؤهلة للتوزيع</span>
          </div>
        </div>

        {/* 3. Total Sales */}
        <div className="sheikh-card kpi-stat-card">
          <div className="kpi-card-header">
            <span className="kpi-label">إجمالي المبيعات</span>
            <div className="kpi-icon-wrap icon-bg-gold">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-value kpi-currency">{isLoading ? '...' : formatCurrency(summary.totalSales)}</div>
          <div className="kpi-sub">
            <span className="text-muted">إجمالي قيمة فواتير المبيعات</span>
          </div>
        </div>

        {/* 4. Total Collections */}
        <div className="sheikh-card kpi-stat-card">
          <div className="kpi-card-header">
            <span className="kpi-label">إجمالي التحصيلات</span>
            <div className="kpi-icon-wrap icon-bg-teal">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="kpi-value kpi-currency">{isLoading ? '...' : formatCurrency(summary.totalCollections)}</div>
          <div className="kpi-sub">
            <span className="text-success">المبالغ النقدية والمحصلة</span>
          </div>
        </div>

        {/* 5. Outstanding Balance */}
        <div className="sheikh-card kpi-stat-card">
          <div className="kpi-card-header">
            <span className="kpi-label">إجمالي الرصيد المستحق</span>
            <div className="kpi-icon-wrap icon-bg-amber">
              <Wallet size={20} />
            </div>
          </div>
          <div className="kpi-value kpi-currency text-amber">{isLoading ? '...' : formatCurrency(summary.totalOutstandingBalance)}</div>
          <div className="kpi-sub">
            <span className="text-muted">المديونية الإجمالية في الذمة</span>
          </div>
        </div>

        {/* 6. Pending Approvals */}
        <div className="sheikh-card kpi-stat-card">
          <div className="kpi-card-header">
            <span className="kpi-label">طلبات الاعتماد المعلقة</span>
            <div className="kpi-icon-wrap icon-bg-purple">
              <FileCheck size={20} />
            </div>
          </div>
          <div className="kpi-value">{isLoading ? '...' : summary.pendingApprovalsCount}</div>
          <div className="kpi-sub">
            <span className={summary.pendingApprovalsCount > 0 ? 'text-warn' : 'text-muted'}>
              {summary.pendingApprovalsCount > 0 ? 'تتطلب مراجعة واعتماد الإدارة' : 'لا توجد طلبات معلقة'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons Row */}
      <div className="dashboard-quick-actions-bar">
        <h3 className="section-title">إجراءات سريعة</h3>
        <div className="quick-actions-flex">
          {onNavigate && (
            <>
              <button onClick={() => onNavigate('/customers')} className="quick-action-pill">
                <Building size={16} />
                <span>إدارة العملاء</span>
              </button>
              <button onClick={() => onNavigate('/invoices')} className="quick-action-pill">
                <PlusCircle size={16} />
                <span>إنشاء فاتورة جديدة</span>
              </button>
              <button onClick={() => onNavigate('/payments')} className="quick-action-pill">
                <Receipt size={16} />
                <span>تسجيل سند تحصيل</span>
              </button>
              {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                <button onClick={() => onNavigate('/approvals')} className="quick-action-pill pill-alert">
                  <FileCheck size={16} />
                  <span>مركز الاعتمادات</span>
                  {summary.pendingApprovalsCount > 0 && (
                    <span className="action-counter">{summary.pendingApprovalsCount}</span>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Top Buyers Business Table */}
      <div className="sheikh-card dashboard-table-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">أعلى العملاء شراءً ومسحوبات</h3>
            <p className="card-subtitle">قائمة كبار العملاء مرتبة حسب إجمالي المبيعات وقيمة الفواتير المسجلة</p>
          </div>
          {onNavigate && (
            <button onClick={() => onNavigate('/customers')} className="btn-outline-small">
              <span>عرض كافة العملاء</span>
              <ChevronLeft size={14} />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="table-loading-state">جاري تحميل البيانات المالية...</div>
        ) : topBuyers.length > 0 ? (
          <div className="table-responsive">
            <table className="sheikh-table">
              <thead>
                <tr>
                  <th>كود العميل</th>
                  <th>اسم العميل</th>
                  <th>الاسم التجاري</th>
                  <th>الهاتف</th>
                  <th>عدد الفواتير</th>
                  <th>إجمالي المبيعات</th>
                  <th>متوسط الفاتورة</th>
                  <th>الرصيد الحالي</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {topBuyers.map((tb) => (
                  <tr key={tb.customer_id}>
                    <td>
                      <span className="customer-code-badge">{tb.customer_code}</span>
                    </td>
                    <td className="font-semibold">{tb.customer_name}</td>
                    <td className="text-muted">{tb.trade_name || '—'}</td>
                    <td>{tb.phone || '—'}</td>
                    <td>{tb.invoice_count}</td>
                    <td className="font-semibold text-gold-dark">{formatCurrency(tb.total_sales)}</td>
                    <td>{formatCurrency(tb.avg_invoice)}</td>
                    <td className={`font-semibold ${tb.current_balance > 0 ? 'text-amber' : 'text-success'}`}>
                      {formatCurrency(tb.current_balance)}
                    </td>
                    <td>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate(`/customers/${tb.customer_id}`)}
                          className="btn-table-action"
                          title="عرض تفاصيل وكشف حساب العميل"
                        >
                          <span>الملف والحساب</span>
                          <ArrowLeft size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-box">
            <Building size={36} className="empty-state-icon" />
            <h4>لا توجد بيانات مبيعات مسجلة حتى الآن</h4>
            <p>عند إصدار فواتير مبيعات للعملاء، ستظهر هنا قائمة بأعلى العملاء حجماً للتعاملات.</p>
            {onNavigate && (
              <button onClick={() => onNavigate('/invoices')} className="btn-gold-small mt-3">
                <PlusCircle size={15} />
                <span>إصدار أول فاتورة</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
