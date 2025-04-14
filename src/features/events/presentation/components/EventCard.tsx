import { Link } from 'react-router-dom';
import { Event } from '../../domain/Event';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDay, faMapMarkerAlt, faClock } from '@fortawesome/free-solid-svg-icons';

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  // Get the title (prioritize instance-specific values)
  const title = event.instance_name || event.name || event.summary || event.title || 'Untitled Event';
  
  // Format date
  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
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

  // Get event date and time
  const eventDate = event.instance_date || (event.instances && event.instances.length > 0 ? event.instances[0].date : '');
  const startTime = event.start_time || (event.instances && event.instances.length > 0 ? event.instances[0].start_time : '');
  const endTime = event.end_time || (event.instances && event.instances.length > 0 ? event.instances[0].end_time : '');
  
  return (
    <Link 
      to={`/events/${event.instance_id}`}
      className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105 flex flex-col h-full"
    >
      <div className="relative">
        <img 
          src={event.image_url || 'https://via.placeholder.com/300x200?text=No+Image'} 
          alt={title} 
          className="w-full h-48 object-cover"
        />
        {event.price === 0 && (
          <span className="absolute top-2 right-2 bg-cm-yellow text-cm-black px-2 py-1 rounded-md text-xs font-bold">
            FREE
          </span>
        )}
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-bold mb-2 text-cm-black line-clamp-2">{title}</h3>
        
        {eventDate && (
          <div className="mt-2 space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faCalendarDay} className="mr-2 text-cm-blue" />
              <span>{formatDate(eventDate)}</span>
            </div>
            
            {startTime && (
              <div className="flex items-center">
                <FontAwesomeIcon icon={faClock} className="mr-2 text-cm-blue" />
                <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-auto pt-3">
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2 text-cm-red" />
            <span className="truncate">{event.venue_name || `Venue #${event.venue_id || 'TBA'}`}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard; 