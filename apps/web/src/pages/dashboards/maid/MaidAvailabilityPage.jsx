import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { gql } from '@apollo/client';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DropdownDatePicker } from '@/components/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CalendarDays,
  Clock,
  Save,
  AlertTriangle,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Briefcase,
  Info,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apolloClient } from '@ethio/api-client';
import {
  format,
  addDays,
  isSameDay,
  parseISO,
  eachDayOfInterval,
} from 'date-fns';

// GraphQL queries
const GET_MAID_AVAILABILITY = gql`
  query GetMaidAvailability($userId: String!) {
    maid_profiles_by_pk(id: $userId) {
      id
      availability_status
      available_from
      unavailable_dates
      working_hours_schedule
      notice_required_days
      availability_notes
      work_preferences
    }
    bookings(
      where: {
        maid_id: { _eq: $userId }
        status: { _in: ["confirmed", "active", "in_progress"] }
      }
      order_by: { start_date: asc }
    ) {
      id
      start_date
      end_date
      status
      booking_type
    }
  }
`;

const UPDATE_MAID_AVAILABILITY = gql`
  mutation UpdateMaidAvailability(
    $userId: String!
    $availability_status: String
    $available_from: date
    $unavailable_dates: jsonb
    $working_hours_schedule: jsonb
    $notice_required_days: Int
    $availability_notes: String
  ) {
    update_maid_profiles_by_pk(
      pk_columns: { id: $userId }
      _set: {
        availability_status: $availability_status
        available_from: $available_from
        unavailable_dates: $unavailable_dates
        working_hours_schedule: $working_hours_schedule
        notice_required_days: $notice_required_days
        availability_notes: $availability_notes
      }
    ) {
      id
      availability_status
      available_from
      unavailable_dates
      working_hours_schedule
      notice_required_days
      availability_notes
    }
  }
`;

const DEFAULT_WORKING_HOURS = {
  monday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
  tuesday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
  wednesday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
  thursday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
  friday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
  saturday: { isWorking: false, startTime: '09:00', endTime: '14:00' },
  sunday: { isWorking: false, startTime: '09:00', endTime: '14:00' },
};

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available', color: 'bg-green-500' },
  { value: 'unavailable', label: 'Unavailable', color: 'bg-red-500' },
  { value: 'available_soon', label: 'Available Soon', color: 'bg-yellow-500' },
  { value: 'employed', label: 'Currently Employed', color: 'bg-blue-500' },
];

const MaidAvailabilityPage = () => {
  const { user } = useAuth();
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [availableFrom, setAvailableFrom] = useState(null);
  const [availability, setAvailability] = useState({
    unavailableDates: [],
    bookedDates: [],
    workingHours: { ...DEFAULT_WORKING_HOURS },
    noticeRequired: 2,
    specialNotes: '',
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveDetails, setLeaveDetails] = useState({
    startDate: null,
    endDate: null,
    reason: '',
  });
  const [workPreferences, setWorkPreferences] = useState([]);

  // Load availability data from DB
  useEffect(() => {
    if (!user?.id) return;

    const loadAvailability = async () => {
      try {
        const { data } = await apolloClient.query({
          query: GET_MAID_AVAILABILITY,
          variables: { userId: user.id },
          fetchPolicy: 'network-only',
        });

        const profile = data?.maid_profiles_by_pk;
        const bookings = data?.bookings || [];

        // Set work preferences
        if (Array.isArray(profile?.work_preferences)) {
          setWorkPreferences(profile.work_preferences);
        }

        // Set availability status
        if (profile?.availability_status) {
          setAvailabilityStatus(profile.availability_status);
        }
        if (profile?.available_from) {
          setAvailableFrom(parseISO(profile.available_from));
        }

        // Parse unavailable dates from DB (stored as JSON array of ISO strings)
        const dbUnavailableDates = Array.isArray(profile?.unavailable_dates)
          ? profile.unavailable_dates.map((d) => parseISO(d))
          : [];

        // Parse booked dates from actual bookings
        const bookedDates = [];
        bookings.forEach((booking) => {
          if (booking.start_date && booking.end_date) {
            try {
              const days = eachDayOfInterval({
                start: parseISO(booking.start_date),
                end: parseISO(booking.end_date),
              });
              bookedDates.push(...days);
            } catch {
              // Single day booking
              bookedDates.push(parseISO(booking.start_date));
            }
          } else if (booking.start_date) {
            bookedDates.push(parseISO(booking.start_date));
          }
        });

        // Parse working hours from DB or use defaults
        const dbWorkingHours = profile?.working_hours_schedule;
        const workingHours =
          dbWorkingHours && typeof dbWorkingHours === 'object' && Object.keys(dbWorkingHours).length > 0
            ? dbWorkingHours
            : { ...DEFAULT_WORKING_HOURS };

        setAvailability({
          unavailableDates: dbUnavailableDates,
          bookedDates,
          workingHours,
          noticeRequired: profile?.notice_required_days ?? 2,
          specialNotes: profile?.availability_notes || '',
        });
      } catch (error) {
        console.error('Error fetching availability data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load availability data. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, [user?.id]);

  const handleDateSelect = (date) => {
    if (isRangeMode) {
      if (!dateRange.from) {
        setDateRange({ from: date, to: null });
      } else if (!dateRange.to && date > dateRange.from) {
        setDateRange({ ...dateRange, to: date });
      } else {
        setDateRange({ from: date, to: null });
      }
    } else {
      setSelectedDate(date);

      const isUnavailable = availability.unavailableDates.some((d) =>
        isSameDay(d, date)
      );
      const isBooked = availability.bookedDates.some((d) => isSameDay(d, date));

      if (isBooked) {
        toast({
          title: 'Cannot Modify Booked Date',
          description: 'This date is already booked by an employer and cannot be modified.',
          variant: 'destructive',
        });
        return;
      }

      if (isUnavailable) {
        setAvailability({
          ...availability,
          unavailableDates: availability.unavailableDates.filter(
            (d) => !isSameDay(d, date)
          ),
        });
        toast({
          title: 'Date Marked as Available',
          description: `You are now marked as available on ${format(date, 'MMMM d, yyyy')}.`,
        });
      } else {
        setAvailability({
          ...availability,
          unavailableDates: [...availability.unavailableDates, date],
        });
        toast({
          title: 'Date Marked as Unavailable',
          description: `You are now marked as unavailable on ${format(date, 'MMMM d, yyyy')}.`,
        });
      }
    }
  };

  const handleApplyRange = () => {
    if (dateRange.from && dateRange.to) {
      const rangeDates = [];
      let currentDate = dateRange.from;

      while (currentDate <= dateRange.to) {
        if (!availability.bookedDates.some((d) => isSameDay(d, currentDate))) {
          rangeDates.push(new Date(currentDate));
        }
        currentDate = addDays(currentDate, 1);
      }

      setAvailability({
        ...availability,
        unavailableDates: [
          ...availability.unavailableDates,
          ...rangeDates,
        ].filter(
          (date, index, self) =>
            index === self.findIndex((d) => isSameDay(d, date))
        ),
      });

      toast({
        title: 'Date Range Applied',
        description: `You are now marked as unavailable from ${format(dateRange.from, 'MMM d')} to ${format(dateRange.to, 'MMM d, yyyy')}.`,
      });

      setDateRange({ from: null, to: null });
      setIsRangeMode(false);
    }
  };

  const handleClearRange = () => {
    setDateRange({ from: null, to: null });
  };

  // Real save to DB via GraphQL
  const handleSaveAvailability = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);

      // Convert Date objects to ISO strings for storage
      const unavailableDatesISO = availability.unavailableDates.map((d) =>
        format(d, 'yyyy-MM-dd')
      );

      await apolloClient.mutate({
        mutation: UPDATE_MAID_AVAILABILITY,
        variables: {
          userId: user.id,
          availability_status: availabilityStatus,
          available_from: availableFrom ? format(availableFrom, 'yyyy-MM-dd') : null,
          unavailable_dates: unavailableDatesISO,
          working_hours_schedule: availability.workingHours,
          notice_required_days: availability.noticeRequired,
          availability_notes: availability.specialNotes,
        },
      });

      toast({
        title: 'Availability Saved',
        description: 'Your availability settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to save availability. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleWorkingHourChange = (day, field, value) => {
    setAvailability({
      ...availability,
      workingHours: {
        ...availability.workingHours,
        [day]: {
          ...availability.workingHours[day],
          [field]: value,
        },
      },
    });
  };

  const handleAddLeave = () => {
    setShowLeaveDialog(true);
  };

  const handleSubmitLeave = () => {
    if (leaveDetails.startDate && leaveDetails.endDate) {
      const leaveDates = [];
      let currentDate = leaveDetails.startDate;

      while (currentDate <= leaveDetails.endDate) {
        if (!availability.bookedDates.some((d) => isSameDay(d, currentDate))) {
          leaveDates.push(new Date(currentDate));
        }
        currentDate = addDays(currentDate, 1);
      }

      setAvailability({
        ...availability,
        unavailableDates: [
          ...availability.unavailableDates,
          ...leaveDates,
        ].filter(
          (date, index, self) =>
            index === self.findIndex((d) => isSameDay(d, date))
        ),
      });

      toast({
        title: 'Leave Added',
        description: `Your leave from ${format(leaveDetails.startDate, 'MMM d')} to ${format(leaveDetails.endDate, 'MMM d, yyyy')} has been added. Click "Save Changes" to persist.`,
      });

      setLeaveDetails({ startDate: null, endDate: null, reason: '' });
      setShowLeaveDialog(false);
    }
  };

  const isDayUnavailable = (date) => {
    return availability.unavailableDates.some((d) => isSameDay(d, date));
  };

  const isDayBooked = (date) => {
    return availability.bookedDates.some((d) => isSameDay(d, date));
  };

  const sectionAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full py-20'>
        <Loader2 className='h-8 w-8 animate-spin text-purple-500' />
        <span className='ml-3 text-gray-600'>Loading availability data...</span>
      </div>
    );
  }

  const isPartTime = workPreferences.some(
    (p) => typeof p === 'string' && p.toLowerCase().includes('part-time')
  );
  const isFullTimeOnly =
    workPreferences.length > 0 &&
    !isPartTime &&
    workPreferences.some(
      (p) =>
        typeof p === 'string' &&
        (p.toLowerCase().includes('full-time') || p.toLowerCase().includes('live-in'))
    );

  return (
    <div className='space-y-8'>
      <div className='flex justify-between items-center flex-wrap gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-800'>
            Manage Availability
          </h1>
          <p className='text-sm text-gray-500 mt-1'>
            Set your part-time working schedule and availability for sponsors.
          </p>
        </div>
        <Button onClick={handleSaveAvailability} disabled={saving} className='gap-2'>
          {saving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Full-time only info banner */}
      {isFullTimeOnly && (
        <motion.div {...sectionAnimation}>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3'>
            <Info className='h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0' />
            <div>
              <p className='text-sm font-medium text-blue-800'>
                Your profile is set to full-time / live-in work only.
              </p>
              <p className='text-sm text-blue-700 mt-1'>
                Availability management is primarily designed for part-time maids who work with
                multiple sponsors on a flexible schedule. As a full-time maid, your sponsor manages
                your schedule. You can still set your status below if you're between placements.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Part-time context banner */}
      {isPartTime && (
        <motion.div {...sectionAnimation}>
          <div className='bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3'>
            <Briefcase className='h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0' />
            <div>
              <p className='text-sm text-purple-700'>
                As a part-time maid, manage your available days and working hours here. Sponsors
                will see your availability when booking your services.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Availability Status Card */}
      <motion.div {...sectionAnimation}>
        <Card className='shadow-lg border-0'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CheckCircle2 className='h-5 w-5 text-purple-500' />
              Availability Status
            </CardTitle>
            <CardDescription>
              Set your current availability status visible to sponsors and agencies.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label>Current Status</Label>
                <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className='flex items-center gap-2'>
                          <div className={`h-3 w-3 rounded-full ${opt.color}`} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(availabilityStatus === 'available_soon' || availabilityStatus === 'employed') && (
                <div className='space-y-2'>
                  <Label>Available From</Label>
                  <DropdownDatePicker
                    selected={availableFrom}
                    onSelect={setAvailableFrom}
                    fromYear={new Date().getFullYear()}
                    toYear={new Date().getFullYear() + 2}
                    minAge={-2}
                    maxAge={0}
                    placeholder='Select date'
                    className='w-full'
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid grid-cols-2 mb-6'>
          <TabsTrigger value='calendar'>Calendar View</TabsTrigger>
          <TabsTrigger value='schedule'>Working Hours</TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value='calendar' className='space-y-6'>
          <motion.div {...sectionAnimation}>
            <Card className='shadow-lg border-0'>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <div>
                    <CardTitle className='flex items-center gap-2'>
                      <CalendarDays className='h-5 w-5 text-purple-500' />
                      Availability Calendar
                    </CardTitle>
                    <CardDescription>
                      Click on dates to mark yourself as available or
                      unavailable for part-time work.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleAddLeave}
                    variant='outline'
                    size='sm'
                    className='gap-2'
                  >
                    <Plus className='h-4 w-4' />
                    Add Leave
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center space-x-4 mb-4'>
                    <div className='flex items-center space-x-2'>
                      <div className='h-4 w-4 rounded-full bg-green-500'></div>
                      <span className='text-sm'>Available</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='h-4 w-4 rounded-full bg-red-500'></div>
                      <span className='text-sm'>Unavailable</span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div className='h-4 w-4 rounded-full bg-blue-500'></div>
                      <span className='text-sm'>Booked</span>
                    </div>
                  </div>

                  <div className='flex flex-col md:flex-row items-start gap-6'>
                    <div className='md:flex-1'>
                      <div className='mb-4 flex justify-between items-center'>
                        <div className='flex items-center gap-2'>
                          <Switch
                            id='range-mode'
                            checked={isRangeMode}
                            onCheckedChange={setIsRangeMode}
                          />
                          <Label
                            htmlFor='range-mode'
                            className='text-sm cursor-pointer'
                          >
                            Range Selection Mode
                          </Label>
                        </div>

                        {isRangeMode && dateRange.from && (
                          <div className='flex gap-2'>
                            <Button
                              onClick={handleApplyRange}
                              size='sm'
                              variant='default'
                              disabled={!dateRange.to}
                            >
                              Apply Range
                            </Button>
                            <Button
                              onClick={handleClearRange}
                              size='sm'
                              variant='outline'
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </div>

                      <Calendar
                        mode={isRangeMode ? 'range' : 'single'}
                        selected={isRangeMode ? dateRange : selectedDate}
                        onSelect={isRangeMode ? setDateRange : handleDateSelect}
                        className='rounded-md border'
                        modifiers={{
                          unavailable: (date) => isDayUnavailable(date),
                          booked: (date) => isDayBooked(date),
                        }}
                        modifiersClassNames={{
                          unavailable: 'bg-red-100 text-red-800',
                          booked: 'bg-blue-100 text-blue-800',
                        }}
                      />
                    </div>

                    <div className='md:flex-1 w-full'>
                      <h3 className='text-lg font-medium text-gray-700 mb-3'>
                        Currently Unavailable Dates
                      </h3>
                      {availability.unavailableDates.length > 0 ? (
                        <div className='bg-gray-50 p-4 rounded-lg max-h-[300px] overflow-y-auto'>
                          <ul className='space-y-2'>
                            {availability.unavailableDates
                              .sort((a, b) => a - b)
                              .map((date, index) => (
                                <li
                                  key={index}
                                  className='flex justify-between items-center py-1 border-b border-gray-100'
                                >
                                  <span>{format(date, 'MMMM d, yyyy')}</span>
                                  <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => handleDateSelect(date)}
                                    className='h-7 w-7 p-0'
                                  >
                                    <X className='h-4 w-4 text-gray-500' />
                                  </Button>
                                </li>
                              ))}
                          </ul>
                        </div>
                      ) : (
                        <p className='text-gray-500 italic'>
                          No unavailable dates set.
                        </p>
                      )}

                      <h3 className='text-lg font-medium text-gray-700 mb-3 mt-6'>
                        Booked Dates
                      </h3>
                      {availability.bookedDates.length > 0 ? (
                        <div className='bg-blue-50 p-4 rounded-lg max-h-[200px] overflow-y-auto'>
                          <ul className='space-y-2'>
                            {availability.bookedDates
                              .sort((a, b) => a - b)
                              .map((date, index) => (
                                <li
                                  key={index}
                                  className='flex justify-between items-center py-1 border-b border-blue-100'
                                >
                                  <span>{format(date, 'MMMM d, yyyy')}</span>
                                  <Badge className='bg-blue-500'>Booked</Badge>
                                </li>
                              ))}
                          </ul>
                        </div>
                      ) : (
                        <p className='text-gray-500 italic'>No bookings yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className='bg-gray-50 px-6 py-4'>
                <div className='text-sm text-gray-500 flex items-center gap-2'>
                  <AlertTriangle className='h-4 w-4 text-yellow-500' />
                  <p>
                    Bookings cannot be modified directly. Contact support if you
                    need to change a booked date.
                  </p>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Working Hours Tab */}
        <TabsContent value='schedule' className='space-y-6'>
          <motion.div {...sectionAnimation}>
            <Card className='shadow-lg border-0'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Clock className='h-5 w-5 text-purple-500' />
                  Working Hours
                </CardTitle>
                <CardDescription>
                  Set your regular part-time working hours for each day of the week.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {Object.entries(availability.workingHours).map(
                    ([day, hours]) => (
                      <div
                        key={day}
                        className='grid grid-cols-4 gap-4 items-center border-b pb-4'
                      >
                        <div className='col-span-1'>
                          <div className='flex items-center gap-2'>
                            <Switch
                              id={`working-${day}`}
                              checked={hours.isWorking}
                              onCheckedChange={(checked) =>
                                handleWorkingHourChange(
                                  day,
                                  'isWorking',
                                  checked
                                )
                              }
                            />
                            <Label
                              htmlFor={`working-${day}`}
                              className='capitalize'
                            >
                              {day}
                            </Label>
                          </div>
                        </div>

                        <div className='col-span-3 grid grid-cols-2 gap-4'>
                          <div className='space-y-2'>
                            <Label htmlFor={`start-${day}`}>Start Time</Label>
                            <input
                              id={`start-${day}`}
                              type='time'
                              value={hours.startTime}
                              onChange={(e) =>
                                handleWorkingHourChange(
                                  day,
                                  'startTime',
                                  e.target.value
                                )
                              }
                              disabled={!hours.isWorking}
                              className='w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50'
                            />
                          </div>

                          <div className='space-y-2'>
                            <Label htmlFor={`end-${day}`}>End Time</Label>
                            <input
                              id={`end-${day}`}
                              type='time'
                              value={hours.endTime}
                              onChange={(e) =>
                                handleWorkingHourChange(
                                  day,
                                  'endTime',
                                  e.target.value
                                )
                              }
                              disabled={!hours.isWorking}
                              className='w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50'
                            />
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  <div className='mt-6 space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='notice-days'>
                        Notice Required (days)
                      </Label>
                      <input
                        id='notice-days'
                        type='number'
                        min='0'
                        max='30'
                        value={availability.noticeRequired}
                        onChange={(e) =>
                          setAvailability({
                            ...availability,
                            noticeRequired: parseInt(e.target.value) || 0,
                          })
                        }
                        className='w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500'
                      />
                      <p className='text-xs text-gray-500'>
                        Minimum number of days in advance employers should
                        request your services.
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='special-notes'>
                        Special Notes for Employers
                      </Label>
                      <Textarea
                        id='special-notes'
                        value={availability.specialNotes || ''}
                        onChange={(e) =>
                          setAvailability({
                            ...availability,
                            specialNotes: e.target.value,
                          })
                        }
                        placeholder='Add any additional notes about your availability or scheduling preferences...'
                        className='min-h-[100px]'
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className='flex justify-end bg-gray-50 px-6 py-4'>
                <Button onClick={handleSaveAvailability} disabled={saving} className='gap-2'>
                  {saving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />}
                  {saving ? 'Saving...' : 'Save Working Hours'}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Leave Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Add Leave Period</DialogTitle>
            <DialogDescription>
              Mark a range of dates as unavailable for personal leave.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='leave-start'>Start Date</Label>
                <DropdownDatePicker
                  selected={leaveDetails.startDate}
                  onSelect={(date) =>
                    setLeaveDetails({ ...leaveDetails, startDate: date })
                  }
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 2}
                  minAge={-2}
                  maxAge={0}
                  placeholder='Select start date'
                  className='w-full'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='leave-end'>End Date</Label>
                <DropdownDatePicker
                  selected={leaveDetails.endDate}
                  onSelect={(date) =>
                    setLeaveDetails({ ...leaveDetails, endDate: date })
                  }
                  disabled={!leaveDetails.startDate}
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 2}
                  minAge={-2}
                  maxAge={0}
                  placeholder='Select end date'
                  className='w-full'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='leave-reason'>Reason (Optional)</Label>
              <Textarea
                id='leave-reason'
                value={leaveDetails.reason}
                onChange={(e) =>
                  setLeaveDetails({ ...leaveDetails, reason: e.target.value })
                }
                placeholder='Add a reason for your leave (visible only to you)...'
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='submit'
              onClick={handleSubmitLeave}
              disabled={!leaveDetails.startDate || !leaveDetails.endDate}
            >
              Add Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaidAvailabilityPage;
