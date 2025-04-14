import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full hover:bg-dark-bg-tertiary dark:hover:bg-light-bg-tertiary transition-colors"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <FontAwesomeIcon 
          icon={faSun} 
          className="h-5 w-5 text-cm-yellow" 
          title="Switch to light mode"
        />
      ) : (
        <FontAwesomeIcon 
          icon={faMoon} 
          className="h-5 w-5 text-cm-blue" 
          title="Switch to dark mode"
        />
      )}
    </button>
  );
};

export default ThemeToggle; 