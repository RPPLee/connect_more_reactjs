import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faChartLine, 
  faCalendar,
  faUsers,
  faEllipsisV,
  faExternalLink
} from '@fortawesome/free-solid-svg-icons';
import { useEventsStore } from '../../events/application/eventsStore';
import { useAuthStore } from '../../auth/application/authStore';
import { useOrganizersStore } from '../application/organizersStore';
import { Event, EventInstance } from '../../events/domain/Event';
import { OrganizerUpcomingEvent } from '../domain/Organizer';

// Define the OrganizerEvent interface that combines our event model with the Lambda response format
interface OrganizerEvent extends Event {
  instances: EventInstance[];
  status?: 'published' | 'draft' | string;
}

const OrganizerDashboard = () => {
  const { user } = useAuthStore();
  const { organizer } = useOrganizersStore();
  const { deleteEvent, isLoading, error } = useEventsStore();
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadEvents = async () => {
      if (user?.organizerId && organizer) {
        try {
          console.log('Organizer data:', organizer);
          
          // Use the upcoming_events from the organizer response
          if (organizer.upcoming_events && Array.isArray(organizer.upcoming_events)) {
            console.log('Upcoming events found:', organizer.upcoming_events);
            
            // Map the upcoming_events to the OrganizerEvent format
            const eventsData: OrganizerEvent[] = organizer.upcoming_events.map((event: OrganizerUpcomingEvent) => {
              // Create properly formatted instances that match the EventInstance interface
              const startDate = event.start_datetime || new Date().toISOString();
              
              // Format start and end times to match expected format
              const startTime = event.start_datetime ? 
                new Date(event.start_datetime).toTimeString().split(' ')[0] : 
                '00:00:00';
              
              const endTime = event.end_datetime ? 
                new Date(event.end_datetime).toTimeString().split(' ')[0] : 
                '00:00:00';
              
              // Create required instance object with non-nullable fields
              const instanceObj: EventInstance = {
                id: event.instance_id || 0,
                date: startDate.split('T')[0], // Just the date part
                start_time: startTime,
                end_time: endTime,
                capacity: 0,
                current_attendees: 0,
                is_soldout: false,
                has_waitlist: false
              };
              
              return {
                id: event.id,
                event_id: event.id,
                title: event.title,
                description: event.description || '',
                organizer_id: organizer.id,
                venue_id: event.venue_id || 0,
                category_id: event.category_id || 0,
                is_featured: false, // Required by Event interface
                instances: [instanceObj],
                venue_name: event.venue_name || '',
                venue_city: event.venue_city || '',
                venue_state: event.venue_state || '',
                status: event.status || 'published'
              } as OrganizerEvent;
            });
            setEvents(eventsData);
          } else {
            setEvents([]); // Fallback to empty array if no upcoming_events
            console.log('No upcoming events found in organizer data');
          }
        } catch (error) {
          console.error('Error processing organizer events:', error);
          setEvents([]);
        }
      }
    };

    loadEvents();
  }, [user, organizer]);

  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await deleteEvent(eventId);
        setEvents(events.filter(event => event.id !== eventId));
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
    setActionMenuOpen(null);
  };

  const toggleActionMenu = (eventId: number, e: React.MouseEvent) => {
    // Stop event propagation to prevent row click
    e.stopPropagation();
    setActionMenuOpen(actionMenuOpen === eventId ? null : eventId);
  };

  // Action menu item click handler to prevent row navigation
  const handleActionItemClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Filter events based on active tab
  const filteredEvents = events.filter(event => {
    const now = new Date();
    const hasUpcomingInstances = event.instances.some(instance => 
      new Date(instance.date) >= now
    );
    
    if (activeTab === 'upcoming') {
      return hasUpcomingInstances;
    } else if (activeTab === 'past') {
      return !hasUpcomingInstances;
    } else {
      return event.status === activeTab;
    }
  });

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'TBA';
    }
  };

  // Helper function to safely calculate total attendees
  const calculateTotalAttendees = () => {
    return events.reduce((total, event) => 
      total + event.instances.reduce((sum, instance) => 
        sum + (instance.current_attendees || 0), 0), 0);
  };

  // Helper function to safely count upcoming events
  const countUpcomingEvents = () => {
    const now = new Date();
    return events.filter(event => 
      event.instances.some(instance => new Date(instance.date) >= now)
    ).length;
  };

  // Helper function to safely count published events
  const countPublishedEvents = () => {
    return events.filter(event => event.status === 'published').length;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cm-blue dark:border-cm-yellow"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-cm-red mb-4">Error loading your events: {error}</p>
        <button 
          onClick={() => {/* fetchOrganizerEvents(user?.uid) */}}
          className="bg-cm-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
          {organizer ? `${organizer.name} Dashboard` : 'Organizer Dashboard'}
        </h1>
        <Link 
          to="/organizer/events/create" 
          className="bg-cm-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors flex items-center"
        >
          <FontAwesomeIcon icon={faPlus} className="mr-2" />
          Create Event
        </Link>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-light-bg-primary dark:bg-dark-bg-tertiary p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
              <FontAwesomeIcon icon={faCalendar} className="text-cm-blue dark:text-cm-yellow text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Events</p>
              <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{events.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-light-bg-primary dark:bg-dark-bg-tertiary p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-4">
              <FontAwesomeIcon icon={faUsers} className="text-green-600 dark:text-green-400 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Attendees</p>
              <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {calculateTotalAttendees()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-light-bg-primary dark:bg-dark-bg-tertiary p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-4">
              <FontAwesomeIcon icon={faChartLine} className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Events</p>
              <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {countUpcomingEvents()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-light-bg-primary dark:bg-dark-bg-tertiary p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full mr-4">
              <FontAwesomeIcon icon={faCalendar} className="text-yellow-600 dark:text-yellow-400 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Published Events</p>
              <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {countPublishedEvents()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Events Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button 
            onClick={() => setActiveTab('upcoming')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming' 
                ? 'border-cm-blue dark:border-cm-yellow text-cm-blue dark:text-cm-yellow' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setActiveTab('past')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past' 
                ? 'border-cm-blue dark:border-cm-yellow text-cm-blue dark:text-cm-yellow' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Past
          </button>
          <button 
            onClick={() => setActiveTab('draft')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'draft' 
                ? 'border-cm-blue dark:border-cm-yellow text-cm-blue dark:text-cm-yellow' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Drafts
          </button>
          <button 
            onClick={() => setActiveTab('published')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'published' 
                ? 'border-cm-blue dark:border-cm-yellow text-cm-blue dark:text-cm-yellow' 
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Published
          </button>
        </nav>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-light-bg-primary dark:bg-dark-bg-primary rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No {activeTab} events found</p>
          <Link 
            to="/organizer/events/create" 
            className="inline-flex items-center text-cm-blue dark:text-cm-yellow hover:underline"
          >
            <FontAwesomeIcon icon={faPlus} className="mr-2" />
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Event
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Attendees
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-light-bg-primary dark:bg-dark-bg-primary divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEvents.map(event => (
                <tr 
                  key={event.id} 
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => {
                    // Navigate when clicking on the row, but not when clicking action menu
                    if (actionMenuOpen === null) {
                      // Cast to string to ensure we have a valid ID (empty string as fallback)
                      const instanceId = String(event.instance_id || (event.instances[0]?.id || ''));
                      navigate(`/events/${instanceId}`);
                    }
                  }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                        {event.image_url ? (
                          <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                            <FontAwesomeIcon icon={faCalendar} />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-light-text-primary dark:text-dark-text-primary">
                          {event.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {event.category_id ? `Category #${event.category_id}` : 'Uncategorized'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-light-text-primary dark:text-dark-text-primary">
                      {event.instances && event.instances.length > 0 
                        ? formatDate(event.instances[0].date)
                        : 'No dates set'}
                    </div>
                    {event.instances && event.instances.length > 1 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{event.instances.length - 1} more dates
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-light-text-primary dark:text-dark-text-primary">
                      {event.instances.reduce((sum: number, instance) => sum + (instance.current_attendees || 0), 0)}
                    </div>
                    {event.instances.some(instance => 
                      instance.capacity && (instance.current_attendees || 0) >= instance.capacity
                    ) && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                        Some sessions full
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${event.status === 'published' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                        : event.status === 'draft' 
                          ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                      }`}>
                      {event.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <button
                      onClick={(e) => {
                        // Ensure event.id is not undefined
                        if (event.id !== undefined) {
                          toggleActionMenu(event.id, e);
                        }
                      }}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <FontAwesomeIcon icon={faEllipsisV} />
                    </button>
                    
                    {actionMenuOpen === event.id && (
                      <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-dark-bg-tertiary ring-1 ring-black ring-opacity-5 z-10">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          <Link
                            to={`/events/${event.instance_id || (event.instances[0]?.id || '')}`}
                            className="flex items-center px-4 py-2 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-gray-800"
                            role="menuitem"
                            onClick={handleActionItemClick}
                          >
                            <FontAwesomeIcon icon={faExternalLink} className="mr-3" /> View
                          </Link>
                          <Link
                            to={`/organizer/events/edit/${event.event_id || event.id}`}
                            className="flex items-center px-4 py-2 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-gray-800"
                            role="menuitem"
                            onClick={handleActionItemClick}
                          >
                            <FontAwesomeIcon icon={faEdit} className="mr-3 text-gray-500 dark:text-gray-400" />
                            Edit
                          </Link>
                          <Link
                            to={`/organizer/events/${event.event_id || event.id}/analytics`}
                            className="flex items-center px-4 py-2 text-sm text-light-text-primary dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-gray-800"
                            role="menuitem"
                            onClick={handleActionItemClick}
                          >
                            <FontAwesomeIcon icon={faChartLine} className="mr-3 text-gray-500 dark:text-gray-400" />
                            Analytics
                          </Link>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click
                              // Ensure event.id is not undefined
                              if (event.id !== undefined) {
                                handleDeleteEvent(event.id);
                              }
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            role="menuitem"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard; 