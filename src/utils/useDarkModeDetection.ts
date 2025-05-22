import { useState, useEffect } from 'react';

export const useDarkModeDetection = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [hasChecked, setHasChecked] = useState<boolean>(false);

  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const checkDarkMode = (query: MediaQueryListEvent | MediaQueryList) => {
      setIsDarkMode(query.matches);
      setHasChecked(true);
    };

    checkDarkMode(darkModeQuery);

    const changeHandler = (event: MediaQueryListEvent) => {
      checkDarkMode(event);
    };

    darkModeQuery.addEventListener('change', changeHandler);
    
    return () => {
      darkModeQuery.removeEventListener('change', changeHandler);
    };
  }, []);

  return { isDarkMode, hasChecked };
};

export default useDarkModeDetection; 