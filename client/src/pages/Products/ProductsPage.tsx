import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { productService, Product } from '../../services/api/productService';
import './ProductsPage.css';

export const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodCode, setProdCode] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodUnit, setProdUnit] = useState('قطعة');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>(0);
  const [sellingPrice, setSellingPrice] = useState<number | ''>(0);

  // Delete Product Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetProduct, setDeleteTargetProduct] = useState<Product | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await productService.getProducts(search || undefined);
      setProducts(res || []);
    } catch {
      setFeedback({ type: 'error', text: 'فشل تحميل قائمة المنتجات' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setProdCode('');
    setProdName('');
    setProdDesc('');
    setProdUnit('قطعة');
    setPurchasePrice(0);
    setSellingPrice(0);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setProdCode(p.product_code);
    setProdName(p.name);
    setProdDesc(p.description || '');
    setProdUnit(p.unit);
    setPurchasePrice(p.purchase_price);
    setSellingPrice(p.selling_price);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (p: Product) => {
    try {
      await productService.toggleProductStatus(p.id, !p.is_active);
      setFeedback({
        type: 'success',
        text: `تم ${!p.is_active ? 'تفعيل' : 'تعطيل'} المنتج بنجاح`,
      });
      fetchProducts();
    } catch {
      setFeedback({ type: 'error', text: 'فشل تغيير حالة المنتج' });
    }
  };

  const openDeleteModal = (p: Product) => {
    setDeleteTargetProduct(p);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!deleteTargetProduct) return;
    setIsSubmitting(true);
    try {
      await productService.deleteProduct(deleteTargetProduct.id);
      setFeedback({ type: 'success', text: `تم حذف المنتج "${deleteTargetProduct.name}" بنجاح` });
      setIsDeleteModalOpen(false);
      setDeleteTargetProduct(null);
      fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حذف المنتج';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim()) {
      setFeedback({ type: 'error', text: 'يرجى إدخال اسم المنتج' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, {
          name: prodName.trim(),
          description: prodDesc.trim() || null,
          unit: prodUnit,
          purchase_price: Number(purchasePrice) || 0,
          selling_price: Number(sellingPrice) || 0,
        });
        setFeedback({ type: 'success', text: 'تم تحديث بيانات المنتج بنجاح' });
      } else {
        await productService.createProduct({
          product_code: prodCode.trim() || undefined,
          name: prodName.trim(),
          description: prodDesc.trim() || null,
          unit: prodUnit,
          purchase_price: Number(purchasePrice) || 0,
          selling_price: Number(sellingPrice) || 0,
        });
        setFeedback({ type: 'success', text: 'تمت إضافة المنتج بنجاح' });
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حفظ المنتج';
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
    <div className="products-page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-main-title">دليل المنتجات والأسعار</h1>
          <p className="page-sub-title">إدارة قائمة الأصناف، وحدات البيع، وهوامش الربح</p>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <button onClick={handleOpenCreate} className="btn-gold">
            <Plus size={16} />
            <span>إضافة صنف جديد</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className={feedback.type === 'success' ? 'sheikh-alert-success' : 'sheikh-alert-error'}>
          {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="alert-close-btn">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="sheikh-card products-filter-card">
        <div className="search-input-group">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="بحث باسم الصنف أو كود المنتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sheikh-input-search"
          />
        </div>
      </div>

      <div className="sheikh-card table-wrapper-card">
        {isLoading ? (
          <div className="table-loading-box">جاري تحميل المنتجات...</div>
        ) : products.length > 0 ? (
          <div className="table-responsive">
            <table className="sheikh-table">
              <thead>
                <tr>
                  <th>كود الصنف</th>
                  <th>اسم المنتج</th>
                  <th>الوصف</th>
                  <th>الوحدة</th>
                  <th>سعر الشراء</th>
                  <th>سعر البيع</th>
                  <th>هامش الربح</th>
                  <th>الحالة</th>
                  {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && <th>الإجراءات</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const profit = p.selling_price - p.purchase_price;
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="code-pill">{p.product_code}</span>
                      </td>
                      <td className="font-semibold">{p.name}</td>
                      <td className="text-muted">{p.description || '—'}</td>
                      <td>{p.unit}</td>
                      <td>{formatCurrency(p.purchase_price)}</td>
                      <td className="font-bold text-gold-dark">{formatCurrency(p.selling_price)}</td>
                      <td className={`font-semibold ${profit >= 0 ? 'text-success' : 'text-warn'}`}>
                        {formatCurrency(profit)}
                      </td>
                      <td>
                        <span className={`status-pill ${p.is_active ? 'status-ok' : 'status-muted'}`}>
                          {p.is_active ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                        <td>
                          <div className="row-actions-group">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="btn-action-icon"
                              title="تعديل الصنف"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(p)}
                              className="btn-action-icon"
                              title={p.is_active ? 'تعطيل المنتج' : 'تفعيل المنتج'}
                            >
                              {p.is_active ? <ToggleRight size={16} className="text-success" /> : <ToggleLeft size={16} className="text-muted" />}
                            </button>
                            <button
                              onClick={() => openDeleteModal(p)}
                              className="btn-action-icon"
                              title="حذف المنتج"
                              style={{ color: '#dc2626' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state-box">
            <Package size={40} className="empty-state-icon" />
            <h4>لا توجد أصناف مطابقة للبحث</h4>
          </div>
        )}
      </div>

      {/* Modal: Create/Edit Product */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingProduct ? 'تعديل بيانات الصنف' : 'إضافة صنف جديد'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="modal-form-grid">
              <div className="form-group">
                <label className="form-label">
                  اسم المنتج / الصنف <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  className="sheikh-input"
                  placeholder="مثال: أرز ممتاز 25 كجم"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">كود الصنف (تلقائي إن ترك فارغاً)</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    placeholder="PRD-XXXX"
                    value={prodCode}
                    onChange={(e) => setProdCode(e.target.value)}
                    disabled={!!editingProduct}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">وحدة القياس</label>
                  <input
                    type="text"
                    className="sheikh-input"
                    placeholder="قطعة / كرتونة / كجم..."
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">سعر الشراء (التكلفة)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="sheikh-input"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">سعر البيع المعتمد</label>
                  <input
                    type="number"
                    step="0.01"
                    className="sheikh-input font-bold"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">الوصف / ملاحظات الصنف</label>
                <textarea
                  className="sheikh-textarea"
                  rows={2}
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-gold" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات المنتج'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Product Confirmation */}
      {isDeleteModalOpen && deleteTargetProduct && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-card modal-sm" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#dc2626' }}>
                <Trash2 size={22} />
                <h3 className="modal-title" style={{ color: '#dc2626' }}>تأكيد حذف المنتج</h3>
              </div>
              <button onClick={() => setIsDeleteModalOpen(false)} className="modal-close-btn">
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.25rem 0', color: '#475569', fontSize: '0.92rem', lineHeight: 1.6 }}>
              هل أنت متأكد من رغبتك في حذف المنتج <strong>{deleteTargetProduct.name}</strong> ({deleteTargetProduct.product_code})؟
              <br />
              <small style={{ color: '#dc2626', display: 'block', marginTop: '0.5rem' }}>
                تنبيه: لا يمكن حذف المنتج إذا كان مرتبطاً بفواتير قائمة.
              </small>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={handleDeleteProduct}
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
