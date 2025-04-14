import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEventsStore } from '../application/eventsStore';
import { useAuthStore } from '../../auth/application/authStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarDay, 
  faMapMarkerAlt, 
  faClock, 
  faTicketAlt, 
  faUser, 
  faEnvelope, 
  faPhone 
} from '@fortawesome/free-solid-svg-icons';

interface ExtendedUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber?: string | null;
}

const EventDetailPage = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const { event, isLoading, error, fetchEvent, registerForEvent } = useEventsStore();
  const { user, isAuthenticated } = useAuthStore();
  const userExtended = user as ExtendedUser | null;
  
  // Form state
  const [name, setName] = useState(userExtended?.displayName || '');
  const [email, setEmail] = useState(userExtended?.email || '');
  const [phone, setPhone] = useState(userExtended?.phoneNumber || '');
  const [numTickets, setNumTickets] = useState(1);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  useEffect(() => {
    if (instanceId) {
      fetchEvent(instanceId);
    }
  }, [instanceId, fetchEvent]);
  
  // Get the title (prioritize instance-specific values)
  const getTitle = () => {
    return event?.instance_name || event?.name || event?.summary || event?.title || 'Untitled Event';
  };

  // Get the description (prioritize instance-specific values)
  const getDescription = () => {
    return event?.instance_description || event?.description || '';
  };

  // Format date
  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Date TBA';
    }
  };
  
  // Format time
  const formatTime = (time: string) => {
    if (!time) return 'TBA';
    return time.substring(0, 5);
  };
  
  // Handle registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!instanceId || !event?.event_id) return;
    
    setIsRegistering(true);
    setRegistrationError(null);
    
    try {
      await registerForEvent(
        event.event_id.toString(), 
        parseInt(instanceId), 
        {
          attendee_name: name,
          attendee_email: email,
          attendee_phone: phone,
          num_tickets: numTickets
        }
      );
      
      setRegistrationSuccess(true);
      
    } catch (error) {
      setRegistrationError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Check if an instance is full
  const isInstanceFull = () => {
    if (!event?.max_attendees) return false;
    if (event.registration_count === undefined) return false;
    return event.registration_count >= (event.max_attendees || 0);
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
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-cm-red mb-4">
          <p>Failed to load event details: {error}</p>
        </div>
        <button 
          onClick={() => fetchEvent(instanceId || '')}
          className="bg-cm-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>No event found with ID: {instanceId}</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-light-bg-primary dark:bg-dark-bg-primary rounded-lg shadow-lg overflow-hidden">
        {/* Event Hero */}
        <div className="relative h-80">
          <img 
            src={event.image_url || 'https://via.placeholder.com/1200x400?text=No+Image'} 
            alt={getTitle()} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
            <div className="p-6 text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{getTitle()}</h1>
              <div className="flex items-center text-sm">
                <span className="mr-4">Organized by: {event.organizer_name || `Organizer #${event.organizer_id}`}</span>
                {event.price === 0 ? (
                  <span className="bg-cm-yellow text-cm-black px-2 py-1 rounded-md text-xs font-bold">
                    FREE
                  </span>
                ) : (
                  <span>${event.price?.toFixed(2)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Event Details */}
        <div className="md:flex">
          {/* Left Content */}
          <div className="md:w-2/3 p-6">
            <h2 className="text-xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">About This Event</h2>
            <div className="prose max-w-none mb-8 text-light-text-primary dark:text-dark-text-primary">
              <p>{getDescription()}</p>
            </div>
            
            <h2 className="text-xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Date and Time</h2>
            <div className="space-y-4 mb-8">
              <div 
                className="p-4 border rounded-md border-cm-blue bg-blue-50 dark:bg-blue-900/20 text-light-text-primary dark:text-dark-text-primary"
              >
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faCalendarDay} className="mr-3 text-cm-blue dark:text-cm-yellow" />
                  <span className="font-medium">{formatDate(event.instance_date || '')}</span>
                </div>
                
                <div className="flex items-center mt-2">
                  <FontAwesomeIcon icon={faClock} className="mr-3 text-cm-blue dark:text-cm-yellow" />
                  <span>{formatTime(event.start_time || '')} - {formatTime(event.end_time || '')}</span>
                </div>
                
                {event.registration_count !== undefined && event.max_attendees && (
                  <div className="mt-2 text-sm">
                    <span className={isInstanceFull() ? 'text-cm-red' : 'text-green-600 dark:text-green-400'}>
                      {event.registration_count} / {event.max_attendees} attendees
                    </span>
                    {isInstanceFull() && !event.allow_waitlist && (
                      <span className="ml-2 bg-cm-red text-white px-2 py-1 rounded text-xs">FULL</span>
                    )}
                    {isInstanceFull() && event.allow_waitlist && (
                      <span className="ml-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">WAITLIST</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Location</h2>
            <div className="flex items-center mb-8">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-3 text-cm-red" />
              <span className="text-light-text-primary dark:text-dark-text-primary">
                {event.venue_name || `Venue #${event.venue_id || 'TBA'}`}
              </span>
            </div>
          </div>
          
          {/* Right Sidebar - Registration Form */}
          <div className="md:w-1/3 p-6 bg-light-bg-tertiary dark:bg-dark-bg-tertiary border-l border-gray-200 dark:border-gray-700">
            {registrationSuccess ? (
              <div className="text-center py-8">
                <div className="text-green-600 dark:text-green-400 text-xl mb-4">Registration Successful!</div>
                <p className="mb-6 text-light-text-primary dark:text-dark-text-primary">Thank you for registering for this event.</p>
                <button 
                  onClick={() => navigate('/events')}
                  className="bg-cm-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Browse More Events
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Register for this Event</h2>
                
                {!isAuthenticated && (
                  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
                    <p className="text-sm text-light-text-primary dark:text-dark-text-primary">
                      <strong>Note:</strong> You can register as a guest, but{' '}
                      <button 
                        onClick={() => navigate('/login')}
                        className="text-cm-blue dark:text-cm-yellow hover:underline"
                      >
                        logging in
                      </button>{' '}
                      will save your information for future events.
                    </p>
                  </div>
                )}
                
                <form onSubmit={handleRegister}>
                  <div className="mb-4">
                    <label className="block text-light-text-primary dark:text-dark-text-primary text-sm font-bold mb-2" htmlFor="name">
                      <FontAwesomeIcon icon={faUser} className="mr-2 text-cm-blue dark:text-cm-yellow" />
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-light-text-primary dark:text-dark-text-primary text-sm font-bold mb-2" htmlFor="email">
                      <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-cm-blue dark:text-cm-yellow" />
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-light-text-primary dark:text-dark-text-primary text-sm font-bold mb-2" htmlFor="phone">
                      <FontAwesomeIcon icon={faPhone} className="mr-2 text-cm-blue dark:text-cm-yellow" />
                      Phone (optional)
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={phone || ''}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-light-text-primary dark:text-dark-text-primary text-sm font-bold mb-2" htmlFor="tickets">
                      <FontAwesomeIcon icon={faTicketAlt} className="mr-2 text-cm-blue dark:text-cm-yellow" />
                      Number of Tickets
                    </label>
                    <select
                      id="tickets"
                      value={numTickets}
                      onChange={(e) => setNumTickets(Number(e.target.value))}
                      className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                    >
                      {[1, 2, 3, 4, 5].map(num => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'ticket' : 'tickets'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {registrationError && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md text-red-600 dark:text-red-400 text-sm">
                      {registrationError}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isRegistering || !instanceId}
                    className="w-full bg-cm-blue hover:bg-blue-700 dark:bg-cm-red dark:hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                  >
                    {isRegistering ? 'Processing...' : 'Register Now'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage; 