import React from 'react';
import { Logo } from '../../components/common/Logo/Logo';
import './AuthLayout.css';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-layout-container">
      <div className="auth-card-box">
        <div className="auth-brand-header">
          <Logo size="large" showText={true} />
        </div>
        {children}
      </div>
    </div>
  );
};
