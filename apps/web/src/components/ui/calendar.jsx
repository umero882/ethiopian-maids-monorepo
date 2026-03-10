import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/src/style.css';

import { cn } from '@/lib/utils';

function Calendar({ className, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
