import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faCalendarDay } from '@fortawesome/free-solid-svg-icons';

interface UpdateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSingle: () => void;
  onUpdateAll: () => void;
  hasRecurrence: boolean;
}

const UpdateEventModal: React.FC<UpdateEventModalProps> = ({
  isOpen,
  onClose,
  onUpdateSingle,
  onUpdateAll,
  hasRecurrence
}) => {
  // Log when modal appears/disappears
  useEffect(() => {
    console.log("UpdateEventModal - isOpen changed:", isOpen);
  }, [isOpen]);

  // If not open, don't render anything
  if (!isOpen) return null;

  console.log("UpdateEventModal - Rendering with props:", { isOpen, hasRecurrence });

  // Handlers with logging
  const handleUpdateSingle = () => {
    console.log("UpdateEventModal - Update Single clicked");
    onUpdateSingle();
  };

  const handleUpdateAll = () => {
    console.log("UpdateEventModal - Update All clicked");
    onUpdateAll();
  };

  const handleClose = () => {
    console.log("UpdateEventModal - Close clicked");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-light-bg-primary dark:bg-dark-bg-primary rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">
          Update Event
        </h2>
        
        <p className="text-light-text-secondary dark:text-dark-text-secondary mb-6">
          {hasRecurrence 
            ? "This event is part of a recurring series. Would you like to update just this instance or all events in the series?" 
            : "Would you like to update this event?"}
        </p>
        
        <div className="space-y-4">
          {hasRecurrence && (
            <button
              onClick={handleUpdateSingle}
              className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg flex items-center hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              <FontAwesomeIcon icon={faCalendarDay} className="text-cm-blue dark:text-cm-yellow mr-3 text-xl" />
              <div className="text-left">
                <div className="font-medium text-light-text-primary dark:text-dark-text-primary">Update this instance only</div>
                <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Changes will apply only to this specific event occurrence
                </div>
              </div>
            </button>
          )}
          
          <button
            onClick={handleUpdateAll}
            className="w-full p-4 border border-gray-300 dark:border-gray-700 rounded-lg flex items-center hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors"
          >
            <FontAwesomeIcon icon={faCalendarAlt} className="text-cm-blue dark:text-cm-yellow mr-3 text-xl" />
            <div className="text-left">
              <div className="font-medium text-light-text-primary dark:text-dark-text-primary">
                {hasRecurrence ? "Update all instances" : "Update event"}
              </div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {hasRecurrence 
                  ? "Changes will apply to all occurrences in this series" 
                  : "Update this event with your changes"}
              </div>
            </div>
          </button>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-light-text-secondary dark:text-dark-text-secondary hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateEventModal;
