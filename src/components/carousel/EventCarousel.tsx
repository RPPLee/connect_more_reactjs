import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Event } from '../../features/events/domain/Event';
import EventCard from '../../features/events/presentation/components/EventCard';

interface EventCarouselProps {
  title: string;
  events: Event[];
  viewAllLink?: string;
}

const EventCarousel = ({ title, events, viewAllLink }: EventCarouselProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(4);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Update maxScroll and cardsPerView on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (carouselRef.current) {
        const width = window.innerWidth;
        let newCardsPerView = 4; // Default for desktop
        
        if (width < 640) {
          newCardsPerView = 1; // Mobile
        } else if (width < 768) {
          newCardsPerView = 2; // Small tablet
        } else if (width < 1024) {
          newCardsPerView = 3; // Tablet
        }
        
        setCardsPerView(newCardsPerView);
        
        // Calculate max scroll based on number of cards and cards per view
        const cardWidth = carouselRef.current.offsetWidth / newCardsPerView;
        const maxScrollValue = Math.max(0, events.length * cardWidth - carouselRef.current.offsetWidth);
        setMaxScroll(maxScrollValue);
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [events.length]);

  const scroll = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    
    const cardWidth = carouselRef.current.offsetWidth / cardsPerView;
    const scrollAmount = cardWidth * cardsPerView; // Scroll by the number of cards per view
    
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(maxScroll, scrollPosition + scrollAmount);
    
    setScrollPosition(newPosition);
    
    if (carouselRef.current) {
      carouselRef.current.scroll({
        left: newPosition,
        behavior: 'smooth'
      });
    }
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">{title}</h2>
        {viewAllLink && (
          <a 
            href={viewAllLink} 
            className="text-cm-blue dark:text-cm-yellow hover:underline text-sm md:text-base"
          >
            View All
          </a>
        )}
      </div>
      
      <div className="relative">
        {/* Left Arrow */}
        {scrollPosition > 0 && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-40 hover:bg-opacity-60 text-white p-2 rounded-full"
            aria-label="Scroll left"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
        )}
        
        {/* Carousel */}
        <div 
          ref={carouselRef}
          className="flex overflow-x-scroll scrollbar-hide snap-x snap-mandatory scroll-smooth"
          style={{ scrollBehavior: 'smooth' }}
        >
          {events.map((event) => (
            <div 
              key={event.event_id} 
              className={`flex-none snap-start px-2 w-full sm:w-1/2 md:w-1/3 lg:w-1/4`}
            >
              <EventCard event={event} />
            </div>
          ))}
        </div>
        
        {/* Right Arrow */}
        {scrollPosition < maxScroll && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black bg-opacity-40 hover:bg-opacity-60 text-white p-2 rounded-full"
            aria-label="Scroll right"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        )}
      </div>
    </div>
  );
};

export default EventCarousel; 