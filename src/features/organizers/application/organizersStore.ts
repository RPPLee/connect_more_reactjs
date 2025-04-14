import { create } from 'zustand';
import { organizerRepository, OrganizersResponse } from '../data/organizerRepository';
import { Organizer } from '../domain/Organizer';

interface OrganizersState {
  organizers: Organizer[];
  organizer: Organizer | null;
  isLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  
  // Actions
  fetchOrganizers: (params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }) => Promise<void>;
  fetchOrganizer: (organizerId: number) => Promise<void>;
  createOrganizer: (organizerData: Partial<Organizer>) => Promise<Organizer>;
  updateOrganizer: (organizerId: number, organizerData: Partial<Organizer>) => Promise<Organizer>;
  deleteOrganizer: (organizerId: number) => Promise<void>;
  clearOrganizer: () => void;
}

export const useOrganizersStore = create<OrganizersState>((set, get) => ({
  organizers: [],
  organizer: null,
  isLoading: false,
  error: null,
  total: 0,
  page: 0,
  limit: 10,
  
  // Fetch all organizers
  fetchOrganizers: async (params?: {
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    set({ isLoading: true, error: null });
    try {
      const response: OrganizersResponse = await organizerRepository.getOrganizers(params);
      set({ 
        organizers: response.organizers,
        total: response.total,
        page: response.page,
        limit: response.limit,
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch organizers', 
        isLoading: false 
      });
    }
  },
  
  // Fetch a single organizer by ID
  fetchOrganizer: async (organizerId: number) => {
    set({ isLoading: true, error: null });
    try {
      const organizer = await organizerRepository.getOrganizer(organizerId);
      set({ organizer, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch organizer details', 
        isLoading: false 
      });
    }
  },
  
  // Create a new organizer
  createOrganizer: async (organizerData: Partial<Organizer>): Promise<Organizer> => {
    set({ isLoading: true, error: null });
    try {
      const organizer = await organizerRepository.createOrganizer(organizerData);
      set({ isLoading: false });
      return organizer;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create organizer', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Update an existing organizer
  updateOrganizer: async (organizerId: number, organizerData: Partial<Organizer>): Promise<Organizer> => {
    set({ isLoading: true, error: null });
    try {
      const organizer = await organizerRepository.updateOrganizer(organizerId, organizerData);
      // If the current organizer is the one being updated, update it in the state
      if (get().organizer?.id === organizerId) {
        set({ organizer });
      }
      set({ isLoading: false });
      return organizer;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update organizer', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Delete an organizer
  deleteOrganizer: async (organizerId: number): Promise<void> => {
    set({ isLoading: true, error: null });
    try {
      await organizerRepository.deleteOrganizer(organizerId);
      // If the current organizer is the one being deleted, clear it from state
      if (get().organizer?.id === organizerId) {
        set({ organizer: null });
      }
      set({ isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete organizer', 
        isLoading: false 
      });
      throw error;
    }
  },
  
  // Clear the current organizer
  clearOrganizer: () => {
    set({ organizer: null });
  }
})); 