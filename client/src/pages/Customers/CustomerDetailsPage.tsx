import React, { useState, useEffect, useMemo } from 'react';
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
  FileSpreadsheet,
  MessageSquare,
  Trash,
  Bell,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  StickyNote,
  X,
  Download,
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

const MONTH_KEYS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export const CustomerDetailsPage: React.FC<CustomerDetailsPageProps> = ({
  customerId,
  onNavigate,
}) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'statement' | 'invoices' | 'payments' | 'interactions' | 'notes' | 'customer_service'>('statement');
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
  const [expandedMonthIdx, setExpandedMonthIdx] = useState<number | null>(null);

  // Payments Tab State
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isPaymentsLoading, setIsPaymentsLoading] = useState(false);

  // Interactions / Notes Tab State
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [isInteractionsLoading, setIsInteractionsLoading] = useState(false);
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [newInteractionType, setNewInteractionType] = useState<InteractionType>('VISIT');
  const [newInteractionSummary, setNewInteractionSummary] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState('');
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);

  // Follow-up Notes State (notes tab) — with date + payment method
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteDate, setNewNoteDate] = useState('');
  const [newNotePaymentMethod, setNewNotePaymentMethod] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState<number | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  // Customer Service Notes State
  const [csAgentName, setCsAgentName] = useState('');
  const [csAgentPhone, setCsAgentPhone] = useState('');
  const [csNoteDate, setCsNoteDate] = useState('');
  const [csNoteText, setCsNoteText] = useState('');
  const [isAddingCsNote, setIsAddingCsNote] = useState(false);
  const [isDeletingCsNote, setIsDeletingCsNote] = useState<number | null>(null);

  // Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignType, setAssignType] = useState<AssignmentType>('SALES_REP');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [assignReason, setAssignReason] = useState('');
  const [employeesList, setEmployeesList] = useState<SystemUser[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<{ id: number; type: 'success' | 'warn' | 'error'; msg: string }[]>([]);
  let toastIdRef = 0;

  const showToast = (type: 'success' | 'warn' | 'error', msg: string) => {
    const id = ++toastIdRef;
    setToasts((prev) => [...prev, { id, type, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  // Overdue detection
  const isOverdue = useMemo(() => {
    if (!customer || !customer.current_balance || customer.current_balance <= 0) return false;
    if (!customer.last_order_date) return false;
    const daysSince = Math.floor(
      (Date.now() - new Date(customer.last_order_date).getTime()) / 86400000
    );
    return daysSince > (customer.payment_terms_days || 30);
  }, [customer]);

  const daysOverdue = useMemo(() => {
    if (!customer?.last_order_date) return 0;
    const daysSince = Math.floor(
      (Date.now() - new Date(customer.last_order_date).getTime()) / 86400000
    );
    return Math.max(0, daysSince - (customer.payment_terms_days || 30));
  }, [customer]);

  // Group invoices by month for the monthly breakdown
  const invoicesByMonth = useMemo(() => {
    const map: Record<number, Invoice[]> = {};
    invoices.forEach((inv) => {
      if (!inv.invoice_date) return;
      const m = new Date(inv.invoice_date).getMonth(); // 0-based
      if (!map[m]) map[m] = [];
      map[m].push(inv);
    });
    return map;
  }, [invoices]);

  const monthlyTotals = useMemo(() => {
    return MONTH_KEYS.map((_: string, idx: number) => {
      const monthInvoices = invoicesByMonth[idx] || [];
      return monthInvoices.reduce((sum: number, inv: Invoice) => sum + Number(inv.total || 0), 0);
    });
  }, [invoicesByMonth]);

  const annualTotal = useMemo(() => monthlyTotals.reduce((s: number, v: number) => s + v, 0), [monthlyTotals]);

  // Notes are interactions of type 'NOTE'
  const notes = useMemo(
    () => interactions.filter((i) => i.interaction_type === 'NOTE'),
    [interactions]
  );
  const csNotes = useMemo(
    () => interactions.filter((i) => i.interaction_type === 'CUSTOMER_SERVICE'),
    [interactions]
  );
  const nonNoteInteractions = useMemo(
    () => interactions.filter((i) => i.interaction_type !== 'NOTE' && i.interaction_type !== 'CUSTOMER_SERVICE'),
    [interactions]
  );

  // Initial fetch
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
    setExpandedMonthIdx(monthNum - 1);
    const mStr = String(monthNum).padStart(2, '0');
    const start = `${selectedYear}-${mStr}-01`;
    const lastDay = new Date(selectedYear, monthNum, 0).getDate();
    const end = `${selectedYear}-${mStr}-${String(lastDay).padStart(2, '0')}`;
    setStartDate(start);
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
      const res = await invoiceService.getInvoices({ customer_id: customerId, limit: 200 });
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
    fetchInvoices();
    fetchInteractions();
  }, [customerId]);

  useEffect(() => {
    if (activeTab === 'statement') fetchStatement();
    else if (activeTab === 'invoices') fetchInvoices();
    else if (activeTab === 'payments') fetchPayments();
    else if (activeTab === 'interactions' || activeTab === 'notes' || activeTab === 'customer_service') fetchInteractions();
  }, [activeTab, customerId]);

  // Overdue notification on load
  useEffect(() => {
    if (isOverdue && customer) {
      showToast(
        'warn',
        `تنبيه: العميل ${customer.name} لم يسدد المديونية منذ ${daysOverdue} يوم إضافياً عن موعد الاستحقاق`
      );
    }
  }, [isOverdue]);

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
      showToast('success', 'تم إسناد الموظف بنجاح');
    } catch (err) {
      showToast('error', 'فشل عملية الإسناد');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleInteractionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInteractionSummary.trim()) {
      showToast('error', 'يرجى كتابة ملخص التفاعل');
      return;
    }

    try {
      setIsAddingInteraction(true);
      await interactionService.createInteraction({
        customer_id: customerId,
        interaction_type: newInteractionType,
        summary: newInteractionSummary,
        follow_up_date: newFollowUpDate || undefined,
      });
      setNewInteractionSummary('');
      setNewFollowUpDate('');
      setIsInteractionModalOpen(false);
      fetchInteractions();
      showToast('success', 'تم تسجيل التفاعل بنجاح');
    } catch (err) {
      showToast('error', 'فشل تسجيل التفاعل');
    } finally {
      setIsAddingInteraction(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    // Build rich summary: date + payment method + text
    const parts: string[] = [];
    if (newNoteDate) parts.push(`[تاريخ السداد: ${newNoteDate}]`);
    if (newNotePaymentMethod) parts.push(`[نوع العميل: ${newNotePaymentMethod}]`);
    parts.push(newNoteText.trim());
    const richSummary = parts.join(' — ');
    try {
      setIsAddingNote(true);
      await interactionService.createInteraction({
        customer_id: customerId,
        interaction_type: 'NOTE',
        summary: richSummary,
      });
      setNewNoteText('');
      setNewNoteDate('');
      setNewNotePaymentMethod('');
      fetchInteractions();
      showToast('success', 'تم إضافة الملاحظة');
    } catch {
      showToast('error', 'فشل إضافة الملاحظة');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleAddCsNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csNoteText.trim()) return;
    const parts: string[] = [];
    if (csAgentName) parts.push(`[اسم الموظف: ${csAgentName}]`);
    if (csAgentPhone) parts.push(`[رقم الهاتف: ${csAgentPhone}]`);
    if (csNoteDate) parts.push(`[التاريخ: ${csNoteDate}]`);
    parts.push(csNoteText.trim());
    const richSummary = parts.join(' — ');
    try {
      setIsAddingCsNote(true);
      await interactionService.createInteraction({
        customer_id: customerId,
        interaction_type: 'CUSTOMER_SERVICE' as InteractionType,
        summary: richSummary,
      });
      setCsAgentName('');
      setCsAgentPhone('');
      setCsNoteDate('');
      setCsNoteText('');
      fetchInteractions();
      showToast('success', 'تم إضافة ملاحظة خدمة العملاء');
    } catch {
      showToast('error', 'فشل إضافة الملاحظة');
    } finally {
      setIsAddingCsNote(false);
    }
  };

  const handleDeleteCsNote = async (interactionId: number) => {
    try {
      setIsDeletingCsNote(interactionId);
      await interactionService.deleteInteraction(customerId, interactionId);
      setInteractions((prev) => prev.filter((i) => i.id !== interactionId));
      showToast('success', 'تم حذف الملاحظة');
    } catch {
      showToast('error', 'فشل حذف الملاحظة');
    } finally {
      setIsDeletingCsNote(null);
    }
  };

  const handleDeleteNote = async (interactionId: number) => {
    try {
      setIsDeletingNote(interactionId);
      await interactionService.deleteInteraction(customerId, interactionId);
      setInteractions((prev) => prev.filter((i) => i.id !== interactionId));
      showToast('success', 'تم حذف الملاحظة');
    } catch {
      showToast('error', 'فشل حذف الملاحظة');
    } finally {
      setIsDeletingNote(null);
    }
  };

  const handleDeleteAllNotes = async () => {
    if (!confirmDeleteAll) {
      setConfirmDeleteAll(true);
      return;
    }
    try {
      setIsDeletingAll(true);
      await interactionService.deleteAllInteractions(customerId);
      setInteractions([]);
      setConfirmDeleteAll(false);
      showToast('success', 'تم حذف جميع الملاحظات');
    } catch {
      showToast('error', 'فشل حذف الملاحظات');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleExportStatementCSV = () => {
    if (!statementData || statementData.transactions.length === 0) {
      showToast('warn', 'لا توجد حركات لتصديرها في الفترة المحددة');
      return;
    }
    const headers = ['#', 'التاريخ', 'نوع الحركة', 'البيان والتفاصيل', 'مدين (+)', 'دائن (-)', 'الرصيد المتراكم'];
    const rows = statementData.transactions.map((tx, idx) => [
      idx + 1,
      `"${tx.transaction_date}"`,
      `"${tx.transaction_type}"`,
      `"${tx.description.replace(/"/g, '""')}"`,
      tx.debit || 0,
      tx.credit || 0,
      tx.running_balance || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `كشف_حساب_${customer?.name || 'عميل'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return Number(val || 0).toLocaleString('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ج.م';
  };

  const formatDate = (d?: string | null) => {
    if (!d) return '—';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d).split('T')[0];
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}/${m}/${day}`;
    } catch {
      return String(d) || '—';
    }
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

  // Assigned sales rep object
  const assignedRep = employeesList.find(
    (e) => e.id === customer.assigned_employee_id || e.full_name === customer.assigned_employee_name
  );

  return (
    <div className="customer-details-page">
      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.id} className={`toast-item toast-${t.type}`}>
              {t.type === 'warn' ? <AlertTriangle size={16} /> : t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{t.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Back Navigation Bar */}
      <div className="details-back-bar">
        {onNavigate && (
          <button onClick={() => onNavigate('/customers')} className="btn-back-link">
            <ArrowRight size={16} />
            <span>العودة لسجل العملاء</span>
          </button>
        )}
        {/* Overdue Alert Banner */}
        {isOverdue && (
          <div className="overdue-alert-banner">
            <AlertTriangle size={16} />
            <span>
              تجاوز موعد السداد — المديونية:{' '}
              <strong>{formatCurrency(customer.current_balance || 0)}</strong> — متأخر{' '}
              <strong>{daysOverdue} يوم</strong> عن تاريخ الاستحقاق
            </span>
          </div>
        )}
      </div>

      {/* Customer Header Summary Card */}
      <div className={`sheikh-card customer-master-header ${isOverdue ? 'header-overdue' : ''}`}>
        <div className="master-header-main">
          <div className={`master-avatar ${isOverdue ? 'avatar-overdue' : ''}`}>
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
              {isOverdue && (
                <span className="overdue-badge">
                  <AlertTriangle size={13} />
                  لم يسدد — {daysOverdue} يوم
                </span>
              )}
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
                  نوع العميل: {customer.payment_type === 'CREDIT' ? `آجل (${customer.payment_terms_days} يوم)` : 'نقدي'}
                </span>
              </span>
              <span className="meta-item">
                <User size={14} />
                <span>المندوب: {customer.assigned_employee_name || 'غير معين'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Sales Rep Info Box */}
        {(customer.assigned_employee_name || customer.accountant_name) && (
          <div className="rep-info-box">
            <div className="rep-info-header">
              <User size={15} />
              <span>فريق الخدمة المسؤول</span>
            </div>
            <div className="rep-info-grid">
              {customer.assigned_employee_name && (
                <div className="rep-card">
                  <span className="rep-role-lbl">مندوب المبيعات</span>
                  <span className="rep-name">{customer.assigned_employee_name}</span>
                  {assignedRep?.phone && (
                    <a href={`tel:${assignedRep.phone}`} className="rep-phone">
                      <Phone size={12} /> {assignedRep.phone}
                    </a>
                  )}
                </div>
              )}
              {customer.accountant_name && (
                <div className="rep-card">
                  <span className="rep-role-lbl">مسؤول الحسابات</span>
                  <span className="rep-name">{customer.accountant_name}</span>
                </div>
              )}
              {customer.follow_up_employee_name && (
                <div className="rep-card">
                  <span className="rep-role-lbl">موظف المتابعة</span>
                  <span className="rep-name">{customer.follow_up_employee_name}</span>
                </div>
              )}
            </div>
          </div>
        )}
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
          <span className="stat-sub">آخر سداد: {customer.last_payment_date ? formatDate(customer.last_payment_date) : '—'}</span>
        </div>

        <div className={`sheikh-card cust-stat-box ${isOverdue ? 'kpi-overdue' : ''}`}>
          <span className="stat-label">الرصيد الحالي (المديونية)</span>
          <div className={`stat-value ${(customer.current_balance || 0) > 0 ? 'text-amber' : 'text-success'}`}>
            {formatCurrency(customer.current_balance || 0)}
          </div>
          <span className="stat-sub">
            {isOverdue
              ? `⚠️ متأخر ${daysOverdue} يوم عن موعد السداد`
              : `الحد الائتماني: ${formatCurrency(customer.credit_limit || 0)}`}
          </span>
          {isOverdue && customer.last_order_date && (
            <span className="stat-sub text-danger">
              تاريخ آخر طلب: {formatDate(customer.last_order_date)} — استحقاق خلال {customer.payment_terms_days} يوم
            </span>
          )}
        </div>

        <div className="sheikh-card cust-stat-box">
          <span className="stat-label">متوسط قيمة الفاتورة</span>
          <div className="stat-value">{formatCurrency(customer.avg_invoice || 0)}</div>
          <span className="stat-sub">آخر طلب: {customer.last_order_date ? formatDate(customer.last_order_date) : '—'}</span>
        </div>
      </div>

      {/* Tabs Navigation Header */}
      <div className="details-tabs-header">
        <button
          className={`tab-link ${activeTab === 'statement' ? 'tab-link-active' : ''}`}
          onClick={() => setActiveTab('statement')}
        >
          <Receipt size={16} />
          <span>كشف الحساب الشهري</span>
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
          <span>سندات التحصيل</span>
        </button>
        <button
          className={`tab-link ${activeTab === 'interactions' ? 'tab-link-active' : ''}`}
          onClick={() => setActiveTab('interactions')}
        >
          <MessageSquare size={16} />
          <span>الزيارات والمتابعات</span>
        </button>
        <button
          className={`tab-link ${activeTab === 'notes' ? 'tab-link-active' : ''}`}
          onClick={() => setActiveTab('notes')}
        >
          <StickyNote size={16} />
          <span>خدمة العملاء{notes.length > 0 ? `(${notes.length})` : ''}</span>
        </button>
        <button
          className={`tab-link ${activeTab === 'customer_service' ? 'tab-link-active' : ''}`}
          onClick={() => setActiveTab('customer_service')}
        >
          <Bell size={16} />
          <span>ملاحظات المندوب{csNotes.length > 0 ? `(${csNotes.length})` : ''}</span>
        </button>
        <button
          className={`tab-link ${activeTab === 'overview' ? 'tab-link-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Building size={16} />
          <span>البيانات العامة</span>
        </button>
      </div>


      {/* TAB 1: STATEMENT (كشف الحساب الشهري) */}
      {activeTab === 'statement' && (
        <div className="tab-content-wrapper">
          {/* Annual Total Badge — shown prominently at TOP */}
          <div className="annual-total-header-card sheikh-card">
            <div className="annual-total-left">
              <FileSpreadsheet size={22} style={{ color: '#059669' }} />
              <div>
                <div className="annual-total-title">سجل مسحوبات العميل الشهرية لعام {selectedYear}</div>
                <div className="annual-total-sub">اضغط على أي شهر لعرض الفواتير المرتبطة به وتصفية كشف الحساب</div>
              </div>
            </div>
            <div className="annual-total-badge">
              <span className="annual-lbl">إجمالي مسحوبات {selectedYear}</span>
              <span className="annual-val">{formatCurrency(annualTotal)}</span>
              <span className="annual-count">{invoices.length} فاتورة</span>
            </div>
          </div>

          {/* 12-Month Grid */}
          <div className="sheikh-card monthly-grid-card">
            <div className="monthly-cards-grid">
              {ARABIC_MONTHS.map((mName, idx) => {
                const monthInvoices = invoicesByMonth[idx] || [];
                const monthTotal = monthlyTotals[idx] || 0;
                const isCurrent = selectedMonth === idx + 1;
                const isExpanded = expandedMonthIdx === idx;

                return (
                  <div
                    key={idx}
                    className={`month-cell ${isCurrent ? 'month-cell-active' : ''} ${monthTotal > 0 ? 'month-cell-has-data' : 'month-cell-empty'}`}
                    onClick={() => {
                      handleMonthlySelect(idx + 1);
                      setExpandedMonthIdx(isExpanded ? null : idx);
                    }}
                  >
                    <div className="month-cell-header">
                      <span className="month-cell-name">{mName}</span>
                      {monthInvoices.length > 0 && (
                        <span className="month-inv-count">{monthInvoices.length} فاتورة</span>
                      )}
                    </div>
                    <div className="month-cell-total">
                      {monthTotal > 0
                        ? Number(monthTotal).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0.00'}
                    </div>
                    <div className="month-cell-currency">ج.م</div>

                    {/* Expanded invoice list inside month cell */}
                    {isExpanded && monthInvoices.length > 0 && (
                      <div className="month-inv-list" onClick={(e) => e.stopPropagation()}>
                        {monthInvoices.map((inv) => (
                          <div key={inv.id} className="month-inv-item">
                            <span className="inv-num">{inv.invoice_number}</span>
                            <span className="inv-date">{inv.invoice_date}</span>
                            <span className="inv-amount font-bold">{formatCurrency(inv.total)}</span>
                            <span className={`inv-status-dot ${inv.payment_status}`}></span>
                          </div>
                        ))}
                      </div>
                    )}
                    {isExpanded && monthInvoices.length === 0 && (
                      <div className="month-no-inv">لا توجد فواتير</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statement Filters */}
          <div className="sheikh-card statement-filter-card">
            <div className="statement-controls-row">
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
                <button
                  onClick={handleExportStatementCSV}
                  className="btn-secondary align-self-end"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem' }}
                  title="تصدير كشف الحساب الحالي لملف Excel"
                >
                  <Download size={14} />
                  <span>تصدير كشف الحساب Excel</span>
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
                        <td>{formatDate(tx.transaction_date)}</td>
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
            <h3>سجل فواتير المبيعات الكامل</h3>
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
                      <th>تاريخ الإصدار</th>
                      <th>تاريخ الاستحقاق</th>
                      <th>نوع العميل</th>
                      <th>الإجمالي</th>
                      <th>المسدد</th>
                      <th>المتبقي</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const isInvOverdue =
                        inv.payment_status === 'OVERDUE' ||
                        (inv.due_date && new Date(inv.due_date) < new Date() && inv.payment_status !== 'PAID');
                      return (
                        <tr key={inv.id} className={isInvOverdue ? 'row-overdue' : ''}>
                          <td>
                            <span className="code-pill">{inv.invoice_number}</span>
                          </td>
                          <td>{formatDate(inv.invoice_date)}</td>
                          <td className={isInvOverdue ? 'text-danger font-bold' : ''}>
                            {inv.due_date ? formatDate(inv.due_date) : '—'}
                          </td>
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
                                ? 'متأخرة عن السداد'
                                : 'غير مدفوعة'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
                        <td>{formatDate(p.payment_date)}</td>
                        <td className="font-bold text-success">{formatCurrency(p.amount)}</td>
                        <td>
                          <span className="method-pill">
                            {p.payment_method === 'CASH'
                              ? 'نقدي'
                              : p.payment_method === 'INSTAPAY'
                              ? 'إنستاباي'
                              : p.payment_method === 'VODAFONE_CASH'
                              ? 'فودافون كاش'
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

      {/* TAB 4: INTERACTIONS (الزيارات والمتابعات) */}
      {activeTab === 'interactions' && (
        <div className="tab-content-wrapper">
          <div className="tab-header-actions-row">
            <h3>سجل الزيارات الميدانية والمتابعات</h3>
            <button
              onClick={() => setIsInteractionModalOpen(true)}
              className="btn-gold-small"
            >
              <PlusCircle size={15} />
              <span>تسجيل زيارة / متابعة</span>
            </button>
          </div>

          <div className="sheikh-card table-wrapper-card">
            {isInteractionsLoading ? (
              <div className="table-loading-box">جاري تحميل سجل التفاعلات...</div>
            ) : nonNoteInteractions.length > 0 ? (
              <div className="table-responsive">
                <table className="sheikh-table">
                  <thead>
                    <tr>
                      <th>التاريخ</th>
                      <th>نوع التفاعل</th>
                      <th>الموظف المسؤول</th>
                      <th>الملخص والبيان</th>
                      <th>تاريخ المتابعة القادمة</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonNoteInteractions.map((it) => (
                      <tr key={it.id}>
                        <td>{formatDate(it.interaction_date)}</td>
                        <td>
                          <span className={`method-pill`}>
                            {it.interaction_type === 'VISIT'
                              ? 'زيارة ميدانية'
                              : it.interaction_type === 'CALL'
                              ? 'مكالمة هاتفية'
                              : it.interaction_type === 'FOLLOW_UP'
                              ? 'متابعة تحصيل'
                              : 'ملاحظة'}
                          </span>
                        </td>
                        <td className="font-semibold">{it.employee_name || 'موظف النظام'}</td>
                        <td>{it.summary || it.notes}</td>
                        <td>
                          {(it as any).follow_up_date ? (
                            <span className="follow-up-date-badge">
                              <Calendar size={12} />
                              {formatDate((it as any).follow_up_date)}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          <span className={`status-pill ${(it as any).is_resolved ? 'status-ok' : 'status-muted'}`}>
                            {(it as any).is_resolved ? 'مكتملة' : 'قيد المتابعة'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-box">
                <MessageSquare size={36} className="empty-state-icon" />
                <h4>لا توجد زيارات أو متابعات مسجلة</h4>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: NOTES (ملاحظات المتابعة) */}
      {activeTab === 'notes' && (
        <div className="tab-content-wrapper">
          <div className="tab-header-actions-row">
            <h3>
              <StickyNote size={18} style={{ marginLeft: '6px', color: '#d97706' }} />
              ملاحظات متابعة العملاء
            </h3>
            {notes.length > 0 && (
              <button
                onClick={handleDeleteAllNotes}
                className={`btn-danger-small ${confirmDeleteAll ? 'btn-confirm-danger' : ''}`}
                disabled={isDeletingAll}
              >
                <Trash size={14} />
                <span>{confirmDeleteAll ? 'تأكيد حذف الكل' : 'حذف جميع الملاحظات'}</span>
              </button>
            )}
          </div>

          {/* Add New Note — with Date + Payment Method */}
          <div className="sheikh-card notes-add-card">
            <form onSubmit={handleAddNote} className="note-add-form">
              <div className="note-form-fields-row">
                <div className="note-form-field">
                  <label className="note-field-label">تاريخ السداد</label>
                  <input
                    type="date"
                    className="sheikh-input"
                    value={newNoteDate}
                    onChange={(e) => setNewNoteDate(e.target.value)}
                  />
                </div>
                <div className="note-form-field">
                  <label className="note-field-label">طريقة السداد</label>
                  <select
                    className="sheikh-select"
                    value={newNotePaymentMethod}
                    onChange={(e) => setNewNotePaymentMethod(e.target.value)}
                  >
                    <option value="">— اختر طريقة السداد —</option>
                    <option value="آجل">آجل (مديونية)</option>
                    <option value="نقدي">نقدي</option>
                    <option value="إنستاباي">إنستاباي</option>
                    <option value="فودافون كاش">فودافون كاش</option>
                    <option value="تحويل بنكي">تحويل بنكي</option>
                    <option value="شيك">شيك</option>
                  </select>
                </div>
              </div>
              <textarea
                className="sheikh-textarea note-textarea"
                placeholder="اكتب ملاحظة المتابعة هنا... (مثال: العميل وعد بالسداد في نهاية الأسبوع)"
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={3}
              />
              <button type="submit" className="btn-gold-small" disabled={isAddingNote || !newNoteText.trim()}>
                <PlusCircle size={15} />
                <span>{isAddingNote ? 'جاري الحفظ...' : '+ إضافة ملاحظة متابعة'}</span>
              </button>
            </form>
          </div>

          {/* Notes List */}
          {isInteractionsLoading ? (
            <div className="table-loading-box">جاري تحميل الملاحظات...</div>
          ) : notes.length > 0 ? (
            <div className="notes-list-grid">
              {notes.map((note) => (
                <div key={note.id} className="note-card">
                  <div className="note-card-header">
                    <div className="note-meta">
                      <span className="note-employee">{note.employee_name || 'موظف'}</span>
                      <span className="note-date">{formatDate(note.interaction_date)}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="note-delete-btn"
                      disabled={isDeletingNote === note.id}
                      title="حذف هذه الملاحظة"
                    >
                      {isDeletingNote === note.id ? '...' : <X size={14} />}
                    </button>
                  </div>
                  {/* Parse rich metadata embedded in summary */}
                  {(note.summary || note.notes || '').includes('[') ? (
                    <div className="note-meta-tags">
                      {(note.summary || note.notes || '').split(' — ').map((part, i) => {
                        if (part.startsWith('[تاريخ السداد:')) {
                          return <span key={i} className="note-tag note-tag-date"><Calendar size={11} /> {part.replace(/[\[\]]/g,'')}</span>;
                        }
                        if (part.startsWith('[نوع العميل:') || part.startsWith('[طريقة الدفع:')) {
                          return <span key={i} className="note-tag note-tag-method"><CreditCard size={11} /> {part.replace(/[\[\]]/g,'')}</span>;
                        }
                        return <div key={i} className="note-content">{part}</div>;
                      })}
                    </div>
                  ) : (
                    <div className="note-content">{note.summary || note.notes}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-box">
              <StickyNote size={36} className="empty-state-icon" />
              <h4>لا توجد ملاحظات متابعة مسجلة لهذا العميل</h4>
              <p>استخدم الحقل أعلاه لإضافة ملاحظة جديدة</p>
            </div>
          )}

          {confirmDeleteAll && (
            <div className="confirm-delete-banner">
              <AlertTriangle size={18} />
              <span>هل أنت متأكد من حذف جميع الملاحظات ({notes.length} ملاحظة)؟ هذا الإجراء لا يمكن التراجع عنه.</span>
              <button onClick={() => setConfirmDeleteAll(false)} className="btn-secondary" style={{ padding: '4px 12px' }}>
                إلغاء
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: CUSTOMER SERVICE NOTES (خدمة العملاء) */}
      {activeTab === 'customer_service' && (
        <div className="tab-content-wrapper">
          <div className="tab-header-actions-row">
            <h3>
              <Bell size={18} style={{ marginLeft: '6px', color: '#7c3aed' }} />
              ملاحظات خدمة العملاء
            </h3>
          </div>

          {/* Add Customer Service Note */}
          <div className="sheikh-card notes-add-card">
            <form onSubmit={handleAddCsNote} className="note-add-form">
              <div className="note-form-fields-row">
                <div className="note-form-field">
                  <label className="note-field-label">اسم المندوب</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    placeholder="اسم الموظف المسؤول"
                    value={csAgentName}
                    onChange={(e) => setCsAgentName(e.target.value)}
                  />
                </div>
                <div className="note-form-field">
                  <label className="note-field-label">رقم الهاتف</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    placeholder="01xxxxxxxxx"
                    value={csAgentPhone}
                    onChange={(e) => setCsAgentPhone(e.target.value)}
                  />
                </div>
                <div className="note-form-field">
                  <label className="note-field-label">التاريخ</label>
                  <input
                    type="date"
                    className="sheikh-input"
                    value={csNoteDate}
                    onChange={(e) => setCsNoteDate(e.target.value)}
                  />
                </div>
              </div>
              <textarea
                className="sheikh-textarea note-textarea"
                placeholder="اكتب ملاحظة المندوب هنا... (مثال: العميل تواصل للاستفسار عن موعد التسليم)"
                value={csNoteText}
                onChange={(e) => setCsNoteText(e.target.value)}
                rows={3}
              />
              <button type="submit" className="btn-gold-small" disabled={isAddingCsNote || !csNoteText.trim()}
                style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed' }}
              >
                <PlusCircle size={15} />
                <span>{isAddingCsNote ? 'جاري الحفظ...' : '+ إضافة ملاحظة خدمة العملاء'}</span>
              </button>
            </form>
          </div>

          {/* CS Notes List */}
          {isInteractionsLoading ? (
            <div className="table-loading-box">جاري تحميل الملاحظات...</div>
          ) : csNotes.length > 0 ? (
            <div className="notes-list-grid">
              {csNotes.map((note) => (
                <div key={note.id} className="note-card note-card-cs">
                  <div className="note-card-header">
                    <div className="note-meta">
                      <span className="note-employee cs-note-label">خدمة العملاء</span>
                      <span className="note-date">{formatDate(note.interaction_date)}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCsNote(note.id)}
                      className="note-delete-btn"
                      disabled={isDeletingCsNote === note.id}
                      title="حذف هذه الملاحظة"
                    >
                      {isDeletingCsNote === note.id ? '...' : <X size={14} />}
                    </button>
                  </div>
                  {/* Parse rich metadata */}
                  <div className="note-meta-tags">
                    {(note.summary || note.notes || '').split(' — ').map((part, i) => {
                      if (part.startsWith('[اسم الموظف:')) {
                        return <span key={i} className="note-tag note-tag-agent"><User size={11} /> {part.replace(/[\[\]]/g,'')}</span>;
                      }
                      if (part.startsWith('[رقم الهاتف:')) {
                        return <span key={i} className="note-tag note-tag-phone"><Phone size={11} /> {part.replace(/[\[\]]/g,'')}</span>;
                      }
                      if (part.startsWith('[التاريخ:')) {
                        return <span key={i} className="note-tag note-tag-date"><Calendar size={11} /> {part.replace(/[\[\]]/g,'')}</span>;
                      }
                      return <div key={i} className="note-content">{part}</div>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state-box">
              <Bell size={36} className="empty-state-icon" />
              <h4>لا توجد ملاحظات خدمة عملاء مسجلة</h4>
              <p>استخدم الحقل أعلاه لإضافة ملاحظة جديدة</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: OVERVIEW (البيانات العامة) */}
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
                <span className="field-label">نوع العميل:</span>
                <span className="field-value font-bold">
                  {customer.payment_type === 'CREDIT'
                    ? `آجل — سداد مؤجل (${customer.payment_terms_days} يوم)`
                    : 'نقدي — دفع فوري'}
                </span>
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
                <span className="field-value">{formatDate(customer.created_at)}</span>
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

      {/* Modal: Assign Employee */}
      {isAssignModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAssignModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">إسناد موظف للعميل ({customer.name})</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="modal-close-btn">
                <X size={18} />
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

      {/* Modal: Add Interaction/Visit */}
      {isInteractionModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInteractionModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">تسجيل زيارة أو متابعة جديدة</h3>
              <button onClick={() => setIsInteractionModalOpen(false)} className="modal-close-btn">
                <X size={18} />
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
                  <option value="NOTE">ملاحظة إدارية</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ملخص الزيارة / التفاعل <span className="req-star">*</span></label>
                <textarea
                  value={newInteractionSummary}
                  onChange={(e) => setNewInteractionSummary(e.target.value)}
                  className="sheikh-textarea"
                  rows={3}
                  placeholder="تفاصيل المقابلة، الطلبات، أو ملاحظات التحصيل..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} style={{ marginLeft: '4px' }} />
                  تاريخ المتابعة القادمة (اختياري)
                </label>
                <input
                  type="date"
                  value={newFollowUpDate}
                  onChange={(e) => setNewFollowUpDate(e.target.value)}
                  className="sheikh-input"
                />
                {newFollowUpDate && (
                  <span className="input-hint">
                    <Bell size={12} /> ستظهر تذكرة في لوحة التحكم عند اقتراب هذا التاريخ
                  </span>
                )}
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
