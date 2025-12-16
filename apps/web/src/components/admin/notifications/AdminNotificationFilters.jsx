/**
 * AdminNotificationFilters Component
 * Filter controls for admin notifications page
 */

import { useState, useCallback } from 'react';
import { Search, X, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ADMIN_NOTIFICATION_CATEGORIES } from '@/services/adminNotificationService';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: ADMIN_NOTIFICATION_CATEGORIES.USER_EVENT, label: 'User Events' },
  { value: ADMIN_NOTIFICATION_CATEGORIES.CONTENT_MODERATION, label: 'Content Moderation' },
  { value: ADMIN_NOTIFICATION_CATEGORIES.FINANCIAL_ALERT, label: 'Financial' },
  { value: ADMIN_NOTIFICATION_CATEGORIES.SYSTEM_ALERT, label: 'System' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

/**
 * AdminNotificationFilters Component
 */
export function AdminNotificationFilters({
  filters = {},
  onFiltersChange,
  allowedCategories = [],
  className,
}) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [dateRange, setDateRange] = useState({
    from: filters.startDate ? new Date(filters.startDate) : undefined,
    to: filters.endDate ? new Date(filters.endDate) : undefined,
  });

  // Get available category options based on allowed categories
  const availableCategories = CATEGORY_OPTIONS.filter(
    option => option.value === 'all' || allowedCategories.length === 0 || allowedCategories.includes(option.value)
  );

  // Count active filters
  const activeFilterCount = Object.entries(localFilters).filter(
    ([key, value]) => value && key !== 'search'
  ).length + (dateRange.from ? 1 : 0);

  // Handle filter change
  const handleFilterChange = useCallback((key, value) => {
    // Convert 'all' to undefined to clear the filter
    const filterValue = value === 'all' ? undefined : value;
    const newFilters = { ...localFilters, [key]: filterValue };

    // Clean up empty values
    Object.keys(newFilters).forEach(k => {
      if (newFilters[k] === '' || newFilters[k] === undefined) {
        delete newFilters[k];
      }
    });

    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [localFilters, onFiltersChange]);

  // Handle search
  const handleSearch = useCallback((value) => {
    handleFilterChange('search', value);
  }, [handleFilterChange]);

  // Handle status filter (converts to read boolean)
  const handleStatusChange = useCallback((value) => {
    if (value === 'unread') {
      handleFilterChange('read', false);
    } else if (value === 'read') {
      handleFilterChange('read', true);
    } else if (value === 'all') {
      handleFilterChange('read', undefined);
    }
  }, [handleFilterChange]);

  // Handle date range
  const handleDateRangeChange = useCallback((range) => {
    setDateRange(range);

    const newFilters = { ...localFilters };
    if (range?.from) {
      newFilters.startDate = range.from.toISOString();
    } else {
      delete newFilters.startDate;
    }
    if (range?.to) {
      newFilters.endDate = range.to.toISOString();
    } else {
      delete newFilters.endDate;
    }

    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [localFilters, onFiltersChange]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setLocalFilters({});
    setDateRange({ from: undefined, to: undefined });
    onFiltersChange?.({});
  }, [onFiltersChange]);

  // Get current status value for select
  const getStatusValue = () => {
    if (localFilters.read === false) return 'unread';
    if (localFilters.read === true) return 'read';
    return 'all';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Quick Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notifications..."
            value={localFilters.search || ''}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
          {localFilters.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => handleSearch('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <Select
            value={localFilters.category || 'all'}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((option) => (
                <SelectItem key={option.value || 'all'} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select
            value={localFilters.priority || 'all'}
            onValueChange={(value) => handleFilterChange('priority', value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value || 'all'} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={getStatusValue()}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value || 'all'} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[180px] justify-start text-left font-normal',
                  !dateRange.from && 'text-muted-foreground'
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                    </>
                  ) : (
                    format(dateRange.from, 'MMM d, yyyy')
                  )
                ) : (
                  'Date range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10"
            >
              <X className="h-4 w-4 mr-1" />
              Clear ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {localFilters.category && (
            <Badge variant="secondary" className="gap-1">
              Category: {CATEGORY_OPTIONS.find(o => o.value === localFilters.category)?.label}
              <button
                onClick={() => handleFilterChange('category', 'all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {localFilters.priority && (
            <Badge variant="secondary" className="gap-1">
              Priority: {localFilters.priority}
              <button
                onClick={() => handleFilterChange('priority', 'all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {localFilters.read !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Status: {localFilters.read ? 'Read' : 'Unread'}
              <button
                onClick={() => handleFilterChange('read', undefined)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {dateRange.from && (
            <Badge variant="secondary" className="gap-1">
              Date: {format(dateRange.from, 'MMM d')}
              {dateRange.to && ` - ${format(dateRange.to, 'MMM d')}`}
              <button
                onClick={() => handleDateRangeChange({ from: undefined, to: undefined })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminNotificationFilters;
