import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useEventsStore } from '../application/eventsStore';
import { useVenuesStore } from '../../venues/application/venuesStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDay, faClock } from '@fortawesome/free-solid-svg-icons';
import 'leaflet/dist/leaflet.css';
import type { MapContainer as MapContainerType, TileLayer as TileLayerType, 
  Marker as MarkerType, Popup as PopupType } from 'react-leaflet';

interface LeafletComponents {
  MapContainer: typeof MapContainerType;
  TileLayer: typeof TileLayerType;
  Marker: typeof MarkerType;
  Popup: typeof PopupType;
}

// We need to load these dynamically since Leaflet requires a DOM
const MapView = () => {
  const { events, isLoading: eventsLoading, error: eventsError, fetchEvents } = useEventsStore();
  const { venues, isLoading: venuesLoading, error: venuesError, fetchVenues } = useVenuesStore();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // Default: San Francisco
  const [mapZoom] = useState(12);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletComponents, setLeafletComponents] = useState<LeafletComponents | null>(null);
  
  // Dynamically import Leaflet only on client-side
  useEffect(() => {
    // Import libraries only on client side to avoid SSR issues
    const loadMap = async () => {
      try {
        const L = await import('leaflet');
        const reactLeaflet = await import('react-leaflet');
        
        // Fix for default marker icons in Leaflet
        const DefaultIcon = L.default.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41]
        });
        
        L.default.Marker.prototype.options.icon = DefaultIcon;
        
        setLeafletComponents(reactLeaflet as unknown as LeafletComponents);
        setMapLoaded(true);
      } catch (error) {
        console.error("Failed to load map libraries:", error);
      }
    };
    
    loadMap();
  }, []);
  
  // When component mounts, get user location and fetch data
  useEffect(() => {
    // Get user's location if they allow it
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setMapCenter([latitude, longitude]);
      },
      (error) => {
        console.error('Error getting user location:', error);
      }
    );
    
    // Fetch events and venues
    fetchEvents({ upcoming: true });
    fetchVenues();
  }, [fetchEvents, fetchVenues]);
  
  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Format time
  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };
  
  // Combines events with their venue data for map display
  const getEventsWithLocations = () => {
    if (!venues || !events) return [];
    
    return events
      .filter(event => {
        // Only include events that have a venue
        const venue = venues.find(v => v.id === event.venue_id);
        return venue && venue.latitude && venue.longitude;
      })
      .map(event => {
        const venue = venues.find(v => v.id === event.venue_id);
        return {
          ...event,
          latitude: venue?.latitude,
          longitude: venue?.longitude,
          venueName: venue?.name
        };
      });
  };
  
  const eventsWithLocations = getEventsWithLocations();
  
  const isLoading = eventsLoading || venuesLoading || !mapLoaded;
  const error = eventsError || venuesError;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cm-blue"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="text-cm-red mb-4">
          <p>Failed to load map data: {error}</p>
        </div>
        <button 
          onClick={() => {
            fetchEvents({ upcoming: true });
            fetchVenues();
          }}
          className="bg-cm-blue text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  // If Leaflet components haven't loaded yet, show a placeholder
  if (!leafletComponents) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-cm-black">Event Map</h1>
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p>Loading map components...</p>
        </div>
      </div>
    );
  }
  
  const { MapContainer, TileLayer, Marker, Popup } = leafletComponents;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-cm-black">Event Map</h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="h-[70vh]">
          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* User location marker */}
            {userLocation && (
              <Marker position={userLocation}>
                <Popup>
                  <div className="text-center">
                    <p className="font-bold">Your Location</p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Event markers */}
            {eventsWithLocations.map(event => (
              <Marker 
                key={event.id} 
                position={[event.latitude || 0, event.longitude || 0]}
              >
                <Popup>
                  <div className="w-64">
                    <h3 className="text-lg font-bold mb-2">{event.title}</h3>
                    
                    <p className="text-sm mb-2">
                      <strong>Location:</strong> {event.venueName || `Venue #${event.venue_id}`}
                    </p>
                    
                    {event.instances && event.instances.length > 0 && (
                      <div className="text-sm mb-3">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faCalendarDay} className="mr-2 text-cm-blue" />
                          <span>{formatDate(event.instances[0].date)}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <FontAwesomeIcon icon={faClock} className="mr-2 text-cm-blue" />
                          <span>
                            {formatTime(event.instances[0].start_time)} - {formatTime(event.instances[0].end_time)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-center">
                      <Link 
                        to={`/events/${event.instance_id || ''}`}
                        className="bg-cm-blue hover:bg-blue-700 text-white py-2 px-4 rounded-md transition"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        
        <div className="p-4 bg-gray-50 border-t">
          <p className="text-sm text-gray-600">
            Showing {eventsWithLocations.length} events with location information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapView; 