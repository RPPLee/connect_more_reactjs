import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEventsStore } from '../../events/application/eventsStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faUsers, 
  faTicketAlt, 
  faMoneyBillWave, 
  faArrowLeft, 
  faCalendarAlt,
  faCheckCircle,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import { Event } from '../../events/domain/Event';

/* This interface would be used for real chart rendering
interface AttendanceData {
  labels: string[];
  datasets: {
    registrations: number[];
    attendees: number[];
  };
}
*/

const EventAnalytics = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { event, isLoading, error, fetchEvent } = useEventsStore();
  
  useEffect(() => {
    if (eventId) {
      fetchEvent(eventId);
      // In a real application, we would fetch analytics data from the API
    }
  }, [eventId, fetchEvent]);
  
  // Calculate metrics from event data
  const calculateMetrics = (eventData: Event) => {
    // Total registered attendees
    const totalRegistrations = eventData.instances.reduce(
      (sum, instance) => sum + (instance.current_attendees || 0), 
      0
    );
    
    // Total capacity
    const totalCapacity = eventData.instances.reduce(
      (sum, instance) => sum + (instance.capacity || 0), 
      0
    );
    
    // Registration rate
    const registrationRate = totalCapacity > 0 
      ? Math.round((totalRegistrations / totalCapacity) * 100) 
      : 0;
    
    // Total revenue (simplified calculation)
    const revenue = totalRegistrations * (eventData.price || 0);
    
    // Days until event (using first instance)
    let daysUntilEvent = 0;
    if (eventData.instances && eventData.instances.length > 0) {
      const eventDate = new Date(eventData.instances[0].date);
      const today = new Date();
      daysUntilEvent = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    }
    
    // Most popular instance
    let mostPopularInstance = null;
    let highestAttendance = 0;
    
    eventData.instances.forEach(instance => {
      if ((instance.current_attendees || 0) > highestAttendance) {
        highestAttendance = instance.current_attendees || 0;
        mostPopularInstance = instance;
      }
    });
    
    return {
      totalRegistrations,
      totalCapacity,
      registrationRate,
      revenue,
      daysUntilEvent,
      mostPopularInstance
    };
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'TBA';
    }
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
          <p>Failed to load event analytics: {error}</p>
        </div>
        <button 
          onClick={() => fetchEvent(eventId || '')}
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
        <p className="text-light-text-primary dark:text-dark-text-primary">No event found with ID: {eventId}</p>
      </div>
    );
  }
  
  const metrics = calculateMetrics(event);
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button and page title */}
      <div className="flex flex-wrap items-center justify-between mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <Link 
            to="/organizer/dashboard" 
            className="text-light-text-primary dark:text-dark-text-primary hover:text-cm-blue dark:hover:text-cm-yellow mr-4"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
            Event Analytics: {event.title}
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link 
            to={`/events/${event.instance_id || ''}`} 
            className="text-cm-blue dark:text-cm-yellow hover:underline"
            target="_blank"
          >
            View Event
          </Link>
          <Link 
            to={`/organizer/events/edit/${event.event_id}`} 
            className="bg-cm-blue hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Edit Event
          </Link>
        </div>
      </div>
      
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-light-bg-primary dark:bg-dark-bg-primary rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mr-4">
              <FontAwesomeIcon icon={faUsers} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Registrations</p>
              <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {metrics.totalRegistrations}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                of {metrics.totalCapacity} capacity
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-light-bg-primary dark:bg-dark-bg-primary rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mr-4">
              <FontAwesomeIcon icon={faTicketAlt} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Registration Rate</p>
              <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                {metrics.registrationRate}%
              </p>
              <div className="mt-1 h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${metrics.registrationRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-light-bg-primary dark:bg-dark-bg-primary rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mr-4">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Revenue</p>
              <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                ${metrics.revenue.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @ ${event.price?.toFixed(2) || 0} / ticket
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-light-bg-primary dark:bg-dark-bg-primary rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-full mr-4">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Event Status</p>
              {metrics.daysUntilEvent > 0 ? (
                <>
                  <p className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                    {metrics.daysUntilEvent} days
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    until the event
                  </p>
                </>
              ) : metrics.daysUntilEvent === 0 ? (
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  Today!
                </p>
              ) : (
                <p className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                  Completed
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Registration Activity Chart (Placeholder) */}
      <div className="bg-light-bg-primary dark:bg-dark-bg-primary rounded-lg shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Registration Activity</h2>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <FontAwesomeIcon icon={faChartLine} className="text-4xl mb-2" />
            <p>Registration chart would be rendered here</p>
            <p className="text-sm">Using a library like Chart.js or Recharts</p>
          </div>
        </div>
      </div>
      
      {/* Event Sessions */}
      <div className="bg-light-bg-primary dark:bg-dark-bg-primary rounded-lg shadow-md p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Event Sessions</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Registrations
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {event.instances.map(instance => {
                const registrationRate = instance.capacity 
                  ? Math.round((instance.current_attendees / instance.capacity) * 100) 
                  : 0;
                
                let statusText = '';
                let statusIcon = null;
                let statusClass = '';
                
                if (instance.is_soldout) {
                  statusText = 'Sold Out';
                  statusIcon = faCheckCircle;
                  statusClass = 'text-red-600 dark:text-red-400';
                } else if (registrationRate >= 90) {
                  statusText = 'Almost Full';
                  statusIcon = faExclamationCircle;
                  statusClass = 'text-orange-600 dark:text-orange-400';
                } else if (registrationRate >= 50) {
                  statusText = 'Filling Up';
                  statusIcon = faExclamationCircle;
                  statusClass = 'text-yellow-600 dark:text-yellow-400';
                } else {
                  statusText = 'Available';
                  statusIcon = faCheckCircle;
                  statusClass = 'text-green-600 dark:text-green-400';
                }
                
                return (
                  <tr key={instance.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-light-text-primary dark:text-dark-text-primary">
                      <div className="font-medium">{formatDate(instance.date)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {instance.start_time.substring(0, 5)} - {instance.end_time.substring(0, 5)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-light-text-primary dark:text-dark-text-primary">
                        {instance.current_attendees} / {instance.capacity}
                      </div>
                      <div className="mt-1 h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${registrationRate > 90 ? 'bg-red-500' : registrationRate > 70 ? 'bg-orange-500' : 'bg-green-500'} rounded-full`}
                          style={{ width: `${registrationRate}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center ${statusClass}`}>
                        <FontAwesomeIcon icon={statusIcon} className="mr-2" />
                        {statusText}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Attendee Demographics (Placeholder) */}
      <div className="bg-light-bg-primary dark:bg-dark-bg-primary rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Attendee Demographics</h2>
        <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <FontAwesomeIcon icon={faUsers} className="text-4xl mb-2" />
            <p>Demographics charts would be rendered here</p>
            <p className="text-sm">Age groups, location, referral sources, etc.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventAnalytics; 