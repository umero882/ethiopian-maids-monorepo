/**
 * Maid Availability Page
 *
 * Fully synced with web MaidAvailabilityPage.jsx
 * Shows: Calendar View (with date selection), Working Hours, Add Leave dialog
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Alert,
  Switch,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { gql, useQuery, useMutation } from '@apollo/client';
import { useAuth } from '../../hooks';

// GraphQL Queries
const GET_BASE_PROFILE = gql`
  query GetBaseProfile($email: String!) {
    profiles(where: { email: { _eq: $email } }, limit: 1) {
      id
      email
      user_type
    }
  }
`;

const GET_MAID_PROFILE = gql`
  query GetMaidProfile($userId: String!) {
    maid_profiles(where: { user_id: { _eq: $userId } }, limit: 1) {
      id
      user_id
      availability_status
      available_from
      work_history
    }
  }
`;

// Get booked dates from accepted booking requests
const GET_BOOKED_DATES = gql`
  query GetBookedDates($maidId: String!) {
    booking_requests(
      where: {
        maid_id: { _eq: $maidId }
        status: { _in: ["accepted", "confirmed", "in_progress"] }
      }
    ) {
      id
      requested_start_date
      requested_duration_months
      status
    }
  }
`;

const UPDATE_AVAILABILITY = gql`
  mutation UpdateAvailability($userId: String!, $availabilityStatus: String, $availableFrom: date, $workHistory: jsonb) {
    update_maid_profiles(
      where: { user_id: { _eq: $userId } }
      _set: {
        availability_status: $availabilityStatus,
        available_from: $availableFrom,
        work_history: $workHistory,
        updated_at: "now()"
      }
    ) {
      affected_rows
      returning {
        id
        availability_status
        available_from
        work_history
      }
    }
  }
`;

type TabType = 'calendar' | 'schedule';

interface WorkingHours {
  isWorking: boolean;
  startTime: string;
  endTime: string;
}

interface AvailabilityState {
  unavailableDates: string[];
  bookedDates: string[];
  workingHours: {
    monday: WorkingHours;
    tuesday: WorkingHours;
    wednesday: WorkingHours;
    thursday: WorkingHours;
    friday: WorkingHours;
    saturday: WorkingHours;
    sunday: WorkingHours;
  };
  noticeRequired: number;
  specialNotes: string;
}

const defaultWorkingHours: AvailabilityState['workingHours'] = {
  monday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
  tuesday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
  wednesday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
  thursday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
  friday: { isWorking: true, startTime: '08:00', endTime: '17:00' },
  saturday: { isWorking: false, startTime: '09:00', endTime: '14:00' },
  sunday: { isWorking: false, startTime: '09:00', endTime: '14:00' },
};

// Simple Calendar Component
interface SimpleCalendarProps {
  selectedDates: string[];
  bookedDates: string[];
  onDayPress: (dateString: string) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  isLeaveMode?: boolean; // Purple highlight for leave selection
}

const SimpleCalendar: React.FC<SimpleCalendarProps> = ({
  selectedDates,
  bookedDates,
  onDayPress,
  currentMonth,
  onMonthChange,
  isLeaveMode = false,
}) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: { date: Date | null; dateString: string }[] = [];

    // Empty cells for days before the first day
    for (let i = 0; i < startingDay; i++) {
      days.push({ date: null, dateString: '' });
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateString = d.toISOString().split('T')[0];
      days.push({ date: d, dateString });
    }

    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date().toISOString().split('T')[0];

  const goToPrevMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={calendarStyles.container}>
      {/* Header */}
      <View style={calendarStyles.header}>
        <TouchableOpacity onPress={goToPrevMonth} style={calendarStyles.navButton}>
          <Ionicons name="chevron-back" size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <Text style={calendarStyles.monthYear}>{monthYear}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={calendarStyles.navButton}>
          <Ionicons name="chevron-forward" size={24} color="#8B5CF6" />
        </TouchableOpacity>
      </View>

      {/* Days of week */}
      <View style={calendarStyles.weekRow}>
        {daysOfWeek.map((day) => (
          <View key={day} style={calendarStyles.weekDayCell}>
            <Text style={calendarStyles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={calendarStyles.grid}>
        {days.map((day, index) => {
          if (!day.date) {
            return <View key={`empty-${index}`} style={calendarStyles.dayCell} />;
          }

          const isToday = day.dateString === today;
          const isSelected = selectedDates.includes(day.dateString);
          const isBooked = bookedDates.includes(day.dateString);
          const isPast = day.dateString < today;

          // Different styles for leave mode vs availability mode
          const selectedStyle = isLeaveMode
            ? calendarStyles.leaveSelectedCell
            : calendarStyles.unavailableCell;
          const selectedTextStyle = isLeaveMode
            ? calendarStyles.leaveSelectedText
            : calendarStyles.unavailableText;

          return (
            <Pressable
              key={day.dateString}
              style={({ pressed }) => [
                calendarStyles.dayCell,
                isToday && !isSelected && calendarStyles.todayCell,
                isSelected && selectedStyle,
                isBooked && calendarStyles.bookedCell,
                isPast && calendarStyles.pastCell,
                pressed && !isPast && calendarStyles.pressedCell,
              ]}
              onPress={() => {
                if (!isPast) {
                  console.log('Calendar day pressed:', day.dateString);
                  onDayPress(day.dateString);
                }
              }}
              disabled={isPast}
            >
              <Text
                style={[
                  calendarStyles.dayText,
                  isToday && !isSelected && calendarStyles.todayText,
                  isSelected && selectedTextStyle,
                  isBooked && calendarStyles.bookedText,
                  isPast && calendarStyles.pastText,
                ]}
              >
                {day.date.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const calendarStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    color: '#1F2937',
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  todayText: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  unavailableCell: {
    backgroundColor: '#FEE2E2',
  },
  unavailableText: {
    color: '#991B1B',
  },
  leaveSelectedCell: {
    backgroundColor: '#DDD6FE',
  },
  leaveSelectedText: {
    color: '#5B21B6',
    fontWeight: '600',
  },
  bookedCell: {
    backgroundColor: '#DBEAFE',
  },
  bookedText: {
    color: '#1E40AF',
  },
  pastCell: {
    opacity: 0.4,
  },
  pastText: {
    color: '#9CA3AF',
  },
  pressedCell: {
    backgroundColor: '#E5E7EB',
    transform: [{ scale: 0.95 }],
  },
});

export default function MaidAvailabilityScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [refreshing, setRefreshing] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState<string | null>(null);
  const [leaveEndDate, setLeaveEndDate] = useState<string | null>(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaveMonth, setLeaveMonth] = useState(new Date());
  const [selectingLeaveDate, setSelectingLeaveDate] = useState<'start' | 'end'>('start');

  const [availability, setAvailability] = useState<AvailabilityState>({
    unavailableDates: [],
    bookedDates: [],
    workingHours: defaultWorkingHours,
    noticeRequired: 2,
    specialNotes: '',
  });

  // First, get base profile to get user ID
  const { data: baseProfileData } = useQuery(GET_BASE_PROFILE, {
    variables: { email: user?.email },
    skip: !user?.email,
  });

  const userId = baseProfileData?.profiles?.[0]?.id;

  // Then fetch maid profile using user ID
  const { data: maidProfileData, loading, refetch } = useQuery(GET_MAID_PROFILE, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  const maidProfile = maidProfileData?.maid_profiles?.[0];

  // Fetch booked dates from booking requests
  const { data: bookedData, refetch: refetchBookings } = useQuery(GET_BOOKED_DATES, {
    variables: { maidId: userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  // Update availability mutation
  const [updateAvailability, { loading: saving }] = useMutation(UPDATE_AVAILABILITY);

  // Calculate booked dates from booking requests
  useEffect(() => {
    if (bookedData?.booking_requests) {
      const dates: string[] = [];
      bookedData.booking_requests.forEach((booking: { requested_start_date: string; requested_duration_months: number }) => {
        if (booking.requested_start_date) {
          const startDate = new Date(booking.requested_start_date);
          const durationMonths = booking.requested_duration_months || 1;

          // Generate dates for the booking duration
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + durationMonths);

          let current = new Date(startDate);
          while (current < endDate) {
            dates.push(current.toISOString().split('T')[0]);
            current.setDate(current.getDate() + 1);
          }
        }
      });

      setAvailability(prev => ({
        ...prev,
        bookedDates: [...new Set(dates)], // Remove duplicates
      }));
    }
  }, [bookedData]);

  // Load saved preferences from profile (stored in work_history.availability)
  useEffect(() => {
    if (maidProfile?.work_history) {
      try {
        const workHistory = typeof maidProfile.work_history === 'string'
          ? JSON.parse(maidProfile.work_history)
          : maidProfile.work_history;

        // Availability settings are stored under 'availability' key in work_history
        const prefs = workHistory?.availability;
        if (prefs) {
          setAvailability(prev => ({
            ...prev,
            workingHours: prefs.workingHours || defaultWorkingHours,
            unavailableDates: prefs.unavailableDates || [],
            noticeRequired: prefs.noticeRequired || 2,
            specialNotes: prefs.specialNotes || '',
          }));
        }
      } catch (e) {
        console.error('Error parsing work history:', e);
      }
    }
  }, [maidProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchBookings()]);
    setRefreshing(false);
  }, [refetch, refetchBookings]);

  const handleSaveAvailability = async () => {
    if (!userId) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    try {
      // Get existing work_history to preserve other data
      const existingWorkHistory = maidProfile?.work_history || {};
      const workHistoryData = typeof existingWorkHistory === 'string'
        ? JSON.parse(existingWorkHistory)
        : existingWorkHistory;

      // Store availability settings under 'availability' key
      const updatedWorkHistory = {
        ...workHistoryData,
        availability: {
          workingHours: availability.workingHours,
          unavailableDates: availability.unavailableDates,
          noticeRequired: availability.noticeRequired,
          specialNotes: availability.specialNotes,
        },
      };

      await updateAvailability({
        variables: {
          userId,
          workHistory: updatedWorkHistory,
        },
      });

      Alert.alert('Success', 'Your availability settings have been updated successfully.');
    } catch (err) {
      console.error('Error saving availability:', err);
      Alert.alert('Error', 'Failed to save availability. Please try again.');
    }
  };

  const handleDateSelect = (dateStr: string) => {
    // Check if date is booked
    if (availability.bookedDates.includes(dateStr)) {
      Alert.alert(
        'Cannot Modify Booked Date',
        'This date is already booked by an employer and cannot be modified.'
      );
      return;
    }

    // Toggle availability
    if (availability.unavailableDates.includes(dateStr)) {
      // Remove from unavailable
      setAvailability(prev => ({
        ...prev,
        unavailableDates: prev.unavailableDates.filter(d => d !== dateStr),
      }));
      Alert.alert('Date Available', `You are now marked as available on ${formatDate(dateStr)}.`);
    } else {
      // Add to unavailable
      setAvailability(prev => ({
        ...prev,
        unavailableDates: [...prev.unavailableDates, dateStr],
      }));
      Alert.alert('Date Unavailable', `You are now marked as unavailable on ${formatDate(dateStr)}.`);
    }
  };

  const handleLeaveSelect = (dateStr: string) => {
    console.log('handleLeaveSelect called with:', dateStr, 'selectingLeaveDate:', selectingLeaveDate);
    if (selectingLeaveDate === 'start') {
      setLeaveStartDate(dateStr);
      setLeaveEndDate(null); // Reset end date when selecting new start
      setSelectingLeaveDate('end');
    } else {
      if (leaveStartDate && dateStr >= leaveStartDate) {
        setLeaveEndDate(dateStr);
      } else {
        // If user selects a date before start, reset and use as new start
        setLeaveStartDate(dateStr);
        setLeaveEndDate(null);
        setSelectingLeaveDate('end');
      }
    }
  };

  const handleSubmitLeave = () => {
    if (!leaveStartDate || !leaveEndDate) {
      Alert.alert('Error', 'Please select both start and end dates');
      return;
    }

    // Generate all dates in range
    const dates: string[] = [];
    let current = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      if (!availability.bookedDates.includes(dateStr)) {
        dates.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }

    // Add to unavailable dates (remove duplicates)
    setAvailability(prev => ({
      ...prev,
      unavailableDates: [...new Set([...prev.unavailableDates, ...dates])],
    }));

    Alert.alert(
      'Leave Added',
      `Your leave from ${formatDate(leaveStartDate)} to ${formatDate(leaveEndDate)} has been added.`
    );

    // Reset and close
    setLeaveStartDate(null);
    setLeaveEndDate(null);
    setLeaveReason('');
    setSelectingLeaveDate('start');
    setShowLeaveModal(false);
  };

  const handleWorkingHourChange = (
    day: keyof AvailabilityState['workingHours'],
    field: keyof WorkingHours,
    value: boolean | string
  ) => {
    setAvailability(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value,
        },
      },
    }));
  };

  const removeUnavailableDate = (dateStr: string) => {
    setAvailability(prev => ({
      ...prev,
      unavailableDates: prev.unavailableDates.filter(d => d !== dateStr),
    }));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'calendar', label: 'Calendar View' },
    { key: 'schedule', label: 'Working Hours' },
  ];

  const days: (keyof AvailabilityState['workingHours'])[] = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
  ];

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading availability...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Availability',
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#1F2937',
        }}
      />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Manage Availability</Text>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveAvailability}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={16} color="#fff" />
                <Text style={styles.saveButtonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#8B5CF6']} />
          }
        >
          {activeTab === 'calendar' ? (
            /* Calendar Tab */
            <View style={styles.calendarSection}>
              {/* Section Header */}
              <View style={styles.calendarHeaderContainer}>
                <View style={styles.calendarHeaderTop}>
                  <Text style={styles.sectionTitle}>Availability Calendar</Text>
                  <TouchableOpacity
                    style={styles.addLeaveButton}
                    onPress={() => {
                      console.log('Add Leave button pressed');
                      setShowLeaveModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={16} color="#8B5CF6" />
                    <Text style={styles.addLeaveButtonText}>Add Leave</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Tap on dates to mark yourself as available or unavailable.
                </Text>
              </View>

              {/* Legend */}
              <View style={styles.legend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Available</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Unavailable</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.legendText}>Booked</Text>
                </View>
              </View>

              {/* Calendar */}
              <View style={styles.calendarContainer}>
                <SimpleCalendar
                  selectedDates={availability.unavailableDates}
                  bookedDates={availability.bookedDates}
                  onDayPress={handleDateSelect}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
              </View>

              {/* Unavailable Dates List */}
              <View style={styles.datesSection}>
                <Text style={styles.datesSectionTitle}>Currently Unavailable Dates</Text>
                {availability.unavailableDates.length > 0 ? (
                  <View style={styles.datesList}>
                    {[...availability.unavailableDates]
                      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                      .map((date) => (
                        <View key={date} style={styles.dateItem}>
                          <Text style={styles.dateItemText}>{formatShortDate(date)}</Text>
                          <TouchableOpacity onPress={() => removeUnavailableDate(date)}>
                            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                          </TouchableOpacity>
                        </View>
                      ))}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No unavailable dates set.</Text>
                )}
              </View>

              {/* Booked Dates */}
              {availability.bookedDates.length > 0 && (
                <View style={styles.datesSection}>
                  <Text style={styles.datesSectionTitle}>Booked Dates</Text>
                  <View style={[styles.datesList, styles.bookedDatesList]}>
                    {[...availability.bookedDates]
                      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                      .map((date) => (
                        <View key={date} style={styles.dateItem}>
                          <Text style={styles.dateItemText}>{formatShortDate(date)}</Text>
                          <View style={styles.bookedBadge}>
                            <Text style={styles.bookedBadgeText}>Booked</Text>
                          </View>
                        </View>
                      ))}
                  </View>
                </View>
              )}

              {/* Warning */}
              <View style={styles.warningBox}>
                <Ionicons name="warning-outline" size={16} color="#D97706" />
                <Text style={styles.warningText}>
                  Bookings cannot be modified directly. Contact support if you need to change a booked date.
                </Text>
              </View>
            </View>
          ) : (
            /* Working Hours Tab */
            <View style={styles.scheduleSection}>
              <View style={styles.scheduleHeader}>
                <Ionicons name="time-outline" size={20} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Working Hours</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Set your regular working hours for each day of the week.
              </Text>

              {/* Days */}
              {days.map((day) => (
                <View key={day} style={styles.dayRow}>
                  <View style={styles.dayToggle}>
                    <Switch
                      value={availability.workingHours[day].isWorking}
                      onValueChange={(value) => handleWorkingHourChange(day, 'isWorking', value)}
                      trackColor={{ false: '#D1D5DB', true: '#DDD6FE' }}
                      thumbColor={availability.workingHours[day].isWorking ? '#8B5CF6' : '#9CA3AF'}
                    />
                    <Text style={styles.dayName}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                  </View>
                  <View style={styles.timeInputs}>
                    <View style={styles.timeInputWrapper}>
                      <Text style={styles.timeLabel}>Start</Text>
                      <TextInput
                        style={[
                          styles.timeInput,
                          !availability.workingHours[day].isWorking && styles.timeInputDisabled,
                        ]}
                        value={availability.workingHours[day].startTime}
                        onChangeText={(value) => handleWorkingHourChange(day, 'startTime', value)}
                        editable={availability.workingHours[day].isWorking}
                        placeholder="08:00"
                      />
                    </View>
                    <View style={styles.timeInputWrapper}>
                      <Text style={styles.timeLabel}>End</Text>
                      <TextInput
                        style={[
                          styles.timeInput,
                          !availability.workingHours[day].isWorking && styles.timeInputDisabled,
                        ]}
                        value={availability.workingHours[day].endTime}
                        onChangeText={(value) => handleWorkingHourChange(day, 'endTime', value)}
                        editable={availability.workingHours[day].isWorking}
                        placeholder="17:00"
                      />
                    </View>
                  </View>
                </View>
              ))}

              {/* Notice Required */}
              <View style={styles.noticeSection}>
                <Text style={styles.noticeLabel}>Notice Required (days)</Text>
                <TextInput
                  style={styles.noticeInput}
                  value={String(availability.noticeRequired)}
                  onChangeText={(value) => {
                    const num = parseInt(value) || 0;
                    setAvailability(prev => ({ ...prev, noticeRequired: Math.min(30, Math.max(0, num)) }));
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.noticeHint}>
                  Minimum number of days in advance employers should request your services.
                </Text>
              </View>

              {/* Special Notes */}
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Special Notes for Employers</Text>
                <TextInput
                  style={styles.notesInput}
                  value={availability.specialNotes}
                  onChangeText={(value) => setAvailability(prev => ({ ...prev, specialNotes: value }))}
                  placeholder="Add any additional notes about your availability or scheduling preferences..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveHoursButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveAvailability}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#fff" />
                    <Text style={styles.saveHoursButtonText}>Save Working Hours</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Leave Modal */}
        <Modal
          visible={showLeaveModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowLeaveModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Leave Period</Text>
                <Pressable
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowLeaveModal(false);
                    setLeaveStartDate(null);
                    setLeaveEndDate(null);
                    setLeaveReason('');
                    setSelectingLeaveDate('start');
                  }}
                >
                  <Ionicons name="close" size={24} color="#374151" />
                </Pressable>
              </View>

              <ScrollView
                style={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                <Text style={styles.modalDescription}>
                  Select start and end dates for your leave period.
                </Text>

                {/* Date Selection Buttons */}
                <View style={styles.leaveSelectionRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.dateSelectButton,
                      selectingLeaveDate === 'start' && styles.dateSelectButtonActive,
                      pressed && styles.dateSelectButtonPressed,
                    ]}
                    onPress={() => setSelectingLeaveDate('start')}
                  >
                    <Text style={styles.dateSelectLabel}>Start Date</Text>
                    <Text style={[
                      styles.dateSelectValue,
                      leaveStartDate && styles.dateSelectValueSelected,
                    ]}>
                      {leaveStartDate ? formatShortDate(leaveStartDate) : 'Select date'}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.dateSelectButton,
                      selectingLeaveDate === 'end' && styles.dateSelectButtonActive,
                      pressed && styles.dateSelectButtonPressed,
                    ]}
                    onPress={() => setSelectingLeaveDate('end')}
                  >
                    <Text style={styles.dateSelectLabel}>End Date</Text>
                    <Text style={[
                      styles.dateSelectValue,
                      leaveEndDate && styles.dateSelectValueSelected,
                    ]}>
                      {leaveEndDate ? formatShortDate(leaveEndDate) : 'Select date'}
                    </Text>
                  </Pressable>
                </View>

                {/* Instructions */}
                <View style={styles.instructionBox}>
                  <Ionicons name="hand-left-outline" size={16} color="#6366F1" />
                  <Text style={styles.instructionText}>
                    {selectingLeaveDate === 'start'
                      ? 'Tap any date below to set START date'
                      : 'Tap any date below to set END date'}
                  </Text>
                </View>

                {/* Calendar for Leave */}
                <View style={styles.leaveCalendarContainer}>
                  <SimpleCalendar
                    selectedDates={leaveStartDate && leaveEndDate ?
                      (() => {
                        const dates: string[] = [];
                        let current = new Date(leaveStartDate);
                        const end = new Date(leaveEndDate);
                        while (current <= end) {
                          dates.push(current.toISOString().split('T')[0]);
                          current.setDate(current.getDate() + 1);
                        }
                        return dates;
                      })() :
                      leaveStartDate ? [leaveStartDate] : []
                    }
                    bookedDates={availability.bookedDates}
                    onDayPress={handleLeaveSelect}
                    currentMonth={leaveMonth}
                    onMonthChange={setLeaveMonth}
                    isLeaveMode={true}
                  />
                </View>

                {/* Reason */}
                <View style={styles.leaveReasonSection}>
                  <Text style={styles.leaveReasonLabel}>Reason (Optional)</Text>
                  <TextInput
                    style={styles.leaveReasonInput}
                    value={leaveReason}
                    onChangeText={setLeaveReason}
                    placeholder="Why are you taking leave?"
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>
              </ScrollView>

              {/* Footer Buttons */}
              <View style={styles.modalFooterButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowLeaveModal(false);
                    setLeaveStartDate(null);
                    setLeaveEndDate(null);
                    setLeaveReason('');
                    setSelectingLeaveDate('start');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.submitLeaveButton,
                    (!leaveStartDate || !leaveEndDate) && styles.submitLeaveButtonDisabled,
                    pressed && leaveStartDate && leaveEndDate && styles.submitLeaveButtonPressed,
                  ]}
                  onPress={() => {
                    console.log('Submit Leave pressed', { leaveStartDate, leaveEndDate });
                    handleSubmitLeave();
                  }}
                  disabled={!leaveStartDate || !leaveEndDate}
                >
                  <Text style={styles.submitLeaveButtonText}>
                    {leaveStartDate && leaveEndDate ? 'Add Leave' : 'Select Dates'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#8B5CF6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#fff',
  },

  // Content
  content: {
    flex: 1,
  },

  // Calendar Section
  calendarSection: {
    padding: 16,
  },
  calendarHeaderContainer: {
    marginBottom: 16,
  },
  calendarHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flexShrink: 1,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  addLeaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
    gap: 4,
    flexShrink: 0,
  },
  addLeaveButtonText: {
    fontSize: 13,
    color: '#8B5CF6',
    fontWeight: '600',
  },

  // Legend
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Calendar
  calendarContainer: {
    marginBottom: 16,
  },

  // Dates Section
  datesSection: {
    marginBottom: 16,
  },
  datesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  datesList: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  bookedDatesList: {
    backgroundColor: '#EFF6FF',
  },
  dateItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateItemText: {
    fontSize: 14,
    color: '#374151',
  },
  bookedBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bookedBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },

  // Warning
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },

  // Schedule Section
  scheduleSection: {
    padding: 16,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },

  // Day Row
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInputWrapper: {
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeInput: {
    width: 70,
    height: 36,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  timeInputDisabled: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },

  // Notice Section
  noticeSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  noticeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  noticeInput: {
    width: 80,
    height: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  noticeHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },

  // Notes Section
  notesSection: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#fff',
    minHeight: 100,
  },

  // Save Hours Button
  saveHoursButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  saveHoursButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalScrollContent: {
    padding: 16,
    maxHeight: 380,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#4338CA',
    fontWeight: '500',
  },

  // Leave Selection
  leaveSelectionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateSelectButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  dateSelectButtonActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },
  dateSelectButtonPressed: {
    backgroundColor: '#EDE9FE',
  },
  dateSelectLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  dateSelectValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  dateSelectValueSelected: {
    color: '#1F2937',
  },

  // Leave Calendar
  leaveCalendarContainer: {
    marginBottom: 16,
  },

  // Leave Reason
  leaveReasonSection: {
    marginBottom: 16,
  },
  leaveReasonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  leaveReasonInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#fff',
    minHeight: 80,
  },

  // Modal Footer
  modalFooterButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  submitLeaveButton: {
    flex: 2,
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitLeaveButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitLeaveButtonPressed: {
    backgroundColor: '#7C3AED',
  },
  submitLeaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
