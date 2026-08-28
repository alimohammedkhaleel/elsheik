import React from 'react';
import { X, Building2 } from 'lucide-react';
import { NAVIGATION_ITEMS } from '../../../constants/navigation';
import { Logo } from '../../common/Logo/Logo';
import { useAuth } from '../../../context/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  activePath: string;
  onNavigate: (path: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePath,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user } = useAuth();

  const filteredNavItems = NAVIGATION_ITEMS.filter((item) => {
    if (!item.allowedRoles) return true;
    if (!user) return false;
    return item.allowedRoles.includes(user.role);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside className={`sheikh-sidebar ${isOpenMobile ? 'sidebar-open-mobile' : ''}`}>
        {/* Sidebar Header with Brand Logo */}
        <div className="sidebar-header">
          <Logo size="medium" showText={true} />
          <button
            className="sidebar-mobile-close-btn"
            onClick={onCloseMobile}
            aria-label="إغلاق القائمة"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">الأقسام والخدمات</div>
          <ul className="sidebar-menu-list">
            {filteredNavItems.map((item) => {
              const IconComponent = item.icon;
              const isActive =
                activePath === item.path ||
                (item.path !== '/' && activePath.startsWith(item.path));

              return (
                <li key={item.id} className="sidebar-menu-item">
                  <button
                    onClick={() => {
                      onNavigate(item.path);
                      if (isOpenMobile) onCloseMobile();
                    }}
                    className={`sidebar-nav-link ${isActive ? 'nav-link-active' : ''}`}
                  >
                    <span className="sidebar-icon-wrap">
                      <IconComponent size={18} />
                    </span>
                    <span className="sidebar-item-label">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-org-info">
            <Building2 size={16} className="org-icon" />
            <div>
              <div className="org-name">مؤسسة الشيخ</div>
              <div className="org-dept">نظام إدارة الحسابات والتوزيع</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
