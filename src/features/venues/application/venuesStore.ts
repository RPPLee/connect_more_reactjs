import { create } from 'zustand';
import { venueRepository } from '../data/venueRepository';
import { Venue, VenueFilterParams } from '../domain/Venue';

interface VenuesState {
  venues: Venue[];
  venue: Venue | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  lastSearchQuery: string | null;
  hasMore: boolean;
  
  // Actions
  fetchVenues: (params?: VenueFilterParams) => Promise<void>;
  fetchMoreVenues: () => Promise<void>;
  fetchVenue: (venueId: number) => Promise<void>;
  clearVenue: () => void;
}

export const useVenuesStore = create<VenuesState>(set => ({
  venues: [],
  venue: null,
  isLoading: false,
  error: null,
  total: 0,
  page: 0,
  limit: 50,
  lastSearchQuery: null,
  hasMore: true,
  
  // Fetch venues with optional filtering
  fetchVenues: async (params?: VenueFilterParams) => {
    // Don't reset venues while loading new ones, just set loading state
    set({ isLoading: true, error: null });
    
    try {
      console.log('VenuesStore - Fetching venues with params:', params);
      
      // Create a cache key from the search parameters
      const searchQuery = params?.name || '';
      
      // Check if we're doing the same search again to prevent unnecessary API calls
      let skipFetch = false;
      set(state => {
        skipFetch = searchQuery === state.lastSearchQuery && searchQuery !== '';
        return { lastSearchQuery: searchQuery };
      });
      
      if (skipFetch) {
        console.log('VenuesStore - Skipping duplicate search:', searchQuery);
        set({ isLoading: false });
        return;
      }
      
      // Reset pagination when doing a new search
      const apiParams = { 
        ...params,
        offset: 0,
        limit: 50
      };
      
      const response = await venueRepository.getVenues(apiParams);
      
      // Log the response structure for debugging
      console.log('VenuesStore - API response received with venues:', 
        response?.venues?.length,
        'total:', response?.pagination?.total);
      
      // Check if venues array exists and has data
      const venues = response.venues || [];
      
      // Check if pagination exists, use defaults if not
      const pagination = response.pagination || { total: venues.length, limit: 50, offset: 0 };
      
      // If this was a search or we have venues, replace them
      // Otherwise keep the current venues if we have any
      set(state => ({ 
        // Replace venues if we're searching, otherwise keep previous ones if this query returned no results
        venues: params?.name || venues.length > 0 ? venues : state.venues,
        total: pagination.total,
        page: 0, // Reset to first page
        limit: pagination.limit,
        isLoading: false,
        hasMore: venues.length < pagination.total
      }));
    } catch (error) {
      console.error('VenuesStore - Error fetching venues:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch venues', 
        isLoading: false 
      });
    }
  },
  
  // Load more venues (pagination)
  fetchMoreVenues: async () => {
    // Check if we're already loading or if there are no more venues to load
    let shouldFetch = false;
    let nextParams = {};
    
    set(state => {
      // Skip if already loading or no more items
      if (state.isLoading || !state.hasMore) {
        return { isLoading: state.isLoading };
      }
      
      // Determine the next page of results to fetch
      const nextPage = state.page + 1;
      const offset = nextPage * state.limit;
      
      nextParams = {
        name: state.lastSearchQuery || '',
        offset,
        limit: state.limit
      };
      
      shouldFetch = true;
      return { isLoading: true, error: null };
    });
    
    if (!shouldFetch) {
      return;
    }
    
    try {
      console.log('VenuesStore - Loading more venues with params:', nextParams);
      const response = await venueRepository.getVenues(nextParams as VenueFilterParams);
      
      // Check if venues array exists and has data
      const newVenues = response.venues || [];
      const pagination = response.pagination || { total: 0, limit: 50, offset: 0 };
      
      console.log(`VenuesStore - Loaded ${newVenues.length} more venues`);
      
      set(state => {
        // Append the new venues to the existing ones
        const updatedVenues = [...state.venues, ...newVenues];
        const nextPage = Math.floor(pagination.offset / pagination.limit);
        
        return {
          venues: updatedVenues,
          page: nextPage,
          total: pagination.total,
          isLoading: false,
          hasMore: updatedVenues.length < pagination.total
        };
      });
    } catch (error) {
      console.error('VenuesStore - Error fetching more venues:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch more venues', 
        isLoading: false 
      });
    }
  },
  
  // Fetch a single venue by ID
  fetchVenue: async (venueId: number) => {
    set({ isLoading: true, error: null });
    try {
      console.log(`VenuesStore - Fetching venue with ID: ${venueId}`);
      const venue = await venueRepository.getVenue(venueId);
      console.log('VenuesStore - Single venue data received:', venue);
      set({ venue, isLoading: false });
    } catch (error) {
      console.error('VenuesStore - Error fetching venue:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch venue', 
        isLoading: false 
      });
    }
  },
  
  // Clear the current venue
  clearVenue: () => {
    set({ venue: null });
  }
})); 