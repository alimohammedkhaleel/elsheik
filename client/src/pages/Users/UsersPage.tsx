import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Mail,
  Phone,
  Briefcase,
  X,
  Lock,
} from 'lucide-react';
import { UserService } from '../../services/api/userService';
import { User, UserRole, UserStatus, CreateUserInput } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import './UsersPage.css';

const ROLE_LABELS: Record<UserRole, { label: string; class: string }> = {
  ADMIN: { label: 'مدير عام', class: 'role-admin' },
  MANAGER: { label: 'مشرف توزيع', class: 'role-manager' },
  EMPLOYEE: { label: 'مندوب مبيعات', class: 'role-employee' },
  COLLECTOR: { label: 'محصل مالي', class: 'role-collector' },
  CUSTOMER: { label: 'عميل (بوابة)', class: 'role-employee' },
};

const STATUS_LABELS: Record<UserStatus, { label: string; class: string }> = {
  ACTIVE: { label: 'نشط', class: 'status-active' },
  INACTIVE: { label: 'معطل', class: 'status-inactive' },
  PENDING_APPROVAL: { label: 'بانتظار الموافقة', class: 'status-pending' },
  REJECTED: { label: 'مرفوض', class: 'status-rejected' },
};

export const UsersPage: React.FC = () => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State for creating a user
  const [formData, setFormData] = useState<CreateUserInput>({
    full_name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    job_title: '',
    role_code: 'EMPLOYEE',
    status: 'ACTIVE',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await UserService.getAllUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch {
      showNotification('error', 'فشل جلب قائمة المستخدمين');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery));

      const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
      const matchesStatus = selectedStatus === 'ALL' || u.status === selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, selectedRole, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === 'ACTIVE').length,
      pending: users.filter((u) => u.status === 'PENDING_APPROVAL').length,
      inactive: users.filter((u) => u.status === 'INACTIVE').length,
    };
  }, [users]);

  // Toggle user status
  const handleToggleStatus = async (user: User) => {
    const newStatus: UserStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await UserService.updateStatus(user.id, newStatus);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
        showNotification(
          'success',
          `تم ${newStatus === 'ACTIVE' ? 'تفعيل' : 'تعطيل'} حساب (${user.full_name}) بنجاح`
        );
      }
    } catch {
      showNotification('error', 'فشل تحديث حالة المستخدم');
    }
  };

  // Change user role
  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    try {
      const res = await UserService.updateRole(userId, newRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        showNotification('success', 'تم تعديل دور المستخدم وصلاحياته بنجاح');
      }
    } catch {
      showNotification('error', 'فشل تعديل دور المستخدم');
    }
  };

  // Submit Create User Form
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.username || !formData.email) {
      showNotification('error', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await UserService.createUser(formData);
      if (res.success && res.data) {
        setUsers((prev) => [res.data!, ...prev]);
        showNotification('success', `تم إنشاء حساب (${res.data.full_name}) بنجاح`);
        setIsModalOpen(false);
        setFormData({
          full_name: '',
          username: '',
          email: '',
          password: '',
          phone: '',
          job_title: '',
          role_code: 'EMPLOYEE',
          status: 'ACTIVE',
        });
      } else {
        showNotification('error', res.message || 'فشل إنشاء المستخدم');
      }
    } catch {
      showNotification('error', 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="users-page-wrapper">
      {/* Top Notification Toast */}
      {notification && (
        <div className={`notification-toast toast-${notification.type}`} role="status">
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="users-page-header">
        <div>
          <div className="users-header-badge">
            <UsersIcon size={14} />
            <span>المرحلة 2: نظام المستخدمين والصلاحيات (RBAC)</span>
          </div>
          <h1 className="users-page-title">إدارة المستخدمين والموظفين</h1>
          <p className="users-page-sub">
            التحكم في حسابات الموظفين، المناديب، المحصلين، وتعيين الصلاحيات والأدوار
          </p>
        </div>

        <div className="users-header-actions">
          <button onClick={fetchUsers} className="btn-secondary-dark" title="تحديث البيانات">
            <RefreshCw size={16} className={isLoading ? 'spin-anim' : ''} />
            <span>تحديث</span>
          </button>

          {isAdmin && (
            <button onClick={() => setIsModalOpen(true)} className="btn-gold">
              <UserPlus size={18} />
              <span>إضافة مستخدم جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="users-stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrap stat-total">
            <UsersIcon size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">إجمالي الحسابات</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap stat-active">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">حسابات نشطة</span>
            <span className="stat-value">{stats.active}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap stat-pending">
            <Clock size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">بانتظار الاعتماد</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrap stat-inactive">
            <XCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">حسابات معطلة</span>
            <span className="stat-value">{stats.inactive}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="users-filter-bar sheikh-card">
        <div className="search-input-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="بحث بالاسم، اسم المستخدم، البريد، أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="users-search-input"
          />
        </div>

        <div className="filter-selects-wrap">
          <div className="filter-group">
            <label className="filter-label">الدور:</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="users-filter-select"
            >
              <option value="ALL">جميع الأدوار</option>
              <option value="ADMIN">مدير عام (ADMIN)</option>
              <option value="MANAGER">مشرف (MANAGER)</option>
              <option value="EMPLOYEE">مندوب (EMPLOYEE)</option>
              <option value="COLLECTOR">محصل (COLLECTOR)</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">الحالة:</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="users-filter-select"
            >
              <option value="ALL">جميع الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="INACTIVE">معطل</option>
              <option value="PENDING_APPROVAL">بانتظار الموافقة</option>
              <option value="REJECTED">مرفوض</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container sheikh-card">
        {isLoading ? (
          <div className="users-loading-state">
            <RefreshCw size={28} className="spin-anim text-gold" />
            <p>جاري تحميل بيانات المستخدمين...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="users-empty-state">
            <UsersIcon size={48} className="empty-icon" />
            <h3>لا توجد حسابات مطابقة</h3>
            <p>جرب تغيير معايير البحث أو الفلترة</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sheikh-table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>المسمى والوظيفة</th>
                  <th>معلومات الاتصال</th>
                  <th>الدور والصلاحية</th>
                  <th>الحالة</th>
                  {isAdmin && <th>إجراءات الحساب</th>}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const roleMeta = ROLE_LABELS[user.role] || {
                    label: user.role,
                    class: 'role-employee',
                  };
                  const statusMeta = STATUS_LABELS[user.status] || {
                    label: user.status,
                    class: 'status-active',
                  };

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-cell-name">
                          <div className="user-table-avatar">
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="user-fullname">{user.full_name}</div>
                            <div className="user-username">@{user.username}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="user-cell-job">
                          <Briefcase size={14} className="cell-icon" />
                          <span>{user.job_title || 'موظف مؤسسة الشيخ'}</span>
                        </div>
                      </td>

                      <td>
                        <div className="user-contact-info">
                          <div className="contact-row">
                            <Mail size={13} className="cell-icon" />
                            <span>{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="contact-row">
                              <Phone size={13} className="cell-icon" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        {isAdmin ? (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                            className={`role-badge-select ${roleMeta.class}`}
                          >
                            <option value="ADMIN">مدير عام</option>
                            <option value="MANAGER">مشرف</option>
                            <option value="EMPLOYEE">مندوب مبيعات</option>
                            <option value="COLLECTOR">محصل مالي</option>
                          </select>
                        ) : (
                          <span className={`role-badge ${roleMeta.class}`}>
                            <span>{roleMeta.label}</span>
                          </span>
                        )}
                      </td>

                      <td>
                        <span className={`status-badge ${statusMeta.class}`}>
                          {statusMeta.label}
                        </span>
                      </td>

                      {isAdmin && (
                        <td>
                          <div className="actions-cell">
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`btn-action-status ${
                                user.status === 'ACTIVE' ? 'btn-deactivate' : 'btn-activate'
                              }`}
                              title={user.status === 'ACTIVE' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                            >
                              {user.status === 'ACTIVE' ? 'تعطيل' : 'تفعيل'}
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
        )}
      </div>

      {/* Modal: Add New User */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title">
                <UserPlus size={20} className="text-gold" />
                <h3>إضافة مستخدم أو موظف جديد</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="إغلاق النافذة"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="modal-form">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">الاسم الكامل *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: حسام علي"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">اسم المستخدم (Username) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: hossam_ali"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="hossam@sheikh.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">كلمة المرور الافتراضية *</label>
                  <div className="input-with-icon">
                    <Lock size={16} className="input-icon" />
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">المسمى الوظيفي</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="مثال: مندوب قطاع المعادي"
                    value={formData.job_title || ''}
                    onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">رقم الهاتف</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="01012345678"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">الدور والصلاحيات *</label>
                  <select
                    className="form-input"
                    value={formData.role_code}
                    onChange={(e) =>
                      setFormData({ ...formData, role_code: e.target.value as UserRole })
                    }
                  >
                    <option value="EMPLOYEE">مندوب مبيعات (EMPLOYEE)</option>
                    <option value="COLLECTOR">محصل مالي (COLLECTOR)</option>
                    <option value="MANAGER">مشرف قطاع (MANAGER)</option>
                    <option value="ADMIN">مدير عام (ADMIN)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">حالة الحساب *</label>
                  <select
                    className="form-input"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as UserStatus })
                    }
                  >
                    <option value="ACTIVE">نشط ومفعل فوراً</option>
                    <option value="PENDING_APPROVAL">في انتظار مراجعة الإدارة</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary-dark"
                  disabled={isSubmitting}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn-gold" disabled={isSubmitting}>
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ وإنشاء الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
