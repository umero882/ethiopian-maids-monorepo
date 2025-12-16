import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SingleSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select...',
  className = '',
  id,
  ariaLabel,
  disabled = false,
}) => {
  return (
    <Select
      value={value}
      onValueChange={(val) => onChange?.(val)}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SingleSelect;
