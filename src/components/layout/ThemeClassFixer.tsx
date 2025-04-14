import React, { useEffect } from 'react';

/**
 * This component applies theme classes directly to elements to work around 
 * Tailwind CSS class compilation issues.
 */
const ThemeClassFixer: React.FC = () => {
  useEffect(() => {
    // Define CSS rules to replace the problematic Tailwind classes
    const style = document.createElement('style');
    style.textContent = `
      .bg-light-bg-primary { background-color: #FFFFFF !important; }
      .bg-light-bg-secondary { background-color: #F5F5F5 !important; }
      .bg-light-bg-tertiary { background-color: #E5E5E5 !important; }
      .bg-dark-bg-primary { background-color: #121212 !important; }
      .bg-dark-bg-secondary { background-color: #1F1F1F !important; }
      .bg-dark-bg-tertiary { background-color: #2D2D2D !important; }
      .text-light-text-primary { color: #121212 !important; }
      .text-light-text-secondary { color: #333333 !important; }
      .text-dark-text-primary { color: #FFFFFF !important; }
      .text-dark-text-secondary { color: #AAAAAA !important; }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ThemeClassFixer; 