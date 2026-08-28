import React, { useState, useEffect } from 'react';
import {
  Building,
  Search,
  Plus,
  UserCheck,
  Eye,
  X,
  CheckCircle2,
  AlertCircle,
  Package,
  Trash2,
  Edit2,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { customerService, CustomerFilters } from '../../services/api/customerService';
import { userService } from '../../services/api/userService';
import { productService, Product } from '../../services/api/productService';
import { invoiceService } from '../../services/api/invoiceService';
import { Customer, CustomerClassification, PaymentType } from '../../types/financial';
import { User } from '../../types/auth';
import { MonthlyExcelSheetModal } from '../../components/customers/MonthlyExcelSheetModal';
import './CustomersPage.css';

interface CustomersPageProps {
  onNavigate?: (path: string) => void;
}

interface InitialOrderItem {
  product_id: number;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [employees, setEmployees] = useState<User[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [paymentType, setPaymentType] = useState<string>('');
  const [classification, setClassification] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [sortBy, setSortBy] = useState<'balance' | 'latest' | 'name'>('latest');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [selectedCustomerForSheet, setSelectedCustomerForSheet] = useState<string | null>(null);
  const [targetCustomer, setTargetCustomer] = useState<Customer | null>(null);

  // Form State - Create Customer
  const [newCustCode, setNewCustCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newTradeName, setNewTradeName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSecondaryPhone, setNewSecondaryPhone] = useState('');
  const [newCity, setNewCity] = useState('القاهرة');
  const [newAddress, setNewAddress] = useState('');
  const [newPaymentType, setNewPaymentType] = useState<PaymentType>('CREDIT');
  const [newTermsDays, setNewTermsDays] = useState(15);
  const [newClassification, setNewClassification] = useState<CustomerClassification>('B');
  const [newCreditLimit, setNewCreditLimit] = useState(25000);
  const [newAssignedEmployeeId, setNewAssignedEmployeeId] = useState<string>('');

  // Initial Order / Products Section in Modal
  const [initialOrderItems, setInitialOrderItems] = useState<InitialOrderItem[]>([]);
  const [selectedProdId, setSelectedProdId] = useState<number | ''>('');
  const [selectedProdQty, setSelectedProdQty] = useState<number>(1);
  const [selectedProdPrice, setSelectedProdPrice] = useState<number>(0);

  // Form State - Edit Customer
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editTradeName, setEditTradeName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSecondaryPhone, setEditSecondaryPhone] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPaymentType, setEditPaymentType] = useState<PaymentType>('CREDIT');
  const [editTermsDays, setEditTermsDays] = useState(15);
  const [editClassification, setEditClassification] = useState<CustomerClassification>('B');
  const [editCreditLimit, setEditCreditLimit] = useState(25000);
  const [editAssignedEmployeeId, setEditAssignedEmployeeId] = useState<string>('');

  // Modal State - Delete Customer
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetCustomer, setDeleteTargetCustomer] = useState<Customer | null>(null);

  // Form State - Assign Employee
  const [assignEmployeeId, setAssignEmployeeId] = useState<string>('');
  const [assignReason, setAssignReason] = useState('');

  // Messages
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const filters: CustomerFilters = {
        search: search || undefined,
        payment_type: paymentType || undefined,
        classification: classification || undefined,
        status: status || undefined,
        sort_by: sortBy,
        sort_order: 'desc',
        employeeId: selectedEmployeeId ? parseInt(selectedEmployeeId, 10) : undefined,
      };

      const res = await customerService.getCustomers(filters);
      setCustomers(res.data || []);
      setTotalCount(res.total || 0);
    } catch {
      setFeedback({ type: 'error', text: 'فشل تحميل بيانات العملاء من الخادم' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (user?.role === 'ADMIN' || user?.role === 'MANAGER') {
      try {
        const users = await userService.getUsers();
        setEmployees(users.filter((u: User) => u.status === 'ACTIVE' && (u.role === 'EMPLOYEE' || u.role === 'COLLECTOR')));
      } catch {
        // Fallback
      }
    }
  };

  const fetchProducts = async () => {
    try {
      const prods = await productService.getProducts('', true);
      setAvailableProducts(prods || []);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, paymentType, classification, status, selectedEmployeeId, sortBy]);

  useEffect(() => {
    fetchEmployees();
    fetchProducts();
  }, [user]);

  const handleProductSelectChange = (prodId: number | '') => {
    setSelectedProdId(prodId);
    if (prodId !== '') {
      const prod = availableProducts.find((p) => p.id === prodId);
      if (prod) {
        setSelectedProdPrice(Number(prod.selling_price) || 0);
        setSelectedProdQty(1);
      }
    } else {
      setSelectedProdPrice(0);
      setSelectedProdQty(1);
    }
  };

  const handleAddProductToOrder = () => {
    if (selectedProdId === '' || selectedProdQty <= 0 || selectedProdPrice < 0) {
      return;
    }
    const prod = availableProducts.find((p) => p.id === selectedProdId);
    if (!prod) return;

    // Check if already in list
    const existingIndex = initialOrderItems.findIndex((item) => item.product_id === selectedProdId);
    if (existingIndex > -1) {
      const updated = [...initialOrderItems];
      updated[existingIndex].quantity += selectedProdQty;
      updated[existingIndex].unit_price = selectedProdPrice;
      setInitialOrderItems(updated);
    } else {
      setInitialOrderItems([
        ...initialOrderItems,
        {
          product_id: prod.id,
          product_name: prod.name,
          unit: prod.unit,
          quantity: selectedProdQty,
          unit_price: selectedProdPrice,
        },
      ]);
    }

    // Reset selection
    setSelectedProdId('');
    setSelectedProdQty(1);
    setSelectedProdPrice(0);
  };

  const handleRemoveProductFromOrder = (prodId: number) => {
    setInitialOrderItems(initialOrderItems.filter((item) => item.product_id !== prodId));
  };

  const calculateOrderTotal = () => {
    return initialOrderItems.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFeedback({ type: 'error', text: 'يرجى إدخال اسم العميل' });
      return;
    }

    setIsSubmitting(true);
    try {
      const createdCustomer = await customerService.createCustomer({
        customer_code: newCustCode.trim() || undefined,
        name: newName.trim(),
        trade_name: newTradeName.trim() || undefined,
        phone: newPhone.trim() || undefined,
        secondary_phone: newSecondaryPhone.trim() || undefined,
        city: newCity.trim() || undefined,
        address: newAddress.trim() || undefined,
        payment_type: newPaymentType,
        payment_terms_days: Number(newTermsDays) || 0,
        classification: newClassification,
        credit_limit: Number(newCreditLimit) || 0,
        assigned_employee_id: newAssignedEmployeeId ? parseInt(newAssignedEmployeeId, 10) : null,
      });

      // If initial order items are included, create an initial sales invoice immediately
      if (initialOrderItems.length > 0 && createdCustomer && createdCustomer.id) {
        try {
          await invoiceService.createInvoice({
            customer_id: createdCustomer.id,
            employee_id: newAssignedEmployeeId ? parseInt(newAssignedEmployeeId, 10) : undefined,
            payment_type: newPaymentType,
            payment_terms_days: Number(newTermsDays) || 0,
            notes: 'طلبية افتتاحية مسجلة عند إضافة العميل',
            items: initialOrderItems.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
            })),
          });
          setFeedback({
            type: 'success',
            text: `تم تسجيل العميل بنجاح وإنشاء فاتورة بالمنتجات المحددة بقيمة ${calculateOrderTotal().toLocaleString('ar-EG')} ج.م`,
          });
        } catch {
          setFeedback({
            type: 'success',
            text: 'تم إنشاء بيانات العميل بنجاح (تعذر إنشاء الفاتورة المبدئية تلقائياً، يمكنك إنشاؤها من قسم الفواتير)',
          });
        }
      } else {
        setFeedback({ type: 'success', text: 'تمت إضافة العميل بنجاح' });
      }

      setIsCreateModalOpen(false);
      // Reset form
      setNewCustCode('');
      setNewName('');
      setNewTradeName('');
      setNewPhone('');
      setNewSecondaryPhone('');
      setNewAddress('');
      setInitialOrderItems([]);
      fetchCustomers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل إضافة العميل';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCustomer) return;

    setIsSubmitting(true);
    try {
      const empId = assignEmployeeId ? parseInt(assignEmployeeId, 10) : null;
      await customerService.assignCustomer(targetCustomer.id, empId, assignReason);
      setFeedback({ type: 'success', text: 'تم تحديث الموظف المسؤول عن العميل بنجاح' });
      setIsAssignModalOpen(false);
      setTargetCustomer(null);
      setAssignReason('');
      fetchCustomers();
    } catch {
      setFeedback({ type: 'error', text: 'فشل تعيين الموظف' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setEditName(c.name || '');
    setEditTradeName(c.trade_name || '');
    setEditPhone(c.phone || '');
    setEditSecondaryPhone(c.secondary_phone || '');
    setEditCity(c.city || 'القاهرة');
    setEditAddress(c.address || '');
    setEditPaymentType(c.payment_type || 'CREDIT');
    setEditTermsDays(c.payment_terms_days || 15);
    setEditClassification(c.classification || 'B');
    setEditCreditLimit(c.credit_limit || 25000);
    setEditAssignedEmployeeId(c.assigned_employee_id ? String(c.assigned_employee_id) : '');
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editName.trim()) {
      setFeedback({ type: 'error', text: 'يرجى إدخال اسم العميل' });
      return;
    }

    setIsSubmitting(true);
    try {
      await customerService.updateCustomer(editingCustomer.id, {
        name: editName.trim(),
        trade_name: editTradeName.trim() || undefined,
        phone: editPhone.trim() || undefined,
        secondary_phone: editSecondaryPhone.trim() || undefined,
        city: editCity.trim() || undefined,
        address: editAddress.trim() || undefined,
        payment_type: editPaymentType,
        payment_terms_days: Number(editTermsDays) || 0,
        classification: editClassification,
        credit_limit: Number(editCreditLimit) || 0,
        assigned_employee_id: editAssignedEmployeeId ? parseInt(editAssignedEmployeeId, 10) : null,
      });

      setFeedback({ type: 'success', text: 'تم تحديث بيانات العميل بنجاح' });
      setIsEditModalOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تحديث العميل';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (c: Customer) => {
    setDeleteTargetCustomer(c);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (!deleteTargetCustomer) return;
    setIsSubmitting(true);
    try {
      await customerService.deleteCustomer(deleteTargetCustomer.id);
      setFeedback({ type: 'success', text: `تم حذف العميل ${deleteTargetCustomer.name} وكافة سجلاته بنجاح` });
      setIsDeleteModalOpen(false);
      setDeleteTargetCustomer(null);
      fetchCustomers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حذف العميل';
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
    <div className="customers-page-container">
      {/* Header with Title and Actions */}
      <div className="page-header-row">
        <div>
          <h1 className="page-main-title">سجل العملاء ومناطق التوزيع</h1>
          <p className="page-sub-title">إدارة بيانات العملاء، شروط السداد، ومتابعة الأرصدة والمسؤوليات</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setSelectedCustomerForSheet(null);
              setIsExcelModalOpen(true);
            }}
            className="btn-header-monthly-sheet"
            title="عرض شيت متابعة حسابات العملاء الشهري 2026"
          >
            <FileSpreadsheet size={18} />
            <span>📊 شيت متابعة حسابات العملاء 2026</span>
          </button>
          <button onClick={() => { setIsCreateModalOpen(true); fetchProducts(); }} className="btn-gold">
            <Plus size={16} />
            <span>إضافة عميل جديد</span>
          </button>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div className={`feedback-alert ${feedback.type === 'success' ? 'feedback-success' : 'feedback-error'}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="alert-close-btn">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="sheikh-card customers-filter-card">
        <div className="filter-grid-row">
          <div className="search-input-group">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="sheikh-input-search"
              placeholder="بحث بالاسم، الكود، أو رقم الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="sheikh-select"
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
          >
            <option value="">كل طرق السداد</option>
            <option value="CREDIT">آجل</option>
            <option value="CASH">نقدي</option>
          </select>

          <select
            className="sheikh-select"
            value={classification}
            onChange={(e) => setClassification(e.target.value)}
          >
            <option value="">كل التصنيفات</option>
            <option value="A">فئة A (ممتاز)</option>
            <option value="B">فئة B (متوسط)</option>
            <option value="C">فئة C (حذر)</option>
          </select>

          <select
            className="sheikh-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">كل الحالات</option>
            <option value="ACTIVE">نشط</option>
            <option value="SUSPENDED">موقوف</option>
            <option value="INACTIVE">معطل</option>
          </select>

          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <select
              className="sheikh-select"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
            >
              <option value="">كل المناديب والمحصلين</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name}
                </option>
              ))}
            </select>
          )}

          <select
            className="sheikh-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'balance' | 'latest' | 'name')}
          >
            <option value="latest">الأحدث تسجيلاً</option>
            <option value="balance">الأعلى مديونية</option>
            <option value="name">أبجدياً (أ-ي)</option>
          </select>
        </div>
      </div>

      {/* Main Customers Table Card */}
      <div className="sheikh-card table-wrapper-card">
        <div className="table-header-info">
          <span className="results-count-badge">إجمالي النتائج: {totalCount} عميل</span>
        </div>

        {isLoading ? (
          <div className="table-loading-box">جاري تحميل سجل العملاء...</div>
        ) : customers.length > 0 ? (
          <div className="table-responsive">
            <table className="sheikh-table">
              <thead>
                <tr>
                  <th>كود العميل</th>
                  <th>اسم المنشأة والعميل</th>
                  <th>المدينة / العنوان</th>
                  <th>الهاتف</th>
                  <th>المندوب المسؤول</th>
                  <th>طريقة التعامل</th>
                  <th>التصنيف</th>
                  <th>الحد الائتماني</th>
                  <th>الرصيد القائم</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="code-pill">{c.customer_code}</span>
                    </td>
                    <td>
                      <div className="cust-name-col">
                        <strong className="cust-primary-name">{c.name}</strong>
                        {c.trade_name && (
                          <span className="cust-trade-name">{c.trade_name}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="cust-address-col">
                        <span>{c.city || '—'}</span>
                        {c.address && <small className="text-muted">{c.address}</small>}
                      </div>
                    </td>
                    <td>
                      <span className="phone-text">{c.phone || '—'}</span>
                    </td>
                    <td>
                      {c.assigned_employee_name ? (
                        <span className="emp-assigned-tag">{c.assigned_employee_name}</span>
                      ) : (
                        <span className="text-muted">غير مخصص</span>
                      )}
                    </td>
                    <td>
                      <span className={`payment-pill ${c.payment_type === 'CREDIT' ? 'pill-credit' : 'pill-cash'}`}>
                        {c.payment_type === 'CREDIT' ? `آجل (${c.payment_terms_days} يوم)` : 'نقدي'}
                      </span>
                    </td>
                    <td>
                      <span className={`class-badge class-${c.classification?.toLowerCase()}`}>
                        فئة {c.classification}
                      </span>
                    </td>
                    <td className="font-semibold">{formatCurrency(c.credit_limit || 0)}</td>
                    <td>
                      <span className={`balance-value ${(c.current_balance || 0) > 0 ? 'balance-due' : 'balance-clear'}`}>
                        {formatCurrency(c.current_balance || 0)}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions-group">
                        <button
                          onClick={() => {
                            setSelectedCustomerForSheet(c.customer_code);
                            setIsExcelModalOpen(true);
                          }}
                          className="btn-monthly-statement"
                          title="عرض كشف الشهور والمعاملات لعام 2026"
                        >
                          <FileSpreadsheet size={15} />
                          <span>كشف الشهور</span>
                        </button>
                        {onNavigate && (
                          <button
                            onClick={() => onNavigate(`/customers/${c.id}`)}
                            className="btn-action-icon"
                            title="الملف التفصيلي وكشف الحساب"
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(c)}
                          className="btn-action-icon"
                          title="تعديل بيانات العميل"
                          style={{ color: '#d97706' }}
                        >
                          <Edit2 size={15} />
                        </button>
                        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                          <>
                            <button
                              onClick={() => {
                                setTargetCustomer(c);
                                setAssignEmployeeId(c.assigned_employee_id ? String(c.assigned_employee_id) : '');
                                setIsAssignModalOpen(true);
                              }}
                              className="btn-action-icon"
                              title="تعيين المندوب المسؤول"
                            >
                              <UserCheck size={15} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(c)}
                              className="btn-action-icon"
                              title="حذف العميل"
                              style={{ color: '#dc2626' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-box">
            <Building size={40} className="empty-state-icon" />
            <h4>لا يوجد عملاء مطابقون للبحث والفلترة</h4>
            <p>يمكنك تغيير معايير البحث أو إضافة عميل جديد إلى المنظومة.</p>
          </div>
        )}
      </div>

      {/* Modal: Create Customer */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px' }}>
            <div className="modal-header">
              <h3 className="modal-title">إضافة عميل جديد للمنظومة</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="modal-form-grid">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">
                    اسم العميل (الرسمي) <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="sheikh-input"
                    placeholder="مثال: شركة البركة للمواد الغذائية"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الاسم التجاري / اسم المحل</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    placeholder="مثال: ماركت البركة"
                    value={newTradeName}
                    onChange={(e) => setNewTradeName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">كود العميل (اختياري)</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    placeholder="CUST-XXXX (تلقائي إن ترك فارغاً)"
                    value={newCustCode}
                    onChange={(e) => setNewCustCode(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">رقم الهاتف الأساسي</label>
                  <input
                    type="tel"
                    className="sheikh-input"
                    placeholder="010XXXXXXXX"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">هاتف ثانوي / مسؤول المشتريات</label>
                  <input
                    type="tel"
                    className="sheikh-input"
                    placeholder="011XXXXXXXX"
                    value={newSecondaryPhone}
                    onChange={(e) => setNewSecondaryPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">المدينة / المحافظة</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    placeholder="القاهرة / الجيزة / الإسكندرية..."
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">العنوان التفصيلي</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    placeholder="اسم الشارع، رقم العقار، علامة مميزة"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">نوع التعامل المالي</label>
                  <select
                    className="sheikh-select"
                    value={newPaymentType}
                    onChange={(e) => setNewPaymentType(e.target.value as PaymentType)}
                  >
                    <option value="CREDIT">آجل مع فترة سداد (CREDIT)</option>
                    <option value="CASH">نقدي فقط (CASH)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">فترة السداد (أيام)</label>
                  <input
                    type="number"
                    className="sheikh-input"
                    value={newTermsDays}
                    onChange={(e) => setNewTermsDays(Number(e.target.value))}
                    disabled={newPaymentType === 'CASH'}
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">التصنيف الائتماني</label>
                  <select
                    className="sheikh-select"
                    value={newClassification}
                    onChange={(e) => setNewClassification(e.target.value as CustomerClassification)}
                  >
                    <option value="A">فئة A (ممتاز)</option>
                    <option value="B">فئة B (متوسط)</option>
                    <option value="C">فئة C (حذر)</option>
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">الحد الائتماني الأقصى (ج.م)</label>
                  <input
                    type="number"
                    className="sheikh-input"
                    value={newCreditLimit}
                    onChange={(e) => setNewCreditLimit(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">المندوب المسؤول المبدئي</label>
                  <select
                    className="sheikh-select"
                    value={newAssignedEmployeeId}
                    onChange={(e) => setNewAssignedEmployeeId(e.target.value)}
                  >
                    <option value="">بدون تعيين حالياً</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products & Initial Order Section */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Package size={16} style={{ color: '#d97706' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
                      المنتجات المشتراة / الطلبية المبدئية للعميل (اختياري)
                    </span>
                  </div>
                  {initialOrderItems.length > 0 && (
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#d97706' }}>
                      إجمالي الفاتورة: {calculateOrderTotal().toLocaleString('ar-EG')} ج.م
                    </span>
                  )}
                </div>

                {/* Add Product Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr auto', gap: '0.6rem', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>اختر الصنف / المنتج</label>
                    <select
                      className="sheikh-select"
                      style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                      value={selectedProdId}
                      onChange={(e) => handleProductSelectChange(e.target.value === '' ? '' : Number(e.target.value))}
                    >
                      <option value="">-- اختر من قائمة الأصناف الفعلية --</option>
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unit}) — {Number(p.selling_price).toLocaleString()} ج.م
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>الكمية</label>
                    <input
                      type="number"
                      min={1}
                      className="sheikh-input"
                      style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                      value={selectedProdQty}
                      onChange={(e) => setSelectedProdQty(Math.max(1, Number(e.target.value)))}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.78rem' }}>سعر الوحدة (ج.م)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      className="sheikh-input"
                      style={{ fontSize: '0.82rem', padding: '6px 10px' }}
                      value={selectedProdPrice}
                      onChange={(e) => setSelectedProdPrice(Number(e.target.value))}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddProductToOrder}
                    disabled={selectedProdId === ''}
                    className="btn-gold"
                    style={{ padding: '7px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                  >
                    + إضافة للطلبية
                  </button>
                </div>

                {/* Selected Items List */}
                {initialOrderItems.length > 0 && (
                  <div className="table-responsive" style={{ border: '1px solid #cbd5e1', borderRadius: '6px', background: '#ffffff' }}>
                    <table className="sheikh-table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>الصنف</th>
                          <th>الوحدة</th>
                          <th>الكمية</th>
                          <th>سعر الوحدة</th>
                          <th>الإجمالي</th>
                          <th style={{ width: '40px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {initialOrderItems.map((item) => (
                          <tr key={item.product_id}>
                            <td><strong>{item.product_name}</strong></td>
                            <td>{item.unit}</td>
                            <td>{item.quantity}</td>
                            <td>{item.unit_price.toLocaleString('ar-EG')} ج.م</td>
                            <td className="font-bold text-gold-dark">
                              {(item.quantity * item.unit_price).toLocaleString('ar-EG')} ج.م
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleRemoveProductFromOrder(item.product_id)}
                                className="btn-action-icon"
                                title="حذف الصنف"
                                style={{ color: '#dc2626' }}
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

              <div className="modal-footer">
                <button type="submit" className="btn-gold" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات العميل والطلبية'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Employee */}
      {isAssignModalOpen && targetCustomer && (
        <div className="modal-overlay" onClick={() => setIsAssignModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">تعيين / تعديل المندوب المسؤول</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignEmployee} className="modal-form-grid">
              <div className="customer-target-banner">
                <span className="text-muted">العميل:</span>
                <strong>{targetCustomer.name}</strong> ({targetCustomer.customer_code})
              </div>

              <div className="form-group">
                <label className="form-label">اختر المندوب / المحصل المسؤول</label>
                <select
                  className="sheikh-select"
                  value={assignEmployeeId}
                  onChange={(e) => setAssignEmployeeId(e.target.value)}
                >
                  <option value="">إلغاء التعيين (غير مخصص)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">سبب التعيين أو إعادة التوزيع</label>
                <textarea
                  className="sheikh-textarea"
                  rows={3}
                  placeholder="مثال: إعادة توزيع خطوط السير لقطاع مصر الجديدة..."
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-gold" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري التعيين...' : 'تأكيد التعيين وتوثيق السجل'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAssignModalOpen(false)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal: Edit Customer */}
      {isEditModalOpen && editingCustomer && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">تعديل بيانات العميل ({editingCustomer.customer_code})</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="modal-form-grid">
              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">
                    اسم العميل / المنشأة <span className="req-star">*</span>
                  </label>
                  <input
                    type="text"
                    className="sheikh-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">الاسم التجاري / الشهرة</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    value={editTradeName}
                    onChange={(e) => setEditTradeName(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">رقم الهاتف الأساسي</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">هاتف إضافي</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    value={editSecondaryPhone}
                    onChange={(e) => setEditSecondaryPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">المدينة / المركز</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">العنوان بالتفصيل</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label">طريقة التعامل المالي</label>
                  <select
                    className="sheikh-select"
                    value={editPaymentType}
                    onChange={(e) => setEditPaymentType(e.target.value as PaymentType)}
                  >
                    <option value="CREDIT">آجل (مع مهلة سداد)</option>
                    <option value="CASH">نقدي (كاش فوري)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">مهلة السداد (بالأيام)</label>
                  <input
                    type="number"
                    className="sheikh-input"
                    value={editTermsDays}
                    onChange={(e) => setEditTermsDays(Number(e.target.value))}
                    disabled={editPaymentType === 'CASH'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">الحد الائتماني (ج.م)</label>
                  <input
                    type="number"
                    className="sheikh-input"
                    value={editCreditLimit}
                    onChange={(e) => setEditCreditLimit(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">تصنيف العميل</label>
                  <select
                    className="sheikh-select"
                    value={editClassification}
                    onChange={(e) => setEditClassification(e.target.value as CustomerClassification)}
                  >
                    <option value="A">فئة أ (ممتاز - حجم كبير)</option>
                    <option value="B">فئة ب (جيد جداً - متوسط)</option>
                    <option value="C">فئة ج (اعتيادي - صغير)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">المندوب المسؤول</label>
                  <select
                    className="sheikh-select"
                    value={editAssignedEmployeeId}
                    onChange={(e) => setEditAssignedEmployeeId(e.target.value)}
                  >
                    <option value="">غير مخصص</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
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

      {/* Modal: Delete Customer */}
      {isDeleteModalOpen && deleteTargetCustomer && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#dc2626' }}>
                <Trash2 size={22} />
                <h3 className="modal-title" style={{ color: '#dc2626' }}>تأكيد حذف العميل</h3>
              </div>
              <button onClick={() => setIsDeleteModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 0', color: '#475569', fontSize: '0.92rem', lineHeight: 1.6 }}>
              هل أنت متأكد من رغبتك في حذف العميل <strong>{deleteTargetCustomer.name}</strong> ({deleteTargetCustomer.customer_code})؟
              <br />
              <small style={{ color: '#dc2626', display: 'block', marginTop: '0.5rem' }}>
                تنبيه: سيتم حذف العميل وكافة سجلات الفواتير والتحصيلات وكشوف الحسابات التابعة له فورياً.
              </small>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteCustomer}
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

      {/* 2026 Monthly Transactions Excel Sheet Modal */}
      <MonthlyExcelSheetModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        selectedCustomerCode={selectedCustomerForSheet}
        onViewCustomerDetails={(id) => onNavigate?.(`/customers/${id}`)}
      />
    </div>
  );
};
export default CustomersPage;
