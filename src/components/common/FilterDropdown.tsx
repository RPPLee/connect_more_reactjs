import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faSearch, faTags } from '@fortawesome/free-solid-svg-icons';
import { useEventsStore } from '../../features/events/application/eventsStore';
import { Tag } from '../../features/events/domain/Metadata';

interface FilterDropdownProps {
  onClose: () => void;
}

const FilterDropdown = ({ onClose }: FilterDropdownProps) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const { metadata } = useEventsStore();
  
  // Use metadata tags if available, otherwise fallback to hardcoded tags
  const availableTags: Tag[] = metadata?.tags || [];
  
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleTagToggle = (tagId: number) => {
    const tagIdStr = tagId.toString();
    setSelectedTags(prev => 
      prev.includes(tagIdStr) 
        ? prev.filter(t => t !== tagIdStr) 
        : [...prev, tagIdStr]
    );
  };

  const handleFilterApply = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    
    if (startDate) params.append('date_start', startDate);
    if (endDate) params.append('date_end', endDate);
    if (keyword) params.append('search', keyword);
    if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
    
    navigate(`/events?${params.toString()}`);
    onClose();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setKeyword('');
    setSelectedTags([]);
  };

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-72 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg shadow-lg p-4 z-50"
    >
      <h3 className="text-lg font-bold mb-4 text-light-text-primary dark:text-dark-text-primary">Filter Events</h3>
      
      <form onSubmit={handleFilterApply}>
        <div className="space-y-4">
          {/* Date Range */}
          <div>
            <label className="flex items-center mb-2 text-light-text-primary dark:text-dark-text-primary">
              <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
              <span>Date Range</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-md bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-primary dark:text-dark-text-primary border-0 focus:ring-2 focus:ring-cm-blue"
                placeholder="From"
              />
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full rounded-md bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-primary dark:text-dark-text-primary border-0 focus:ring-2 focus:ring-cm-blue"
                placeholder="To"
              />
            </div>
          </div>
          
          {/* Keyword */}
          <div>
            <label className="flex items-center mb-2 text-light-text-primary dark:text-dark-text-primary">
              <FontAwesomeIcon icon={faSearch} className="mr-2" />
              <span>Keyword</span>
            </label>
            <input
              type="text"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="w-full rounded-md bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-primary dark:text-dark-text-primary border-0 focus:ring-2 focus:ring-cm-blue"
              placeholder="Search keywords"
            />
          </div>
          
          {/* Tags */}
          <div>
            <label className="flex items-center mb-2 text-light-text-primary dark:text-dark-text-primary">
              <FontAwesomeIcon icon={faTags} className="mr-2" />
              <span>Tags</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagToggle(tag.id)}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                    selectedTags.includes(tag.id.toString())
                      ? 'bg-cm-blue text-white'
                      : 'bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {tag.tag_name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-2 px-4 bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-primary dark:text-dark-text-primary rounded-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Reset
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-cm-blue text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FilterDropdown; 