import { useState, useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { useVenuesStore } from '../../application/venuesStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faMapMarkerAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Venue } from '../../domain/Venue';

interface VenueSelectorProps {
  value: number | undefined;
  onChange: (venueId: number | undefined) => void;
  className?: string;
}

const VenueSelector = ({ value, onChange, className = '' }: VenueSelectorProps) => {
  const { venues, isLoading, error, fetchVenues, fetchMoreVenues, hasMore, total } = useVenuesStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Create a debounced API search function that only runs after 500ms of no typing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetchVenues = debounce((term: string) => {
    if (term.trim().length > 0) {
      fetchVenues({ name: term });
    }
  }, 500);
  
  // Fetch initial venues when component mounts - only once
  useEffect(() => {
    if (!initialFetchDone) {
      console.log('VenueSelector - Initial venue fetch');
      fetchVenues();
      setInitialFetchDone(true);
    }
    
    // Cleanup the debounce function when component unmounts
    return () => {
      debouncedFetchVenues.cancel();
    };
  }, [fetchVenues, debouncedFetchVenues, initialFetchDone]);
  
  // Filter venues locally based on search term
  useEffect(() => {
    console.log('VenueSelector - Current venues:', venues.length, 'of', total);
    
    if (!searchTerm) {
      setFilteredVenues(venues);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = venues.filter(venue => 
      venue.name.toLowerCase().includes(term) ||
      (venue.city && venue.city.toLowerCase().includes(term)) ||
      (venue.state && venue.state.toLowerCase().includes(term))
    );
    
    console.log(`VenueSelector - Filtered venues: ${filtered.length} out of ${venues.length}`);
    setFilteredVenues(filtered);
  }, [venues, searchTerm, total]);
  
  // Set search term to selected venue name when available
  useEffect(() => {
    if (value) {
      const selectedVenue = venues.find(v => v.id === value);
      if (selectedVenue && !searchTerm) {
        setSearchTerm(selectedVenue.name);
      }
    }
  }, [venues, value, searchTerm]);
  
  // Handle scrolling to load more venues
  const handleScroll = useCallback(() => {
    if (dropdownRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = dropdownRef.current;
      
      // If we're near the bottom (within 100px) and not already loading and there are more to load
      if (scrollHeight - scrollTop - clientHeight < 100 && !isLoading && hasMore) {
        console.log('VenueSelector - Scrolled near bottom, loading more venues');
        fetchMoreVenues();
      }
    }
  }, [fetchMoreVenues, isLoading, hasMore]);
  
  // Add scroll event listener to dropdown
  useEffect(() => {
    const dropdown = dropdownRef.current;
    
    if (isOpen && dropdown) {
      dropdown.addEventListener('scroll', handleScroll);
      return () => dropdown.removeEventListener('scroll', handleScroll);
    }
  }, [isOpen, handleScroll]);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsOpen(true);
    
    // Only trigger API search if term is meaningful
    if (term.trim().length > 2) {
      console.log('VenueSelector - Debounced search for:', term);
      debouncedFetchVenues(term);
    } else if (term.trim().length === 0) {
      // If search is cleared, reset to initial venues
      fetchVenues();
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="Search venues..."
          className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
        />
        <FontAwesomeIcon 
          icon={faSearch} 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
      </div>
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-light-bg-primary dark:bg-dark-bg-primary rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {isLoading && filteredVenues.length === 0 ? (
            <div className="p-4 text-center text-light-text-secondary dark:text-dark-text-secondary">
              <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
              Loading venues...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-cm-red">
              {error}
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="p-4 text-center text-light-text-secondary dark:text-dark-text-secondary">
              No venues found
            </div>
          ) : (
            <>
              <ul className="py-1">
                {filteredVenues.map(venue => (
                  <li
                    key={venue.id}
                    onClick={() => {
                      onChange(venue.id);
                      setSearchTerm(venue.name);
                      setIsOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary cursor-pointer flex items-center"
                  >
                    <FontAwesomeIcon 
                      icon={faMapMarkerAlt} 
                      className="mr-2 text-cm-red"
                    />
                    <span className="text-light-text-primary dark:text-dark-text-primary">
                      {venue.name}
                    </span>
                    {venue.city && venue.state && (
                      <span className="text-light-text-secondary dark:text-dark-text-secondary text-xs ml-2">
                        {venue.city}, {venue.state}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              
              {/* Show loading indicator at bottom when loading more */}
              {isLoading && filteredVenues.length > 0 && (
                <div className="p-2 text-center text-light-text-secondary dark:text-dark-text-secondary">
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  Loading more...
                </div>
              )}
              
              {/* Show count information */}
              {!isLoading && hasMore && (
                <div className="p-2 text-center text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  Showing {filteredVenues.length} of {total} venues. Scroll for more.
                </div>
              )}
              
              {/* Show all loaded message */}
              {!isLoading && !hasMore && filteredVenues.length > 0 && (
                <div className="p-2 text-center text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  Showing all {filteredVenues.length} venues.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VenueSelector; 