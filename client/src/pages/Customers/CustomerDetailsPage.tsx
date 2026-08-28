import React, { useState, useEffect } from 'react';
import {
  Building,
  ArrowRight,
  Receipt,
  FileText,
  CreditCard,
  User,
  Phone,
  MapPin,
  Clock,
  PlusCircle,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { customerService } from '../../services/api/customerService';
import { statementService } from '../../services/api/statementService';
import { invoiceService } from '../../services/api/invoiceService';
import { paymentService } from '../../services/api/paymentService';
import { interactionService } from '../../services/api/interactionService';
import { userService } from '../../services/api/userService';
import {
  Customer,
  CustomerAccountStatementResponse,
  Invoice,
  Payment,
  CustomerInteraction,
  InteractionType,
  AssignmentType,
} from '../../types/financial';
import { User as SystemUser } from '../../types/auth';
import './CustomerDetailsPage.css';

interface CustomerDetailsPageProps {
  customerId: number;
  onNavigate?: (path: string) => void;
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export const CustomerDetailsPage: React.FC<CustomerDetailsPageProps> = ({
  customerId,
  onNavigate,
}) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'statement' | 'invoices' | 'payments' | 'interactions'>('statement');
  const [isLoading, setIsLoading] = useState(true);

  // Statement Tab State
  const [statementData, setStatementData] = useState<CustomerAccountStatementResponse | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear] = useState<number>(new Date().getFullYear());
  const [isStatementLoading, setIsStatementLoading] = useState(false);

  // Invoices Tab State
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(false);

  // Payments Tab State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);

  // Interactions Tab State
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [isInteractionsLoading, setIsInteractionsLoading] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [newInteractionType, setNewInteractionType] = useState<InteractionType>('VISIT');
  const [newInteractionNotes, setNewInteractionNotes] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);

  // Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignType, setAssignType] = useState<AssignmentType>('SALES_REP');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [assignReason, setAssignReason] = useState('');
  const [employeesList, setEmployeesList] = useState<SystemUser[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);


  // Initial fetch of customer details
  const fetchCustomerDetails = async () => {
    try {
      setIsLoading(true);
      const cust = await customerService.getCustomerById(customerId);
      setCustomer(cust);
    } catch {
      // Error handling
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatement = async () => {
    try {
      setIsStatementLoading(true);
      const res = await statementService.getCustomerStatement(customerId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setStatementData(res);
    } catch {
      // Fallback
    } finally {
      setIsStatementLoading(false);
    }
  };

  const handleMonthlySelect = async (monthNum: number) => {
    setSelectedMonth(monthNum);
    const mStr = String(monthNum).padStart(2, '0');
    const start = `${selectedYear}-${mStr}-01`;
    const lastDay = new Date(selectedYear, monthNum, 0).getDate();
    const end = `${selectedYear}-${mStr}-${String(lastDay).padStart(2, '0')}`;
    setStartDate(start);
    setEndDate(end);
    setEndDate(end);
    try {
      setIsStatementLoading(true);
      const res = await statementService.getCustomerStatement(customerId, {
        startDate: start,
        endDate: end,
      });
      setStatementData(res);
    } catch {
      // Fallback
    } finally {
      setIsStatementLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      setIsInvoicesLoading(true);
      const res = await invoiceService.getInvoices({ customer_id: customerId });
      setInvoices(res.data || []);
    } catch {
      // Fallback
    } finally {
      setIsInvoicesLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setIsPaymentsLoading(true);
      const res = await paymentService.getPayments({ customer_id: customerId });
      setPayments(res.data || []);
    } catch {
      // Fallback
    } finally {
      setIsPaymentsLoading(false);
    }
  };

  const fetchInteractions = async () => {
    try {
      setIsInteractionsLoading(true);
      const res = await interactionService.getByCustomer(customerId);
      setInteractions(res || []);
    } catch {
      // Fallback
    } finally {
      setIsInteractionsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await userService.getAllUsers();
      const usersData: SystemUser[] = Array.isArray(res) ? res : ((res as any)?.data || []);
      setEmployeesList(usersData.filter((u) => u.role !== 'CUSTOMER'));
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
    fetchEmployees();
  }, [customerId]);

  useEffect(() => {
    if (activeTab === 'statement') fetchStatement();
    else if (activeTab === 'invoices') fetchInvoices();
    else if (activeTab === 'payments') fetchPayments();
    else if (activeTab === 'interactions') fetchInteractions();
  }, [activeTab, customerId]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    try {
      setIsAssigning(true);
      await customerService.assignCustomer(
        customerId,
        Number(selectedEmployeeId),
        assignReason || undefined,
        assignType
      );
      setIsAssignModalOpen(false);
      fetchCustomerDetails();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleInteractionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInteractionNotes) return;

    try {
      setIsAddingInteraction(true);
      await interactionService.createInteraction({
        customer_id: customerId,
        interaction_type: newInteractionType,
        notes: newInteractionNotes,
        follow_up_date: newFollowUpDate || undefined,
      });
      setNewInteractionNotes('');
      setNewFollowUpDate('');
      setIsInteractionModalOpen(false);
      fetchInteractions();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingInteraction(false);
    }
  };


  const formatCurrency = (val: number) => {
    return Number(val || 0).toLocaleString('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ج.م';
  };

  if (isLoading) {
    return <div className="details-loading-box">جاري تحميل ملف العميل...</div>;
  }

  if (!customer) {
    return (
      <div className="details-not-found">
        <AlertCircle size={40} className="text-warn" />
        <h3>العميل غير موجود أو ليس لديك صلاحية للوصول إليه</h3>
        {onNavigate && (
          <button onClick={() => onNavigate('/customers')} className="btn-gold mt-3">
            <span>العودة لقائمة العملاء</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="customer-details-page">
      {/* Back Navigation Bar */}
      <div className="details-back-bar">
        {onNavigate && (
          <button onClick={() => onNavigate('/customers')} className="btn-back-link">
            <ArrowRight size={16} />
            <span>العودة لسجل العملاء</span>
          </button>
        )}
      </div>

      {/* Customer Header Summary Card */}
      <div className="sheikh-card customer-master-header">
        <div className="master-header-main">
          <div className="master-avatar">
            <Building size={28} />
          </div>
          <div className="master-info-col">
            <div className="master-title-row">
              <h1 className="master-customer-name">{customer.name}</h1>
              <span className="code-pill">{customer.customer_code}</span>
              <span className={`status-pill ${customer.status === 'ACTIVE' ? 'status-ok' : 'status-muted'}`}>
                {customer.status === 'ACTIVE' ? 'حساب نشط' : 'معطل'}
              </span>
              <span className={`classification-badge class-${customer.classification}`}>
                فئة {customer.classification}
              </span>
            </div>
            {customer.trade_name && (
              <div className="master-trade-name">الاسم التجاري: {customer.trade_name}</div>
            )}
            <div className="master-meta-row">
              {customer.phone && (
                <span className="meta-item">
                  <Phone size={14} />
                  <span>{customer.phone}</span>
                </span>
              )}
              {customer.city && (
                <span className="meta-item">
                  <MapPin size={14} />
                  <span>{customer.city} {customer.address ? `— ${customer.address}` : ''}</span>
                </span>
              )}
              <span className="meta-item">
                <Clock size={14} />
                <span>
                  طريقة السداد: {customer.payment_type === 'CREDIT' ? `آجل (${customer.payment_terms_days} يوم)` : 'نقدي'}
                </span>
              </span>
              <span className="meta-item">
                <User size={14} />
                <span>المندوب: {customer.assigned_employee_name || 'غير معين'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial KPIs 4-Card Summary Bar */}
      <div className="customer-kpi-summary-grid">
        <div className="sheikh-card cust-stat-box">
          <span className="stat-label">إجمالي المبيعات</span>
          <div className="stat-value text-gold-dark">{formatCurrency(customer.total_sales || 0)}</div>
          <span className="stat-sub">عدد الفواتير: {customer.invoice_count || 0}</span>
        </div>

        <div className="sheikh-card cust-stat-box">
          <span className="stat-label">إجمالي المسدد</span>
          <div className="stat-value text-success">{formatCurrency(customer.total_paid || 0)}</div>
          <span className="stat-sub">آخر سداد: {customer.last_payment_date || '—'}</span>
        </div>

        <div className="sheikh-card cust-stat-box">
          <span className="stat-label">الرصيد الحالي (المديونية)</span>
          <div className={`stat-value ${(customer.current_balance || 0) > 0 ? 'text-amber' : 'text-success'}`}>
            {formatCurrency(customer.current_balance || 0)}
          </div>
          <span className="stat-sub">
            الحد الائتماني: {formatCurrency(customer.credit_limit || 0)}
          </span>
        </div>

        <div className="sheikh-card cust-stat-box">
          <span className="stat-label">متوسط قيمة الفاتورة</span>
          <div className="stat-value">{formatCurrency(customer.avg_invoice || 0)}</div>
          <span className="stat-sub">آخر طلب: {customer.last_order_date || '—'}</span>
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div className="details-tabs-header">
        <button
          className={`tab-link ${activeTab === 'statement' ? 'tab-link-active' : ''}`}
          onClick={() => setActiveTab('statement')}
        >
          <Receipt size={16} />
          <span>كشف الحساب التفصيلي</span>
        </button>
        <button
          className={`tab-link ${activeTab === 'invoices' ? 'tab-link-active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <FileText size={16} />
          <span>سجل الفواتير ({customer.invoice_count || 0})</span>
        </button>
        <button
          className={`tab-link ${activeTab === 'payments' ? 'tab-link-active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <CreditCard size={16} />
          <span>سندات التحصيل والمقبوضات</span>
        </button>
        <button
          className={`tab-link ${activeTab === 'interactions' ? 'tab-link-active' : ''}`}
          onClick={() => setActiveTab('interactions')}
        >
          <User size={16} />
          <span>الزيارات والتفاعلات</span>
        </button>
        <button
          className={`tab-link ${activeTab === 'overview' ? 'tab-link-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Building size={16} />
          <span>البيانات العامة للمنشأة</span>
        </button>
      </div>


      {/* TAB 1: STATEMENT (كشف الحساب) */}
      {activeTab === 'statement' && (
        <div className="tab-content-wrapper">
          {/* Statement Filters & Monthly Selector */}
          <div className="sheikh-card statement-filter-card">
            <div className="statement-controls-row">
              {/* Monthly Quick Selector */}
              <div className="monthly-selector-group">
                <span className="selector-title">شهور سنة {selectedYear}:</span>
                <div className="months-pills-row">
                  {ARABIC_MONTHS.map((mName, idx) => (
                    <button
                      key={idx}
                      className={`month-pill ${selectedMonth === idx + 1 ? 'month-pill-active' : ''}`}
                      onClick={() => handleMonthlySelect(idx + 1)}
                    >
                      {mName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Inputs */}
              <div className="date-range-group">
                <div className="date-input-wrap">
                  <label>من تاريخ:</label>
                  <input
                    type="date"
                    className="sheikh-date-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="date-input-wrap">
                  <label>إلى تاريخ:</label>
                  <input
                    type="date"
                    className="sheikh-date-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <button onClick={fetchStatement} className="btn-gold-small align-self-end">
                  <Filter size={14} />
                  <span>تطبيق</span>
                </button>
              </div>
            </div>
          </div>

          {/* Statement Summary Card */}
          {statementData && (
            <div className="statement-summary-bar sheikh-card">
              <div className="summary-block">
                <span className="summary-block-label">الرصيد الافتتاحي</span>
                <span className="summary-block-val">
                  {formatCurrency(statementData.summary.opening_balance)}
                </span>
              </div>
              <div className="summary-block">
                <span className="summary-block-label">إجمالي المدين (+)</span>
                <span className="summary-block-val text-amber">
                  {formatCurrency(statementData.summary.total_debit)}
                </span>
              </div>
              <div className="summary-block">
                <span className="summary-block-label">إجمالي الدائن (-)</span>
                <span className="summary-block-val text-success">
                  {formatCurrency(statementData.summary.total_credit)}
                </span>
              </div>
              <div className="summary-block block-highlight">
                <span className="summary-block-label">الرصيد الختامي للفترة</span>
                <span className="summary-block-val font-bold">
                  {formatCurrency(statementData.summary.closing_balance)}
                </span>
              </div>
            </div>
          )}

          {/* Statement Transactions Table */}
          <div className="sheikh-card table-wrapper-card">
            {isStatementLoading ? (
              <div className="table-loading-box">جاري تحميل حركات كشف الحساب...</div>
            ) : statementData && statementData.transactions.length > 0 ? (
              <div className="table-responsive">
                <table className="sheikh-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>التاريخ</th>
                      <th>نوع الحركة</th>
                      <th>البيان والتفاصيل</th>
                      <th>مدين (+)</th>
                      <th>دائن (-)</th>
                      <th>الرصيد المتراكم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementData.transactions.map((tx, idx) => (
                      <tr key={tx.id}>
                        <td>{idx + 1}</td>
                        <td>{tx.transaction_date}</td>
                        <td>
                          <span className={`tx-type-pill tx-${tx.transaction_type}`}>
                            {tx.transaction_type === 'INVOICE'
                              ? 'فاتورة مبيعات'
                              : tx.transaction_type === 'PAYMENT'
                              ? 'سند قبض / تحصيل'
                              : tx.transaction_type === 'RETURN'
                              ? 'مرتجع مبيعات'
                              : tx.transaction_type === 'DISCOUNT'
                              ? 'خصم مسموح به'
                              : 'تسوية حساب'}
                          </span>
                        </td>
                        <td className="font-semibold">{tx.description}</td>
                        <td className="text-amber font-bold">
                          {tx.debit > 0 ? formatCurrency(tx.debit) : '—'}
                        </td>
                        <td className="text-success font-bold">
                          {tx.credit > 0 ? formatCurrency(tx.credit) : '—'}
                        </td>
                        <td className={`font-bold ${(tx.running_balance || 0) > 0 ? 'text-amber' : 'text-success'}`}>
                          {formatCurrency(tx.running_balance || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-box">
                <Receipt size={36} className="empty-state-icon" />
                <h4>لا توجد حركات مالية مسجلة لهذه الفترة</h4>
                <p>لم يتم تسجيل فواتير أو سندات تحصيل للعميل في النطاق الزمني المحدد.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: INVOICES (الفواتير) */}
      {activeTab === 'invoices' && (
        <div className="tab-content-wrapper">
          <div className="tab-header-actions-row">
            <h3>سجل فواتير المبيعات</h3>
            {onNavigate && (
              <button onClick={() => onNavigate('/invoices')} className="btn-gold-small">
                <PlusCircle size={15} />
                <span>إصدار فاتورة جديدة</span>
              </button>
            )}
          </div>

          <div className="sheikh-card table-wrapper-card">
            {isInvoicesLoading ? (
              <div className="table-loading-box">جاري تحميل الفواتير...</div>
            ) : invoices.length > 0 ? (
              <div className="table-responsive">
                <table className="sheikh-table">
                  <thead>
                    <tr>
                      <th>رقم الفاتورة</th>
                      <th>تاريخ الفاتورة</th>
                      <th>تاريخ الاستحقاق</th>
                      <th>طريقة السداد</th>
                      <th>الإجمالي</th>
                      <th>المسدد</th>
                      <th>المتبقي</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td>
                          <span className="code-pill">{inv.invoice_number}</span>
                        </td>
                        <td>{inv.invoice_date}</td>
                        <td>{inv.due_date}</td>
                        <td>
                          <span className={`payment-type-badge ${inv.payment_type === 'CREDIT' ? 'badge-credit' : 'badge-cash'}`}>
                            {inv.payment_type === 'CREDIT' ? 'آجل' : 'نقدي'}
                          </span>
                        </td>
                        <td className="font-bold">{formatCurrency(inv.total)}</td>
                        <td className="text-success font-semibold">{formatCurrency(inv.paid_amount || 0)}</td>
                        <td className="text-amber font-semibold">{formatCurrency(inv.remaining_amount || inv.total)}</td>
                        <td>
                          <span className={`invoice-status-pill status-${inv.payment_status}`}>
                            {inv.payment_status === 'PAID'
                              ? 'مدفوعة بالكامل'
                              : inv.payment_status === 'PARTIALLY_PAID'
                              ? 'مدفوعة جزئياً'
                              : inv.payment_status === 'OVERDUE'
                              ? 'متأخرة'
                              : 'غير مدفوعة'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-box">
                <FileText size={36} className="empty-state-icon" />
                <h4>لا توجد فواتير مسجلة لهذا العميل</h4>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENTS (التحصيلات) */}
      {activeTab === 'payments' && (
        <div className="tab-content-wrapper">
          <div className="tab-header-actions-row">
            <h3>سجل سندات التحصيل والمقبوضات</h3>
            {onNavigate && (
              <button onClick={() => onNavigate('/payments')} className="btn-gold-small">
                <PlusCircle size={15} />
                <span>تسجيل سند تحصيل جديد</span>
              </button>
            )}
          </div>

          <div className="sheikh-card table-wrapper-card">
            {isPaymentsLoading ? (
              <div className="table-loading-box">جاري تحميل سندات التحصيل...</div>
            ) : payments.length > 0 ? (
              <div className="table-responsive">
                <table className="sheikh-table">
                  <thead>
                    <tr>
                      <th>رقم السند</th>
                      <th>تاريخ التحصيل</th>
                      <th>المبلغ المحصل</th>
                      <th>طريقة الدفع</th>
                      <th>المحصل المسؤول</th>
                      <th>ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span className="code-pill">{p.receipt_number}</span>
                        </td>
                        <td>{p.payment_date}</td>
                        <td className="font-bold text-success">{formatCurrency(p.amount)}</td>
                        <td>
                          <span className="method-pill">
                            {p.payment_method === 'CASH'
                              ? 'نقدي'
                              : p.payment_method === 'WALLET'
                              ? 'محفظة إلكترونية'
                              : p.payment_method === 'NSP'
                              ? 'شبكة NSP'
                              : p.payment_method === 'BANK_TRANSFER'
                              ? 'تحويل بنكي'
                              : 'أخرى'}
                          </span>
                        </td>
                        <td>{p.collected_by_name || '—'}</td>
                        <td className="text-muted">{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-box">
                <CreditCard size={36} className="empty-state-icon" />
                <h4>لا توجد تحصيلات مسجلة لهذا العميل حتى الآن</h4>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: OVERVIEW (البيانات العامة) */}
      {activeTab === 'overview' && (
        <div className="tab-content-wrapper">
          <div className="sheikh-card overview-card">
            <h3 className="section-title mb-4">تفاصيل الحساب وبيانات المنشأة</h3>
            <div className="overview-details-grid">
              <div className="overview-field">
                <span className="field-label">اسم العميل:</span>
                <span className="field-value">{customer.name}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">الاسم التجاري:</span>
                <span className="field-value">{customer.trade_name || '—'}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">كود العميل:</span>
                <span className="field-value code-pill">{customer.customer_code}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">الهاتف الأساسي:</span>
                <span className="field-value">{customer.phone || '—'}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">الهاتف الثانوي:</span>
                <span className="field-value">{customer.secondary_phone || '—'}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">المحافظة / المدينة:</span>
                <span className="field-value">{customer.city || '—'}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">العنوان التفصيلي:</span>
                <span className="field-value">{customer.address || '—'}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">طريقة التعامل:</span>
                <span className="field-value">{customer.payment_type === 'CREDIT' ? 'آجل' : 'نقدي'}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">فترة السداد المعتمدة:</span>
                <span className="field-value">{customer.payment_terms_days} يوم</span>
              </div>
              <div className="overview-field">
                <span className="field-label">التصنيف:</span>
                <span className="field-value">فئة {customer.classification}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">الحد الائتماني:</span>
                <span className="field-value font-bold">{formatCurrency(customer.credit_limit || 0)}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">مندوب المبيعات:</span>
                <span className="field-value font-bold">{customer.assigned_employee_name || 'غير معين'}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">مسؤول الحسابات:</span>
                <span className="field-value font-bold">{customer.accountant_name || 'غير معين'}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">موظف المتابعة والتحصيل:</span>
                <span className="field-value font-bold">{customer.follow_up_employee_name || 'غير معين'}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">تطبيق المندوب مفعل:</span>
                <span className="field-value">{customer.has_app ? 'نعم' : 'لا'}</span>
              </div>
              <div className="overview-field">
                <span className="field-label">تاريخ التسجيل:</span>
                <span className="field-value">{new Date(customer.created_at).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="btn-gold"
              >
                تعديل إسناد الموظفين (مندوب / محاسب / متابعة)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INTERACTIONS (سجل الزيارات والمتابعات) */}
      {activeTab === 'interactions' && (
        <div className="tab-content-wrapper">
          <div className="tab-header-actions-row">
            <h3>سجل الزيارات الميدانية والتفاعلات والمتابعات</h3>
            <button
              onClick={() => setIsInteractionModalOpen(true)}
              className="btn-gold-small"
            >
              <PlusCircle size={15} />
              <span>تسجيل زيارة / تفاعل جديد</span>
            </button>
          </div>

          <div className="sheikh-card table-wrapper-card">
            {isInteractionsLoading ? (
              <div className="table-loading-box">جاري تحميل سجل التفاعلات...</div>
            ) : interactions.length > 0 ? (
              <div className="table-responsive">
                <table className="sheikh-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>نوع التفاعل</th>
                      <th>الموظف المسؤول</th>
                      <th>البيان والملاحظات</th>
                      <th>تاريخ المتابعة القادمة</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interactions.map((it) => (
                      <tr key={it.id}>
                        <td>{new Date(it.interaction_date).toLocaleDateString('ar-EG')}</td>
                        <td>
                          <span className={`method-pill`}>
                            {it.interaction_type === 'VISIT'
                              ? 'زيارة ميدانية'
                              : it.interaction_type === 'CALL'
                              ? 'مكالمة هاتفية'
                              : it.interaction_type === 'FOLLOW_UP'
                              ? 'متابعة تحصيل'
                              : 'ملاحظة إدارية'}
                          </span>
                        </td>
                        <td className="font-semibold">{it.employee_name || 'موظف النظام'}</td>
                        <td>{it.notes}</td>
                        <td>{it.follow_up_date ? new Date(it.follow_up_date).toLocaleDateString('ar-EG') : '—'}</td>
                        <td>
                          <span className={`status-pill ${it.is_resolved ? 'status-ok' : 'status-muted'}`}>
                            {it.is_resolved ? 'مكتملة' : 'قيد المتابعة'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-box">
                <User size={36} className="empty-state-icon" />
                <h4>لا توجد زيارات أو تفاعلات مسجلة لهذا العميل حتى الآن</h4>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Assign Employee */}
      {isAssignModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAssignModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">إسناد موظف للعميل ({customer.name})</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="modal-close-btn">
                <AlertCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="modal-form-grid">
              <div className="form-group">
                <label className="form-label">نوع الإسناد / الدور <span className="req-star">*</span></label>
                <select
                  value={assignType}
                  onChange={(e: any) => setAssignType(e.target.value)}
                  className="sheikh-select"
                >
                  <option value="SALES_REP">مندوب المبيعات الميداني</option>
                  <option value="ACCOUNTANT">مسؤول الحسابات والتحصيل</option>
                  <option value="FOLLOW_UP">موظف المتابعة والتنسيق</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">الموظف المعني <span className="req-star">*</span></label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                  className="sheikh-select"
                  required
                >
                  <option value="">-- اختر الموظف --</option>
                  {employeesList.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.job_title || emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">سبب التعيين / التعديل</label>
                <input
                  type="text"
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  className="sheikh-input"
                  placeholder="مثال: إعادة توزيع خطوط السير الجغرافية"
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-gold" disabled={isAssigning}>
                  {isAssigning ? 'جاري الحفظ...' : 'تأكيد الإسناد'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setIsAssignModalOpen(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Interaction */}
      {isInteractionModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInteractionModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">تسجيل زيارة أو تفاعل جديد للعميل</h3>
              <button onClick={() => setIsInteractionModalOpen(false)} className="modal-close-btn">
                <AlertCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleInteractionSubmit} className="modal-form-grid">
              <div className="form-group">
                <label className="form-label">نوع التفاعل <span className="req-star">*</span></label>
                <select
                  value={newInteractionType}
                  onChange={(e: any) => setNewInteractionType(e.target.value)}
                  className="sheikh-select"
                >
                  <option value="VISIT">زيارة ميدانية</option>
                  <option value="CALL">مكالمة هاتفية</option>
                  <option value="FOLLOW_UP">متابعة تحصيل</option>
                  <option value="NOTE">ملاحظة</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">البيان والملاحظات <span className="req-star">*</span></label>
                <textarea
                  value={newInteractionNotes}
                  onChange={(e) => setNewInteractionNotes(e.target.value)}
                  className="sheikh-textarea"
                  rows={3}
                  placeholder="تفاصيل المقابلة، الطلبات، أو ملاحظات التحصيل..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">تاريخ المتابعة القادمة (اختياري)</label>
                <input
                  type="date"
                  value={newFollowUpDate}
                  onChange={(e) => setNewFollowUpDate(e.target.value)}
                  className="sheikh-input"
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-gold" disabled={isAddingInteraction}>
                  {isAddingInteraction ? 'جاري الحفظ...' : 'تسجيل التفاعل'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setIsInteractionModalOpen(false)}>
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

