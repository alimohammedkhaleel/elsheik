import React, { useEffect, useState } from 'react';
import { customerPortalService, CustomerPortalOverview } from '../../services/api/customerPortalService';

interface Props {
  onNavigate?: (path: string) => void;
}

export const CustomerPortalOverviewPage: React.FC<Props> = ({ onNavigate }) => {
  const [overview, setOverview] = useState<CustomerPortalOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerPortalService.getOverview();
      setOverview(data);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل بيانات الحساب');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="portal-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: '#64748b' }}>جاري تحميل ملخص الحساب...</p>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="portal-alert portal-alert-error">
        <div>
          <p style={{ margin: 0, fontWeight: 700 }}>خطأ في استرجاع البيانات</p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>{error || 'لا يمكن الوصول لبيانات العميل'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Customer Banner Card */}
      <div className="portal-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#ffffff', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>{overview.customerName}</h2>
              <span className="portal-badge" style={{ backgroundColor: '#d97706', color: '#ffffff' }}>
                كود: {overview.customerCode}
              </span>
              <span className="portal-badge" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#f8fafc' }}>
                فئة ({overview.classification})
              </span>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
              {overview.tradeName ? `الاسم التجاري: ${overview.tradeName} | ` : ''}
              {overview.phone ? `الهاتف: ${overview.phone} | ` : ''}
              {overview.address || 'العنوان غير مسجل'}
            </p>
          </div>
          <div>
            <button onClick={() => onNavigate && onNavigate('/customer/portal/statement')} className="portal-btn" style={{ backgroundColor: '#d97706', color: '#ffffff', border: 'none', cursor: 'pointer' }}>
              عرض كشف الحساب
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="portal-kpi-grid">
        <div className="portal-kpi-card gold">
          <span className="portal-kpi-title">الرصيد الحالي المستحق</span>
          <span className="portal-kpi-value">{Number(overview.currentBalance).toLocaleString()} ج.م</span>
          <span className="portal-kpi-sub">
            الحد الائتماني: {Number(overview.creditLimit).toLocaleString()} ج.م
          </span>
        </div>

        <div className="portal-kpi-card green">
          <span className="portal-kpi-title">إجمالي المشتريات / المسحوبات</span>
          <span className="portal-kpi-value">{Number(overview.totalSales).toLocaleString()} ج.م</span>
          <span className="portal-kpi-sub">إجمالي قيمة الفواتير الصادرة</span>
        </div>

        <div className="portal-kpi-card blue">
          <span className="portal-kpi-title">إجمالي المدفوعات والسدادات</span>
          <span className="portal-kpi-value">{Number(overview.totalPayments).toLocaleString()} ج.م</span>
          <span className="portal-kpi-sub">المسدد نقداً وعبر السندات</span>
        </div>

        <div className="portal-kpi-card red">
          <span className="portal-kpi-title">المبالغ المتأخرة</span>
          <span className="portal-kpi-value">{Number(overview.overdueAmount).toLocaleString()} ج.م</span>
          <span className="portal-kpi-sub">{overview.overdueInvoicesCount} فاتورة متأخرة السداد</span>
        </div>
      </div>

      {/* Quick Summary Sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Latest Invoice Card */}
        <div className="portal-card">
          <div className="portal-card-header">
            <h3 className="portal-card-title">آخر فاتورة مبيعات</h3>
            <button onClick={() => onNavigate && onNavigate('/customer/portal/invoices')} style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              كل الفواتير ({overview.outstandingInvoicesCount} معلقة)
            </button>
          </div>
          {overview.latestInvoice ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#64748b' }}>رقم الفاتورة:</span>
                <strong>{overview.latestInvoice.invoice_number}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#64748b' }}>تاريخ الإصدار:</span>
                <span>{new Date(overview.latestInvoice.invoice_date).toLocaleDateString('ar-EG')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#64748b' }}>إجمالي الفاتورة:</span>
                <strong style={{ color: '#0f172a' }}>{Number(overview.latestInvoice.total).toLocaleString()} ج.م</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>حالة السداد:</span>
                <span className={`portal-badge ${overview.latestInvoice.payment_status === 'PAID' ? 'paid' : overview.latestInvoice.payment_status === 'OVERDUE' ? 'overdue' : 'partially'}`}>
                  {overview.latestInvoice.payment_status === 'PAID' ? 'مدفوعة' : overview.latestInvoice.payment_status === 'OVERDUE' ? 'متأخرة' : 'غير مدفوعة'}
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', margin: '1.5rem 0' }}>لا توجد فواتير مسجلة حتى الآن</p>
          )}
        </div>

        {/* Latest Payment Card */}
        <div className="portal-card">
          <div className="portal-card-header">
            <h3 className="portal-card-title">آخر عملية سداد</h3>
            <button onClick={() => onNavigate && onNavigate('/customer/portal/statement')} style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              سجل الحركات المالية
            </button>
          </div>
          {overview.latestPayment ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#64748b' }}>رقم إيصال السداد:</span>
                <strong>{overview.latestPayment.receipt_number}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#64748b' }}>تاريخ السداد:</span>
                <span>{new Date(overview.latestPayment.payment_date).toLocaleDateString('ar-EG')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ color: '#64748b' }}>المبلغ المسدد:</span>
                <strong style={{ color: '#059669' }}>{Number(overview.latestPayment.amount).toLocaleString()} ج.م</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b' }}>طريقة الدفع:</span>
                <span className="portal-badge paid">
                  {overview.latestPayment.payment_method === 'CASH' ? 'نقدي' : overview.latestPayment.payment_method === 'WALLET' ? 'محفظة إلكترونية' : overview.latestPayment.payment_method}
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', margin: '1.5rem 0' }}>لا توجد مدفوعات مسجلة حتى الآن</p>
          )}
        </div>
      </div>
    </div>
  );
};
