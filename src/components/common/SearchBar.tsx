import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

const SearchBar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const navigate = useNavigate();
  const location = useLocation();

  // Update search term when URL changes
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Navigate to events page with search parameter if not already there
    if (location.pathname !== '/events') {
      navigate(`/events?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      // Update existing search params
      const newParams = new URLSearchParams(searchParams);
      if (searchTerm.trim()) {
        newParams.set('search', searchTerm.trim());
      } else {
        newParams.delete('search');
      }
      setSearchParams(newParams);
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    
    if (location.pathname === '/events') {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('search');
      setSearchParams(newParams);
    }
  };
  
  return (
    <form 
      onSubmit={handleSubmit}
      className="relative"
    >
      <div className="relative flex items-center">
        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="py-1 pl-8 pr-8 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-cm-blue dark:focus:ring-cm-yellow w-32 md:w-40 lg:w-48 transition-all focus:w-48 md:focus:w-56 lg:focus:w-64"
        />
        
        <button 
          type="submit"
          className="absolute left-2 text-light-text-secondary dark:text-dark-text-secondary"
          aria-label="Search"
        >
          <FontAwesomeIcon icon={faSearch} size="sm" />
        </button>
        
        {searchTerm && (
          <button 
            type="button"
            onClick={clearSearch}
            className="absolute right-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-cm-red dark:hover:text-cm-red"
            aria-label="Clear search"
          >
            <FontAwesomeIcon icon={faTimes} size="sm" />
          </button>
        )}
      </div>
    </form>
  );
};

export default SearchBar; 