import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  X,
  Search,
  Download,
  Eye,
} from 'lucide-react';
import {
  EXCEL_CUSTOMERS_2026,
  MONTH_KEYS,
  MONTH_NAMES_AR,
} from '../../constants/monthlyData';
import { Invoice } from '../../types/financial';
import './MonthlyExcelSheetModal.css';

interface MonthlyExcelSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCustomerCode?: string;
  onViewCustomerDetails?: (customerId: number) => void;
  liveInvoices?: Invoice[];
}

export const MonthlyExcelSheetModal: React.FC<MonthlyExcelSheetModalProps> = ({
  isOpen,
  onClose,
  selectedCustomerCode,
  onViewCustomerDetails,
  liveInvoices = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Merge live invoices dynamically if any exist
  const customersData = useMemo(() => {
    return EXCEL_CUSTOMERS_2026.map((c) => {
      const custInvoices = liveInvoices.filter(
        (inv) =>
          inv.customer_id === c.id ||
          inv.customer_name === c.name ||
          inv.customer_code === c.code
      );

      if (custInvoices.length === 0) return c;

      const dynamicMonths = { ...c.months };
      custInvoices.forEach((inv) => {
        if (!inv.invoice_date) return;
        const m = new Date(inv.invoice_date).getMonth();
        const k = MONTH_KEYS[m];
        if (k) {
          dynamicMonths[k] = (dynamicMonths[k] || 0) + Number(inv.total || 0);
        }
      });

      return {
        ...c,
        months: dynamicMonths,
      };
    });
  }, [liveInvoices]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customersData;
    const q = searchTerm.toLowerCase().trim();
    return customersData.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.assigned_employee_name && c.assigned_employee_name.toLowerCase().includes(q))
    );
  }, [customersData, searchTerm]);

  // Calculate Column Totals
  const monthColumnTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    MONTH_KEYS.forEach((k) => {
      totals[k] = filteredCustomers.reduce((acc, c) => acc + (c.months[k] || 0), 0);
    });
    return totals;
  }, [filteredCustomers]);

  const grandTotal = useMemo(() => {
    return Object.values(monthColumnTotals).reduce((sum, v) => sum + v, 0);
  }, [monthColumnTotals]);

  const totalOutstandingBalance = useMemo(() => {
    return filteredCustomers.reduce((acc, c) => acc + (c.balance || 0), 0);
  }, [filteredCustomers]);

  // Export CSV with UTF-8 BOM for Excel
  const handleExportCSV = () => {
    const headers = [
      'كود العميل',
      'اسم المنشأة والعميل',
      'الرصيد القائم (ج.م)',
      ...MONTH_NAMES_AR,
      'إجمالي السنة 2026 (ج.م)',
      'المدينة',
      'المندوب المسؤول'
    ];

    const rows = filteredCustomers.map((c) => {
      const annualSum = MONTH_KEYS.reduce((sum, k) => sum + (c.months[k] || 0), 0);
      return [
        `"${c.code}"`,
        `"${c.name.replace(/"/g, '""')}"`,
        c.balance.toFixed(2),
        ...MONTH_KEYS.map((k) => (c.months[k] || 0).toFixed(2)),
        annualSum.toFixed(2),
        `"${c.city || ''}"`,
        `"${c.assigned_employee_name || ''}"`
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `كشف_مسحوبات_العملاء_2026_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatMoney = (val: number) => {
    if (!val || val === 0) return '0.00';
    return Number(val).toLocaleString('ar-EG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="excel-modal-overlay" onClick={onClose}>
      <div className="excel-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="excel-modal-header">
          <div className="excel-header-title-group">
            <div className="excel-icon-wrapper">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="excel-title-main">كشف حسابات مسحوبات العملاء الشهرية لعام 2026</h2>
              <p className="excel-title-sub">
                مطابقة تفصيلية لدفاتر الحسابات والشيت المعتمد (18 عميل رئيسي)
              </p>
            </div>
          </div>

          <div className="excel-header-actions">
            <button
              onClick={handleExportCSV}
              className="btn-excel-action"
              title="تصدير شيت Excel (CSV معتمد)"
            >
              <Download size={16} />
              <span>تصدير شيت Excel</span>
            </button>
            <button onClick={onClose} className="excel-close-btn" title="إغلاق">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="excel-controls-bar">
          <div className="excel-search-box">
            <Search size={15} />
            <input
              type="text"
              className="excel-search-input"
              placeholder="بحث باسم العميل، الكود، المحافظة، أو المندوب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="excel-quick-stats">
            <span className="excel-stat-pill">
              عدد العملاء: <strong>{filteredCustomers.length}</strong>
            </span>
            <span className="excel-stat-pill">
              إجمالي المديونية القائمة: <strong>{formatMoney(totalOutstandingBalance)} ج.م</strong>
            </span>
            <span className="excel-stat-pill">
              إجمالي مسحوبات 2026: <strong style={{ color: '#059669' }}>{formatMoney(grandTotal)} ج.م</strong>
            </span>
          </div>
        </div>

        {/* Table Area */}
        <div className="excel-table-scroll-area">
          <table className="sheikh-excel-table">
            <thead>
              <tr>
                <th className="sticky-code-col">كود</th>
                <th className="sticky-name-col">اسم المنشأة والعميل</th>
                <th>الرصيد القائم</th>
                {MONTH_NAMES_AR.map((m, idx) => (
                  <th key={idx} className="month-header-col">{m}</th>
                ))}
                <th className="annual-sum-col">إجمالي السنة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => {
                const isSelected = selectedCustomerCode && (c.code === selectedCustomerCode || String(c.id) === selectedCustomerCode);
                const annualCustomerSum = MONTH_KEYS.reduce((sum, k) => sum + (c.months[k] || 0), 0);

                return (
                  <tr key={c.id} className={isSelected ? 'row-focused' : ''}>
                    <td className="sticky-code-col">
                      <span className="excel-code-badge">{c.code}</span>
                    </td>
                    <td className="sticky-name-col">
                      <strong>{c.name}</strong>
                    </td>
                    <td className="excel-money-cell" style={{ color: '#b91c1c', fontWeight: 700 }}>
                      {formatMoney(c.balance)}
                    </td>
                    {MONTH_KEYS.map((k, idx) => {
                      const val = c.months[k] || 0;
                      return (
                        <td
                          key={idx}
                          className={`excel-money-cell ${val > 0 ? '' : 'excel-money-zero'}`}
                        >
                          {formatMoney(val)}
                        </td>
                      );
                    })}
                    <td className="annual-sum-col excel-money-cell">
                      {formatMoney(annualCustomerSum)}
                    </td>
                    <td>
                      {onViewCustomerDetails && (
                        <button
                          onClick={() => {
                            onClose();
                            onViewCustomerDetails(c.id);
                          }}
                          className="btn-row-action"
                          title="عرض الملف التفصيلي للعميل"
                        >
                          <Eye size={13} style={{ marginLeft: '4px' }} />
                          الملف
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="excel-table-foot">
              <tr>
                <td className="sticky-code-col">المجموع</td>
                <td className="sticky-name-col">إجمالي مسحوبات كل الشهور</td>
                <td className="excel-money-cell" style={{ color: '#fca5a5' }}>
                  {formatMoney(totalOutstandingBalance)}
                </td>
                {MONTH_KEYS.map((k, idx) => (
                  <td key={idx} className="excel-money-cell">
                    {formatMoney(monthColumnTotals[k])}
                  </td>
                ))}
                <td className="annual-sum-col excel-money-cell" style={{ background: '#059669', color: '#ffffff' }}>
                  {formatMoney(grandTotal)}
                </td>
                <td>—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
