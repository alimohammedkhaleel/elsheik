import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { paymentService } from '../../services/api/paymentService';
import { customerService } from '../../services/api/customerService';
import { invoiceService } from '../../services/api/invoiceService';
import { userService } from '../../services/api/userService';
import { Payment, Customer, Invoice, PaymentMethod } from '../../types/financial';
import { User } from '../../types/auth';
import './PaymentsPage.css';

interface PaymentsPageProps {
  onNavigate?: (path: string) => void;
}

export const PaymentsPage: React.FC<PaymentsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [customerInvoices, setCustomerInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State - Record Payment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReceiptNumber, setNewReceiptNumber] = useState('');
  const [newCustomerId, setNewCustomerId] = useState<string>('');
  const [newInvoiceId, setNewInvoiceId] = useState<string>('');
  const [newCollectorId, setNewCollectorId] = useState<string>('');
  const [newAmount, setNewAmount] = useState<number | ''>('');
  const [newMethod, setNewMethod] = useState<PaymentMethod>('CASH');
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');

  // Modal State - Edit Payment
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState<number | ''>('');
  const [editMethod, setEditMethod] = useState<PaymentMethod>('CASH');
  const [editPaymentDate, setEditPaymentDate] = useState('');
  const [editCollectorId, setEditCollectorId] = useState<string>('');
  const [editNotes, setEditNotes] = useState('');

  // Modal State - Delete Payment
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);

  // Feedback & Submitting
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const res = await paymentService.getPayments({
        search: search || undefined,
        customer_id: selectedCustomerId ? parseInt(selectedCustomerId, 10) : undefined,
        payment_method: paymentMethod || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setPayments(res.data || []);
      setTotalCount(res.total || 0);
    } catch {
      setFeedback({ type: 'error', text: 'فشل تحميل سندات التحصيل من الخادم' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await customerService.getCustomers();
      setCustomers(res.data || []);
    } catch {
      // Fallback
    }
  };

  const fetchEmployees = async () => {
    try {
      const users = await userService.getUsers();
      setEmployees(users.filter((u: User) => u.status === 'ACTIVE' && (u.role === 'EMPLOYEE' || u.role === 'COLLECTOR' || u.role === 'ADMIN' || u.role === 'MANAGER')));
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [search, selectedCustomerId, paymentMethod, startDate, endDate]);

  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
  }, []);

  const handleCustomerSelect = async (custIdStr: string) => {
    setNewCustomerId(custIdStr);
    setNewInvoiceId('');
    if (custIdStr) {
      const cust = customers.find(c => c.id === parseInt(custIdStr, 10));
      if (cust && cust.assigned_employee_id) {
        setNewCollectorId(String(cust.assigned_employee_id));
      } else if (user?.id) {
        setNewCollectorId(String(user.id));
      }

      try {
        const res = await invoiceService.getInvoices({
          customer_id: parseInt(custIdStr, 10),
          payment_status: 'UNPAID',
        });
        setCustomerInvoices(res.data || []);
      } catch {
        setCustomerInvoices([]);
      }
    } else {
      setCustomerInvoices([]);
      setNewCollectorId('');
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId) {
      setFeedback({ type: 'error', text: 'يرجى اختيار العميل' });
      return;
    }
    const amt = Number(newAmount);
    if (!amt || amt <= 0) {
      setFeedback({ type: 'error', text: 'يرجى إدخال مبلغ تحصيل صحيح' });
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentService.createPayment({
        receipt_number: newReceiptNumber.trim() || undefined,
        customer_id: parseInt(newCustomerId, 10),
        invoice_id: newInvoiceId ? parseInt(newInvoiceId, 10) : undefined,
        collected_by: newCollectorId ? parseInt(newCollectorId, 10) : undefined,
        amount: amt,
        payment_method: newMethod,
        payment_date: newPaymentDate,
        notes: newNotes.trim() || undefined,
      });

      setFeedback({ type: 'success', text: 'تم تسجيل سند التحصيل وتحديث رصيد العميل بنجاح' });
      setIsModalOpen(false);
      // Reset form
      setNewCustomerId('');
      setNewInvoiceId('');
      setNewCollectorId('');
      setNewAmount('');
      setNewNotes('');
      setNewReceiptNumber('');
      fetchPayments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تسجيل سند التحصيل';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (p: Payment) => {
    setEditingPayment(p);
    setEditAmount(p.amount);
    setEditMethod(p.payment_method);
    setEditPaymentDate(p.payment_date);
    setEditCollectorId(p.collected_by ? String(p.collected_by) : '');
    setEditNotes(p.notes || '');
    setIsEditModalOpen(true);
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    const amt = Number(editAmount);
    if (!amt || amt <= 0) {
      setFeedback({ type: 'error', text: 'يرجى إدخال مبلغ تحصيل صحيح' });
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentService.updatePayment(editingPayment.id, {
        amount: amt,
        payment_method: editMethod,
        payment_date: editPaymentDate,
        collected_by: editCollectorId ? parseInt(editCollectorId, 10) : undefined,
        notes: editNotes.trim() || undefined,
      });

      setFeedback({ type: 'success', text: 'تم تعديل سند التحصيل وتحديث الحسابات بنجاح' });
      setIsEditModalOpen(false);
      setEditingPayment(null);
      fetchPayments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تعديل سند التحصيل';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (p: Payment) => {
    setDeleteTarget(p);
    setIsDeleteModalOpen(true);
  };

  const handleDeletePayment = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await paymentService.deletePayment(deleteTarget.id);
      setFeedback({ type: 'success', text: `تم حذف سند التحصيل #${deleteTarget.receipt_number} وإعادة احتساب الأرصدة بنجاح` });
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchPayments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حذف سند التحصيل';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return Number(val || 0).toLocaleString('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ج.م';
  };

  return (
    <div className="payments-page-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-main-title">سجل سندات التحصيل والمقبوضات</h1>
          <p className="page-sub-title">توثيق المتحصلات النقدية والبنكية، السداد على الحساب، وتحديث أرصدة العملاء</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-gold">
          <Plus size={16} />
          <span>تسجيل سند تحصيل جديد</span>
        </button>
      </div>

      {/* Alerts */}
      {feedback && (
        <div className={feedback.type === 'success' ? 'sheikh-alert-success' : 'sheikh-alert-error'}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="alert-close-btn">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="sheikh-card payments-filter-card">
        <div className="filter-grid-row">
          <div className="search-input-group">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="بحث برقم السند أو اسم العميل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sheikh-input-search"
            />
          </div>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="sheikh-select"
          >
            <option value="">كافة العملاء</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.customer_code})
              </option>
            ))}
          </select>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="sheikh-select"
          >
            <option value="">كافة طرق الدفع</option>
            <option value="CASH">نقدي (CASH)</option>
            <option value="WALLET">محفظة إلكترونية</option>
            <option value="NSP">شبكة NSP</option>
            <option value="BANK_TRANSFER">تحويل بنكي</option>
            <option value="OTHER">أخرى</option>
          </select>

          <input
            type="date"
            className="sheikh-date-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="من تاريخ"
          />

          <input
            type="date"
            className="sheikh-date-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="إلى تاريخ"
          />
        </div>
      </div>

      {/* Payments Table Card */}
      <div className="sheikh-card table-wrapper-card">
        <div className="table-header-info">
          <span className="results-count-badge">إجمالي السندات: {totalCount}</span>
        </div>

        {isLoading ? (
          <div className="table-loading-box">جاري تحميل سندات التحصيل...</div>
        ) : payments.length > 0 ? (
          <div className="table-responsive">
            <table className="sheikh-table">
              <thead>
                <tr>
                  <th>رقم السند</th>
                  <th>اسم العميل</th>
                  <th>الفاتورة المرتبطة</th>
                  <th>تاريخ التحصيل</th>
                  <th>المبلغ المحصل</th>
                  <th>طريقة الدفع</th>
                  <th>المحصل المسؤول</th>
                  <th>ملاحظات</th>
                  <th style={{ textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="code-pill">{p.receipt_number}</span>
                    </td>
                    <td className="font-semibold">{p.customer_name}</td>
                    <td>
                      {p.invoice_number ? (
                        <span className="invoice-link-tag">{p.invoice_number}</span>
                      ) : (
                        <span className="text-muted">سداد على الحساب</span>
                      )}
                    </td>
                    <td>{p.payment_date}</td>
                    <td className="font-bold text-success">{formatCurrency(p.amount)}</td>
                    <td>
                      <span className="method-pill">
                        {p.payment_method === 'CASH'
                          ? 'نقدي'
                          : p.payment_method === 'WALLET'
                          ? 'محفظة'
                          : p.payment_method === 'NSP'
                          ? 'NSP'
                          : p.payment_method === 'BANK_TRANSFER'
                          ? 'تحويل بنكي'
                          : 'أخرى'}
                      </span>
                    </td>
                    <td>
                      <span className="emp-assigned-tag">
                        {p.collected_by_name || '—'}
                      </span>
                    </td>
                    <td className="text-muted">{p.notes || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', alignItems: 'center' }}>
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate(`/customers/${p.customer_id}`)}
                            className="btn-action-icon"
                            title="عرض كشف حساب العميل"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(p)}
                          className="btn-action-icon"
                          title="تعديل السند"
                          style={{ color: '#d97706' }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(p)}
                          className="btn-action-icon"
                          title="حذف السند"
                          style={{ color: '#dc2626' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-box">
            <CreditCard size={40} className="empty-state-icon" />
            <h4>لا توجد سندات تحصيل مسجلة</h4>
            <p>يمكنك تسجيل سند قبض جديد لسداد فواتير أو مديونية العملاء.</p>
          </div>
        )}
      </div>

      {/* Modal: Record Payment */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">تسجيل سند تحصيل وقبض مالي</h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="modal-form-grid">
              <div className="form-group">
                <label className="form-label">
                  العميل المسدد <span className="req-star">*</span>
                </label>
                <select
                  className="sheikh-select"
                  value={newCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  required
                >
                  <option value="">-- اختر العميل --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customer_code}) {c.current_balance ? `[رصيد: ${c.current_balance} ج.م]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">المحصل المسؤول</label>
                <select
                  className="sheikh-select"
                  value={newCollectorId}
                  onChange={(e) => setNewCollectorId(e.target.value)}
                >
                  <option value="">تلقائي (مندوب العميل / المستخدم الحالي)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              {customerInvoices.length > 0 && (
                <div className="form-group">
                  <label className="form-label">ربط بفاتورة مستحقة (اختياري)</label>
                  <select
                    className="sheikh-select"
                    value={newInvoiceId}
                    onChange={(e) => setNewInvoiceId(e.target.value)}
                  >
                    <option value="">سداد عام على الحساب (بدون فاتورة محددة)</option>
                    {customerInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        فاتورة #{inv.invoice_number} (المتبقي: {inv.remaining_amount || inv.total} ج.م)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">
                    المبلغ المحصل (ج.م) <span className="req-star">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="sheikh-input font-bold"
                    placeholder="0.00"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    min={0.01}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">طريقة التحصيل</label>
                  <select
                    className="sheikh-select"
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="CASH">نقدي (CASH)</option>
                    <option value="WALLET">محفظة إلكترونية (فودافون كاش / إلخ)</option>
                    <option value="NSP">شبكة NSP / بطاقة</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="OTHER">أخرى</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">تاريخ التحصيل</label>
                  <input
                    type="date"
                    className="sheikh-input"
                    value={newPaymentDate}
                    onChange={(e) => setNewPaymentDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">رقم السند / الإيصال (تلقائي إن ترك فارغاً)</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    placeholder="RCT-XXXXX"
                    value={newReceiptNumber}
                    onChange={(e) => setNewReceiptNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ملاحظات التحصيل</label>
                <textarea
                  className="sheikh-textarea"
                  rows={2}
                  placeholder="ملاحظات المحصل أو رقم المعاملة البنكية..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-gold" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري التسجيل...' : 'تسجيل وتأكيد سند التحصيل'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Payment */}
      {isEditModalOpen && editingPayment && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">تعديل بيانات سند التحصيل #{editingPayment.receipt_number}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdatePayment} className="modal-form-grid">
              <div className="form-group">
                <label className="form-label">العميل</label>
                <input
                  type="text"
                  className="sheikh-input"
                  value={editingPayment.customer_name}
                  disabled
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">
                    المبلغ المحصل (ج.م) <span className="req-star">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="sheikh-input font-bold"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    min={0.01}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">طريقة التحصيل</label>
                  <select
                    className="sheikh-select"
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="CASH">نقدي (CASH)</option>
                    <option value="WALLET">محفظة إلكترونية</option>
                    <option value="NSP">شبكة NSP</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="OTHER">أخرى</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">تاريخ التحصيل</label>
                  <input
                    type="date"
                    className="sheikh-input"
                    value={editPaymentDate}
                    onChange={(e) => setEditPaymentDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">المحصل المسؤول</label>
                  <select
                    className="sheikh-select"
                    value={editCollectorId}
                    onChange={(e) => setEditCollectorId(e.target.value)}
                  >
                    <option value="">بدون تحديد</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ملاحظات</label>
                <textarea
                  className="sheikh-textarea"
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-gold" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {isDeleteModalOpen && deleteTarget && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#dc2626' }}>
                <Trash2 size={22} />
                <h3 className="modal-title" style={{ color: '#dc2626' }}>تأكيد حذف سند التحصيل</h3>
              </div>
              <button onClick={() => setIsDeleteModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 0', color: '#475569', fontSize: '0.92rem', lineHeight: 1.6 }}>
              هل أنت متأكد من رغبتك في حذف سند التحصيل رقم <strong>#{deleteTarget.receipt_number}</strong> للعميل <strong>{deleteTarget.customer_name}</strong> بمبلغ <strong>{formatCurrency(deleteTarget.amount)}</strong>؟
              <br />
              <small style={{ color: '#dc2626', display: 'block', marginTop: '0.5rem' }}>
                تنبيه: سيتم إلغاء قيد السداد من كشف حساب العميل وإعادة احتساب المديونية فورياً.
              </small>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeletePayment}
                disabled={isSubmitting}
                style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer' }}
              >
                {isSubmitting ? 'جاري الحذف...' : 'نعم، تأكيد الحذف'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
