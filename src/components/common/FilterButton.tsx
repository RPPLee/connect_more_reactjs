import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useEventsStore } from '../../features/events/application/eventsStore';

const FilterButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Get metadata for categories
  const { metadata } = useEventsStore();
  
  // Filter state
  const [filters, setFilters] = useState({
    category_id: searchParams.get('category_id') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    is_virtual: searchParams.get('is_virtual') === 'true',
    date_start: searchParams.get('date_start') || '',
    date_end: searchParams.get('date_end') || '',
  });
  
  // Count active filters
  const activeFilterCount = Object.values(filters).filter(val => 
    val !== '' && val !== false
  ).length;
  
  // Handle outside click to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Update filters when URL changes
  useEffect(() => {
    setFilters({
      category_id: searchParams.get('category_id') || '',
      city: searchParams.get('city') || '',
      state: searchParams.get('state') || '',
      is_virtual: searchParams.get('is_virtual') === 'true',
      date_start: searchParams.get('date_start') || '',
      date_end: searchParams.get('date_end') || '',
    });
  }, [searchParams]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };
  
  // Apply filters
  const applyFilters = () => {
    // Navigate to events page with filter parameters if not already there
    if (location.pathname !== '/events') {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.set(key, value.toString());
        }
      });
      
      navigate(`/events?${params.toString()}`);
    } else {
      // Update existing search params
      const newParams = new URLSearchParams(searchParams);
      
      // First clear existing filter params (except search)
      ['category_id', 'city', 'state', 'is_virtual', 'date_start', 'date_end'].forEach(key => {
        newParams.delete(key);
      });
      
      // Then add new ones
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          newParams.set(key, value.toString());
        }
      });
      
      setSearchParams(newParams);
    }
    
    setIsOpen(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      category_id: '',
      city: '',
      state: '',
      is_virtual: false,
      date_start: '',
      date_end: '',
    });
  };
  
  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary text-light-text-primary dark:text-dark-text-primary transition-colors ${
          activeFilterCount > 0 ? 'bg-cm-blue/20 dark:bg-cm-yellow/20' : ''
        }`}
        aria-label="Filter events"
      >
        <div className="relative">
          <FontAwesomeIcon icon={faFilter} className="h-5 w-5" />
          {activeFilterCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-cm-blue dark:bg-cm-yellow text-white dark:text-black rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
              {activeFilterCount}
            </div>
          )}
        </div>
      </button>
      
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute right-0 mt-2 w-72 bg-white dark:bg-dark-bg-primary shadow-lg rounded-lg overflow-hidden z-50 border border-light-border dark:border-dark-border"
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Filter Events</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-light-text-secondary dark:text-dark-text-secondary hover:text-cm-red dark:hover:text-cm-red"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Category filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  name="category_id"
                  value={filters.category_id}
                  onChange={handleInputChange}
                  className="w-full p-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded text-sm border-0"
                >
                  <option value="">All Categories</option>
                  {metadata?.categories.map(category => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Location filters */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={filters.city}
                    onChange={handleInputChange}
                    placeholder="Any city"
                    className="w-full p-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded text-sm border-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State</label>
                  <input
                    type="text"
                    name="state"
                    value={filters.state}
                    onChange={handleInputChange}
                    placeholder="Any state"
                    className="w-full p-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded text-sm border-0"
                  />
                </div>
              </div>
              
              {/* Virtual event toggle */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_virtual"
                  name="is_virtual"
                  checked={filters.is_virtual}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-cm-blue dark:text-cm-yellow rounded border-gray-300 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                />
                <label htmlFor="is_virtual" className="ml-2 text-sm">
                  Virtual events only
                </label>
              </div>
              
              {/* Date range */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">From</label>
                  <input
                    type="date"
                    name="date_start"
                    value={filters.date_start}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded text-sm border-0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To</label>
                  <input
                    type="date"
                    name="date_end"
                    value={filters.date_end}
                    onChange={handleInputChange}
                    className="w-full p-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded text-sm border-0"
                  />
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-between pt-2">
                <button
                  onClick={resetFilters}
                  className="px-3 py-2 text-sm hover:underline text-light-text-secondary dark:text-dark-text-secondary"
                >
                  Reset
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 bg-cm-blue dark:bg-cm-yellow text-white dark:text-black rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-yellow-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterButton; 