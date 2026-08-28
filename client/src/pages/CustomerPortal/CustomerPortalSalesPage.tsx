import React, { useEffect, useState } from 'react';
import { customerPortalService, CustomerPortalSalesAnalytics } from '../../services/api/customerPortalService';

export const CustomerPortalSalesPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<CustomerPortalSalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await customerPortalService.getSalesAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="portal-card">
        <div className="portal-card-header">
          <h2 className="portal-card-title">تحليل نمط المشتريات وحجم التعامل</h2>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>جاري استخراج التحليلات...</p>
        ) : analytics ? (
          <div>
            {/* KPI Row */}
            <div className="portal-kpi-grid">
              <div className="portal-kpi-card gold">
                <span className="portal-kpi-title">إجمالي المشتريات السنوية</span>
                <span className="portal-kpi-value">{Number(analytics.annualSales).toLocaleString()} ج.م</span>
                <span className="portal-kpi-sub">المجموع الكلي لقيمة البضائع</span>
              </div>
              <div className="portal-kpi-card blue">
                <span className="portal-kpi-title">عدد الطلبيات والفواتير</span>
                <span className="portal-kpi-value">{analytics.totalInvoicesCount}</span>
                <span className="portal-kpi-sub">إجمالي عدد مرات الشراء</span>
              </div>
              <div className="portal-kpi-card green">
                <span className="portal-kpi-title">متوسط قيمة الفاتورة</span>
                <span className="portal-kpi-value">{Math.round(analytics.averageInvoiceValue).toLocaleString()} ج.م</span>
                <span className="portal-kpi-sub">معدل حجم الطلبية الواحدة</span>
              </div>
            </div>

            {/* Monthly Breakdown Table */}
            <h3 className="portal-card-title" style={{ margin: '2rem 0 1rem' }}>
              المبيعات الشهرية خلال الأشهر السابقة
            </h3>
            <div className="portal-table-container">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>الشهر</th>
                    <th>عدد الفواتير</th>
                    <th>إجمالي المشتريات</th>
                    <th>نسبة المساهمة من السنوي</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.monthlySales.map((m) => {
                    const percentage = analytics.annualSales > 0 ? ((m.total / analytics.annualSales) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={m.month}>
                        <td>
                          <strong>{m.monthName} ({m.month})</strong>
                        </td>
                        <td>{m.invoiceCount}</td>
                        <td>
                          <strong>{Number(m.total).toLocaleString()} ج.م</strong>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, backgroundColor: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ backgroundColor: '#d97706', width: `${percentage}%`, height: '100%' }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', minWidth: '40px' }}>{percentage}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
