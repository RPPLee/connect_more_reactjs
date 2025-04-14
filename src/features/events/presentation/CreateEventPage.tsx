import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEventsStore } from '../application/eventsStore';
import { useAuthStore } from '../../auth/application/authStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, 
  faImage, 
  faInfoCircle, 
  faLocationArrow, 
  faMoneyBillWave, 
  faSave, 
  faTags, 
} from '@fortawesome/free-solid-svg-icons';
import { Category, Subcategory } from '../domain/Metadata';
import RecurrenceSelector from '../presentation/components/RecurrenceSelector';
import TagSelector from './components/TagSelector';
import FileUploader from './components/FileUploader';
import VenueSelector from '../../venues/presentation/components/VenueSelector';
import UpdateEventModal from './components/UpdateEventModal';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { metadata, createEvent, updateEvent, fetchEvent, event, isLoading, error } = useEventsStore();
  const { user } = useAuthStore();
  
  // Add state for edit mode detection
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Add state for organizer ID
  const [organizerId, setOrganizerId] = useState<number | undefined>(undefined);
  const [hasCheckedOrganizer, setHasCheckedOrganizer] = useState(false);
  
  // Add console log to debug user data
  useEffect(() => {
    console.log('CreateEventPage - Current user data:', user);
    console.log('CreateEventPage - User fields:', {
      id: user?.id,
      email: user?.email,
      organizerId: user?.organizerId,
      isOrganizer: user?.isOrganizer,
      roles: user?.roles
    });
    
    // Check auth store state for debugging
    console.log('CreateEventPage - Auth check - user present:', !!user);
    console.log('CreateEventPage - Auth check - user object keys:', user ? Object.keys(user) : 'no user');
    
    // Set organizer ID from user data if available
    if (user?.organizerId) {
      console.log('Setting organizer ID:', user.organizerId);
      setOrganizerId(user.organizerId);
    } else {
      console.log('No organizer ID found in user data');
      
      // Check for alternatives
      if (user?.isOrganizer) {
        console.log('User is marked as organizer but no organizerId is present');
      }
      
      if (user?.roles && user.roles.includes(2)) { // Assuming role ID 2 is for organizers
        console.log('User has organizer role (ID 2) but no organizerId is present');
      }
    }
    
    // Mark that we've checked for the organizer ID
    setHasCheckedOrganizer(true);
  }, [user]);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [subcategoryId, setSubcategoryId] = useState<number | undefined>(undefined);
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState<number | undefined>(undefined);
  const [capacity, setCapacity] = useState<number | undefined>(undefined);
  const [locationType, setLocationType] = useState('venue');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [venueId, setVenueId] = useState<number | undefined>(undefined);
  const [customVenueName, setCustomVenueName] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [eventDataToUpdate, setEventDataToUpdate] = useState<any>({});

  // Check if we are in edit mode and fetch event data
  useEffect(() => {
    // Set edit mode based on eventId
    if (eventId) {
      setIsEditMode(true);
      
      // Fetch event data
      const fetchEventData = async () => {
        try {
          console.log('Fetching event data for editing, event ID:', eventId);
          await fetchEvent(Number(eventId));
          
          // Check immediately if the event data is loaded
          if (!event) {
            console.log('Event data not available yet');
          }
        } catch (error: unknown) {
          console.error('Error fetching event data for editing:', error);
          
          // Create fallback data for the form so the user can still edit something
          const fallbackEvent = {
            event_id: Number(eventId),
            title: 'New Event',
            description: 'Enter your event description here',
            organizer_id: organizerId || 1,
            is_featured: false,
            is_private: false,
            is_free: true,
          };
          
          console.log('Using fallback data due to API error:', fallbackEvent);
          
          // Manually populate form with fallback data
          setTitle(fallbackEvent.title);
          setDescription(fallbackEvent.description);
          setIsPrivate(!!fallbackEvent.is_private);
          setIsFree(!!fallbackEvent.is_free);
          
          // Get error message for user
          let errorMessage = 'Could not load event data for editing';
          
          // Type guard for checking if error is an object with status or response
          const hasStatus = (err: unknown): err is { status: number } => 
            typeof err === 'object' && err !== null && 'status' in err;
          
          // Type guard for checking if error has a response property with status
          const hasResponse = (err: unknown): err is { response: { status: number } } => {
            if (typeof err !== 'object' || err === null || !('response' in err)) {
              return false;
            }
            
            const response = (err as Record<string, unknown>).response;
            return (
              typeof response === 'object' && 
              response !== null && 
              'status' in response && 
              typeof (response as Record<string, unknown>).status === 'number'
            );
          };
          
          // Detect if this is a 404 error
          const is404 = (hasStatus(error) && error.status === 404) || 
                      (hasResponse(error) && error.response.status === 404);
          
          if (is404) {
            errorMessage = `Event with ID ${eventId} not found. You can create a new event with this ID.`;
          } else if (error instanceof Error) {
            errorMessage = `Failed to load event: ${error.message}`;
          }
          
          setFormError(errorMessage);
        }
      };
      
      fetchEventData();
    }
  }, [eventId, fetchEvent, organizerId]);

  // Add debugging to the event population useEffect
  useEffect(() => {
    if (isEditMode) {
      if (event) {
        console.log('Populating form with event data for editing:', event);
        
        // Populate form fields with event data
        setTitle(event.title || event.name || '');
        setDescription(event.description || '');
        setCategoryId(event.category_id);
        setSubcategoryId(event.subcategory_id);
        setSelectedTags(event.tag_ids || []);
        setImageUrl(event.image_url || '');
        setThumbnailUrl(event.thumbnail_url || '');
        setVideoUrl(event.video_url || '');
        setIsPrivate(!!event.is_private);
        setIsFree(event.is_free !== false);
        setPrice(event.price);
        setCapacity(event.capacity);
        
        // Location type handling
        if (event.is_virtual) {
          setLocationType('online');
        } else if (event.is_hybrid) {
          setLocationType('hybrid');
        } else {
          setLocationType('venue');
        }
        
        // Handle venue
        setVenueId(event.venue_id);
        setCustomVenueName(event.custom_venue_name || '');
        
        // Handle dates
        if (event.instances && event.instances.length > 0) {
          const instance = event.instances[0];
          
          // Format date string with time to ISO format for input
          if (instance.date && instance.start_time) {
            const startDate = new Date(`${instance.date}T${instance.start_time}`);
            setStartDatetime(startDate.toISOString().slice(0, 16)); // Format as YYYY-MM-DDTHH:MM
          }
          
          if (instance.date && instance.end_time) {
            const endDate = new Date(`${instance.date}T${instance.end_time}`);
            setEndDatetime(endDate.toISOString().slice(0, 16)); // Format as YYYY-MM-DDTHH:MM
          }
        }
        
        // Set recurrence rule if available
        setRecurrenceRule(event.recurrence || '');
      } else {
        console.log('No event data available for population in edit mode');
      }
    }
  }, [isEditMode, event]);

  // Update subcategories when category changes
  useEffect(() => {
    if (categoryId && metadata?.subcategories) {
      const filtered = metadata.subcategories.filter(
        sub => sub.category_id === categoryId
      );
      setFilteredSubcategories(filtered);
      // Only reset subcategory if not in edit mode or if changing category after initial load
      if (!isEditMode || categoryId !== event?.category_id) {
        setSubcategoryId(undefined);
      }
    } else {
      setFilteredSubcategories([]);
    }
  }, [categoryId, metadata, isEditMode, event]);

  // Get current datetime in ISO format for the inputs
  useEffect(() => {
    // Only set default dates if not in edit mode
    if (!isEditMode && !startDatetime && !endDatetime) {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      // Format dates for datetime-local input
      const formatDate = (date: Date) => {
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
          .toISOString()
          .slice(0, 16); // Format as YYYY-MM-DDTHH:MM
      };
      
      setStartDatetime(formatDate(now));
      setEndDatetime(formatDate(oneHourLater));
    }
  }, [isEditMode, startDatetime, endDatetime]);

  // Handle update single event instance
  const handleUpdateSingle = async () => {
    try {
      console.log("CreateEventPage - handleUpdateSingle called");
      
      if (!eventDataToUpdate || !eventId) {
        console.error("Missing eventDataToUpdate or eventId for single update");
        setFormError("Cannot update event: missing data");
        setIsUpdateModalOpen(false);
        return;
      }

      // Add update_type to indicate single instance update
      const singleEventData = {
        ...eventDataToUpdate,
        update_type: 'single'
      };
      
      console.log("Updating single event instance with data:", singleEventData);
      
      // Call API to update event
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateEvent(Number(eventId), singleEventData as any);
      
      console.log("Single event update successful");
      setFormSuccess('Event updated successfully!');
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/organizer/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error updating single event:', error);
      setFormError('Failed to update event. Please try again.');
    } finally {
      setIsUpdateModalOpen(false);
    }
  };
  
  // Handle update all events in series
  const handleUpdateAll = async () => {
    try {
      console.log("CreateEventPage - handleUpdateAll called");
      
      if (!eventDataToUpdate || !eventId) {
        console.error("Missing eventDataToUpdate or eventId for all-events update");
        setFormError("Cannot update events: missing data");
        setIsUpdateModalOpen(false);
        return;
      }

      // Add update_type to indicate all instances update
      const allEventsData = {
        ...eventDataToUpdate,
        update_type: 'all'
      };
      
      console.log("Updating all event instances with data:", allEventsData);
      
      // Call API to update all events in series
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateEvent(Number(eventId), allEventsData as any);
      
      console.log("All events update successful");
      setFormSuccess('All events in series updated successfully!');
      
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/organizer/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error updating all events:', error);
      setFormError('Failed to update events. Please try again.');
    } finally {
      setIsUpdateModalOpen(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    
    try {
      // Validate form
      if (!title.trim()) {
        setFormError('Title is required');
        return;
      }
      
      if (!description.trim()) {
        setFormError('Description is required');
        return;
      }
      
      if (!categoryId) {
        setFormError('Category is required');
        return;
      }
      
      if (!startDatetime || !endDatetime) {
        setFormError('Start and end dates are required');
        return;
      }
      
      if (new Date(startDatetime) >= new Date(endDatetime)) {
        setFormError('End time must be after start time');
        return;
      }
      
      if (!isFree && (!price || price <= 0)) {
        setFormError('Please enter a valid price');
        return;
      }
      
      if (locationType === 'venue' && !venueId && !customVenueName) {
        setFormError('Please select a venue or enter a custom venue name');
        return;
      }
      
      // Check for organizerId
      if (!organizerId) {
        setFormError('You must be an organizer to create an event. Please contact support to get organizer access.');
        console.error('No organizer ID available for event creation');
        return;
      }
      
      // Create event data object
      const eventData = {
        title,
        description,
        organizer_id: organizerId,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        tag_ids: selectedTags,
        image_url: imageUrl,
        thumbnail_url: thumbnailUrl,
        video_url: videoUrl,
        is_private: isPrivate,
        is_free: isFree,
        price: isFree ? undefined : price,
        currency: 'USD',
        capacity,
        location_type: locationType,
        is_virtual: locationType === 'online' || locationType === 'hybrid',
        is_hybrid: locationType === 'hybrid',
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        venue_id: venueId,
        custom_venue_name: customVenueName,
        recurrence: recurrenceRule
      };
      
      // Debug the event data before sending
      console.log(`${isEditMode ? 'Updating' : 'Creating'} event data:`, eventData);
      
      // If creating, submit directly
      if (!isEditMode) {
        await createEvent(eventData);
        setFormSuccess('Event created successfully!');
        
        // Navigate after a short delay
        setTimeout(() => {
          navigate('/organizer/dashboard');
        }, 1500);
      } else {
        // TEMPORARILY ALWAYS SHOW MODAL IN EDIT MODE FOR TESTING
        console.log("Always showing update modal for testing");
        setEventDataToUpdate(eventData);
        setIsUpdateModalOpen(true);
        
        // Old conditional logic below - commented out for now
        /*
        // If updating, check if there's a recurrence rule
        const hasRecurrence = !!recurrenceRule || (event && !!event.recurrence);
        
        console.log("Update event check:", { 
          isEditMode, 
          hasRecurrence, 
          recurrenceRule, 
          eventRecurrence: event?.recurrence 
        });
        
        if (hasRecurrence) {
          // Show update modal for recurring events
          console.log("Opening update modal for recurring event");
          setEventDataToUpdate(eventData);
          setIsUpdateModalOpen(true);
        } else {
          // For non-recurring events, update directly
          console.log("Directly updating non-recurring event");
          await updateEvent(Number(eventId), eventData);
          setFormSuccess('Event updated successfully!');
          
          // Navigate after a short delay
          setTimeout(() => {
            navigate('/organizer/dashboard');
          }, 1500);
        }
        */
      }
    } catch (err) {
      // Use the store error or a fallback message based on the caught error
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setFormError(error || errorMessage);
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} event:`, errorMessage);
    }
  };

  // Add a dedicated function to handle modal close
  const handleCloseModal = () => {
    console.log("CreateEventPage - Closing update modal");
    setIsUpdateModalOpen(false);
  };

  // Show message if user is not an organizer
  if (hasCheckedOrganizer && !organizerId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-light-bg-primary dark:bg-dark-bg-primary rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-6 text-light-text-primary dark:text-dark-text-primary border-b pb-4 border-gray-200 dark:border-gray-700">
            {isEditMode ? 'Edit Event' : 'Create New Event'}
          </h1>
          <div className="p-4 mb-6 bg-red-100 dark:bg-red-900/30 text-cm-red dark:text-red-300 rounded-md">
            <h2 className="text-xl font-semibold mb-2">Organizer Access Required</h2>
            <p>You need to be registered as an organizer to create events. Please contact support to get organizer access.</p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-light-bg-primary dark:bg-dark-bg-primary rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-light-text-primary dark:text-dark-text-primary border-b pb-4 border-gray-200 dark:border-gray-700">
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </h1>
        
        {formError && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-cm-red dark:text-red-300 rounded-md">
            {formError}
          </div>
        )}
        
        {formSuccess && (
          <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md">
            {formSuccess}
          </div>
        )}

        {isLoading && (
          <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
            {isEditMode ? 'Loading event data...' : 'Loading...'}
          </div>
        )}

        {!metadata && !isLoading && (
          <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
            Loading categories and tags...
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">
              <FontAwesomeIcon icon={faInfoCircle} className="mr-2 text-cm-blue dark:text-cm-yellow" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label htmlFor="title" className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                  Event Title*
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                  placeholder="Enter event title"
                />
              </div>
              
              <div className="col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                  Description*
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  rows={5}
                  className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                  placeholder="Describe your event"
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                  Category*
                </label>
                <select
                  id="category"
                  value={categoryId || ''}
                  onChange={(e) => setCategoryId(Number(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                  disabled={!metadata || isLoading}
                  required
                >
                  <option value="">Select a category</option>
                  {metadata?.categories?.map((category: Category) => (
                    <option key={category.id} value={category.id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="subcategory" className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                  Subcategory
                </label>
                <select
                  id="subcategory"
                  value={subcategoryId || ''}
                  onChange={(e) => setSubcategoryId(Number(e.target.value) || undefined)}
                  disabled={!categoryId || filteredSubcategories.length === 0 || !metadata || isLoading}
                  className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow disabled:bg-gray-100 disabled:dark:bg-gray-800 disabled:cursor-not-allowed"
                >
                  <option value="">Select a subcategory</option>
                  {filteredSubcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.subcategory_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
          
          {/* Tags */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">
              <FontAwesomeIcon icon={faTags} className="mr-2 text-cm-blue dark:text-cm-yellow" />
              Tags
            </h2>
            <TagSelector 
              availableTags={metadata?.tags || []}
              selectedTagIds={selectedTags}
              onTagsChange={setSelectedTags}
            />
          </section>
          
          {/* Media */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">
              <FontAwesomeIcon icon={faImage} className="mr-2 text-cm-blue dark:text-cm-yellow" />
              Event Media
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                  Main Image
                </label>
                <FileUploader
                  type="image"
                  value={imageUrl}
                  onChange={setImageUrl}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                  Thumbnail Image
                </label>
                <FileUploader
                  type="thumbnail"
                  value={thumbnailUrl}
                  onChange={setThumbnailUrl}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                  Video
                </label>
                <FileUploader
                  type="video"
                  value={videoUrl}
                  onChange={setVideoUrl}
                />
              </div>
            </div>
          </section>
          
          {/* Date and Time */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-cm-blue dark:text-cm-yellow" />
              Date and Time
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDatetime" className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                  Start Date and Time*
                </label>
                <input
                  id="startDatetime"
                  type="datetime-local"
                  value={startDatetime}
                  onChange={(e) => setStartDatetime(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                />
              </div>
              
              <div>
                <label htmlFor="endDatetime" className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                  End Date and Time*
                </label>
                <input
                  id="endDatetime"
                  type="datetime-local"
                  value={endDatetime}
                  onChange={(e) => setEndDatetime(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                />
              </div>
            </div>
            
            {/* Recurrence */}
            <div className="mt-4">
              <RecurrenceSelector 
                value={recurrenceRule} 
                onChange={setRecurrenceRule}
              />
            </div>
          </section>
          
          {/* Location */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">
              <FontAwesomeIcon icon={faLocationArrow} className="mr-2 text-cm-blue dark:text-cm-yellow" />
              Location
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                  Location Type*
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="locationType"
                      value="venue"
                      checked={locationType === 'venue'}
                      onChange={() => setLocationType('venue')}
                      className="text-cm-blue dark:text-cm-yellow focus:ring-cm-blue dark:focus:ring-cm-yellow"
                    />
                    <span className="ml-2 text-light-text-primary dark:text-dark-text-primary">Physical Venue</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="locationType"
                      value="online"
                      checked={locationType === 'online'}
                      onChange={() => setLocationType('online')}
                      className="text-cm-blue dark:text-cm-yellow focus:ring-cm-blue dark:focus:ring-cm-yellow"
                    />
                    <span className="ml-2 text-light-text-primary dark:text-dark-text-primary">Online</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="locationType"
                      value="hybrid"
                      checked={locationType === 'hybrid'}
                      onChange={() => setLocationType('hybrid')}
                      className="text-cm-blue dark:text-cm-yellow focus:ring-cm-blue dark:focus:ring-cm-yellow"
                    />
                    <span className="ml-2 text-light-text-primary dark:text-dark-text-primary">Hybrid</span>
                  </label>
                </div>
              </div>
              
              {(locationType === 'venue' || locationType === 'hybrid') && (
                <>
                  <div>
                    <label htmlFor="customVenueName" className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                      Custom Venue Name
                    </label>
                    <input
                      id="customVenueName"
                      type="text"
                      value={customVenueName}
                      onChange={(e) => setCustomVenueName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                      placeholder="Enter venue name"
                    />
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                      Enter a custom venue name or select from the list below when available
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="venueId" className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                      Select Venue
                    </label>
                    {/* Only render VenueSelector when needed */}
                    {user && (
                      <VenueSelector
                        value={venueId}
                        onChange={setVenueId}
                        className="w-full"
                      />
                    )}
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                      Search and select a venue from the list
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>
          
          {/* Pricing and Capacity */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-light-text-primary dark:text-dark-text-primary">
              <FontAwesomeIcon icon={faMoneyBillWave} className="mr-2 text-cm-blue dark:text-cm-yellow" />
              Pricing and Capacity
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={() => setIsPrivate(!isPrivate)}
                    className="rounded text-cm-blue dark:text-cm-yellow focus:ring-cm-blue dark:focus:ring-cm-yellow mr-2"
                  />
                  Private Event
                </label>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  Private events are only visible to invited guests
                </p>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                  <input
                    type="checkbox"
                    checked={isFree}
                    onChange={() => setIsFree(!isFree)}
                    className="rounded text-cm-blue dark:text-cm-yellow focus:ring-cm-blue dark:focus:ring-cm-yellow mr-2"
                  />
                  Free Event
                </label>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  If unchecked, you can set a price for attendance
                </p>
              </div>
              
              {!isFree && (
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                    Price (USD)*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-light-text-secondary dark:text-dark-text-secondary">$</span>
                    </div>
                    <input
                      id="price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={price || ''}
                      onChange={(e) => setPrice(Number(e.target.value) || undefined)}
                      required={!isFree}
                      className="w-full pl-7 px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                  Maximum Capacity
                </label>
                <input
                  id="capacity"
                  type="number"
                  min="1"
                  value={capacity || ''}
                  onChange={(e) => setCapacity(Number(e.target.value) || undefined)}
                  className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                  placeholder="Leave blank for unlimited"
                />
              </div>
            </div>
          </section>
          
          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isLoading || !metadata}
              className="px-6 py-2 bg-cm-blue hover:bg-blue-700 text-white font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cm-blue transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
            >
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Event' : 'Create Event')}
            </button>
          </div>
        </form>
      </div>
      
      {/* Update Event Modal */}
      <UpdateEventModal 
        isOpen={isUpdateModalOpen}
        onClose={handleCloseModal}
        onUpdateSingle={handleUpdateSingle}
        onUpdateAll={handleUpdateAll}
        hasRecurrence={!!(recurrenceRule || (event && event.recurrence))}
      />
    </div>
  );
};

export default CreateEventPage; 