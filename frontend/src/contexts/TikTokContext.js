import React, { createContext, useContext, useState } from 'react';

const TikTokContext = createContext();

export const useTikTok = () => {
  const context = useContext(TikTokContext);
  if (!context) {
    throw new Error('useTikTok must be used within a TikTokProvider');
  }
  return context;
};

export const TikTokProvider = ({ children }) => {
  const [isTikTokMode, setIsTikTokMode] = useState(false);
  const [hideRightNavigation, setHideRightNavigation] = useState(false);

  const enterTikTokMode = () => {
    setIsTikTokMode(true);
    // Prevent body scroll when in TikTok mode
    document.body.style.overflow = 'hidden';
  };

  const exitTikTokMode = () => {
    setIsTikTokMode(false);
    setHideRightNavigation(false); // Restaurar navegación cuando se sale de TikTok
    // Restore body scroll
    document.body.style.overflow = 'auto';
  };

  const toggleTikTokMode = () => {
    if (isTikTokMode) {
      exitTikTokMode();
    } else {
      enterTikTokMode();
    }
  };

  const hideRightNavigationBar = () => {
    setHideRightNavigation(true);
  };

  const showRightNavigationBar = () => {
    setHideRightNavigation(false);
  };

  return (
    <TikTokContext.Provider 
      value={{
        isTikTokMode,
        hideRightNavigation,
        enterTikTokMode,
        exitTikTokMode,
        toggleTikTokMode,
        hideRightNavigationBar,
        showRightNavigationBar
      }}
    >
      {children}
    </TikTokContext.Provider>
  );
};

export default TikTokContext;