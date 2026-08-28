import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import {
  leaderboardService,
  TopCustomerLeaderboardItem,
  TopRepresentativeLeaderboardItem,
  LeaderboardPeriod,
} from '../../services/api/leaderboardService';
import './LeaderboardPage.css';

export const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'CUSTOMERS' | 'REPS'>('REPS');
  const [period, setPeriod] = useState<LeaderboardPeriod>('all');
  const [sortBy, setSortBy] = useState<string>('sales');

  const [topCustomers, setTopCustomers] = useState<TopCustomerLeaderboardItem[]>([]);
  const [topReps, setTopReps] = useState<TopRepresentativeLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab, period, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'CUSTOMERS') {
        const data = await leaderboardService.getTopCustomers({
          period,
          sort_by: sortBy,
          limit: 20,
        });
        setTopCustomers(data);
      } else {
        const data = await leaderboardService.getTopRepresentatives({
          period,
          limit: 20,
        });
        setTopReps(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatRank = (rank: number) => {
    return String(rank).padStart(2, '0');
  };

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return 'leaderboard-rank-badge leaderboard-rank-1';
    if (rank === 2) return 'leaderboard-rank-badge leaderboard-rank-2';
    if (rank === 3) return 'leaderboard-rank-badge leaderboard-rank-3';
    return 'leaderboard-rank-badge leaderboard-rank-other';
  };

  return (
    <div className="leaderboard-page-container">
      {/* Header */}
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-main-title">لوحة التميز والأداء — المبيعات والتحصيل</h1>
          <p className="page-sub-title">تصنيف وترتيب أداء المناديب والمحصلين وكبار العملاء استناداً للبيانات الفعلية</p>
        </div>

        {/* Period Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#ffffff', padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
          <Calendar size={16} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>الفترة:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as LeaderboardPeriod)}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 700, color: '#0f172a', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            <option value="all">جميع الفترات (تراكمي)</option>
            <option value="month">خلال الشهر الحالي</option>
            <option value="week">خلال الأسبوع الحالي</option>
            <option value="today">اليوم</option>
            <option value="year">خلال العام الحالي</option>
          </select>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="sheikh-card" style={{ padding: '0.5rem 1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('REPS')}
          className={activeTab === 'REPS' ? 'btn-gold' : 'btn-secondary'}
          style={{ padding: '0.5rem 1.25rem' }}
        >
          ترتيب المناديب والمحصلين
        </button>
        <button
          onClick={() => setActiveTab('CUSTOMERS')}
          className={activeTab === 'CUSTOMERS' ? 'btn-gold' : 'btn-secondary'}
          style={{ padding: '0.5rem 1.25rem' }}
        >
          تصنيف كبار العملاء
        </button>
      </div>

      {/* REPS LEADERBOARD */}
      {activeTab === 'REPS' && (
        <div>
          {/* Top 3 Podium */}
          {!loading && topReps.length >= 3 && (
            <div className="leaderboard-podium">
              {/* Rank 02 */}
              <div className="podium-card silver-podium">
                <div className="podium-rank-label">المركز الثاني</div>
                <div className="leaderboard-rank-badge leaderboard-rank-2" style={{ margin: '0.5rem auto' }}>02</div>
                <h3 className="podium-name">{topReps[1].representative_name}</h3>
                <p className="podium-sub">{topReps[1].job_title}</p>
                <div className="podium-metric">{Number(topReps[1].total_sales).toLocaleString('ar-EG')} ج.م</div>
                <p className="podium-sub">نسبة التحصيل: {topReps[1].collection_rate.toFixed(1)}%</p>
              </div>

              {/* Rank 01 */}
              <div className="podium-card gold-podium">
                <div className="podium-rank-label gold-label">المركز الأول</div>
                <div className="leaderboard-rank-badge leaderboard-rank-1" style={{ margin: '0.5rem auto' }}>01</div>
                <h3 className="podium-name" style={{ fontSize: '1.35rem', color: '#b45309' }}>{topReps[0].representative_name}</h3>
                <p className="podium-sub">{topReps[0].job_title}</p>
                <div className="podium-metric" style={{ fontSize: '1.8rem' }}>{Number(topReps[0].total_sales).toLocaleString('ar-EG')} ج.م</div>
                <p className="podium-sub">مبيعات {topReps[0].invoice_count} فاتورة | نسبة التحصيل: {topReps[0].collection_rate.toFixed(1)}%</p>
              </div>

              {/* Rank 03 */}
              <div className="podium-card bronze-podium">
                <div className="podium-rank-label">المركز الثالث</div>
                <div className="leaderboard-rank-badge leaderboard-rank-3" style={{ margin: '0.5rem auto' }}>03</div>
                <h3 className="podium-name">{topReps[2].representative_name}</h3>
                <p className="podium-sub">{topReps[2].job_title}</p>
                <div className="podium-metric">{Number(topReps[2].total_sales).toLocaleString('ar-EG')} ج.م</div>
                <p className="podium-sub">نسبة التحصيل: {topReps[2].collection_rate.toFixed(1)}%</p>
              </div>
            </div>
          )}

          {/* Full Table */}
          <div className="sheikh-card table-wrapper-card">
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                جدول ترتيب المناديب والمحصلين ({topReps.length})
              </h3>
            </div>

            {loading ? (
              <div className="table-loading-box">جاري حساب الإحصائيات وترتيب المناديب...</div>
            ) : topReps.length === 0 ? (
              <div className="empty-state-box">
                <h4>لا توجد بيانات مبيعات أو تحصيل لهذه الفترة</h4>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="sheikh-table">
                  <thead>
                    <tr>
                      <th style={{ width: '70px' }}>الترتيب</th>
                      <th>اسم المندوب / المحصل</th>
                      <th>المسمى الوظيفي</th>
                      <th>العملاء المسندين</th>
                      <th>إجمالي المبيعات</th>
                      <th>عدد الفواتير</th>
                      <th>إجمالي التحصيلات</th>
                      <th>نسبة كفاءة التحصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topReps.map((rep) => (
                      <tr key={rep.representative_id}>
                        <td>
                          <span className={getRankBadgeClass(rep.rank)}>{formatRank(rep.rank)}</span>
                        </td>
                        <td>
                          <strong>{rep.representative_name}</strong>
                        </td>
                        <td>{rep.job_title}</td>
                        <td>{rep.assigned_customers} عميل</td>
                        <td style={{ fontWeight: 800, color: '#b45309' }}>
                          {Number(rep.total_sales).toLocaleString('ar-EG')} ج.م
                        </td>
                        <td>{rep.invoice_count}</td>
                        <td style={{ fontWeight: 700, color: '#059669' }}>
                          {Number(rep.total_collections).toLocaleString('ar-EG')} ج.م
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '80px', backgroundColor: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  backgroundColor: rep.collection_rate >= 85 ? '#059669' : rep.collection_rate >= 60 ? '#d97706' : '#dc2626',
                                  width: `${Math.min(100, rep.collection_rate)}%`,
                                  height: '100%',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{rep.collection_rate.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUSTOMERS LEADERBOARD */}
      {activeTab === 'CUSTOMERS' && (
        <div>
          {/* Filter Bar */}
          <div className="sheikh-card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>ترتيب العملاء حسب:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setSortBy('sales')}
                className={`btn ${sortBy === 'sales' ? 'btn-gold' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
              >
                حجم المبيعات
              </button>
              <button
                onClick={() => setSortBy('collections')}
                className={`btn ${sortBy === 'collections' ? 'btn-gold' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
              >
                حجم السدادات النقدية
              </button>
              <button
                onClick={() => setSortBy('invoices')}
                className={`btn ${sortBy === 'invoices' ? 'btn-gold' : 'btn-secondary'}`}
                style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}
              >
                تكرار الطلبيات
              </button>
            </div>
          </div>

          <div className="sheikh-card table-wrapper-card">
            {loading ? (
              <div className="table-loading-box">جاري استخراج بيانات كبار العملاء...</div>
            ) : topCustomers.length === 0 ? (
              <div className="empty-state-box">
                <h4>لا توجد معاملات للعملاء في هذه الفترة</h4>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="sheikh-table">
                  <thead>
                    <tr>
                      <th style={{ width: '70px' }}>الترتيب</th>
                      <th>كود العميل</th>
                      <th>اسم المنشأة / العميل</th>
                      <th>الاسم التجاري والمدينة</th>
                      <th>إجمالي المشتريات</th>
                      <th>عدد الفواتير</th>
                      <th>متوسط الطلبية</th>
                      <th>إجمالي السدادات</th>
                      <th>الرصيد القائم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((cust) => (
                      <tr key={cust.customer_id}>
                        <td>
                          <span className={getRankBadgeClass(cust.rank)}>{formatRank(cust.rank)}</span>
                        </td>
                        <td>
                          <span className="code-pill">{cust.customer_code}</span>
                        </td>
                        <td>
                          <strong>{cust.customer_name}</strong>
                        </td>
                        <td>
                          <span>{cust.trade_name || '—'}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{cust.city || 'غير محدد'}</span>
                        </td>
                        <td style={{ fontWeight: 800, color: '#b45309' }}>
                          {Number(cust.sales).toLocaleString('ar-EG')} ج.م
                        </td>
                        <td>{cust.invoice_count}</td>
                        <td>{Math.round(cust.avg_invoice).toLocaleString('ar-EG')} ج.م</td>
                        <td style={{ color: '#059669', fontWeight: 700 }}>
                          {Number(cust.collections).toLocaleString('ar-EG')} ج.م
                        </td>
                        <td style={{ color: Number(cust.current_balance) > 0 ? '#b91c1c' : '#059669', fontWeight: 700 }}>
                          {Number(cust.current_balance).toLocaleString('ar-EG')} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default LeaderboardPage;
