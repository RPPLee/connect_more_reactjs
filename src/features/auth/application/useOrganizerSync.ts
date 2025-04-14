import { useEffect } from 'react';
import { useAuthStore } from './authStore';
import { useOrganizersStore } from '../../organizers/application/organizersStore';

/**
 * Hook to synchronize organizer data when a user with an organizerId logs in
 * This ensures the organizer data is available in the organizers store
 */
export const useOrganizerSync = () => {
  const { user } = useAuthStore();
  const { fetchOrganizer, organizer } = useOrganizersStore();
  
  useEffect(() => {
    // If user has an organizerId and it's not already loaded or different from current
    if (user?.organizerId && (!organizer || organizer.id !== user.organizerId)) {
      // Fetch the organizer data
      fetchOrganizer(user.organizerId).catch(err => {
        console.error('Failed to load organizer data:', err);
      });
    }
  }, [user?.organizerId, organizer?.id, fetchOrganizer]);
  
  return null;
}; 