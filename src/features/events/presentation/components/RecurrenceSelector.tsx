import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faRedo, faSyncAlt } from '@fortawesome/free-solid-svg-icons';

interface RecurrenceSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

type RecurrenceType = 'none' | 'custom';

const RecurrenceSelector = ({ value, onChange }: RecurrenceSelectorProps) => {
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [frequency, setFrequency] = useState('DAILY');
  const [interval, setInterval] = useState(1);
  const [count, setCount] = useState(1);
  const [weekdays, setWeekdays] = useState<string[]>([]);

  // Parse the value when it changes from outside
  useEffect(() => {
    if (!value) {
      setRecurrenceType('none');
      return;
    }

    try {
      setRecurrenceType('custom');
      
      // Parse frequency
      if (value.includes('FREQ=DAILY')) {
        setFrequency('DAILY');
      } else if (value.includes('FREQ=WEEKLY')) {
        setFrequency('WEEKLY');
      } else if (value.includes('FREQ=MONTHLY')) {
        setFrequency('MONTHLY');
      } else if (value.includes('FREQ=YEARLY')) {
        setFrequency('YEARLY');
      }
      
      // Parse interval
      const intervalMatch = value.match(/INTERVAL=(\d+)/);
      if (intervalMatch) {
        setInterval(parseInt(intervalMatch[1]));
      }
      
      // Parse count
      const countMatch = value.match(/COUNT=(\d+)/);
      if (countMatch) {
        setCount(parseInt(countMatch[1]));
      }
      
      // Parse weekdays
      const bydayMatch = value.match(/BYDAY=([^;]+)/);
      if (bydayMatch) {
        setWeekdays(bydayMatch[1].split(','));
      } else {
        setWeekdays([]);
      }
    } catch (error) {
      console.error('Failed to parse recurrence rule', error);
    }
  }, [value]);

  // Build the recurrence rule when options change
  useEffect(() => {
    if (recurrenceType === 'none') {
      onChange('');
      return;
    }
    
    let rule = `FREQ=${frequency}`;
    
    if (interval > 1) {
      rule += `;INTERVAL=${interval}`;
    }
    
    if (count > 0) {
      rule += `;COUNT=${count}`;
    }
    
    if (weekdays.length > 0 && frequency !== 'DAILY') {
      rule += `;BYDAY=${weekdays.join(',')}`;
    }
    
    onChange(rule);
  }, [recurrenceType, frequency, interval, count, weekdays, onChange]);

  // Handle weekday toggle
  const handleWeekdayToggle = (day: string) => {
    setWeekdays(prev => 
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // Predefined recurrence templates
  const handleTemplateSelect = (template: string) => {
    switch (template) {
      case 'daily':
        setRecurrenceType('custom');
        setFrequency('DAILY');
        setInterval(1);
        setCount(30);
        setWeekdays([]);
        break;
      case 'weekly':
        setRecurrenceType('custom');
        setFrequency('WEEKLY');
        setInterval(1);
        setCount(8);
        setWeekdays([]);
        break;
      case 'monthly':
        setRecurrenceType('custom');
        setFrequency('MONTHLY');
        setInterval(1);
        setCount(12);
        setWeekdays([]);
        break;
      case 'weekday':
        setRecurrenceType('custom');
        setFrequency('WEEKLY');
        setInterval(1);
        setCount(30);
        setWeekdays(['MO', 'TU', 'WE', 'TH', 'FR']);
        break;
      case 'custom':
        setRecurrenceType('custom');
        break;
      default:
        setRecurrenceType('none');
        break;
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
        <FontAwesomeIcon icon={faRedo} className="mr-2 text-cm-blue dark:text-cm-yellow" />
        Event Recurrence
      </label>
      
      {/* Recurrence Type */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleTemplateSelect('none')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            recurrenceType === 'none'
              ? 'bg-cm-blue text-white dark:bg-cm-yellow dark:text-dark-bg-primary'
              : 'bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          No Recurrence
        </button>
        
        <button
          type="button"
          onClick={() => handleTemplateSelect('daily')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            recurrenceType === 'custom' && frequency === 'DAILY'
              ? 'bg-cm-blue text-white dark:bg-cm-yellow dark:text-dark-bg-primary'
              : 'bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Daily
        </button>
        
        <button
          type="button"
          onClick={() => handleTemplateSelect('weekly')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            recurrenceType === 'custom' && frequency === 'WEEKLY' && weekdays.length === 0
              ? 'bg-cm-blue text-white dark:bg-cm-yellow dark:text-dark-bg-primary'
              : 'bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Weekly
        </button>
        
        <button
          type="button"
          onClick={() => handleTemplateSelect('weekday')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            recurrenceType === 'custom' && frequency === 'WEEKLY' && weekdays.length === 5
              ? 'bg-cm-blue text-white dark:bg-cm-yellow dark:text-dark-bg-primary'
              : 'bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Weekdays Only
        </button>
        
        <button
          type="button"
          onClick={() => handleTemplateSelect('monthly')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            recurrenceType === 'custom' && frequency === 'MONTHLY'
              ? 'bg-cm-blue text-white dark:bg-cm-yellow dark:text-dark-bg-primary'
              : 'bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Monthly
        </button>
        
        <button
          type="button"
          onClick={() => handleTemplateSelect('custom')}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            recurrenceType === 'custom' && !(
              (frequency === 'DAILY') ||
              (frequency === 'WEEKLY' && weekdays.length === 0) ||
              (frequency === 'WEEKLY' && weekdays.length === 5) ||
              (frequency === 'MONTHLY')
            )
              ? 'bg-cm-blue text-white dark:bg-cm-yellow dark:text-dark-bg-primary'
              : 'bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Custom
        </button>
      </div>
      
      {/* Advanced Settings */}
      {recurrenceType === 'custom' && (
        <div className="mt-4 p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
          <h3 className="text-md font-medium mb-3 text-light-text-primary dark:text-dark-text-primary">
            <FontAwesomeIcon icon={faSyncAlt} className="mr-2 text-cm-blue dark:text-cm-yellow" />
            Recurrence Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Frequency */}
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                Repeat every
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="interval"
                  type="number"
                  min="1"
                  max="99"
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-1 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                />
                <select
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="flex-grow px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
                >
                  <option value="DAILY">Day(s)</option>
                  <option value="WEEKLY">Week(s)</option>
                  <option value="MONTHLY">Month(s)</option>
                  <option value="YEARLY">Year(s)</option>
                </select>
              </div>
            </div>
            
            {/* Occurrences */}
            <div>
              <label htmlFor="count" className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-1">
                Number of occurrences
              </label>
              <input
                id="count"
                type="number"
                min="1"
                max="99"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border rounded-md bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary border-gray-300 dark:border-gray-700 focus:ring-cm-blue dark:focus:ring-cm-yellow"
              />
            </div>
          </div>
          
          {/* Weekdays */}
          {frequency === 'WEEKLY' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-light-text-primary dark:text-dark-text-primary mb-2">
                Repeat on
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'SU', label: 'Sun' },
                  { value: 'MO', label: 'Mon' },
                  { value: 'TU', label: 'Tue' },
                  { value: 'WE', label: 'Wed' },
                  { value: 'TH', label: 'Thu' },
                  { value: 'FR', label: 'Fri' },
                  { value: 'SA', label: 'Sat' }
                ].map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleWeekdayToggle(day.value)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm transition-colors ${
                      weekdays.includes(day.value)
                        ? 'bg-cm-blue text-white dark:bg-cm-yellow dark:text-dark-bg-primary'
                        : 'bg-light-bg-tertiary dark:bg-dark-bg-tertiary text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Summary */}
          <div className="mt-4 bg-light-bg-tertiary dark:bg-dark-bg-tertiary p-3 rounded-md text-sm text-light-text-secondary dark:text-dark-text-secondary">
            <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-cm-blue dark:text-cm-yellow" />
            {recurrenceType === 'none' ? (
              'One-time event'
            ) : (
              <span>
                {`Repeats ${frequency === 'DAILY' ? 'daily' : 
                  frequency === 'WEEKLY' ? 'weekly' : 
                  frequency === 'MONTHLY' ? 'monthly' : 'yearly'}`}
                
                {interval > 1 && ` every ${interval} ${
                  frequency === 'DAILY' ? 'days' : 
                  frequency === 'WEEKLY' ? 'weeks' : 
                  frequency === 'MONTHLY' ? 'months' : 'years'
                }`}
                
                {weekdays.length > 0 && ' on ' + weekdays.map(day => {
                  const dayMap: Record<string, string> = {
                    'SU': 'Sunday',
                    'MO': 'Monday',
                    'TU': 'Tuesday',
                    'WE': 'Wednesday',
                    'TH': 'Thursday',
                    'FR': 'Friday',
                    'SA': 'Saturday'
                  };
                  return dayMap[day];
                }).join(', ')}
                
                {count > 0 && `, ${count} time${count > 1 ? 's' : ''}`}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurrenceSelector; 