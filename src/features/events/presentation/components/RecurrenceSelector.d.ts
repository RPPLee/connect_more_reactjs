declare module './RecurrenceSelector' {
  interface RecurrenceSelectorProps {
    value: string;
    onChange: (value: string) => void;
  }

  const RecurrenceSelector: React.FC<RecurrenceSelectorProps>;
  export default RecurrenceSelector;
} 