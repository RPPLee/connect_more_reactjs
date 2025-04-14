import api from '../../../services/api';
import { Venue, VenuesResponse, VenueFilterParams } from '../domain/Venue';

// Use 'export type' for re-exporting types
export type { VenuesResponse };

export const venueRepository = {
  // Get venues with optional filtering
  getVenues: async (params?: VenueFilterParams): Promise<VenuesResponse> => {
    try {
      // Make the API call
      const response = await api.get('/venues', { params });
      
      console.log('Venues response from API:', response);
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // Case 1: Direct format - response already has venues and pagination
        if ('venues' in response && 'pagination' in response) {
          return response as VenuesResponse;
        }
        
        // Case 2: Wrapped in 'data' - common in some APIs but API interceptor should have handled this
        if ('data' in response && typeof response.data === 'object' && 'venues' in response.data) {
          return response.data as VenuesResponse;
        }
      }
      
      // Log unexpected response structure and return empty results
      console.warn('Unexpected venue API response structure:', response);
      return { venues: [], pagination: { total: 0, limit: 50, offset: 0 } };
    } catch (error) {
      console.error('Error fetching venues:', error);
      throw error;
    }
  },

  // Get a single venue by ID
  getVenue: async (venueId: number): Promise<Venue> => {
    try {
      const response = await api.get(`/venues/${venueId}`);
      
      console.log('Venue detail response:', response);
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // Case 1: Direct venue object with id
        if ('id' in response && response.id === venueId) {
          // Convert to unknown first to satisfy TypeScript
          return response as unknown as Venue;
        }
        
        // Case 2: Wrapped in a data property
        if ('data' in response && typeof response.data === 'object' && 'id' in response.data) {
          return response.data as unknown as Venue;
        }
      }
      
      throw new Error('Failed to retrieve venue data - unexpected response format');
    } catch (error) {
      console.error(`Error fetching venue ${venueId}:`, error);
      throw error;
    }
  }
}; 