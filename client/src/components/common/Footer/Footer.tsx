import React from 'react';
import { Phone, MessageSquare, ShieldCheck, Code2 } from 'lucide-react';
import './Footer.css';

interface FooterProps {
  transparent?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ transparent = false }) => {
  const engineerName = 'المهندس علي محمد علي خليل';
  const phoneNumber = '01121360605';
  const whatsappUrl = `https://wa.me/201121360605?text=${encodeURIComponent('السلام عليكم باشمهندس علي، بخصوص نظام مؤسسة الشيخ')}`;

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
            جميع الحقوق محفوظة © {new Date().getFullYear()} — نظام مركزي معتمد
          </p>
        </div>

        {/* Engineer / Creator Credits */}
        <div className="footer-developer-section">
          <div className="footer-dev-badge">
            <Code2 size={15} className="text-gold" style={{ color: '#c9a227' }} />
            <span>تم الإنشاء والتطوير بواسطة:</span>
            <strong>{engineerName}</strong>
          </div>

          <div className="footer-dev-divider" />

          <div className="footer-contact-links">
            <a
              href={`tel:${phoneNumber}`}
              className="footer-contact-btn btn-phone-call"
              title="اتصال هاتفي بالمهندس المطور"
            >
              <Phone size={13} />
              <span>{phoneNumber}</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-contact-btn btn-whatsapp-chat"
              title="مراسلة عبر واتساب"
            >
              <MessageSquare size={13} />
              <span>واتساب</span>
            </a>
          </div>
        </div>

        {/* Security & System Trust Badge */}
        <div className="footer-system-status">
          <ShieldCheck size={14} />
          <span>نظام مشفر 256-bit SSL</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
