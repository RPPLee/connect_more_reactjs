import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Tag } from '../../domain/Metadata';

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTagIds: number[];
  onTagsChange: (tagIds: number[]) => void;
}

const TagSelector = ({ availableTags, selectedTagIds, onTagsChange }: TagSelectorProps) => {
  const [searchText, setSearchText] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Generate list of selected tags
  const selectedTags = availableTags.filter(tag => selectedTagIds.includes(tag.id));

  // Filter tags based on search text
  useEffect(() => {
    if (searchText.trim() === '') {
      // Show all unselected tags when search is empty
      setFilteredTags(availableTags.filter(tag => !selectedTagIds.includes(tag.id)));
    } else {
      // Filter by search text and exclude already selected tags
      const filtered = availableTags.filter(
        tag => 
          !selectedTagIds.includes(tag.id) && 
          tag.tag_name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredTags(filtered);
    }
  }, [searchText, availableTags, selectedTagIds]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add a tag
  const handleTagSelect = (tagId: number) => {
    if (!selectedTagIds.includes(tagId)) {
      onTagsChange([...selectedTagIds, tagId]);
    }
    setSearchText('');
    inputRef.current?.focus();
  };

  // Remove a tag
  const handleTagRemove = (tagId: number) => {
    onTagsChange(selectedTagIds.filter(id => id !== tagId));
  };

  // Handle key navigation in dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="relative">
      {/* Selected Tags Pills */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map(tag => (
          <div 
            key={tag.id}
            className="inline-flex items-center bg-cm-blue text-white dark:bg-cm-yellow dark:text-dark-bg-primary px-3 py-1 rounded-full text-sm"
          >
            <span>{tag.tag_name}</span>
            <button 
              type="button"
              onClick={() => handleTagRemove(tag.id)}
              className="ml-2 focus:outline-none"
              aria-label={`Remove ${tag.tag_name} tag`}
            >
              <FontAwesomeIcon icon={faTimes} className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for tags..."
          className="w-full pl-10 px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
        />
      </div>

      {/* Dropdown */}
      {isDropdownOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-light-bg-primary dark:bg-dark-bg-primary border border-gray-300 dark:border-gray-700 rounded-md shadow-lg"
        >
          {filteredTags.length === 0 ? (
            <div className="px-4 py-2 text-light-text-secondary dark:text-dark-text-secondary text-sm">
              {searchText.trim() === '' ? 'No more tags available' : 'No matching tags found'}
            </div>
          ) : (
            <ul>
              {filteredTags.map(tag => (
                <li key={tag.id}>
                  <button
                    type="button"
                    onClick={() => handleTagSelect(tag.id)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary focus:bg-light-bg-tertiary dark:focus:bg-dark-bg-tertiary focus:outline-none"
                  >
                    {tag.tag_name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default TagSelector; 