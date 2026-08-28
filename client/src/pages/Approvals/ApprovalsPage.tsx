import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FileCheck,
  User,
  DollarSign,
  Building,
  FileText,
  MessageSquare,
  X,
  LucideIcon,
} from 'lucide-react';
import { ApprovalService } from '../../services/api/approvalService';
import { ApprovalRecord } from '../../types/auth';
import './ApprovalsPage.css';

const TYPE_ICONS: Record<string, { icon: LucideIcon; label: string; color: string }> = {
  USER: { icon: User, label: 'تسجيل موظف', color: '#60a5fa' },
  CUSTOMER: { icon: Building, label: 'طلب عميل / سقف ائتمان', color: '#fbbf24' },
  PAYMENT: { icon: DollarSign, label: 'اعتماد تحصيل مالي', color: '#34d399' },
  INVOICE: { icon: FileText, label: 'فاتورة خاصة', color: '#c084fc' },
  DATA: { icon: FileCheck, label: 'تعديل بيانات', color: '#94a3b8' },
  VISIT: { icon: Clock, label: 'تقرير زيارة', color: '#38bdf8' },
};

export const ApprovalsPage: React.FC = () => {
  const [records, setRecords] = useState<ApprovalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reject Modal State
  const [rejectModalRecord, setRejectModalRecord] = useState<ApprovalRecord | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fetchApprovals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await ApprovalService.getApprovals(statusFilter === 'ALL' ? undefined : statusFilter);
      if (res.success && res.data) {
        setRecords(res.data);
      }
    } catch {
      showNotification('error', 'فشل جلب طلبات الاعتماد');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleApprove = async (record: ApprovalRecord) => {
    setIsProcessing(true);
    try {
      const res = await ApprovalService.approve(record.id, 'تمت الموافقة والاعتماد من لوحة الإدارة');
      if (res.success) {
        showNotification('success', `تم اعتماد الطلب #${record.id} (${record.target_name || record.entity_type}) بنجاح`);
        fetchApprovals();
      } else {
        showNotification('error', res.message || 'فشل اعتماد الطلب');
      }
    } catch {
      showNotification('error', 'حدث خطأ أثناء اعتماد الطلب');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalRecord || !rejectReason.trim()) {
      showNotification('error', 'يرجى كتابة سبب الرفض');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await ApprovalService.reject(rejectModalRecord.id, rejectReason);
      if (res.success) {
        showNotification('success', `تم رفض الطلب #${rejectModalRecord.id}`);
        setRejectModalRecord(null);
        setRejectReason('');
        fetchApprovals();
      } else {
        showNotification('error', res.message || 'فشل رفض الطلب');
      }
    } catch {
      showNotification('error', 'حدث خطأ أثناء معالجة الرفض');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="approvals-page-wrapper">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification-toast toast-${notification.type}`} role="status">
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="approvals-header">
        <div>
          <div className="approvals-header-badge">
            <FileCheck size={14} />
            <span>المرحلة 2: دورة الموافقات والاعتمادات (Approval Engine)</span>
          </div>
          <h1 className="approvals-title">مركز الموافقات والاعتمادات</h1>
          <p className="approvals-sub">
            مراجعة واعتماد طلبات الموظفين والعملاء وتعديلات البيانات المالية والإدارية
          </p>
        </div>

        <div className="approvals-actions">
          <button onClick={fetchApprovals} className="btn-secondary-dark" title="تحديث البيانات">
            <RefreshCw size={16} className={isLoading ? 'spin-anim' : ''} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="approvals-filter-tabs">
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`tab-btn ${statusFilter === 'PENDING' ? 'tab-btn-active' : ''}`}
        >
          <Clock size={16} />
          <span>بانتظار القرار</span>
        </button>

        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`tab-btn ${statusFilter === 'APPROVED' ? 'tab-btn-active' : ''}`}
        >
          <CheckCircle2 size={16} />
          <span>المعتمدة</span>
        </button>

        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`tab-btn ${statusFilter === 'REJECTED' ? 'tab-btn-active' : ''}`}
        >
          <XCircle size={16} />
          <span>المرفوضة</span>
        </button>

        <button
          onClick={() => setStatusFilter('ALL')}
          className={`tab-btn ${statusFilter === 'ALL' ? 'tab-btn-active' : ''}`}
        >
          <span>الكل</span>
        </button>
      </div>

      {/* Approvals List */}
      <div className="approvals-list-container">
        {isLoading ? (
          <div className="approvals-loading-state">
            <RefreshCw size={32} className="spin-anim text-gold" />
            <p>جاري فحص قائمة طلبات الاعتماد...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="approvals-empty-state sheikh-card">
            <FileCheck size={48} className="empty-icon" />
            <h3>لا توجد طلبات في هذا القسم</h3>
            <p>جميع الطلبات المعروضة تم اتخاذ القرار المناسب بشأنها</p>
          </div>
        ) : (
          <div className="approvals-grid">
            {records.map((record) => {
              const typeMeta = TYPE_ICONS[record.entity_type] || TYPE_ICONS.DATA;
              const IconComp = typeMeta.icon;

              return (
                <div key={record.id} className="approval-card sheikh-card">
                  <div className="approval-card-top">
                    <div className="approval-type-badge" style={{ color: typeMeta.color }}>
                      <IconComp size={16} />
                      <span>{typeMeta.label}</span>
                    </div>

                    <span
                      className={`approval-status-pill status-${record.status.toLowerCase()}`}
                    >
                      {record.status === 'PENDING'
                        ? 'بانتظار القرار'
                        : record.status === 'APPROVED'
                        ? 'معتمد'
                        : 'مرفوض'}
                    </span>
                  </div>

                  <h3 className="approval-target-title">
                    {record.target_name || `طلب #${record.id}`}
                  </h3>

                  <div className="approval-meta-row">
                    <span className="meta-item">
                      <strong>مقدم الطلب:</strong> {record.submitter_name || 'موظف في النظام'}
                    </span>
                    <span className="meta-item">
                      <strong>التاريخ:</strong>{' '}
                      {new Date(record.created_at).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {record.details && (
                    <div className="approval-details-box">
                      {Object.entries(record.details).map(([key, val]) => (
                        <div key={key} className="detail-item">
                          <span className="detail-key">{key}:</span>
                          <span className="detail-val">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {record.review_notes && (
                    <div className="approval-notes-box">
                      <MessageSquare size={14} />
                      <span>ملاحظات القرار: {record.review_notes}</span>
                    </div>
                  )}

                  {record.status === 'PENDING' && (
                    <div className="approval-actions-bar">
                      <button
                        onClick={() => handleApprove(record)}
                        disabled={isProcessing}
                        className="btn-approve"
                      >
                        <CheckCircle2 size={16} />
                        <span>اعتماد وموافقة</span>
                      </button>

                      <button
                        onClick={() => {
                          setRejectModalRecord(record);
                          setRejectReason('');
                        }}
                        disabled={isProcessing}
                        className="btn-reject"
                      >
                        <XCircle size={16} />
                        <span>رفض الطلب</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalRecord && (
        <div className="modal-backdrop" onClick={() => setRejectModalRecord(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title">
                <XCircle size={20} style={{ color: '#ef4444' }} />
                <h3>رفض الطلب #{rejectModalRecord.id}</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setRejectModalRecord(null)}
                aria-label="إغلاق"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="modal-form">
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 12 }}>
                يرجى كتابة سبب رفض هذا الطلب لإعلام مقدمه وحفظه في سجل التدقيق:
              </p>

              <div className="form-group">
                <label className="form-label">سبب الرفض *</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="مثال: المستندات المرفقة غير مكتملة / تجاوز السقف الائتماني المسموح به..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setRejectModalRecord(null)}
                  className="btn-secondary-dark"
                  disabled={isProcessing}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-danger-solid"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'جاري الرفض...' : 'تأكيد الرفض'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
