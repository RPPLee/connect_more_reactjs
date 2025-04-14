import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Event } from '../../features/events/domain/Event';
import { Link } from 'react-router-dom';

interface HeroCarouselProps {
  events: Event[];
}

const HeroCarousel = ({ events }: HeroCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Auto-advance slide every 7 seconds
  useEffect(() => {
    if (events.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
    }, 7000);
    
    return () => clearInterval(interval);
  }, [events.length]);
  
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };
  
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? events.length - 1 : prevIndex - 1));
  };
  
  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length);
  };
  
  // If no events, don't render the carousel
  if (events.length === 0) {
    return null;
  }

  // Gradient overlay for better text visibility
  const gradientOverlay = `
    linear-gradient(
      to right,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.5) 50%,
      rgba(0, 0, 0, 0.3) 80%,
      rgba(0, 0, 0, 0) 100%
    )
  `;
  
  // Format date
  const formatDate = (event: Event) => {
    const date = event.instance_date || (event.instances && event.instances.length > 0 ? event.instances[0].date : '');
    try {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long', 
        day: 'numeric'
      });
    } catch {
      return 'Coming Soon';
    }
  };

  // Get the title (prioritize instance-specific values)
  const getTitle = (event: Event) => {
    return event.instance_name || event.name || event.summary || event.title || 'Untitled Event';
  };

  // Get the description (prioritize instance-specific values)
  const getDescription = (event: Event) => {
    return event.instance_description || event.description || '';
  };
  
  return (
    <div className="relative w-full h-[500px] mb-16 overflow-hidden">
      {/* Carousel slides */}
      <div className="relative h-full">
        {events.map((event, index) => (
          <div
            key={event.event_id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `${gradientOverlay}, url(${event.image_url || 'https://via.placeholder.com/1200x500?text=Event'})` 
              }}
            />
            
            {/* Content */}
            <div className="relative z-10 h-full flex items-center text-white">
              <div className="container mx-auto px-4 md:px-8 flex flex-col items-start max-w-3xl">
                <span className="bg-cm-red px-3 py-1 mb-4 text-sm font-semibold rounded-full">
                  Featured Event
                </span>
                <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                  {getTitle(event)}
                </h1>
                
                <p className="text-lg mb-4">
                  {formatDate(event)}
                </p>
                
                <p className="text-gray-200 mb-8 line-clamp-3">
                  {getDescription(event)}
                </p>
                
                <Link
                  to={`/events/${event.instance_id}`}
                  className="bg-cm-blue hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-md transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Navigation Arrows */}
      {events.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute z-20 left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-3 transition-colors"
            aria-label="Previous slide"
          >
            <FontAwesomeIcon icon={faChevronLeft} size="lg" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute z-20 right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full p-3 transition-colors"
            aria-label="Next slide"
          >
            <FontAwesomeIcon icon={faChevronRight} size="lg" />
          </button>
          
          {/* Dots indicator */}
          <div className="absolute z-20 bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
            {events.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroCarousel; 