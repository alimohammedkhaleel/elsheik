import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './providers/ThemeProvider';
import { AnimationProvider, useAnimation } from './providers/AnimationProvider';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { Presentation } from '../components/presentation/Presentation';
import { DashboardLayout } from '../layouts/DashboardLayout/DashboardLayout';
import { RouteRenderer, getPageTitle } from './routes';
import '../styles/globals.css';

const MainApp: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>('/');
  const { hasSeenPresentation, markPresentationSeen } = useAnimation();
  const { isAuthenticated, isLoading } = useAuth();

  // Sync hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      setCurrentPath(hash);
    };

    if (window.location.hash) {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path);
  };

  const handleFinishPresentation = () => {
    markPresentationSeen();
  };

  return (
    <>
      {/* 1. Presentation Intro Animation on initial load */}
      {!hasSeenPresentation && (
        <Presentation onFinish={handleFinishPresentation} />
      )}

      {/* 2. Main System Application Shell */}
      {currentPath === '/login' || (!isLoading && !isAuthenticated) ? (
        <RouteRenderer
          currentPath={currentPath}
          onNavigate={navigateTo}
        />
      ) : (
        <DashboardLayout
          activePath={currentPath}
          onNavigate={navigateTo}
          pageTitle={getPageTitle(currentPath)}
        >
          <RouteRenderer
            currentPath={currentPath}
            onNavigate={navigateTo}
          />
        </DashboardLayout>
      )}
    </>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AnimationProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </AnimationProvider>
    </ThemeProvider>
  );
};

export default App;

// Root Mount
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
