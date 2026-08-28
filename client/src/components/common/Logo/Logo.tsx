import React from 'react';
import logoImg from '../../../assets/images/logo/logo.png';
import './Logo.css';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  showText = true,
  className = '',
}) => {
  return (
    <div className={`sheikh-logo-container sheikh-logo-${size} ${className}`}>
      <div className="sheikh-logo-img-wrapper">
        <img
          src={logoImg}
          alt="شعار مؤسسة الشيخ"
          className="sheikh-logo-img"
        />
      </div>

      {showText && (
        <div className="sheikh-logo-text">
          <span className="sheikh-brand-name">مؤسسة الشيخ</span>
          <span className="sheikh-system-name">نظام إدارة ومتابعة العملاء</span>
        </div>
      )}
    </div>
  );
};
