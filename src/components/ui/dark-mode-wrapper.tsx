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
  
  // Hiển thị popup khi dark mode được bật
  useEffect(() => {
    if (!hasChecked) return;
    
    if (isDarkMode && !userDismissed) {
      setShowPopup(true);
    } else if (!isDarkMode) {
      // Tự động ẩn popup khi người dùng đã chuyển sang light mode
      setShowPopup(false);
    }
  }, [isDarkMode, hasChecked, userDismissed]);
  
  const handleDismiss = () => {
    // Chỉ ẩn popup nhưng không nhớ trạng thái
    setUserDismissed(true);
    setShowPopup(false);
  };
  
  // Reset trạng thái userDismissed khi người dùng chuyển từ light mode sang dark mode
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