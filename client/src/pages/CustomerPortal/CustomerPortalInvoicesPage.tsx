import React, { useEffect, useState } from 'react';
import { customerPortalService } from '../../services/api/customerPortalService';
import { Invoice } from '../../types/financial';

export const CustomerPortalInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, [filterStatus]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await customerPortalService.getInvoices(filterStatus);
      setInvoices(data);
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
          <h2 className="portal-card-title">فواتير المبيعات الخاصة بحسابك</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`portal-btn ${filterStatus === 'ALL' ? 'portal-btn-primary' : 'portal-btn-secondary'}`}
            >
              الكل ({invoices.length})
            </button>
            <button
              onClick={() => setFilterStatus('UNPAID')}
              className={`portal-btn ${filterStatus === 'UNPAID' ? 'portal-btn-primary' : 'portal-btn-secondary'}`}
            >
              غير مسددة
            </button>
            <button
              onClick={() => setFilterStatus('PARTIALLY_PAID')}
              className={`portal-btn ${filterStatus === 'PARTIALLY_PAID' ? 'portal-btn-primary' : 'portal-btn-secondary'}`}
            >
              مسددة جزئياً
            </button>
            <button
              onClick={() => setFilterStatus('PAID')}
              className={`portal-btn ${filterStatus === 'PAID' ? 'portal-btn-primary' : 'portal-btn-secondary'}`}
            >
              مسددة بالكامل
            </button>
            <button
              onClick={() => setFilterStatus('OVERDUE')}
              className={`portal-btn ${filterStatus === 'OVERDUE' ? 'portal-btn-danger' : 'portal-btn-secondary'}`}
            >
              متأخرة
            </button>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>جاري تحميل الفواتير...</p>
        ) : invoices.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>لا توجد فواتير تطابق هذا التصنيف</p>
        ) : (
          <div className="portal-table-container">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>تاريخ الإصدار</th>
                  <th>تاريخ الاستحقاق</th>
                  <th>إجمالي الفاتورة</th>
                  <th>المسدد</th>
                  <th>المتبقي</th>
                  <th>حالة السداد</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <strong>{inv.invoice_number}</strong>
                    </td>
                    <td>{new Date(inv.invoice_date).toLocaleDateString('ar-EG')}</td>
                    <td>{new Date(inv.due_date).toLocaleDateString('ar-EG')}</td>
                    <td>
                      <strong>{Number(inv.total).toLocaleString()} ج.م</strong>
                    </td>
                    <td style={{ color: '#059669' }}>
                      {Number(inv.paid_amount || 0).toLocaleString()} ج.م
                    </td>
                    <td style={{ color: Number(inv.remaining_amount || 0) > 0 ? '#b91c1c' : '#059669', fontWeight: 600 }}>
                      {Number(inv.remaining_amount || (inv.total - (inv.paid_amount || 0))).toLocaleString()} ج.م
                    </td>
                    <td>
                      <span className={`portal-badge ${inv.payment_status === 'PAID' ? 'paid' : inv.payment_status === 'OVERDUE' ? 'overdue' : 'partially'}`}>
                        {inv.payment_status === 'PAID' ? 'مدفوعة' : inv.payment_status === 'OVERDUE' ? 'متأخرة' : inv.payment_status === 'PARTIALLY_PAID' ? 'جزئي' : 'غير مدفوعة'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="portal-btn portal-btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      >
                        تفاصيل الأصناف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
        >
          <div className="portal-card" style={{ maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="portal-card-header">
              <h3 className="portal-card-title">تفاصيل الفاتورة #{selectedInvoice.invoice_number}</h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="portal-btn portal-btn-secondary"
              >
                إغلاق
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ margin: '0 0 0.25rem', color: '#64748b', fontSize: '0.85rem' }}>تاريخ الفاتورة:</p>
                <strong>{new Date(selectedInvoice.invoice_date).toLocaleDateString('ar-EG')}</strong>
              </div>
              <div>
                <p style={{ margin: '0 0 0.25rem', color: '#64748b', fontSize: '0.85rem' }}>المندوب المسؤول:</p>
                <strong>{selectedInvoice.employee_name || '—'}</strong>
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>الأصناف والمنتجات</h4>
            <div className="portal-table-container">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>سعر الوحدة</th>
                    <th>الخصم</th>
                    <th>الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.product_name || `صنف #${item.product_id}`}</td>
                        <td>{item.quantity}</td>
                        <td>{Number(item.unit_price).toLocaleString()} ج.م</td>
                        <td>{Number(item.discount || 0).toLocaleString()} ج.م</td>
                        <td><strong>{Number(item.total).toLocaleString()} ج.م</strong></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>لا توجد بنود مسجلة</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <div style={{ minWidth: '220px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>المجموع الفرعي:</span>
                  <span>{Number(selectedInvoice.subtotal || selectedInvoice.total).toLocaleString()} ج.م</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>الخصم:</span>
                  <span>{Number(selectedInvoice.discount || 0).toLocaleString()} ج.م</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: '0.5rem' }}>
                  <span>الإجمالي النهائي:</span>
                  <span>{Number(selectedInvoice.total).toLocaleString()} ج.م</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
