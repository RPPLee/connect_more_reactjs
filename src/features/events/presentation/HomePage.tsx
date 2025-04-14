import { useEffect, useRef } from 'react';
import { useEventsStore } from '../application/eventsStore';
import { Event } from '../domain/Event';
import HeroCarousel from '../../../components/carousel/HeroCarousel';
import EventCarousel from '../../../components/carousel/EventCarousel';
// Import test API script
import '../../../services/testApi';

const HomePage = () => {
  const { 
    events = [], 
    featuredEvents = [], 
    superFeaturedEvents = [],
    metadata = null,
    isLoading, 
    error, 
    fetchEvents
  } = useEventsStore();
  
  // Use a ref to track if we've already attempted to fetch events
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    console.log('HomePage: Checking if events need to be fetched...');
    
    // Only fetch events if we don't have any yet AND we haven't tried fetching before
    const shouldFetchEvents = !hasFetchedRef.current && 
                             events.length === 0 && 
                             featuredEvents.length === 0 && 
                             superFeaturedEvents.length === 0 && 
                             !isLoading;
    
    if (shouldFetchEvents) {
      console.log('HomePage: Fetching events...');
      hasFetchedRef.current = true; // Mark that we've attempted to fetch
      fetchEvents({ homepage: true, upcoming: true, limit: 100 });
    } else {
      console.log('HomePage: Events already loaded or loading in progress, skipping fetch');
    }
    
    // IMPORTANT: Do not include array lengths in the dependency array
    // This was causing the infinite loop
  }, [isLoading, fetchEvents]);

  // Log events data for debugging
  useEffect(() => {
    console.log('Events data:', { events, featuredEvents, superFeaturedEvents, metadata, isLoading, error });
  }, [events, featuredEvents, superFeaturedEvents, metadata, isLoading, error]);

  // Show loading spinner only when no data is available
  if (isLoading && events.length === 0 && featuredEvents.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cm-blue dark:border-cm-yellow"></div>
      </div>
    );
  }

  // Group events by category
  const eventsByCategory: Record<string, Event[]> = {};
  
  // Safely handle undefined or null events
  if (events?.length) {
    events.forEach(event => {
      // Use category_name directly from the event data
      // The Lambda function returns category_name with each event
      const categoryName = event.category_name || 'Uncategorized';
      
      if (!eventsByCategory[categoryName]) {
        eventsByCategory[categoryName] = [];
      }
      
      eventsByCategory[categoryName].push(event);
    });
  }

  return (
    <div className="min-h-screen">
      {/* Hero Carousel for Super-Featured Events */}
      {superFeaturedEvents.length > 0 && (
        <HeroCarousel events={superFeaturedEvents} />
      )}
      
      <div className="container mx-auto px-4 py-8">
        {/* Debugging info - remove in production */}
        <div className="bg-yellow-100 dark:bg-yellow-800 p-4 mb-6 rounded-lg text-sm">
          <p>Status: {isLoading ? 'Loading...' : error ? 'Error' : events.length ? 'Loaded' : 'No events'}</p>
          <p>Events count: {events.length}</p>
          <p>Featured events: {featuredEvents.length}</p>
          <p>Super-featured events: {superFeaturedEvents.length}</p>
          <p>Categories: {metadata?.categories?.length || 0}</p>
          {error && <p>Error: {error}</p>}
        </div>
      
        {/* Category carousels */}
        {Object.entries(eventsByCategory).map(([category, categoryEvents]) => {
          // Find the category ID from the metadata or first event
          const categoryId = categoryEvents[0]?.category_id || 
                            metadata?.categories.find(c => c.category_name === category)?.id;
          
          return categoryEvents.length > 0 && (
            <EventCarousel 
              key={category}
              title={category}
              events={categoryEvents}
              viewAllLink={`/events?category_id=${categoryId}`}
            />
          );
        })}
        
        {/* Empty state */}
        {!isLoading && !error && Object.keys(eventsByCategory).length === 0 && (
          <div className="text-center my-16">
            <h2 className="text-2xl font-bold mb-4">No events found</h2>
            <p className="text-light-text-secondary dark:text-dark-text-secondary mb-8">
              Check back later for upcoming events.
            </p>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="text-cm-red text-center my-8">
            <p>Something went wrong: {error}</p>
            <button 
              onClick={() => {
                hasFetchedRef.current = false; // Reset the ref to allow fetching again
                fetchEvents({ homepage: true, upcoming: true, limit: 100 });
              }}
              className="mt-4 bg-cm-blue dark:bg-cm-red text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage; 