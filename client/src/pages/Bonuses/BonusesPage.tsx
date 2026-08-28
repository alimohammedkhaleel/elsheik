import React, { useState, useEffect } from 'react';
import {
  Award,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { bonusService, Bonus } from '../../services/api/bonusService';
import { repBonusService, RepBonusDeduction, RepBonusSummary, RepTransactionType } from '../../services/api/repBonusService';
import { userService } from '../../services/api/userService';
import { User } from '../../types/auth';
import './BonusesPage.css';

export const BonusesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'PLANS'>('TRANSACTIONS');

  // Bonus Plans State
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  // Rep Transactions State
  const [transactions, setTransactions] = useState<RepBonusDeduction[]>([]);
  const [summaries, setSummaries] = useState<RepBonusSummary[]>([]);
  const [repsList, setRepsList] = useState<User[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(false);

  // Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingBonus, setEditingBonus] = useState<Bonus | null>(null);
  const [bonusName, setBonusName] = useState('');
  const [bonusDesc, setBonusDesc] = useState('');
  const [bonusType, setBonusType] = useState<'FIXED' | 'PERCENTAGE' | 'TARGET_BASED'>('FIXED');
  const [bonusValue, setBonusValue] = useState<number | ''>(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [criteria, setCriteria] = useState('');

  // Rep Transaction Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txRepId, setTxRepId] = useState<number | ''>('');
  const [txType, setTxType] = useState<RepTransactionType>('BONUS');
  const [txAmount, setTxAmount] = useState<number | ''>('');
  const [txReason, setTxReason] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txNotes, setTxNotes] = useState('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPlans = async () => {
    try {
      setIsLoadingPlans(true);
      const res = await bonusService.getBonuses();
      setBonuses(res || []);
    } catch {
      // ignore
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setIsLoadingTx(true);
      const [txData, sumData] = await Promise.all([
        repBonusService.getTransactions(),
        repBonusService.getSummaries(),
      ]);
      setTransactions(txData || []);
      setSummaries(sumData || []);
    } catch {
      // ignore
    } finally {
      setIsLoadingTx(false);
    }
  };

  const fetchReps = async () => {
    try {
      const users = await userService.getAllUsers();
      const usersData = Array.isArray(users) ? users : ((users as any)?.data || []);
      setRepsList(usersData.filter((u: User) => u.role === 'EMPLOYEE' || u.role === 'COLLECTOR'));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchTransactions();
    fetchReps();
  }, []);

  // Plan Handlers
  const handleOpenCreatePlan = () => {
    setEditingBonus(null);
    setBonusName('');
    setBonusDesc('');
    setBonusType('FIXED');
    setBonusValue(0);
    setStartDate('');
    setEndDate('');
    setCriteria('');
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (b: Bonus) => {
    setEditingBonus(b);
    setBonusName(b.name);
    setBonusDesc(b.description || '');
    setBonusType(b.bonus_type || 'FIXED');
    setBonusValue(b.value);
    setStartDate(b.start_date ? b.start_date.split('T')[0] : '');
    setEndDate(b.end_date ? b.end_date.split('T')[0] : '');
    setCriteria(b.criteria || '');
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusName || bonusValue === '') {
      setFeedback({ type: 'error', text: 'يرجى ملء جميع الحقول المطلوبة' });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: bonusName,
        description: bonusDesc,
        bonus_type: bonusType,
        value: Number(bonusValue),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        criteria: criteria || undefined,
      };

      if (editingBonus) {
        await bonusService.updateBonus(editingBonus.id, payload);
        setFeedback({ type: 'success', text: 'تم تحديث خطة الحافز بنجاح' });
      } else {
        await bonusService.createBonus(payload);
        setFeedback({ type: 'success', text: 'تم إنشاء خطة الحافز بنجاح' });
      }

      setIsPlanModalOpen(false);
      fetchPlans();
    } catch {
      setFeedback({ type: 'error', text: 'حدث خطأ أثناء حفظ الخطة' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transaction Handlers
  const handleOpenCreateTx = () => {
    setTxRepId(repsList[0]?.id || '');
    setTxType('BONUS');
    setTxAmount('');
    setTxReason('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxNotes('');
    setIsTxModalOpen(true);
  };

  const handleSaveTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txRepId || !txAmount || Number(txAmount) <= 0 || !txReason) {
      setFeedback({ type: 'error', text: 'يرجى اختيار المندوب وكتابة المبلغ والسبب' });
      return;
    }

    try {
      setIsSubmitting(true);
      await repBonusService.createTransaction({
        representative_id: Number(txRepId),
        type: txType,
        amount: Number(txAmount),
        reason: txReason,
        transaction_date: txDate,
        notes: txNotes || undefined,
      });

      setFeedback({ type: 'success', text: 'تم تسجيل المعاملة المالية للمندوب بنجاح' });
      setIsTxModalOpen(false);
      fetchTransactions();
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'فشل تسجيل المعاملة' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bonuses-page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-main-title">نظام الحوافز ومكافآت وخصومات المناديب</h1>
          <p className="page-sub-title">إدارة الخطط التحفيزية وتطبيق المكافآت والخصومات المالية للمناديب والمحصلين</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab === 'TRANSACTIONS' ? (
            <button className="btn-gold" onClick={handleOpenCreateTx}>
              <Plus size={16} />
              <span>تسجيل مكافأة / خصم</span>
            </button>
          ) : (
            <button className="btn-gold" onClick={handleOpenCreatePlan}>
              <Plus size={16} />
              <span>إنشاء خطة حوافز جديدة</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback message */}
      {feedback && (
        <div className={feedback.type === 'success' ? 'sheikh-alert-success' : 'sheikh-alert-error'}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="alert-close-btn">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="sheikh-card" style={{ padding: '0.5rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('TRANSACTIONS')}
          className={activeTab === 'TRANSACTIONS' ? 'btn-gold' : 'btn-secondary'}
          style={{ padding: '0.45rem 1.25rem' }}
        >
          سجل معاملات المكافآت والخصومات
        </button>
        <button
          onClick={() => setActiveTab('PLANS')}
          className={activeTab === 'PLANS' ? 'btn-gold' : 'btn-secondary'}
          style={{ padding: '0.45rem 1.25rem' }}
        >
          خطط وبرامج الحوافز
        </button>
      </div>

      {/* TAB 1: Rep Transactions */}
      {activeTab === 'TRANSACTIONS' && (
        <div>
          {/* Summary Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {summaries.map((s) => (
              <div key={s.representative_id} className="sheikh-card" style={{ borderRight: '4px solid #d97706', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{s.representative_name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.job_title}</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.5rem 0', color: s.net_amount >= 0 ? '#059669' : '#dc2626' }}>
                  {s.net_amount.toLocaleString()} ج.م
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem' }}>
                  <span style={{ color: '#059669' }}>+ {s.total_bonuses.toLocaleString()} مكافآت</span>
                  <span style={{ color: '#dc2626' }}>- {s.total_deductions.toLocaleString()} خصومات</span>
                </div>
              </div>
            ))}
          </div>

          {/* Transactions Table */}
          <div className="sheikh-card table-wrapper-card">
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>سجل الحركات المالية المباشرة للمناديب ({transactions.length})</h3>
            </div>

            {isLoadingTx ? (
              <div className="table-loading-box">جاري تحميل سجل المعاملات...</div>
            ) : transactions.length === 0 ? (
              <div className="empty-state-box">
                <Award size={40} className="empty-state-icon" />
                <h4>لا توجد مكافآت أو خصومات مسجلة بعد</h4>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="sheikh-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>المندوب / الموظف</th>
                      <th>النوع</th>
                      <th>المبلغ</th>
                      <th>السبب والبيان</th>
                      <th>الصادر عنه</th>
                      <th>الملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>{new Date(tx.transaction_date).toLocaleDateString('ar-EG')}</td>
                        <td>
                          <strong>{tx.representative_name}</strong>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>{tx.representative_job}</span>
                        </td>
                        <td>
                          <span className={`status-pill ${tx.type === 'BONUS' ? 'status-ok' : 'status-muted'}`} style={{ color: tx.type === 'BONUS' ? '#059669' : '#dc2626' }}>
                            {tx.type === 'BONUS' ? 'مكافأة' : 'خصم'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: tx.type === 'BONUS' ? '#059669' : '#dc2626' }}>
                          {tx.type === 'BONUS' ? '+' : '-'} {Number(tx.amount).toLocaleString()} ج.م
                        </td>
                        <td>{tx.reason}</td>
                        <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{tx.created_by_name || 'إدارة النظام'}</td>
                        <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{tx.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Bonus Plans */}
      {activeTab === 'PLANS' && (
        <div className="sheikh-card table-wrapper-card">
          {isLoadingPlans ? (
            <div className="table-loading-box">جاري تحميل خطط الحوافز...</div>
          ) : bonuses.length === 0 ? (
            <div className="empty-state-box">
              <Award size={40} className="empty-state-icon" />
              <h4>لا توجد خطط حوافز مسجلة</h4>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="sheikh-table">
                <thead>
                  <tr>
                    <th>اسم الخطة</th>
                    <th>نوع الحافز</th>
                    <th>القيمة</th>
                    <th>الفترة الزمنية</th>
                    <th>معايير الاستحقاق</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {bonuses.map((b) => (
                    <tr key={b.id}>
                      <td className="font-semibold">{b.name}</td>
                      <td>
                        <span className="bonus-type-pill">
                          {b.bonus_type === 'FIXED'
                            ? 'مبلغ ثابت'
                            : b.bonus_type === 'PERCENTAGE'
                            ? 'نسبة مئوية'
                            : 'مبني على التارجت'}
                        </span>
                      </td>
                      <td className="font-bold text-gold-dark">
                        {b.bonus_type === 'PERCENTAGE' ? `${b.value}%` : `${Number(b.value).toLocaleString('ar-EG')} ج.م`}
                      </td>
                      <td>
                        {b.start_date || b.end_date ? (
                          <span className="text-muted text-xs">
                            {b.start_date ? b.start_date.split('T')[0] : '—'} إلى {b.end_date ? b.end_date.split('T')[0] : 'مستمر'}
                          </span>
                        ) : (
                          <span className="text-muted">دائم</span>
                        )}
                      </td>
                      <td className="text-muted">{b.criteria || '—'}</td>
                      <td>
                        <button
                          onClick={() => handleOpenEditPlan(b)}
                          className="btn-action-icon"
                          title="تعديل الخطة"
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Rep Transaction */}
      {isTxModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTxModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">تسجيل مكافأة أو خصم لمندوب</h3>
              <button onClick={() => setIsTxModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTx} className="modal-form-grid">
              <div className="form-group">
                <label className="form-label">المندوب / الموظف المعني <span className="req-star">*</span></label>
                <select
                  value={txRepId}
                  onChange={(e) => setTxRepId(Number(e.target.value))}
                  className="sheikh-select"
                  required
                >
                  <option value="">-- اختر المندوب --</option>
                  {repsList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.full_name} ({r.job_title || r.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">نوع المعاملة <span className="req-star">*</span></label>
                <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="txType"
                      checked={txType === 'BONUS'}
                      onChange={() => setTxType('BONUS')}
                    />
                    <span style={{ color: '#059669', fontWeight: 700 }}>مكافأة مالية (+)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="txType"
                      checked={txType === 'DEDUCTION'}
                      onChange={() => setTxType('DEDUCTION')}
                    />
                    <span style={{ color: '#dc2626', fontWeight: 700 }}>خصم مالي (-)</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">المبلغ (ج.م) <span className="req-star">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="sheikh-input font-bold"
                  placeholder="مثال: 500"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">السبب / المبرر <span className="req-star">*</span></label>
                <input
                  type="text"
                  value={txReason}
                  onChange={(e) => setTxReason(e.target.value)}
                  className="sheikh-input"
                  placeholder="مثال: تميز في تحصيل المتأخرات أو مخالفة مسار"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">تاريخ الحركة</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="sheikh-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">ملاحظات إضافية</label>
                <textarea
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="sheikh-textarea"
                  rows={2}
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-gold" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ المعاملة'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setIsTxModalOpen(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create/Edit Plan */}
      {isPlanModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPlanModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingBonus ? 'تعديل خطة الحافز' : 'إضافة خطة حوافز ومكافآت'}</h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="modal-form-grid">
              <div className="form-group">
                <label className="form-label">
                  اسم الخطة / الحافز <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  className="sheikh-input"
                  placeholder="مثال: مكافأة تحقيق تارجت مبيعات الربع الأول"
                  value={bonusName}
                  onChange={(e) => setBonusName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">نوع الحافز</label>
                  <select
                    className="sheikh-select"
                    value={bonusType}
                    onChange={(e) => setBonusType(e.target.value as any)}
                  >
                    <option value="FIXED">مبلغ ثابت (ج.م)</option>
                    <option value="PERCENTAGE">نسبة مئوية (%)</option>
                    <option value="TARGET_BASED">مبني على التارجت ومستويات التحصيل</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    القيمة {bonusType === 'PERCENTAGE' ? '(%)' : '(ج.م)'} <span className="req-star">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="sheikh-input font-bold"
                    value={bonusValue}
                    onChange={(e) => setBonusValue(e.target.value === '' ? '' : Number(e.target.value))}
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">تاريخ البدء</label>
                  <input
                    type="date"
                    className="sheikh-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    className="sheikh-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">شروط ومعايير الاستحقاق</label>
                <textarea
                  className="sheikh-textarea"
                  rows={2}
                  placeholder="مثال: تحقيق مبيعات تفوق 100,000 ج.م مع نسبة تحصيل لا تقل عن 90%..."
                  value={criteria}
                  onChange={(e) => setCriteria(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">الوصف</label>
                <textarea
                  className="sheikh-textarea"
                  rows={2}
                  placeholder="تفاصيل إضافية عن الخطة التحفيزية..."
                  value={bonusDesc}
                  onChange={(e) => setBonusDesc(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-gold" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : editingBonus ? 'حفظ التعديلات' : 'حفظ الخطة'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setIsPlanModalOpen(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default BonusesPage;
