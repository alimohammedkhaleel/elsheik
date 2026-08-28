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
  const [hasSeenPresentation, setHasSeenPresentation] = useState(false);

  const replayPresentation = () => setHasSeenPresentation(false);
  const markPresentationSeen = () => setHasSeenPresentation(true);

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
