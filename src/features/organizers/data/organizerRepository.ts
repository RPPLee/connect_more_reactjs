import api from '../../../services/api';
import { Organizer } from '../domain/Organizer';
import { cacheService } from '../../../services/cacheService';

export interface OrganizersResponse {
  organizers: Organizer[];
  total: number;
  page: number;
  limit: number;
}

// Cache keys
const CACHE_KEYS = {
  ORGANIZERS_LIST: 'organizers:list',
  ORGANIZER_DETAIL: 'organizers:detail',
}

// TTL values (in milliseconds)
const CACHE_TTL = {
  ORGANIZERS: 30 * 60 * 1000, // 30 minutes for organizers list
  ORGANIZER_DETAIL: 60 * 60 * 1000, // 1 hour for organizer details
}

export const organizerRepository = {
  // Get all organizers
  getOrganizers: async (params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<OrganizersResponse> => {
    try {
      // Check if we should use cache for this request
      const shouldCache = !params?.offset; // Don't cache paginated results
      
      // Generate cache key based on params
      const cacheKey = shouldCache 
        ? `${CACHE_KEYS.ORGANIZERS_LIST}:${JSON.stringify(params || {})}`
        : '';
      
      // Try to get from cache first
      if (shouldCache) {
        const cachedData = cacheService.get<OrganizersResponse>(cacheKey);
        if (cachedData) {
          console.log('Using cached organizers data');
          return cachedData;
        }
      }
      
      // If not in cache or shouldn't be cached, fetch from API
      const response = await api.get('/organizers', { params });
      
      // Extract data
      const result = response.data || response;
      
      // Cache the result if applicable
      if (shouldCache) {
        cacheService.set(cacheKey, result, CACHE_TTL.ORGANIZERS);
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching organizers:', error);
      throw error;
    }
  },

  // Get a single organizer by ID
  getOrganizer: async (organizerId: number): Promise<Organizer> => {
    try {
      // Try to get from cache first
      const cacheKey = `${CACHE_KEYS.ORGANIZER_DETAIL}:${organizerId}`;
      const cachedOrganizer = cacheService.get<Organizer>(cacheKey);
      
      if (cachedOrganizer) {
        console.log(`Using cached organizer data for ID: ${organizerId}`);
        return cachedOrganizer;
      }
      
      // If not in cache, fetch from API
      const response = await api.get(`/organizers/${organizerId}`);
      
      // Extract data
      const result = response.data || response;
      
      // Cache the result
      cacheService.set(cacheKey, result, CACHE_TTL.ORGANIZER_DETAIL);
      
      return result;
    } catch (error) {
      console.error(`Error fetching organizer with ID ${organizerId}:`, error);
      throw error;
    }
  },

  // Create a new organizer
  createOrganizer: async (organizerData: Partial<Organizer>): Promise<Organizer> => {
    try {
      const response = await api.post('/organizers', organizerData);
      
      // Invalidate organizers list cache
      cacheService.removeByPrefix(CACHE_KEYS.ORGANIZERS_LIST);
      
      // Extract data
      const result = response.data || response;
      
      // Cache the new organizer if it has an ID
      if (result.id) {
        cacheService.set(
          `${CACHE_KEYS.ORGANIZER_DETAIL}:${result.id}`,
          result,
          CACHE_TTL.ORGANIZER_DETAIL
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error creating organizer:', error);
      throw error;
    }
  },

  // Update an existing organizer
  updateOrganizer: async (organizerId: number, organizerData: Partial<Organizer>): Promise<Organizer> => {
    try {
      const response = await api.put(`/organizers/${organizerId}`, organizerData);
      
      // Invalidate affected caches
      cacheService.remove(`${CACHE_KEYS.ORGANIZER_DETAIL}:${organizerId}`);
      cacheService.removeByPrefix(CACHE_KEYS.ORGANIZERS_LIST);
      
      // Extract data
      const result = response.data || response;
      
      // Cache the updated organizer
      cacheService.set(
        `${CACHE_KEYS.ORGANIZER_DETAIL}:${organizerId}`,
        result,
        CACHE_TTL.ORGANIZER_DETAIL
      );
      
      return result;
    } catch (error) {
      console.error(`Error updating organizer with ID ${organizerId}:`, error);
      throw error;
    }
  },

  // Delete an organizer
  deleteOrganizer: async (organizerId: number): Promise<void> => {
    try {
      await api.delete(`/organizers/${organizerId}`);
      
      // Invalidate affected caches
      cacheService.remove(`${CACHE_KEYS.ORGANIZER_DETAIL}:${organizerId}`);
      cacheService.removeByPrefix(CACHE_KEYS.ORGANIZERS_LIST);
    } catch (error) {
      console.error(`Error deleting organizer with ID ${organizerId}:`, error);
      throw error;
    }
  },
}; 