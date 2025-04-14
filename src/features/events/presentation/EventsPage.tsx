import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEventsStore } from '../application/eventsStore';
import { Event, EventFilterParams } from '../domain/Event';
import EventCard from './components/EventCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faFilter } from '@fortawesome/free-solid-svg-icons';

const EventsPage = () => {
  const { 
    events,
    metadata,
    isLoading,
    error,
    fetchEvents
  } = useEventsStore();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number | null>(null);
  
  // Use a ref to track the previous filter params to avoid unnecessary fetches
  const prevParamsRef = useRef<string>('');
  
  // Extract filter parameters from URL
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('category_id') ? Number(searchParams.get('category_id')) : undefined;
  const venueId = searchParams.get('venue_id') ? Number(searchParams.get('venue_id')) : undefined;
  const city = searchParams.get('city') || undefined;
  const state = searchParams.get('state') || undefined;
  const isVirtual = searchParams.get('is_virtual') === 'true' ? true : undefined;
  const dateStart = searchParams.get('date_start') || undefined;
  const dateEnd = searchParams.get('date_end') || undefined;
  
  // Set active tab based on category_id in URL
  useEffect(() => {
    if (categoryId) {
      setActiveTab(categoryId);
    } else if (metadata?.categories.length && !isFiltered()) {
      // Default to first category if no filters are active
      setActiveTab(metadata.categories[0].id);
    }
  }, [categoryId, metadata]);
  
  // Check if any filters are applied
  const isFiltered = () => {
    return !!(search || categoryId || venueId || city || state || isVirtual || dateStart || dateEnd);
  };
  
  // Fetch events on initial load or when filters change
  useEffect(() => {
    const params: EventFilterParams = {
      search,
      category_id: categoryId,
      venue_id: venueId,
      city,
      state,
      is_virtual: isVirtual,
      date_start: dateStart,
      date_end: dateEnd,
      upcoming: true,
      limit: 100
    };
    
    // Create a string representation of current parameters to compare
    const paramsString = JSON.stringify(params);
    
    // Only fetch if parameters have changed
    if (paramsString !== prevParamsRef.current) {
      console.log('EventsPage: Fetching events with params:', params);
      fetchEvents(params);
      prevParamsRef.current = paramsString;
    } else {
      console.log('EventsPage: Skipping fetch - parameters unchanged');
    }
  }, [fetchEvents, search, categoryId, venueId, city, state, isVirtual, dateStart, dateEnd]);
  
  // Handle tab change
  const handleTabChange = (tabId: number) => {
    setActiveTab(tabId);
    if (isFiltered()) {
      // If we have other filters, just update the category
      setSearchParams(prev => {
        prev.set('category_id', tabId.toString());
        return prev;
      });
    } else {
      // If no other filters, just set the category
      setSearchParams({ category_id: tabId.toString() });
    }
  };
  
  // Remove a filter
  const removeFilter = (key: string) => {
    setSearchParams(prev => {
      prev.delete(key);
      return prev;
    });
    
    // Reset active tab if removing category filter
    if (key === 'category_id') {
      if (metadata?.categories.length) {
        setActiveTab(metadata.categories[0].id);
      } else {
        setActiveTab(null);
      }
    }
  };
  
  // Clear all filters
  const clearAllFilters = () => {
    navigate('/events');
    
    if (metadata?.categories.length) {
      setActiveTab(metadata.categories[0].id);
    } else {
      setActiveTab(null);
    }
  };
  
  // Get events for current tab if filtered results aren't showing
  const getEventsForTab = (tabId: number | null) => {
    if (!tabId) return [];
    return events.filter(event => event.category_id === tabId);
  };
  
  // Get category name from ID (using API data)
  const getCategoryName = (id: number) => {
    if (!metadata) return 'Category';
    const category = metadata.categories.find(c => c.id === id);
    return category ? category.category_name : 'Category';
  };
  
  // Group events by subcategory for the active tab
  const getEventsBySubcategory = (events: Event[]) => {
    const result: Record<string, Event[]> = {};
    const subcategories = metadata?.subcategories.filter(sc => sc.category_id === activeTab) || [];
    
    // Create entry for each subcategory, even if empty
    subcategories.forEach(sc => {
      result[sc.subcategory_name] = [];
    });
    
    // Add "Other" for events without subcategory
    result['Other'] = [];
    
    // Populate subcategories
    events.forEach(event => {
      // Use subcategory_name directly from the event data when available
      if (event.subcategory_name) {
        if (!result[event.subcategory_name]) {
          result[event.subcategory_name] = [];
        }
        result[event.subcategory_name].push(event);
      } 
      // Fallback to subcategory_id lookup if necessary
      else if (event.subcategory_id) {
        const subcategory = subcategories.find(sc => sc.id === event.subcategory_id);
        if (subcategory) {
          if (!result[subcategory.subcategory_name]) {
            result[subcategory.subcategory_name] = [];
          }
          result[subcategory.subcategory_name].push(event);
        } else {
          result['Other'].push(event);
        }
      } else {
        result['Other'].push(event);
      }
    });
    
    // Remove empty subcategories
    Object.keys(result).forEach(key => {
      if (result[key].length === 0) {
        delete result[key];
      }
    });
    
    return result;
  };

  // Render filter pills
  const renderFilterPills = () => {
    if (!isFiltered()) return null;
    
    const filters: { key: string; label: string; value: string }[] = [];
    
    if (search) {
      filters.push({ key: 'search', label: 'Search', value: search });
    }
    
    if (categoryId !== undefined) {
      // Use event data to get category name if available
      const categoryEvent = events.find(e => e.category_id === categoryId);
      const categoryName = categoryEvent?.category_name || getCategoryName(categoryId);
      
      filters.push({ 
        key: 'category_id', 
        label: 'Category', 
        value: categoryName
      });
    }
    
    if (city) {
      filters.push({ key: 'city', label: 'City', value: city });
    }
    
    if (state) {
      filters.push({ key: 'state', label: 'State', value: state });
    }
    
    if (isVirtual) {
      filters.push({ key: 'is_virtual', label: 'Event Type', value: 'Virtual' });
    }
    
    if (dateStart) {
      filters.push({ 
        key: 'date_start', 
        label: 'From', 
        value: new Date(dateStart).toLocaleDateString() 
      });
    }
    
    if (dateEnd) {
      filters.push({ 
        key: 'date_end', 
        label: 'To', 
        value: new Date(dateEnd).toLocaleDateString() 
      });
    }
    
    return (
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <FontAwesomeIcon icon={faFilter} className="mr-2 text-cm-blue" />
          <h3 className="text-lg font-medium">Active Filters</h3>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filters.map(filter => (
            <div 
              key={filter.key}
              className="bg-light-bg-tertiary dark:bg-dark-bg-tertiary px-3 py-1 rounded-full flex items-center"
            >
              <span className="text-xs font-medium mr-1">{filter.label}:</span>
              <span className="text-xs">{filter.value}</span>
              <button 
                className="ml-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-cm-red dark:hover:text-cm-red"
                onClick={() => removeFilter(filter.key)}
                aria-label={`Remove ${filter.label} filter`}
              >
                <FontAwesomeIcon icon={faTimes} size="xs" />
              </button>
            </div>
          ))}
          
          <button 
            className="text-xs text-cm-blue dark:text-cm-yellow hover:underline"
            onClick={clearAllFilters}
          >
            Clear All
          </button>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading && events.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cm-blue dark:border-cm-yellow"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Events</h1>
      
      {/* Filter pills */}
      {renderFilterPills()}
      
      {/* Category tabs */}
      {metadata && metadata.categories.length > 0 && !isFiltered() && (
        <div className="mb-8">
          <div className="border-b border-light-border dark:border-dark-border overflow-x-auto hide-scrollbar">
            <div className="flex whitespace-nowrap">
              {metadata.categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleTabChange(category.id)}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === category.id
                      ? 'border-b-2 border-cm-blue dark:border-cm-yellow text-cm-blue dark:text-cm-yellow'
                      : 'text-light-text-secondary dark:text-dark-text-secondary'
                  }`}
                >
                  {category.category_name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="text-cm-red text-center my-8">
          <p>Something went wrong: {error}</p>
          <button 
            onClick={() => {
              const currentParams = {
                search, 
                category_id: categoryId,
                venue_id: venueId,
                city,
                state,
                upcoming: true 
              };
              // Reset previous params ref to force a new fetch
              prevParamsRef.current = '';
              fetchEvents(currentParams);
            }}
            className="mt-4 bg-cm-blue dark:bg-cm-red text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Filtered results */}
      {isFiltered() && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          
          {events.length === 0 ? (
            <div className="text-center my-8 p-8 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded-lg">
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                No events found matching your filters. Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Categories and subcategories when no filter is active */}
      {!isFiltered() && activeTab && (
        <>
          <h2 className="text-xl font-semibold mb-4">
            {/* Use the active tab's category name from an event if available */}
            {events.find(e => e.category_id === activeTab)?.category_name || getCategoryName(activeTab)} Events
          </h2>
          
          {Object.entries(getEventsBySubcategory(getEventsForTab(activeTab))).map(([subcategory, subcategoryEvents]) => (
            <div key={subcategory} className="mb-10">
              <h3 className="text-lg font-medium mb-4 text-light-text-secondary dark:text-dark-text-secondary">
                {subcategory}
              </h3>
              
              {subcategoryEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {subcategoryEvents.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <p className="text-light-text-secondary dark:text-dark-text-secondary">
                  No events in this subcategory.
                </p>
              )}
            </div>
          ))}
          
          {getEventsForTab(activeTab).length === 0 && (
            <div className="text-center my-8 p-8 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded-lg">
              <p className="text-light-text-secondary dark:text-dark-text-secondary">
                No events in this category. Check back later!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventsPage; 