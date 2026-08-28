import { useState, useEffect } from 'react';

export interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  width: number;
}

export const useResponsive = (): ResponsiveState => {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowWidth < 768,
    isTablet: windowWidth >= 768 && windowWidth < 1024,
    isLaptop: windowWidth >= 1024 && windowWidth < 1280,
    isDesktop: windowWidth >= 1280,
    width: windowWidth,
  };
};
