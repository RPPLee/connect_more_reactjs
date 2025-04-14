import api from '../../../services/api';
import { Event, EventFilterParams } from '../domain/Event';
import { Metadata } from '../domain/Metadata';
import { AxiosError } from 'axios';
import { cacheService } from '../../../services/cacheService';

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

export interface EventsResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
  metadata?: Metadata;
}

// Cache keys
const CACHE_KEYS = {
  EVENTS_LIST: 'events:list',
  EVENT_DETAIL: 'events:detail',
  METADATA: 'events:metadata',
}

// TTL values (in milliseconds)
const CACHE_TTL = {
  EVENTS: 15 * 60 * 1000, // 15 minutes for events list
  EVENT_DETAIL: 30 * 60 * 1000, // 30 minutes for event details
  METADATA: 24 * 60 * 60 * 1000, // 24 hours for metadata (categories, etc.)
}

export const eventRepository = {
  // Get events with optional filtering
  getEvents: async (params?: EventFilterParams): Promise<EventsResponse> => {
    try {
      console.log('Fetching events with params:', params);
      
      // Check if we should use cache for this request
      const shouldCache = !params?.offset; // Don't cache paginated results beyond first page
      
      // For homepage requests with metadata, try to get metadata from cache first
      if (params?.homepage) {
        const cachedMetadata = cacheService.get<Metadata>(CACHE_KEYS.METADATA);
        
        if (cachedMetadata) {
          console.log('Using cached metadata');
        }
      }
      
      // Generate cache key based on params
      const cacheKey = shouldCache 
        ? `${CACHE_KEYS.EVENTS_LIST}:${JSON.stringify(params || {})}`
        : '';
      
      // Try to get from cache first
      if (shouldCache) {
        const cachedData = cacheService.get<EventsResponse>(cacheKey);
        if (cachedData) {
          console.log('Using cached events data');
          return cachedData;
        }
      }
      
      // If not in cache or shouldn't be cached, fetch from API
      const response = await api.get('/events', { params });
      
      console.log('Events API response structure:', response);
      
      // Handle different API response structures
      let result: EventsResponse;
      
      // If response directly has the expected properties without going through response.data
      if (response && typeof response === 'object') {
        // Check for events directly in response
        if ('events' in response && Array.isArray(response.events)) {
          console.log('Found events directly in response');
          const eventList = response.events;
          
          // Safely access pagination and metadata
          const pagination = 'pagination' in response && typeof response.pagination === 'object' 
            ? response.pagination as Pagination 
            : null;
            
          const metadata = 'metadata' in response && typeof response.metadata === 'object'
            ? response.metadata as Metadata
            : undefined;
            
          result = {
            events: eventList,
            total: pagination?.total || eventList.length,
            page: 1,
            limit: pagination?.limit || eventList.length,
            metadata: metadata
          };
        }
        
        // Check for nested data structure
        else if ('data' in response && response.data) {
          const data = response.data;
          
          // Check for events in data
          if ('events' in data && Array.isArray(data.events)) {
            console.log('Found events in response.data');
            const eventList = data.events;
            
            // Safely access pagination and metadata
            const pagination = 'pagination' in data && typeof data.pagination === 'object' 
              ? data.pagination as Pagination 
              : null;
              
            const metadata = 'metadata' in data && typeof data.metadata === 'object'
              ? data.metadata as Metadata
              : undefined;
              
            result = {
              events: eventList,
              total: pagination?.total || eventList.length,
              page: 1,
              limit: pagination?.limit || eventList.length,
              metadata: metadata
            };
          }
          else {
            // Fallback if response format is unexpected
            console.warn('Unexpected API response format in data property:', data);
            result = {
              events: [],
              total: 0,
              page: 1,
              limit: 10
            };
          }
        }
        // If response is an array, treat it as events
        else if (Array.isArray(response)) {
          console.log('API returned array of events');
          result = {
            events: response,
            total: response.length,
            page: 1,
            limit: response.length
          };
        }
        else {
          // Fallback if response format is unexpected
          console.warn('Unexpected API response format:', response);
          result = {
            events: [],
            total: 0,
            page: 1,
            limit: 10
          };
        }
      }
      else {
        // Fallback if response is not an object
        console.warn('API response is not an object:', response);
        result = {
          events: [],
          total: 0,
          page: 1,
          limit: 10
        };
      }
      
      // Cache the result if applicable
      if (shouldCache) {
        cacheService.set(cacheKey, result, CACHE_TTL.EVENTS);
        
        // If metadata is included, cache it separately with longer TTL
        if (result.metadata) {
          cacheService.set(CACHE_KEYS.METADATA, result.metadata, CACHE_TTL.METADATA);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Get metadata (categories, subcategories, tags)
  getMetadata: async (): Promise<Metadata | null> => {
    try {
      // Try to get from cache first
      const cachedMetadata = cacheService.get<Metadata>(CACHE_KEYS.METADATA);
      if (cachedMetadata) {
        console.log('Using cached metadata');
        return cachedMetadata;
      }
      
      // If not in cache, try to fetch it via homepage events request
      console.log('Fetching metadata from API');
      const response = await eventRepository.getEvents({ 
        homepage: true,
        limit: 1 // Minimize data transfer since we just need metadata
      });
      
      if (response.metadata) {
        // Cache the metadata with longer TTL
        cacheService.set(CACHE_KEYS.METADATA, response.metadata, CACHE_TTL.METADATA);
        return response.metadata;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return null;
    }
  },

  // Get a single event instance by instance_id
  getEvent: async (eventId: number): Promise<Event> => {
    try {
      console.log(`Fetching event with ID: ${eventId}`);
      
      // Try to get from cache first
      const cacheKey = `${CACHE_KEYS.EVENT_DETAIL}:${eventId}`;
      const cachedEvent = cacheService.get<Event>(cacheKey);
      
      if (cachedEvent) {
        console.log(`Using cached event data for ID: ${eventId}`);
        return cachedEvent;
      }
      
      // If not in cache, fetch from API
      const response = await api.get(`/events/${eventId}`);
      
      console.log('Event API response structure:', response);
      
      let result: Event;
      
      // Handle different API response structures
      if (response && typeof response === 'object') {
        // Check for direct event object
        if ('event_id' in response || 'id' in response) {
          result = response as unknown as Event;
        }
        // Check for event in .data property
        else if ('data' in response && typeof response.data === 'object') {
          if ('event_id' in response.data || 'id' in response.data) {
            result = response.data as unknown as Event;
          }
          else {
            throw new Error('Unexpected response format - unable to extract event data');
          }
        }
        else {
          throw new Error('Unexpected response format - unable to extract event data');
        }
        
        // Cache the result
        cacheService.set(cacheKey, result, CACHE_TTL.EVENT_DETAIL);
        
        return result;
      }
      
      throw new Error('Unexpected response format - unable to extract event data');
    } catch (error) {
      console.error(`Error fetching event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Create a new event
  createEvent: async (eventData: Partial<Event>): Promise<Event> => {
    // Debug what we're sending
    console.log('Creating event with data:', JSON.stringify(eventData, null, 2));
    
    // Check for important fields
    if (!eventData.organizer_id) {
      console.error('Missing organizer_id in event data');
    }
    
    try {
      // Call the create_event lambda function
      const result = await api.post('/events', eventData);
      console.log('Event creation successful, received:', result);
      
      // Invalidate events list cache as we've added a new event
      cacheService.removeByPrefix(CACHE_KEYS.EVENTS_LIST);
      
      const eventId = result.data?.id || result.data?.event_id;
      
      if (eventId) {
        // Cache the new event
        cacheService.set(
          `${CACHE_KEYS.EVENT_DETAIL}:${eventId}`, 
          result.data, 
          CACHE_TTL.EVENT_DETAIL
        );
      }
      
      return result.data;
    } catch (error: unknown) {
      console.error('Event creation failed with error:', error);
      if (error instanceof AxiosError && error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      } else if (error instanceof AxiosError && error.request) {
        console.error('No response received, request was:', error.request);
      } else {
        console.error('Error message:', error instanceof Error ? error.message : String(error));
      }
      throw error;
    }
  },

  // Update an existing event
  updateEvent: async (eventId: number, eventData: Partial<Event>): Promise<Event> => {
    try {
      const result = await api.put(`/events/${eventId}`, eventData);
      
      // Invalidate affected caches
      cacheService.remove(`${CACHE_KEYS.EVENT_DETAIL}:${eventId}`);
      cacheService.removeByPrefix(CACHE_KEYS.EVENTS_LIST);
      
      // Cache the updated event
      cacheService.set(
        `${CACHE_KEYS.EVENT_DETAIL}:${eventId}`, 
        result.data || result, 
        CACHE_TTL.EVENT_DETAIL
      );
      
      return result.data || result;
    } catch (error) {
      console.error(`Error updating event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Delete an event
  deleteEvent: async (eventId: number): Promise<void> => {
    try {
      await api.delete(`/events/${eventId}`);
      
      // Invalidate affected caches
      cacheService.remove(`${CACHE_KEYS.EVENT_DETAIL}:${eventId}`);
      cacheService.removeByPrefix(CACHE_KEYS.EVENTS_LIST);
    } catch (error) {
      console.error(`Error deleting event with ID ${eventId}:`, error);
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
    try {
      const response = await api.post(`/events/${instanceId}/register`, registrationData);
      
      // Invalidate affected caches to reflect updated attendee counts
      cacheService.remove(`${CACHE_KEYS.EVENT_DETAIL}:${eventId}`);
      cacheService.removeByPrefix(CACHE_KEYS.EVENTS_LIST);
      
      return response.data || response;
    } catch (error) {
      console.error(`Error registering for event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Cancel registration for an event instance
  cancelRegistration: async (eventId: number, instanceId: number): Promise<void> => {
    try {
      await api.delete(`/events/${instanceId}/register`);
      
      // Invalidate affected caches to reflect updated attendee counts
      cacheService.remove(`${CACHE_KEYS.EVENT_DETAIL}:${eventId}`);
      cacheService.removeByPrefix(CACHE_KEYS.EVENTS_LIST);
    } catch (error) {
      console.error(`Error canceling registration for event with ID ${eventId}:`, error);
      throw error;
    }
  },

  // Get waitlist status
  getWaitlistStatus: async (eventId: number, instanceId: number): Promise<Record<string, unknown>> => {
    // This is typically user-specific so we don't cache it
    return api.get(`/events/${instanceId}/waitlist`);
  },
}; 