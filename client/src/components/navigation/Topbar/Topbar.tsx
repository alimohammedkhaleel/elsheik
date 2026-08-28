import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Menu,
  LogOut,
  LogIn,
  Shield,
  ChevronDown,
  Bell,
  X,
  CheckCheck,
  AlertTriangle,
  Clock,
  Info,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { notificationService, SystemNotification } from '../../../services/api/notificationService';
import './Topbar.css';

interface TopbarProps {
  onToggleMobileMenu: () => void;
  pageTitle: string;
  onNavigate?: (path: string) => void;
}

const ROLE_DISPLAY: Record<string, { label: string; badgeClass: string }> = {
  ADMIN: { label: 'مدير عام', badgeClass: 'role-badge-admin' },
  MANAGER: { label: 'مشرف توزيع', badgeClass: 'role-badge-manager' },
  EMPLOYEE: { label: 'مندوب مبيعات', badgeClass: 'role-badge-employee' },
  COLLECTOR: { label: 'محصل مالي', badgeClass: 'role-badge-collector' },
  CUSTOMER: { label: 'عميل', badgeClass: 'role-badge-default' },
};

const NOTIF_ICON: Record<string, React.ReactNode> = {
  APPROVAL: <AlertTriangle size={15} style={{ color: '#d97706' }} />,
  OVERDUE: <Clock size={15} style={{ color: '#dc2626' }} />,
  CREDIT: <Info size={15} style={{ color: '#7c3aed' }} />,
  INFO: <Info size={15} style={{ color: '#0284c7' }} />,
};

export const Topbar: React.FC<TopbarProps> = ({
  onToggleMobileMenu,
  pageTitle,
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user || user.role === 'CUSTOMER') return;
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent
    }
  }, [user]);


  useEffect(() => {
    fetchNotifications();
    // Poll every 45 seconds
    const timer = setInterval(fetchNotifications, 45000);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    if (onNavigate) onNavigate('/login');
  };

  const currentRole = user ? ROLE_DISPLAY[user.role] || { label: user.role, badgeClass: 'role-badge-default' } : null;

  return (
    <header className="sheikh-topbar">
      <div className="topbar-right">
        {/* Mobile Hamburger Menu */}
        <button
          className="topbar-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label="فتح القائمة الجانبية"
        >
          <Menu size={22} />
        </button>

        {/* Page Title & Hierarchy */}
        <div className="topbar-title-wrap">
          <h2 className="topbar-page-title">{pageTitle}</h2>
          <span className="topbar-subtitle">مؤسسة الشيخ — نظام إدارة ومتابعة العملاء والمبيعات</span>
        </div>
      </div>

      <div className="topbar-left">
        {/* Notifications Bell */}
        {user && user.role !== 'CUSTOMER' && (
          <div className="topbar-notif-wrapper" ref={notifRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="topbar-notif-btn"
              aria-label="الإشعارات"
              style={{
                position: 'relative',
                background: 'transparent',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.45rem 0.55rem',
                cursor: 'pointer',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    left: '-5px',
                    background: '#dc2626',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #fff',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotifOpen && (
              <div
                className="sheikh-card"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: '380px',
                  maxHeight: '480px',
                  overflowY: 'auto',
                  zIndex: 9999,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  borderRadius: '12px',
                  padding: 0,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '0.85rem 1.1rem',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                    الإشعارات {unreadCount > 0 && <span style={{ color: '#dc2626' }}>({unreadCount} جديد)</span>}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#d97706', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <CheckCheck size={14} />
                      تعليم الكل كمقروء
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Bell size={28} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                    <p>لا توجد إشعارات حالياً</p>
                  </div>
                ) : (
                  <div>
                    {notifications.slice(0, 15).map((notif) => (
                      <div
                        key={notif.id}
                        style={{
                          padding: '0.85rem 1.1rem',
                          borderBottom: '1px solid #f8fafc',
                          background: notif.is_read ? '#ffffff' : '#fefce8',
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ marginTop: '2px' }}>
                          {NOTIF_ICON[notif.type] || NOTIF_ICON.INFO}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                            {notif.title}
                          </p>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                            {notif.message}
                          </p>
                          {notif.link && onNavigate && (
                            <button
                              onClick={() => {
                                setIsNotifOpen(false);
                                onNavigate(notif.link!);
                              }}
                              style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: '#d97706', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              فتح التفاصيل ←
                            </button>
                          )}
                        </div>
                        {!notif.is_read && (
                          <button
                            onClick={() => handleMarkRead(notif.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                            title="تعليم كمقروء"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* User Profile Dropdown */}
        <div className="topbar-user-wrapper" ref={dropdownRef}>
          {user ? (
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="topbar-user-profile-btn"
              aria-expanded={isDropdownOpen}
            >
              <div className="user-avatar-gold">
                {user.full_name.charAt(0)}
              </div>
              <div className="user-info-text">
                <span className="user-name">{user.full_name}</span>
                <span className={`user-role-tag ${currentRole?.badgeClass}`}>
                  {currentRole?.label}
                </span>
              </div>
              <ChevronDown size={14} className="dropdown-arrow-icon" />
            </button>
          ) : (
            <button
              onClick={() => onNavigate && onNavigate('/login')}
              className="btn-login-header"
            >
              <LogIn size={15} />
              <span>تسجيل الدخول</span>
            </button>
          )}

          {/* Clean User Dropdown */}
          {isDropdownOpen && user && (
            <div className="user-profile-dropdown sheikh-card">
              <div className="dropdown-user-header">
                <div className="dropdown-avatar">
                  {user.full_name.charAt(0)}
                </div>
                <div className="dropdown-user-details">
                  <div className="dropdown-fullname">{user.full_name}</div>
                  <div className="dropdown-email">{user.email}</div>
                  <div className="dropdown-username">@{user.username}</div>
                  <span className={`dropdown-role-pill ${currentRole?.badgeClass}`}>
                    <Shield size={12} />
                    <span>{currentRole?.label}</span>
                  </span>
                </div>
              </div>

              <div className="dropdown-divider" />

              <div className="dropdown-menu-links">
                {user.job_title && (
                  <div className="dropdown-info-item">
                    <span className="info-label">المسمى الوظيفي:</span>
                    <span className="info-value">{user.job_title}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="dropdown-info-item">
                    <span className="info-label">الهاتف:</span>
                    <span className="info-value">{user.phone}</span>
                  </div>
                )}

                <div className="dropdown-divider" />

                <button onClick={handleLogout} className="dropdown-link-btn btn-logout-danger">
                  <LogOut size={15} />
                  <span>تسجيل الخروج من النظام</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
