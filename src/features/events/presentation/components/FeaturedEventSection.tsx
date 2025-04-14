import { Link } from 'react-router-dom';
import { Event } from '../../domain/Event';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDay, faMapMarkerAlt, faClock, faTicketAlt } from '@fortawesome/free-solid-svg-icons';

interface FeaturedEventSectionProps {
  event: Event;
}

const FeaturedEventSection = ({ event }: FeaturedEventSectionProps) => {
  // Get the first instance for display purposes
  const firstInstance = event.instances && event.instances.length > 0 
    ? event.instances[0] 
    : null;
  
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
  
  // Truncate description
  const truncateDescription = (description: string, maxLength: number = 200) => {
    if (!description) return 'No description available';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };
  
  return (
    <div className="mb-16">
      <h1 className="text-3xl font-bold mb-8 text-cm-black">Featured Event</h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="md:flex">
          {/* Image Section */}
          <div className="md:w-1/2">
            <img 
              src={event.image_url || 'https://via.placeholder.com/800x500?text=No+Image'} 
              alt={event.title} 
              className="w-full h-full object-cover object-center"
            />
          </div>
          
          {/* Content Section */}
          <div className="md:w-1/2 p-6 flex flex-col">
            <div>
              <h2 className="text-2xl font-bold text-cm-black mb-3">{event.title || 'Untitled Event'}</h2>
              
              <p className="text-gray-600 mb-6">
                {truncateDescription(event.description)}
              </p>
              
              {firstInstance && (
                <div className="space-y-3 mb-6">
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faCalendarDay} className="mr-3 text-cm-blue" />
                    <span>{formatDate(firstInstance.date)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faClock} className="mr-3 text-cm-blue" />
                    <span>{formatTime(firstInstance.start_time)} - {formatTime(firstInstance.end_time)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-3 text-cm-red" />
                    <span>{event.venue_name || `Venue #${event.venue_id || 'TBA'}`}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={faTicketAlt} className="mr-3 text-cm-red" />
                    <span>{event.price === 0 ? 'Free' : `$${event.price?.toFixed(2) || 'TBA'}`}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-auto">
              <div className="mt-6">
                <Link
                  to={`/events/${event.instance_id || event.id || ''}`}
                  className="inline-block bg-cm-blue hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                >
                  View Event
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedEventSection; 