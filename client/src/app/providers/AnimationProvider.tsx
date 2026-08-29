import React, { createContext, useContext, useState } from 'react';

interface AnimationContextType {
  hasSeenPresentation: boolean;
  replayPresentation: () => void;
  markPresentationSeen: () => void;
}

const AnimationContext = createContext<AnimationContextType>({
  hasSeenPresentation: false,
  replayPresentation: () => {},
  markPresentationSeen: () => {},
});

export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasSeenPresentation, setHasSeenPresentation] = useState<boolean>(() => {
    try {
      const hasSeen = sessionStorage.getItem('sheikh_has_seen_presentation');
      const token = localStorage.getItem('sheikh_auth_token');
      // If user has seen it this session or is already logged in, do not replay intro
      if (hasSeen === 'true' || token) {
        return true;
      }
    } catch {
      // ignore storage errors
    }
    return false;
  });

  const replayPresentation = () => {
    try {
      sessionStorage.removeItem('sheikh_has_seen_presentation');
    } catch {}
    setHasSeenPresentation(false);
  };

  const markPresentationSeen = () => {
    try {
      sessionStorage.setItem('sheikh_has_seen_presentation', 'true');
    } catch {}
    setHasSeenPresentation(true);
  };

  return (
    <AnimationContext.Provider
      value={{
        hasSeenPresentation,
        replayPresentation,
        markPresentationSeen,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};

export const useAnimation = () => useContext(AnimationContext);
