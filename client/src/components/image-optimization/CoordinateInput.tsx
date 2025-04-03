import React, { useState, useEffect } from 'react';

interface CoordinateInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  isLatitude?: boolean; // Optional prop to indicate if this is for latitude (for min/max values)
}

/**
 * A specialized input for decimal coordinate values that correctly handles:
 * - Negative values
 * - Decimal points
 * - Empty strings (converted to null)
 * - Validation for latitude/longitude ranges
 */
const CoordinateInput: React.FC<CoordinateInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
  isLatitude = false, // Default to false (longitude) if not specified
}) => {
  // Set appropriate min/max based on coordinate type
  const min = isLatitude ? -90 : -180;
  const max = isLatitude ? 90 : 180;
  
  // Internal state to track the string value before parsing
  const [textValue, setTextValue] = useState<string>(value !== null ? String(value) : '');
  
  // Track input validation state
  const [isValid, setIsValid] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Update the internal text value when the external value changes
  useEffect(() => {
    setTextValue(value !== null ? String(value) : '');
    
    // Validate the new value
    if (value !== null) {
      validateCoordinate(value);
    } else {
      setIsValid(true);
      setErrorMessage('');
    }
  }, [value]);

  // Validate if the coordinate is within range
  const validateCoordinate = (coordValue: number): boolean => {
    if (coordValue < min || coordValue > max) {
      setIsValid(false);
      setErrorMessage(`Value must be between ${min} and ${max}`);
      return false;
    } else {
      setIsValid(true);
      setErrorMessage('');
      return true;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setTextValue(newText);
    
    // If the input is empty, set to null
    if (newText === '') {
      onChange(null);
      setIsValid(true);
      setErrorMessage('');
      return;
    }
    
    // Parse the value
    const parsedValue = parseFloat(newText);
    if (!isNaN(parsedValue)) {
      // Check if the value is within range before updating
      const isValidCoord = validateCoordinate(parsedValue);
      if (isValidCoord) {
        onChange(parsedValue);
      } else {
        // Still update state with the value even if out of range
        onChange(parsedValue);
      }
    }
  };

  return (
    <div>
      <input
        type="number"
        value={textValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        step="any"
        min={min}
        max={max}
        className={`w-full rounded-md border ${!isValid ? 'border-red-500' : 'border-input'} bg-white px-3 py-2 text-sm text-black h-10 ${className}`}
      />
      {!isValid && errorMessage && (
        <p className="text-xs text-red-500 mt-1">{errorMessage}</p>
      )}
    </div>
  );
};

export default CoordinateInput;