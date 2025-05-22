'use client';

import React, { useState, useEffect } from 'react';
import DarkModePopup from './dark-mode-popup';
import useDarkModeDetection from '@/utils/useDarkModeDetection';

interface DarkModeWrapperProps {
  children: React.ReactNode;
}

/**
 * Component wrapper theo dõi và quản lý dark mode
 */
const DarkModeWrapper: React.FC<DarkModeWrapperProps> = ({ children }) => {
  const { isDarkMode, hasChecked } = useDarkModeDetection();
  const [showPopup, setShowPopup] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);
  
  useEffect(() => {
    if (!hasChecked) return;
    
    if (isDarkMode && !userDismissed) {
      setShowPopup(true);
    } else if (!isDarkMode) {
      setShowPopup(false);
    }
  }, [isDarkMode, hasChecked, userDismissed]);
  
  const handleDismiss = () => {
    setUserDismissed(true);
    setShowPopup(false);
  };
  
  useEffect(() => {
    if (!isDarkMode) {
      setUserDismissed(false);
    }
  }, [isDarkMode]);
  
  return (
    <>
      {children}
      {showPopup && <DarkModePopup onClose={handleDismiss} />}
    </>
  );
};

export default DarkModeWrapper; 