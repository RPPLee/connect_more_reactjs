import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/application/authStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCalendarAlt, faMap, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import ThemeToggle from '../common/ThemeToggle';
import SearchBar from '../common/SearchBar';
import FilterButton from '../common/FilterButton';
import { useState } from 'react';

// Extended User interface to include custom properties
interface ExtendedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isOrganizer?: boolean;
}

const Header = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Cast user to ExtendedUser to handle custom properties
  const userExtended = user as ExtendedUser | null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="bg-light-bg-secondary dark:bg-dark-bg-secondary text-light-text-primary dark:text-dark-text-primary shadow-md relative z-20">
      <div className="container mx-auto px-0 pr-4 py-2 flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="font-bold font-league-spartan">
            <img 
              src="/logo.svg" 
              alt="ConnectMore" 
              className="h-18 md:h-20" 
            />
          </Link>
        </div>
        
        <nav className="flex items-center space-x-4">
          <Link to="/events" className="hover:text-cm-blue dark:hover:text-cm-yellow transition-colors flex items-center">
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
            <span className="hidden md:inline">Events</span>
          </Link>
          
          <Link to="/map" className="hover:text-cm-blue dark:hover:text-cm-yellow transition-colors flex items-center">
            <FontAwesomeIcon icon={faMap} className="mr-2" />
            <span className="hidden md:inline">Map</span>
          </Link>
          
          <div className="flex items-center space-x-2">
            <SearchBar />
            <FilterButton />
            <ThemeToggle />
          </div>
          
          {isAuthenticated ? (
            <div className="relative ml-4">
              <button 
                className="flex items-center hover:text-cm-blue dark:hover:text-cm-yellow transition-colors"
                onClick={toggleMenu}
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                <span>{userExtended?.displayName || 'Account'}</span>
              </button>
              
              {menuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary rounded-md shadow-lg py-1 z-40">
                    {userExtended?.isOrganizer && (
                      <Link 
                        to="/organizer/dashboard" 
                        className="block px-4 py-2 hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary"
                        onClick={() => setMenuOpen(false)}
                      >
                        Organizer Dashboard
                      </Link>
                    )}
                    
                    <button 
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary flex items-center"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-x-4 flex items-center ml-4">
              <Link 
                to="/login" 
                className="hover:text-cm-blue dark:hover:text-cm-yellow transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-cm-blue hover:bg-blue-700 dark:bg-cm-red dark:hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header; 