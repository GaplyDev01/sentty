import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface NewsTickerContextType {
  isVisible: boolean;
  isMuted: boolean;
  showTicker: () => void;
  hideTicker: () => void;
  toggleMute: () => void;
}

const NewsTickerContext = createContext<NewsTickerContextType | undefined>(undefined);

export const useNewsTicker = () => {
  const context = useContext(NewsTickerContext);
  if (context === undefined) {
    throw new Error('useNewsTicker must be used within a NewsTickerProvider');
  }
  return context;
};

interface NewsTickerProviderProps {
  children: ReactNode;
}

export const NewsTickerProvider: React.FC<NewsTickerProviderProps> = ({ children }) => {
  // Get initial state from localStorage if available
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem('newsTicker.isVisible');
    return saved !== null ? saved === 'true' : true;
  });
  
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('newsTicker.isMuted');
    return saved !== null ? saved === 'true' : false;
  });

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('newsTicker.isVisible', isVisible.toString());
  }, [isVisible]);
  
  useEffect(() => {
    localStorage.setItem('newsTicker.isMuted', isMuted.toString());
  }, [isMuted]);

  const showTicker = () => setIsVisible(true);
  const hideTicker = () => setIsVisible(false);
  const toggleMute = () => setIsMuted(prev => !prev);

  return (
    <NewsTickerContext.Provider value={{ isVisible, isMuted, showTicker, hideTicker, toggleMute }}>
      {children}
    </NewsTickerContext.Provider>
  );
};