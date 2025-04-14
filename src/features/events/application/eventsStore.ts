import { create } from 'zustand';
import { eventRepository, EventsResponse } from '../data/eventRepository';
import { Event, EventFilterParams } from '../domain/Event';
import { Metadata } from '../domain/Metadata';
import { isEqual } from 'lodash';

interface EventsState {
  events: Event[];
  featuredEvents: Event[];
  superFeaturedEvents: Event[];
  event: Event | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  metadata: Metadata | null;
  lastFetchParams: EventFilterParams | null;
  
  // Actions
  fetchEvents: (params?: EventFilterParams) => Promise<void>;
  fetchFeaturedEvents: () => Promise<void>;
  fetchEvent: (eventId: number) => Promise<void>;
  fetchMetadata: () => Promise<void>;
  createEvent: (eventData: Partial<Event>) => Promise<Event>;
  updateEvent: (eventId: number, eventData: Partial<Event>) => Promise<Event>;
  deleteEvent: (eventId: number) => Promise<void>;
  registerForEvent: (
    eventId: number,
    instanceId: number,
    registrationData: {
      attendee_name: string;
      attendee_email: string;
      attendee_phone?: string;
      num_tickets: number;
    }
  ) => Promise<Record<string, unknown>>;
  cancelRegistration: (eventId: number, instanceId: number) => Promise<void>;
  getWaitlistStatus: (eventId: number, instanceId: number) => Promise<Record<string, unknown>>;
  clearEvent: () => void;
  updateAllEvents: (eventData: Partial<Event>) => Promise<void>;
}

// Mock data for testing when API is unavailable
const mockEvents: Event[] = [
  {
    event_id: 1,
    title: 'Tech Meetup',
    description: 'A meetup for tech enthusiasts',
    organizer_id: 1,
    venue_id: 1,
    category_id: 7,
    is_featured: true,
    instances: [
      {
        id: 1,
        date: '2024-05-20',
        start_time: '18:00:00',
        end_time: '20:00:00',
        capacity: 100,
        current_attendees: 50,
        is_soldout: false,
        has_waitlist: false
      }
    ],
    venue_name: 'Innovation Depot',
    venue_address: '1500 1st Ave N',
    venue_city: 'Birmingham',
    venue_state: 'AL',
    venue_postal_code: '35203',
    venue_lat: 33.5116,
    venue_lng: -86.8122,
    is_virtual: false,
    tickets_available: true,
    currency: 'USD'
  },
  {
    id: 2,
    event_id: 2,
    title: 'Music in the Park',
    description: 'Live music performances in the park',
    organizer_id: 2,
    venue_id: 2,
    category_id: 1,
    is_featured: true,
    instances: [
      {
        id: 2,
        date: '2024-05-22',
        start_time: '19:00:00',
        end_time: '22:00:00',
        capacity: 200,
        current_attendees: 120,
        is_soldout: false,
        has_waitlist: false
      }
    ],
    venue_name: 'Railroad Park',
    venue_address: '1600 1st Ave S',
    venue_city: 'Birmingham',
    venue_state: 'AL',
    venue_postal_code: '35233',
    venue_lat: 33.5077,
    venue_lng: -86.8098,
    is_virtual: false,
    tickets_available: true,
    currency: 'USD'
  },
  {
    id: 3,
    event_id: 3,
    title: 'Business Networking',
    description: 'Connect with local business leaders',
    organizer_id: 1,
    venue_id: 3,
    category_id: 2,
    is_featured: false,
    instances: [
      {
        id: 3,
        date: '2024-05-25',
        start_time: '08:00:00',
        end_time: '10:00:00',
        capacity: 50,
        current_attendees: 35,
        is_soldout: false,
        has_waitlist: false
      }
    ],
    venue_name: 'Regions Field',
    venue_address: '1401 1st Ave S',
    venue_city: 'Birmingham',
    venue_state: 'AL',
    venue_postal_code: '35233',
    venue_lat: 33.5066,
    venue_lng: -86.8146,
    is_virtual: false,
    tickets_available: true,
    currency: 'USD'
  }
];

export const useEventsStore = create<EventsState>((set, get) => ({
  events: [],
  featuredEvents: [],
  superFeaturedEvents: [],
  event: null,
  isLoading: false,
  error: null,
  total: 0,
  page: 0,
  limit: 10,
  metadata: null,
  lastFetchParams: null,
  
  // Fetch multiple events with optional filtering
  fetchEvents: async (params?: EventFilterParams) => {
    // Prevent redundant fetches with same parameters
    const currentParams = params || {};
    const lastParams = get().lastFetchParams;
    
    // Skip if already loading
    if (get().isLoading) {
      console.log('EventsStore: Already loading events, skipping fetch');
      return;
    }
    
    // Skip if params haven't changed and we already have data
    if (lastParams && isEqual(lastParams, currentParams) && get().events.length > 0) {
      console.log('EventsStore: Same parameters, using cached events');
      return;
    }
    
    set({ isLoading: true, error: null, lastFetchParams: currentParams });
    try {
      console.log('EventsStore: Fetching events with params:', currentParams);
      const response: EventsResponse = await eventRepository.getEvents(params);
      
      // If homepage is true, separate featured and super-featured events
      if (params?.homepage) {
        const featured = response.events.filter(event => event.is_featured && !event.is_super_featured);
        const superFeatured = response.events.filter(event => event.is_super_featured);
        
        set({
          events: response.events,
          featuredEvents: featured,
          superFeaturedEvents: superFeatured,
          metadata: response.metadata || null,
          total: response.total,
          page: response.page,
          limit: response.limit,
          isLoading: false
        });
      } 
      // If category_id is provided, replace only events of that category
      else if (params?.category_id !== undefined) {
        const categoryId = params.category_id;
        const currentEvents = get().events;
        
        // Filter out events of the same category to be replaced
        const otherCategoryEvents = currentEvents.filter(event => event.category_id !== categoryId);
        
        // Combine with the new events of the requested category
        const updatedEvents = [...otherCategoryEvents, ...response.events];
        
        set({ 
          events: updatedEvents,
          total: response.total,
          page: response.page,
          limit: response.limit,
          isLoading: false
        });
      }
      // Default case for normal event fetching (no homepage, no category)
      else {
        set({ 
          events: response.events,
          total: response.total,
          page: response.page,
          limit: response.limit,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Failed to fetch events from API, using mock data instead:', error);
      // Use mock data if the API is down
      set({ 
        events: mockEvents,
        total: mockEvents.length,
        page: 1,
        limit: 10,
        isLoading: false,
        error: 'Using sample data - API connection failed'
      });
    }
  },
  
  // Fetch featured events
  fetchFeaturedEvents: async () => {
    // Skip if already loading
    if (get().isLoading) return;
    
    // Skip if we already have featured events
    if (get().featuredEvents.length > 0) {
      console.log('EventsStore: Already have featured events, skipping fetch');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const response: EventsResponse = await eventRepository.getEvents({ 
        is_featured: true,
        upcoming: true,
        limit: 10
      });
      
      const featured = response.events.filter(event => event.is_featured && !event.is_super_featured);
      const superFeatured = response.events.filter(event => event.is_super_featured);
      
      set({ 
        featuredEvents: featured,
        superFeaturedEvents: superFeatured,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to fetch featured events, using mock data instead:', error);
      // Use mock data if the API is down
      const featured = mockEvents.filter(event => event.is_featured && !event.is_super_featured);
      const superFeatured = mockEvents.filter(event => event.is_super_featured);
      
      set({ 
        featuredEvents: featured,
        superFeaturedEvents: superFeatured,
        isLoading: false,
        error: 'Using sample data - API connection failed'
      });
    }
  },
  
  // Fetch a single event by ID
  fetchEvent: async (eventId: number) => {
    set({ isLoading: true, error: null });
    try {
      const event = await eventRepository.getEvent(eventId);
      set({ event, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch event details, using mock data if available:', error);
      // Try to find the event in mock data
      const mockEvent = mockEvents.find(e => e.event_id === eventId);
      if (mockEvent) {
        set({ event: mockEvent, isLoading: false, error: 'Using sample data - API connection failed' });
      } else {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch event details', 
          isLoading: false 
        });
      }
    }
  },
  
  // Fetch metadata (categories, subcategories, tags)
  fetchMetadata: async () => {
    // Skip if already loading to prevent loops
    if (get().isLoading) {
      console.log('EventsStore: Already loading, skipping metadata fetch');
      return;
    }
    
    // Skip if we already have metadata
    if (get().metadata) {
      console.log('EventsStore: Already have metadata, skipping fetch');
      return;
    }
    
    set({ isLoading: true, error: null });
    try {
      const metadata = await eventRepository.getMetadata();
      
      if (metadata) {
        set({ metadata, isLoading: false });
      } else {
        // Don't call fetchEvents here as it creates a loop with HomePage.tsx
        // Instead just log that we couldn't find metadata
        console.log('No metadata found in cache, it will be loaded via homepage');
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch metadata', 
        isLoading: false 
      });
    }
  },
  
  // Create a new event
  createEvent: async (eventData: Partial<Event>): Promise<Event> => {
    set({ isLoading: true, error: null });
    try {
      const event = await eventRepository.createEvent(eventData);
      set({ isLoading: false });
      return event;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create event', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Update an existing event
  updateEvent: async (eventId: number, eventData: Partial<Event>): Promise<Event> => {
    set({ isLoading: true, error: null });
    try {
      const event = await eventRepository.updateEvent(eventId, eventData);
      // If the current event is the one being updated, update it in the state
      if (get().event?.event_id === eventId) {
        set({ event });
      }
      set({ isLoading: false });
      return event;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update event', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Delete an event
  deleteEvent: async (eventId: number): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await eventRepository.deleteEvent(eventId);
      // If the current event is the one being deleted, clear it from state
      if (get().event?.event_id === eventId) {
        set({ event: null });
      }
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete event', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Register for an event instance
  registerForEvent: async (
    eventId: number,
    instanceId: number,
    registrationData: {
      attendee_name: string;
      attendee_email: string;
      attendee_phone?: string;
      num_tickets: number;
    }
  ): Promise<Record<string, unknown>> => {
    set({ isLoading: true, error: null });
    try {
      const response = await eventRepository.registerForEvent(eventId, instanceId, registrationData);
      
      // Update the current event's instance attendee count if it's the one being registered for
      if (get().event?.event_id === eventId) {
        const currentEvent = get().event;
        if (currentEvent) {
          const updatedInstances = currentEvent.instances?.map(instance => {
            if (instance.id === instanceId) {
              return {
                ...instance,
                current_attendees: (instance.current_attendees || 0) + registrationData.num_tickets
              };
            }
            return instance;
          }) || [];
          
          set({ 
            event: {
              ...currentEvent,
              instances: updatedInstances
            }
          });
        }
      }
      
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to register for event', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Cancel registration for an event instance
  cancelRegistration: async (eventId: number, instanceId: number): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await eventRepository.cancelRegistration(eventId, instanceId);
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to cancel registration', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Get waitlist status
  getWaitlistStatus: async (eventId: number, instanceId: number): Promise<Record<string, unknown>> => {
    set({ isLoading: true, error: null });
    try {
      const response = await eventRepository.getWaitlistStatus(eventId, instanceId);
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to get waitlist status', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Clear the current event
  clearEvent: () => {
    set({ event: null });
  }
})); 