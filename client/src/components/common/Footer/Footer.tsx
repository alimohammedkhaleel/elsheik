import React from 'react';
import { ShieldCheck } from 'lucide-react';
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
            <span className="footer-gold-dot" />
            <span>مؤسسة الشيخ للأنظمة المحاسبية وإدارة التوزيع</span>
          </div>
          <p className="footer-brand-subtitle">
            جميع الحقوق محفوظة © {new Date().getFullYear()} — نظام إدارة العمليات والتوزيع المعتمد
          </p>
        </div>

        {/* Security & System Trust Badge */}
        <div className="footer-system-status">
          <ShieldCheck size={14} />
          <span>نظام مشفر 256-bit SSL | إصدار السحابة 2026</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
