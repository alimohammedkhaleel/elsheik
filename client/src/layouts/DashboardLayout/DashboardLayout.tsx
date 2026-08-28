import React, { useState } from 'react';
import { Sidebar } from '../../components/navigation/Sidebar/Sidebar';
import { Topbar } from '../../components/navigation/Topbar/Topbar';
import { Footer } from '../../components/common/Footer/Footer';
import './DashboardLayout.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePath: string;
  onNavigate: (path: string) => void;
  pageTitle: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activePath,
  onNavigate,
  pageTitle,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        activePath={activePath}
        onNavigate={onNavigate}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Layout Area */}
      <div className="main-layout">
        <Topbar
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
          pageTitle={pageTitle}
          onNavigate={onNavigate}
        />

        <main className="content-wrapper">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};
