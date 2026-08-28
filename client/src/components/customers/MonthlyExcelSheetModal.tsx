import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  EXCEL_CUSTOMERS_2026,
  MonthlyCustomerData,
  MONTH_NAMES_AR,
  MONTH_KEYS,
} from '../../constants/monthlyData';
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
  const [activeCustomer, setActiveCustomer] = useState<MonthlyCustomerData | null>(() => {
    if (selectedCustomerCode) {
      return (
        EXCEL_CUSTOMERS_2026.find(
          (c) => c.code === selectedCustomerCode || String(c.id) === selectedCustomerCode
        ) || null
      );
    }
    return null;
  });
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(0);

  if (!isOpen) return null;

  // Filter customers by search
  const filteredCustomers = EXCEL_CUSTOMERS_2026.filter((c) => {
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

  const currentCustomer = activeCustomer || filteredCustomers[0];

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
              <h2 className="excel-title">متابعة حسابات العملاء الشهري</h2>
              <span className="excel-subtitle">
                سجل الحركات والمعاملات المالية الشهرية لجميع العملاء خلال عام 2026
              </span>
            </div>
          </div>

          <div className="excel-header-actions">
            <button
              onClick={handleExportCSV}
              className="btn-excel-action"
              title="تصدير شيت Excel (CSV)"
            >
              <Download size={16} />
              <span>تصدير Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-excel-action"
              title="طباعة الشيت"
            >
              <Printer size={16} />
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
              {MONTH_NAMES_AR[monthlyTotals.indexOf(Math.max(...monthlyTotals))]}
            </div>
            <span className="metric-sub">{formatEGP(Math.max(...monthlyTotals))}</span>
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
            <span>اضغط على أي عميل في الجدول لعرض كشف حسابه الشهري المنفرد</span>
          </div>
        </div>

        {/* Main Excel Table Wrapper */}
        <div className="excel-table-scroll-container">
          <table className="sheikh-excel-grid">
            <thead>
              <tr className="excel-main-header-row">
                <th className="sticky-col col-code">كود العميل</th>
                <th className="sticky-col col-name">اسم العميل</th>
                <th className="col-balance">الرصيد</th>
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
              {filteredCustomers.map((c, rowIdx) => {
                const rowAnnualTotal = MONTH_KEYS.reduce(
                  (sum, k) => sum + (c.months[k] || 0),
                  0
                );
                const isSelected = activeCustomer?.code === c.code;

                return (
                  <tr
                    key={c.code}
                    className={`excel-row ${isSelected ? 'excel-row-selected' : ''} ${
                      rowIdx % 2 === 1 ? 'excel-row-alt' : ''
                    }`}
                    onClick={() => setActiveCustomer(c)}
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
                          setActiveCustomer(c);
                        }}
                        className="btn-inspect-customer"
                        title="عرض كشف الشهور المفصل"
                      >
                        <Eye size={14} />
                        <span>كشف الحساب</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
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
                    style={{ padding: '8px 12px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
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
                  تفاصيل شهر {MONTH_NAMES_AR[selectedMonthIndex]} 2026 للعميل {currentCustomer.name}
                </span>
              </div>

              <div className="deep-dive-details-box">
                <div className="detail-item">
                  <span className="label">قيمة المسحوبات المعتمدة:</span>
                  <span className="value font-bold text-gold-dark">
                    {formatEGP(currentCustomer.months[MONTH_KEYS[selectedMonthIndex]] || 0)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">حالة المطابقة المالية:</span>
                  <span className="value text-success font-semibold">
                    مطابق مع السجل العام لمؤسسة الشيخ
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
