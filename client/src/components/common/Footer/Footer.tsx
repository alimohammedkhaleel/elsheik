import React from 'react';
import { ShieldCheck, Building2 } from 'lucide-react';
import './Footer.css';

interface FooterProps {
  transparent?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ transparent = false }) => {
  return (
    <footer className={`sheikh-footer ${transparent ? 'sheikh-footer-transparent' : ''}`}>
      <div className="sheikh-footer-inner">
        {/* Brand & Rights */}
        <div className="footer-brand-section">
          <div className="footer-brand-title">
            <Building2 size={16} style={{ color: 'var(--color-gold, #c5a059)' }} />
            <span>مؤسسة الشيخ للتجارة والتوزيع</span>
          </div>
          <p className="footer-brand-subtitle">
            المنظومة السحابية المركزية لإدارة المبيعات والتوزيع والحسابات © {new Date().getFullYear()}
          </p>
        </div>

        {/* System Trust & Security Status */}
        <div className="footer-system-status">
          <ShieldCheck size={15} style={{ color: '#10b981' }} />
          <span>نظام مشفر ومؤمن بالكامل 256-bit SSL</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
