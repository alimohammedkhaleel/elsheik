import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Plus,
  PlusCircle,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Edit2,
} from 'lucide-react';
import { invoiceService } from '../../services/api/invoiceService';
import { customerService } from '../../services/api/customerService';
import { productService, Product } from '../../services/api/productService';
import { Invoice, Customer, PaymentType } from '../../types/financial';
import './InvoicesPage.css';

interface InvoicesPageProps {
  onNavigate?: (path: string) => void;
}

interface ItemRow {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({ onNavigate }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Create Invoice Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInvCustomer, setNewInvCustomer] = useState<string>('');
  const [newInvDate, setNewInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [newInvType, setNewInvType] = useState<PaymentType>('CREDIT');
  const [newInvTermsDays, setNewInvTermsDays] = useState(15);
  const [newInvNumber, setNewInvNumber] = useState('');
  const [newInvDiscount, setNewInvDiscount] = useState(0);
  const [newInvNotes, setNewInvNotes] = useState('');
  // Actual payment method (separate from CREDIT/CASH type)
  const [newInvPaymentMethod, setNewInvPaymentMethod] = useState<string>('CASH');
  const [newInvPaymentRef, setNewInvPaymentRef] = useState<string>('');

  // Items State
  const [items, setItems] = useState<ItemRow[]>([]);
  const [selectedProdId, setSelectedProdId] = useState<string>('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);
  const [itemDiscount, setItemDiscount] = useState(0);

  // Edit Invoice Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editPaymentType, setEditPaymentType] = useState<PaymentType>('CREDIT');
  const [editNotes, setEditNotes] = useState('');

  // Delete Invoice Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetInvoice, setDeleteTargetInvoice] = useState<Invoice | null>(null);

  // Feedback & Submitting
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      const res = await invoiceService.getInvoices({
        search: search || undefined,
        customer_id: selectedCustomerId ? parseInt(selectedCustomerId, 10) : undefined,
        payment_status: paymentStatus || undefined,
        payment_type: paymentType || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setInvoices(res.data || []);
      setTotalCount(res.total || 0);
    } catch {
      setFeedback({ type: 'error', text: 'فشل تحميل الفواتير من الخادم' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        customerService.getCustomers(),
        productService.getProducts(undefined, true),
      ]);
      setCustomers(custRes.data || []);
      setProducts(prodRes || []);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, selectedCustomerId, paymentStatus, paymentType, startDate, endDate]);

  useEffect(() => {
    fetchLookupData();
  }, []);

  const handleCustomerChange = (custIdStr: string) => {
    setNewInvCustomer(custIdStr);
    const found = customers.find((c) => c.id === parseInt(custIdStr, 10));
    if (found) {
      setNewInvType(found.payment_type);
      setNewInvTermsDays(found.payment_terms_days || (found.payment_type === 'CASH' ? 0 : 15));
    }
  };

  const handleProductSelect = (prodIdStr: string) => {
    setSelectedProdId(prodIdStr);
    const found = products.find((p) => p.id === parseInt(prodIdStr, 10));
    if (found) {
      setItemPrice(Number(found.selling_price) || 0);
    }
  };

  const handleAddItem = () => {
    if (!selectedProdId) return;
    const prod = products.find((p) => p.id === parseInt(selectedProdId, 10));
    if (!prod) return;

    const qty = Number(itemQty) || 1;
    const price = Number(itemPrice) || 0;
    const disc = Number(itemDiscount) || 0;
    const total = Math.max(0, qty * price - disc);

    setItems([
      ...items,
      {
        product_id: prod.id,
        product_name: prod.name,
        quantity: qty,
        unit_price: price,
        discount: disc,
        total,
      },
    ]);

    // Reset item form
    setSelectedProdId('');
    setItemQty(1);
    setItemPrice(0);
    setItemDiscount(0);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...items];
    updated.splice(index, 1);
    setItems(updated);
  };

  const subtotal = items.reduce((acc, it) => acc + it.total, 0);
  const netTotal = Math.max(0, subtotal - (Number(newInvDiscount) || 0));

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvCustomer) {
      setFeedback({ type: 'error', text: 'يرجى تحديد العميل' });
      return;
    }
    if (items.length === 0) {
      setFeedback({ type: 'error', text: 'يجب إضافة صنف واحد على الأقل في الفاتورة' });
      return;
    }

    setIsSubmitting(true);
    try {
      await invoiceService.createInvoice({
        invoice_number: newInvNumber.trim() || undefined,
        customer_id: parseInt(newInvCustomer, 10),
        invoice_date: newInvDate,
        payment_type: newInvType,
        payment_terms_days: Number(newInvTermsDays) || 0,
        discount: Number(newInvDiscount) || 0,
        notes: newInvNotes.trim() || undefined,
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount: it.discount,
        })),
      });

      setFeedback({ type: 'success', text: 'تم إنشاء الفاتورة وقيدها في حساب العميل بنجاح' });
      setIsModalOpen(false);
      // Reset form
      setNewInvCustomer('');
      setItems([]);
      setNewInvDiscount(0);
      setNewInvNotes('');
      setNewInvNumber('');
      setNewInvPaymentMethod('CASH');
      setNewInvPaymentRef('');
      fetchInvoices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل إنشاء الفاتورة';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditPaymentType(inv.payment_type || 'CREDIT');
    setEditNotes(inv.notes || '');
    setIsEditModalOpen(true);
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    setIsSubmitting(true);
    try {
      await invoiceService.updateInvoice(editingInvoice.id, {
        payment_type: editPaymentType,
        notes: editNotes.trim() || undefined,
      });
      setFeedback({ type: 'success', text: 'تم تعديل بيانات الفاتورة بنجاح' });
      setIsEditModalOpen(false);
      setEditingInvoice(null);
      fetchInvoices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تعديل الفاتورة';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (inv: Invoice) => {
    setDeleteTargetInvoice(inv);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteInvoice = async () => {
    if (!deleteTargetInvoice) return;
    setIsSubmitting(true);
    try {
      await invoiceService.deleteInvoice(deleteTargetInvoice.id);
      setFeedback({ type: 'success', text: `تم حذف الفاتورة #${deleteTargetInvoice.invoice_number} وإلغاء قيودها المحاسبية بنجاح` });
      setIsDeleteModalOpen(false);
      setDeleteTargetInvoice(null);
      fetchInvoices();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حذف الفاتورة';
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
    <div className="invoices-page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-main-title">سجل فواتير المبيعات المركزية</h1>
          <p className="page-sub-title">إصدار الفواتير، احتساب شروط السداد، وتوثيق القيود المحاسبية الذرية</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-gold">
          <Plus size={16} />
          <span>إنشاء فاتورة مبيعات</span>
        </button>
      </div>

      {/* Feedback Alerts */}
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
      <div className="sheikh-card invoices-filter-card">
        <div className="filter-grid-row">
          <div className="search-input-group">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="بحث برقم الفاتورة أو اسم العميل..."
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
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="sheikh-select"
          >
            <option value="">كافة حالات السداد</option>
            <option value="UNPAID">غير مدفوعة</option>
            <option value="PARTIALLY_PAID">مدفوعة جزئياً</option>
            <option value="PAID">مدفوعة بالكامل</option>
            <option value="OVERDUE">متأخرة عن الاستحقاق</option>
          </select>

          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="sheikh-select"
          >
            <option value="">نوع السداد (نقدي / آجل)</option>
            <option value="CASH">نقدي</option>
            <option value="CREDIT">آجل</option>
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

      {/* Invoices Table Card */}
      <div className="sheikh-card table-wrapper-card">
        <div className="table-header-info">
          <span className="results-count-badge">إجمالي الفواتير: {totalCount}</span>
        </div>

        {isLoading ? (
          <div className="table-loading-box">جاري تحميل الفواتير...</div>
        ) : invoices.length > 0 ? (
          <div className="table-responsive">
            <table className="sheikh-table">
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>اسم العميل</th>
                  <th>تاريخ الفاتورة</th>
                  <th>تاريخ الاستحقاق</th>
                  <th>نوع السداد</th>
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
                      <span className="code-pill">{inv.invoice_number}</span>
                    </td>
                    <td className="font-semibold">{inv.customer_name}</td>
                    <td>{inv.invoice_date}</td>
                    <td>{inv.due_date}</td>
                    <td>
                      <span className={`payment-type-badge ${inv.payment_type === 'CREDIT' ? 'badge-credit' : 'badge-cash'}`}>
                        {inv.payment_type === 'CREDIT' ? 'آجل' : 'نقدي'}
                      </span>
                    </td>
                    <td className="font-bold text-gold-dark">{formatCurrency(inv.total)}</td>
                    <td className="font-semibold text-success">{formatCurrency(inv.paid_amount || 0)}</td>
                    <td className={`font-semibold ${(inv.remaining_amount || inv.total) > 0 ? 'text-amber' : 'text-success'}`}>
                      {formatCurrency(inv.remaining_amount || inv.total)}
                    </td>
                    <td>
                      <span className={`invoice-status-pill status-${inv.payment_status}`}>
                        {inv.payment_status === 'PAID'
                          ? 'مدفوعة'
                          : inv.payment_status === 'PARTIALLY_PAID'
                          ? 'سداد جزئي'
                          : inv.payment_status === 'OVERDUE'
                          ? 'متأخرة'
                          : 'غير مسددة'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', alignItems: 'center' }}>
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate(`/customers/${inv.customer_id}`)}
                            className="btn-action-icon"
                            title="عرض كشف حساب العميل"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(inv)}
                          className="btn-action-icon"
                          title="تعديل بيانات الفاتورة"
                          style={{ color: '#d97706' }}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(inv)}
                          className="btn-action-icon"
                          title="حذف الفاتورة"
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
            <FileText size={40} className="empty-state-icon" />
            <h4>لا توجد فواتير مطابقة لمعايير البحث</h4>
            <p>يمكنك تغيير الفلاتر أو إنشاء فاتورة مبيعات جديدة.</p>
          </div>
        )}
      </div>

      {/* Modal: Create Invoice */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">إصدار فاتورة مبيعات جديدة</h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="modal-form-grid">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">
                    اختر العميل <span className="req-star">*</span>
                  </label>
                  <select
                    className="sheikh-select"
                    value={newInvCustomer}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    required
                  >
                    <option value="">-- اختر العميل --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customer_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">تاريخ الفاتورة</label>
                  <input
                    type="date"
                    className="sheikh-input"
                    value={newInvDate}
                    onChange={(e) => setNewInvDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">نوع العميل (آجل / نقدي)</label>
                  <select
                    className="sheikh-select"
                    value={newInvType}
                    onChange={(e) => setNewInvType(e.target.value as PaymentType)}
                  >
                    <option value="CREDIT">آجل مع فترة سداد (CREDIT)</option>
                    <option value="CASH">نقدي فوري (CASH)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">فترة السداد (أيام)</label>
                  <input
                    type="number"
                    className="sheikh-input"
                    value={newInvTermsDays}
                    onChange={(e) => setNewInvTermsDays(Number(e.target.value))}
                    disabled={newInvType === 'CASH'}
                    min={0}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">رقم الفاتورة (تلقائي إن ترك فارغاً)</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    placeholder="INV-XXXXX"
                    value={newInvNumber}
                    onChange={(e) => setNewInvNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment Method Row */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">طريقة السداد الفعلية</label>
                  <select
                    className="sheikh-select"
                    value={newInvPaymentMethod}
                    onChange={(e) => { setNewInvPaymentMethod(e.target.value); setNewInvPaymentRef(''); }}
                  >
                    <option value="CASH">نقدي</option>
                    <option value="INSTAPAY">إنستاباي</option>
                    <option value="VODAFONE_CASH">فودافون كاش</option>
                    <option value="WALLET">محفظة إلكترونية</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="NSP">شبكة NSP</option>
                    <option value="OTHER">أخرى</option>
                  </select>
                </div>

                {/* Show reference input for non-cash methods */}
                {['INSTAPAY','VODAFONE_CASH','WALLET','OTHER'].includes(newInvPaymentMethod) && (
                  <div className="form-group">
                    <label className="form-label">رقم المرجع / التحويل
                      <span style={{ fontWeight: 400, color: '#6b7280', fontSize: '0.78rem', marginRight: '4px' }}>
                        ({newInvPaymentMethod === 'INSTAPAY' ? 'رقم العملية / المحفظة' :
                          newInvPaymentMethod === 'VODAFONE_CASH' ? 'رقم المحفظة' :
                          newInvPaymentMethod === 'WALLET' ? 'رقم المحفظة' : 'تفاصيل إضافية'})
                      </span>
                    </label>
                    <input
                      type="text"
                      className="sheikh-input"
                      placeholder={newInvPaymentMethod === 'INSTAPAY' ? '01xxxxxxxxx@instapay' :
                        newInvPaymentMethod === 'VODAFONE_CASH' ? '01xxxxxxxxx' : 'رقم التحويل'}
                      value={newInvPaymentRef}
                      onChange={(e) => setNewInvPaymentRef(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Items Section */}
              <div className="invoice-items-builder-box">
                <h4 className="builder-title">بنود وأصناف الفاتورة</h4>

                <div className="item-input-row">
                  <div className="item-field-grow">
                    <label>المنتج / الصنف</label>
                    <select
                      className="sheikh-select"
                      value={selectedProdId}
                      onChange={(e) => handleProductSelect(e.target.value)}
                    >
                      <option value="">-- اختر المنتج --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.selling_price} ج.م / {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="item-field-sm">
                    <label>الكمية</label>
                    <input
                      type="number"
                      className="sheikh-input"
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      min={1}
                    />
                  </div>

                  <div className="item-field-sm">
                    <label>سعر الوحدة</label>
                    <input
                      type="number"
                      className="sheikh-input"
                      value={itemPrice}
                      onChange={(e) => setItemPrice(Number(e.target.value))}
                      min={0}
                    />
                  </div>

                  <div className="item-field-sm">
                    <label>خصم البند</label>
                    <input
                      type="number"
                      className="sheikh-input"
                      value={itemDiscount}
                      onChange={(e) => setItemDiscount(Number(e.target.value))}
                      min={0}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="btn-gold-small align-self-end mb-1"
                    disabled={!selectedProdId}
                  >
                    <PlusCircle size={15} />
                    <span>إضافة</span>
                  </button>
                </div>

                {/* Added items list */}
                {items.length > 0 && (
                  <div className="items-table-wrap">
                    <table className="items-mini-table">
                      <thead>
                        <tr>
                          <th>المنتج</th>
                          <th>الكمية</th>
                          <th>السعر</th>
                          <th>الخصم</th>
                          <th>الإجمالي</th>
                          <th>حذف</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((it, idx) => (
                          <tr key={idx}>
                            <td>{it.product_name}</td>
                            <td>{it.quantity}</td>
                            <td>{formatCurrency(it.unit_price)}</td>
                            <td>{formatCurrency(it.discount)}</td>
                            <td className="font-bold">{formatCurrency(it.total)}</td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="btn-remove-item"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Totals & Notes */}
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">ملاحظات الفاتورة</label>
                  <textarea
                    className="sheikh-textarea"
                    rows={2}
                    placeholder="ملاحظات التسليم أو شروط خاصة..."
                    value={newInvNotes}
                    onChange={(e) => setNewInvNotes(e.target.value)}
                  />
                </div>

                <div className="invoice-totals-box">
                  <div className="totals-row">
                    <span>المجموع الفرعي:</span>
                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>
                  <div className="totals-row">
                    <span>خصم إضافي:</span>
                    <input
                      type="number"
                      className="sheikh-input-sm"
                      value={newInvDiscount}
                      onChange={(e) => setNewInvDiscount(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                  <div className="totals-row row-net">
                    <span>صافي الفاتورة النهائي:</span>
                    <strong className="text-gold-dark font-extrabold">{formatCurrency(netTotal)}</strong>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-gold" disabled={isSubmitting || items.length === 0}>
                  {isSubmitting ? 'جاري الإصدار...' : 'إصدار الفاتورة وتثبيت القيد'}
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

      {/* Modal: Edit Invoice */}
      {isEditModalOpen && editingInvoice && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">تعديل بيانات الفاتورة #{editingInvoice.invoice_number}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateInvoice} className="modal-form-grid">
              <div className="form-group">
                <label className="form-label">العميل</label>
                <input
                  type="text"
                  className="sheikh-input"
                  value={editingInvoice.customer_name}
                  disabled
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">نوع السداد</label>
                  <select
                    className="sheikh-select"
                    value={editPaymentType}
                    onChange={(e) => setEditPaymentType(e.target.value as PaymentType)}
                  >
                    <option value="CREDIT">آجل</option>
                    <option value="CASH">نقدي</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">إجمالي الفاتورة (للقراءة فقط)</label>
                  <input
                    type="text"
                    className="sheikh-input font-bold"
                    value={formatCurrency(editingInvoice.total)}
                    disabled
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ملاحظات الفاتورة</label>
                <textarea
                  className="sheikh-textarea"
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="ملاحظات التسليم أو أي تعديلات..."
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

      {/* Modal: Delete Invoice Confirmation */}
      {isDeleteModalOpen && deleteTargetInvoice && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#dc2626' }}>
                <Trash2 size={22} />
                <h3 className="modal-title" style={{ color: '#dc2626' }}>تأكيد حذف الفاتورة</h3>
              </div>
              <button onClick={() => setIsDeleteModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 0', color: '#475569', fontSize: '0.92rem', lineHeight: 1.6 }}>
              هل أنت متأكد من رغبتك في حذف الفاتورة رقم <strong>#{deleteTargetInvoice.invoice_number}</strong> للعميل <strong>{deleteTargetInvoice.customer_name}</strong> بإجمالي <strong>{formatCurrency(deleteTargetInvoice.total)}</strong>؟
              <br />
              <small style={{ color: '#dc2626', display: 'block', marginTop: '0.5rem' }}>
                تنبيه: سيتم حذف أصناف الفاتورة وإلغاء القيد المالي المترتب عليها من كشف الحساب فورياً.
              </small>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteInvoice}
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
