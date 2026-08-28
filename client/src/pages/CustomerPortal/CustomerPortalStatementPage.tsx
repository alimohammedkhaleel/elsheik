import React, { useEffect, useState } from 'react';
import { customerPortalService } from '../../services/api/customerPortalService';

export const CustomerPortalStatementPage: React.FC = () => {
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadStatement();
  }, []);

  const loadStatement = async () => {
    try {
      setLoading(true);
      const data = await customerPortalService.getStatement(startDate || undefined, endDate || undefined);
      setStatement(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadStatement();
  };

  return (
    <div>
      {/* Filter and Date Selection Card */}
      <div className="portal-card">
        <div className="portal-card-header">
          <h2 className="portal-card-title">كشف الحساب التفصيلي للعميل</h2>
          <button
            onClick={() => window.print()}
            className="portal-btn portal-btn-secondary"
          >
            طباعة كشف الحساب
          </button>
        </div>

        <form onSubmit={handleFilter} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="portal-label">من تاريخ:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="portal-input"
              style={{ width: '180px' }}
            />
          </div>

          <div>
            <label className="portal-label">إلى تاريخ:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="portal-input"
              style={{ width: '180px' }}
            />
          </div>

          <button type="submit" className="portal-btn portal-btn-primary">
            تحديث التقرير
          </button>
        </form>
      </div>

      {loading ? (
        <div className="portal-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#64748b' }}>جاري استخراج حركات كشف الحساب...</p>
        </div>
      ) : statement ? (
        <>
          {/* Summary Box */}
          <div className="portal-kpi-grid">
            <div className="portal-kpi-card gold">
              <span className="portal-kpi-title">الرصيد الافتتاحي</span>
              <span className="portal-kpi-value">{Number(statement.summary?.opening_balance || 0).toLocaleString()} ج.م</span>
              <span className="portal-kpi-sub">رصيد ما قبل الفترة</span>
            </div>
            <div className="portal-kpi-card green">
              <span className="portal-kpi-title">إجمالي المدين (المسحوبات)</span>
              <span className="portal-kpi-value">{Number(statement.summary?.total_debit || 0).toLocaleString()} ج.م</span>
              <span className="portal-kpi-sub">قيمة فواتير الفترة</span>
            </div>
            <div className="portal-kpi-card blue">
              <span className="portal-kpi-title">إجمالي الدائن (السدادات)</span>
              <span className="portal-kpi-value">{Number(statement.summary?.total_credit || 0).toLocaleString()} ج.م</span>
              <span className="portal-kpi-sub">المدفوعات والمردودات</span>
            </div>
            <div className="portal-kpi-card red">
              <span className="portal-kpi-title">الرصيد الختامي المستحق</span>
              <span className="portal-kpi-value">{Number(statement.summary?.closing_balance || 0).toLocaleString()} ج.م</span>
              <span className="portal-kpi-sub">صافي المستحق حتى تاريخه</span>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="portal-card">
            <h3 className="portal-card-title" style={{ marginBottom: '1.25rem' }}>
              جدول المعاملات والحركات المالية ({statement.transactions?.length || 0} حركة)
            </h3>

            {statement.transactions && statement.transactions.length > 0 ? (
              <div className="portal-table-container">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>نوع الحركة</th>
                      <th>البيان والتفاصيل</th>
                      <th>مدين (عليك)</th>
                      <th>دائن (لك / سداد)</th>
                      <th>الرصيد التراكمي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.transactions.map((tx: any) => (
                      <tr key={tx.id}>
                        <td>{new Date(tx.transaction_date).toLocaleDateString('ar-EG')}</td>
                        <td>
                          <span
                            className={`portal-badge ${
                              tx.transaction_type === 'INVOICE'
                                ? 'unpaid'
                                : tx.transaction_type === 'PAYMENT'
                                ? 'paid'
                                : 'partially'
                            }`}
                          >
                            {tx.transaction_type === 'INVOICE'
                              ? 'فاتورة مبيعات'
                              : tx.transaction_type === 'PAYMENT'
                              ? 'سداد نقدي'
                              : tx.transaction_type === 'RETURN'
                              ? 'مردودات'
                              : tx.transaction_type === 'DISCOUNT'
                              ? 'خصم مالي'
                              : 'تسوية حساب'}
                          </span>
                        </td>
                        <td>{tx.description}</td>
                        <td style={{ color: Number(tx.debit) > 0 ? '#b91c1c' : '#94a3b8', fontWeight: Number(tx.debit) > 0 ? 700 : 400 }}>
                          {Number(tx.debit) > 0 ? `${Number(tx.debit).toLocaleString()} ج.م` : '—'}
                        </td>
                        <td style={{ color: Number(tx.credit) > 0 ? '#059669' : '#94a3b8', fontWeight: Number(tx.credit) > 0 ? 700 : 400 }}>
                          {Number(tx.credit) > 0 ? `${Number(tx.credit).toLocaleString()} ج.م` : '—'}
                        </td>
                        <td>
                          <strong>{Number(tx.running_balance || 0).toLocaleString()} ج.م</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                لا توجد حركات مالية مسجلة خلال الفترة المحددة
              </p>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};
