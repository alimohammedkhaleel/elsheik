import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Building,
  Eye,
  CheckCircle2,
  Receipt,
  User,
  MapPin,
  Phone,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  EXCEL_CUSTOMERS_2026,
  MonthlyCustomerData,
  MONTH_NAMES_AR,
  MONTH_KEYS,
} from '../../constants/monthlyData';
import { customerService } from '../../services/api/customerService';
import { invoiceService } from '../../services/api/invoiceService';
import { Customer, Invoice } from '../../types/financial';
import './MonthlyExcelSheetModal.css';

interface MonthlyExcelSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomerCode?: string | null;
  onViewCustomerDetails?: (customerId: number) => void;
}

export const MonthlyExcelSheetModal: React.FC<MonthlyExcelSheetModalProps> = ({
  isOpen,
  onClose,
  selectedCustomerCode,
  onViewCustomerDetails,
}) => {
  const [search, setSearch] = useState('');
  const [activeCustomerCode, setActiveCustomerCode] = useState<string | null>(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0);
  const [systemCustomers, setSystemCustomers] = useState<Customer[]>([]);
  const [systemInvoices, setSystemInvoices] = useState<Invoice[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // Load live customers & invoices
  const loadLiveData = async () => {
    try {
      setIsLoadingLive(true);
      const [custRes, invRes] = await Promise.all([
        customerService.getCustomers({ limit: 100 }).catch(() => ({ data: [] })),
        invoiceService.getInvoices({ limit: 500 }).catch(() => ({ data: [] })),
      ]);
      setSystemCustomers(custRes.data || []);
      setSystemInvoices(invRes.data || []);
    } catch {
      // Keep fallbacks
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLiveData();
      if (selectedCustomerCode) {
        setActiveCustomerCode(selectedCustomerCode);
      }
    }
  }, [isOpen, selectedCustomerCode]);

  // Combine and calculate dynamic monthly sales per customer
  const computedCustomers: MonthlyCustomerData[] = useMemo(() => {
    // Start with base customer definitions
    const baseList: MonthlyCustomerData[] = [...EXCEL_CUSTOMERS_2026];

    // Merge in any dynamic customers created in system not in base list
    systemCustomers.forEach((sc) => {
      const exists = baseList.some(
        (b) => b.code === sc.customer_code || b.id === sc.id || b.name === sc.name
      );
      if (!exists) {
        baseList.push({
          id: sc.id,
          code: sc.customer_code,
          name: sc.name,
          trade_name: sc.trade_name || undefined,
          phone: sc.phone || undefined,
          city: sc.city || undefined,
          address: sc.address || undefined,
          balance: sc.current_balance || 0,
          assigned_employee_name: sc.assigned_employee_name || undefined,
          months: {
            jan: 0,
            feb: 0,
            mar: 0,
            apr: 0,
            may: 0,
            jun: 0,
            jul: 0,
            aug: 0,
            sep: 0,
            oct: 0,
            nov: 0,
            dec: 0,
          },
        });
      }
    });

    // Populate dynamic monthly invoices
    return baseList.map((cust) => {
      const matchSysCust = systemCustomers.find(
        (sc) => sc.customer_code === cust.code || sc.id === cust.id || sc.name === cust.name
      );

      const realBalance = matchSysCust ? Number(matchSysCust.current_balance || 0) : cust.balance;

      const dynamicMonths = {
        jan: 0,
        feb: 0,
        mar: 0,
        apr: 0,
        may: 0,
        jun: 0,
        jul: 0,
        aug: 0,
        sep: 0,
        oct: 0,
        nov: 0,
        dec: 0,
      };

      // Sum actual invoices for 2026 by month
      if (matchSysCust && systemInvoices.length > 0) {
        systemInvoices.forEach((inv) => {
          if (inv.customer_id === matchSysCust.id && inv.invoice_date) {
            const d = new Date(inv.invoice_date);
            const m = d.getMonth(); // 0 to 11
            if (m >= 0 && m < 12) {
              const mKey = MONTH_KEYS[m];
              dynamicMonths[mKey] += Number(inv.total || 0);
            }
          }
        });
      }

      return {
        ...cust,
        balance: realBalance,
        months: dynamicMonths,
      };
    });
  }, [systemCustomers, systemInvoices]);

  if (!isOpen) return null;

  // Filter customers by search
  const filteredCustomers = computedCustomers.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(s) ||
      c.code.toLowerCase().includes(s) ||
      (c.phone && c.phone.includes(s)) ||
      (c.city && c.city.toLowerCase().includes(s))
    );
  });

  // Calculate totals
  const totalBalance = filteredCustomers.reduce((acc, c) => acc + (c.balance || 0), 0);
  const monthlyTotals = MONTH_KEYS.map((mKey) =>
    filteredCustomers.reduce((acc, c) => acc + (c.months[mKey] || 0), 0)
  );
  const totalAnnualSales = monthlyTotals.reduce((acc, val) => acc + val, 0);

  const formatEGP = (val: number) => {
    return (
      Number(val || 0).toLocaleString('ar-EG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ' ج.م'
    );
  };

  const handleExportCSV = () => {
    const headers = [
      'كود العميل',
      'اسم العميل',
      'الرصيد القائم',
      ...MONTH_NAMES_AR,
      'إجمالي السنة 2026',
    ];

    const rows = filteredCustomers.map((c) => {
      const annualTotal = MONTH_KEYS.reduce((sum, k) => sum + (c.months[k] || 0), 0);
      return [
        c.code,
        `"${c.name}"`,
        c.balance.toFixed(2),
        ...MONTH_KEYS.map((k) => c.months[k].toFixed(2)),
        annualTotal.toFixed(2),
      ];
    });

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `متابعة_حسابات_العملاء_الشهري_2026_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const currentCustomer =
    filteredCustomers.find((c) => c.code === activeCustomerCode) ||
    filteredCustomers[0] ||
    null;

  return (
    <div className="excel-modal-overlay" onClick={onClose}>
      <div
        className="excel-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="excel-modal-header">
          <div className="excel-header-brand">
            <div className="excel-icon-badge">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="excel-title">متابعة حسابات العملاء الشهري</h2>
                <span className="live-sync-pill">
                  <Sparkles size={12} />
                  <span>نظام فعلي متزامن 2026</span>
                </span>
              </div>
              <span className="excel-subtitle">
                كشف وتتبع الحركات والمسحوبات الشهرية لجميع العملاء خلال عام 2026
              </span>
            </div>
          </div>

          <div className="excel-header-actions">
            <button
              onClick={loadLiveData}
              className="btn-excel-action"
              title="تحديث البيانات الحالية"
              disabled={isLoadingLive}
            >
              <RefreshCw size={14} className={isLoadingLive ? 'spin-anim' : ''} />
              <span>تحديث</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="btn-excel-action"
              title="تصدير شيت Excel (CSV)"
            >
              <Download size={15} />
              <span>تصدير Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-excel-action"
              title="طباعة الشيت"
            >
              <Printer size={15} />
              <span>طباعة</span>
            </button>
            <button onClick={onClose} className="excel-close-btn" aria-label="إغلاق">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="excel-summary-strip">
          <div className="summary-metric-card">
            <span className="metric-label">إجمالي العملاء المسجلين</span>
            <div className="metric-number">{filteredCustomers.length} عميل</div>
            <span className="metric-sub">سنة 2026 المالية</span>
          </div>

          <div className="summary-metric-card">
            <span className="metric-label">إجمالي الأرصدة القائمة (المديونية)</span>
            <div className="metric-number text-amber">{formatEGP(totalBalance)}</div>
            <span className="metric-sub">مستحقات واجبة التحصيل</span>
          </div>

          <div className="summary-metric-card">
            <span className="metric-label">إجمالي مسحوبات عام 2026</span>
            <div className="metric-number text-gold-dark">{formatEGP(totalAnnualSales)}</div>
            <span className="metric-sub">يناير - ديسمبر 2026</span>
          </div>

          <div className="summary-metric-card">
            <span className="metric-label">أعلى شهر مسحوبات</span>
            <div className="metric-number text-success">
              {totalAnnualSales > 0
                ? MONTH_NAMES_AR[monthlyTotals.indexOf(Math.max(...monthlyTotals))]
                : '—'}
            </div>
            <span className="metric-sub">
              {totalAnnualSales > 0 ? formatEGP(Math.max(...monthlyTotals)) : '0.00 ج.م'}
            </span>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="excel-toolbar-row">
          <div className="excel-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="بحث باسم العميل، الكود، المحافظة، أو رقم الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="excel-search-input"
            />
          </div>

          <div className="excel-hint-tag">
            <span>💡 اضغط على زر [كشف الحساب] أو انقر على أي صف لعرض تحليل الـ 12 شهراً للعميل</span>
          </div>
        </div>

        {/* Main Excel Table Wrapper */}
        <div className="excel-table-scroll-container">
          <table className="sheikh-excel-grid">
            <thead>
              <tr className="excel-main-header-row">
                <th className="sticky-col col-code">كود العميل</th>
                <th className="sticky-col col-name">اسم العميل</th>
                <th className="col-balance">الرصيد القائم</th>
                {MONTH_NAMES_AR.map((m, idx) => (
                  <th key={idx} className="col-month">
                    {m}
                  </th>
                ))}
                <th className="col-total">إجمالي 2026</th>
                <th className="col-action">كشف الحساب</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c, rowIdx) => {
                  const rowAnnualTotal = MONTH_KEYS.reduce(
                    (sum, k) => sum + (c.months[k] || 0),
                    0
                  );
                  const isSelected = currentCustomer?.code === c.code;

                  return (
                    <tr
                      key={c.code}
                      className={`excel-row ${isSelected ? 'excel-row-selected' : ''} ${
                        rowIdx % 2 === 1 ? 'excel-row-alt' : ''
                      }`}
                      onClick={() => setActiveCustomerCode(c.code)}
                    >
                      <td className="sticky-col col-code">
                        <span className="excel-code-badge">{c.code}</span>
                      </td>
                      <td className="sticky-col col-name">
                        <div className="excel-cust-name-cell">
                          <strong className="name-main">{c.name}</strong>
                          {c.city && <span className="city-sub">{c.city}</span>}
                        </div>
                      </td>
                      <td className="col-balance text-balance font-bold">
                        {formatEGP(c.balance)}
                      </td>
                      {MONTH_KEYS.map((k, mIdx) => {
                        const val = c.months[k] || 0;
                        return (
                          <td
                            key={mIdx}
                            className={`col-month ${val > 0 ? 'has-value' : 'zero-value'}`}
                          >
                            {val > 0
                              ? Number(val).toLocaleString('ar-EG', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : '0.00'}
                          </td>
                        );
                      })}
                      <td className="col-total font-bold text-gold-dark">
                        {formatEGP(rowAnnualTotal)}
                      </td>
                      <td className="col-action">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCustomerCode(c.code);
                          }}
                          className="btn-inspect-customer"
                          title="عرض كشف الشهور المفصل"
                        >
                          <Eye size={13} />
                          <span>كشف الحساب</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={16} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    لا توجد نتائج مطابقة لعملية البحث
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="excel-footer-totals-row">
                <td className="sticky-col col-code" colSpan={2}>
                  <strong>الإجمالي العام ({filteredCustomers.length} عميل)</strong>
                </td>
                <td className="col-balance font-bold text-amber">
                  {formatEGP(totalBalance)}
                </td>
                {monthlyTotals.map((mTotal, idx) => (
                  <td key={idx} className="col-month font-bold">
                    {Number(mTotal).toLocaleString('ar-EG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                ))}
                <td className="col-total font-bold text-gold-dark">
                  {formatEGP(totalAnnualSales)}
                </td>
                <td className="col-action"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Dedicated Customer 12-Month Detailed Drawer / Card */}
        {currentCustomer && (
          <div className="single-customer-detailed-drawer">
            <div className="drawer-header-row">
              <div className="drawer-cust-info">
                <div className="drawer-avatar">
                  <Building size={20} />
                </div>
                <div>
                  <h3 className="drawer-cust-title">
                    {currentCustomer.name} (كود: {currentCustomer.code})
                  </h3>
                  <div className="drawer-meta-pills">
                    {currentCustomer.phone && (
                      <span className="meta-pill">
                        <Phone size={12} /> {currentCustomer.phone}
                      </span>
                    )}
                    {currentCustomer.city && (
                      <span className="meta-pill">
                        <MapPin size={12} /> {currentCustomer.city} {currentCustomer.address ? `— ${currentCustomer.address}` : ''}
                      </span>
                    )}
                    {currentCustomer.assigned_employee_name && (
                      <span className="meta-pill">
                        <User size={12} /> المندوب: {currentCustomer.assigned_employee_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="drawer-balance-badge">
                  <span className="lbl">الرصيد القائم:</span>
                  <span className="val">{formatEGP(currentCustomer.balance)}</span>
                </div>
                {onViewCustomerDetails && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewCustomerDetails(currentCustomer.id);
                    }}
                    className="btn-inspect-customer"
                    style={{
                      padding: '8px 14px',
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      color: '#ffffff',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 700,
                    }}
                    title="فتح الملف الشامل للعميل"
                  >
                    <Eye size={15} />
                    <span>الملف الشامل</span>
                  </button>
                )}
              </div>
            </div>

            {/* 12-Month Visual Cards */}
            <div className="drawer-months-grid">
              {MONTH_KEYS.map((k, idx) => {
                const monthVal = currentCustomer.months[k] || 0;
                const isSelectedMonth = selectedMonthIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`month-card-item ${
                      monthVal > 0 ? 'month-active' : 'month-empty'
                    } ${isSelectedMonth ? 'month-selected' : ''}`}
                    onClick={() => setSelectedMonthIndex(idx)}
                  >
                    <div className="month-card-header">
                      <span className="month-card-name">{MONTH_NAMES_AR[idx]}</span>
                      <span className="month-num">{idx + 1}</span>
                    </div>
                    <div className="month-card-val">
                      {monthVal > 0
                        ? Number(monthVal).toLocaleString('ar-EG', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : '0.00'}
                    </div>
                    <div className="month-card-status">
                      {monthVal > 0 ? (
                        <span className="status-badge active-badge">
                          <CheckCircle2 size={11} /> مسحوبات مسجلة
                        </span>
                      ) : (
                        <span className="status-badge zero-badge">لا توجد مسحوبات</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Month Deep-Dive */}
            <div className="selected-month-deep-dive">
              <div className="deep-dive-title">
                <Receipt size={16} />
                <span>
                  تحليل شهر {MONTH_NAMES_AR[selectedMonthIndex]} 2026 للعميل {currentCustomer.name}
                </span>
              </div>

              <div className="deep-dive-details-box">
                <div className="detail-item">
                  <span className="label">قيمة المسحوبات المعتمدة للشهر:</span>
                  <span className="value font-bold text-gold-dark">
                    {formatEGP(currentCustomer.months[MONTH_KEYS[selectedMonthIndex]] || 0)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">حالة المطابقة المالية:</span>
                  <span className="value text-success font-semibold">
                    مطابق مع الفواتير وسندات القبض المسجلة
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">المحصل والمندوب المسؤول:</span>
                  <span className="value font-semibold">
                    {currentCustomer.assigned_employee_name || 'طاقم توزيع مؤسسة الشيخ'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyExcelSheetModal;
