/**
 * Agency Calendar & Tasks Page
 *
 * Full-featured calendar and task management for agency users.
 * Includes event creation with participant selection, meeting links,
 * and notification reminders.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCalendar, REMINDER_INTERVALS, CalendarEvent, Task } from '../../hooks';
import { useAuth } from '../../hooks/useAuth';

// ============================================
// Constants
// ============================================

const EVENT_TYPES = [
  { value: 'interview', label: 'Interview', color: '#3B82F6' },
  { value: 'meeting', label: 'Meeting', color: '#6366F1' },
  { value: 'training', label: 'Training', color: '#8B5CF6' },
  { value: 'placement', label: 'Placement', color: '#10B981' },
  { value: 'followup', label: 'Follow-up', color: '#14B8A6' },
  { value: 'screening', label: 'Screening', color: '#F97316' },
  { value: 'orientation', label: 'Orientation', color: '#06B6D4' },
  { value: 'medical', label: 'Medical', color: '#EF4444' },
  { value: 'documentation', label: 'Documentation', color: '#EAB308' },
  { value: 'other', label: 'Other', color: '#6B7280' },
];

const TASK_TITLES = [
  'Review maid application',
  'Verify documents',
  'Schedule interview',
  'Conduct background check',
  'Process visa application',
  'Arrange medical checkup',
  'Prepare contract',
  'Coordinate travel arrangements',
  'Follow up with sponsor',
  'Follow up with maid',
  'Update maid profile',
  'Send payment reminder',
  'Complete training session',
  'Resolve complaint',
];

const EVENT_TITLES = [
  'Maid Interview',
  'Sponsor Meeting',
  'Document Verification',
  'Contract Signing',
  'Medical Examination',
  'Visa Interview',
  'Embassy Appointment',
  'Training Session',
  'Orientation Meeting',
  'Follow-up Call',
  'Payment Collection',
  'Airport Pickup',
  'Airport Dropoff',
  'Home Visit',
  'Complaint Resolution Meeting',
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#10B981' },
  { value: 'medium', label: 'Medium', color: '#F59E0B' },
  { value: 'high', label: 'High', color: '#EF4444' },
];

const LOCATION_TYPES = [
  { value: 'onsite', label: 'On-site (In Person)' },
  { value: 'online', label: 'Online (Video Call)' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'hybrid', label: 'Hybrid' },
];

// ============================================
// Helper Functions
// ============================================

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'No date';
  try {
    const date = new Date(dateString + 'T12:00:00');
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Invalid date';
  }
};

const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return '';
  try {
    const parts = timeString.split(':');
    if (parts.length < 2) return timeString;
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return timeString;
  }
};

const isToday = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return dateString.split('T')[0] === todayStr;
};

const getEventTypeColor = (type: string): string => {
  return EVENT_TYPES.find(t => t.value === type)?.color || '#6B7280';
};

const getPriorityColor = (priority: string): string => {
  return PRIORITIES.find(p => p.value === priority)?.color || '#F59E0B';
};

// ============================================
// Components
// ============================================

interface TabButtonProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

const TabButton = ({ title, active, onPress }: TabButtonProps) => (
  <TouchableOpacity
    style={[styles.tabButton, active && styles.tabButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
      {title}
    </Text>
  </TouchableOpacity>
);

interface StatCardProps {
  title: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

interface EventCardProps {
  event: CalendarEvent;
  onPress: () => void;
}

const EventCard = ({ event, onPress }: EventCardProps) => (
  <TouchableOpacity style={styles.eventCard} onPress={onPress}>
    <View style={[styles.eventTypeIndicator, { backgroundColor: getEventTypeColor(event.event_type) }]} />
    <View style={styles.eventContent}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
        {isToday(event.start_date) && (
          <View style={styles.todayBadge}>
            <Text style={styles.todayBadgeText}>Today</Text>
          </View>
        )}
      </View>
      <View style={styles.eventDetails}>
        <View style={styles.eventDetailRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.eventDetailText}>{formatDate(event.start_date)}</Text>
        </View>
        {event.start_time && (
          <View style={styles.eventDetailRow}>
            <Ionicons name="time-outline" size={14} color="#6B7280" />
            <Text style={styles.eventDetailText}>{formatTime(event.start_time)}</Text>
          </View>
        )}
        {event.location && (
          <View style={styles.eventDetailRow}>
            <Ionicons name="location-outline" size={14} color="#6B7280" />
            <Text style={styles.eventDetailText} numberOfLines={1}>{event.location}</Text>
          </View>
        )}
        {event.meeting_link && (
          <View style={styles.eventDetailRow}>
            <Ionicons name="videocam-outline" size={14} color="#3B82F6" />
            <Text style={[styles.eventDetailText, { color: '#3B82F6' }]}>Video Call</Text>
          </View>
        )}
      </View>
      <View style={styles.eventFooter}>
        <View style={[styles.eventTypeBadge, { backgroundColor: getEventTypeColor(event.event_type) + '20' }]}>
          <Text style={[styles.eventTypeBadgeText, { color: getEventTypeColor(event.event_type) }]}>
            {EVENT_TYPES.find(t => t.value === event.event_type)?.label || 'Other'}
          </Text>
        </View>
        {event.priority === 'high' && (
          <View style={[styles.priorityBadge, { backgroundColor: '#FEE2E2' }]}>
            <Text style={[styles.priorityBadgeText, { color: '#EF4444' }]}>High</Text>
          </View>
        )}
      </View>
    </View>
  </TouchableOpacity>
);

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onStatusChange: (status: string) => void;
}

const TaskCard = ({ task, onPress, onStatusChange }: TaskCardProps) => (
  <TouchableOpacity style={styles.taskCard} onPress={onPress}>
    <TouchableOpacity
      style={[
        styles.taskCheckbox,
        task.status === 'completed' && styles.taskCheckboxCompleted,
      ]}
      onPress={() => onStatusChange(task.status === 'completed' ? 'pending' : 'completed')}
    >
      {task.status === 'completed' && (
        <Ionicons name="checkmark" size={16} color="#fff" />
      )}
    </TouchableOpacity>
    <View style={styles.taskContent}>
      <Text
        style={[
          styles.taskTitle,
          task.status === 'completed' && styles.taskTitleCompleted,
        ]}
        numberOfLines={1}
      >
        {task.title}
      </Text>
      <View style={styles.taskDetails}>
        {task.due_date && (
          <View style={styles.taskDetailRow}>
            <Ionicons name="calendar-outline" size={12} color="#6B7280" />
            <Text style={styles.taskDetailText}>{formatDate(task.due_date)}</Text>
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) + '20' }]}>
          <Text style={[styles.statusBadgeText, { color: getStatusColor(task.status) }]}>
            {task.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      {task.progress > 0 && task.progress < 100 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${task.progress}%` }]} />
        </View>
      )}
    </View>
    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
  </TouchableOpacity>
);

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed': return '#10B981';
    case 'in_progress': return '#3B82F6';
    case 'pending': return '#F59E0B';
    case 'overdue': return '#EF4444';
    default: return '#6B7280';
  }
};

// ============================================
// Main Component
// ============================================

export default function CalendarPage() {
  const { user } = useAuth();
  const agencyId = user?.uid;

  const {
    events,
    tasks,
    maids,
    sponsors,
    isLoading,
    error,
    refetch,
    createEvent,
    updateEvent,
    deleteEvent,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
  } = useCalendar(agencyId);

  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'tasks'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Create Event Modal
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'meeting',
    start_date: new Date(),
    start_time: new Date(),
    end_time: new Date(),
    location: '',
    location_type: 'onsite',
    meeting_link: '',
    priority: 'medium',
    maid_id: '',
    sponsor_id: '',
    send_notifications: true,
    reminder_intervals: [1440, 60],
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Create Task Modal
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: new Date(),
    estimated_hours: 1,
  });
  const [showTaskDatePicker, setShowTaskDatePicker] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Event Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);

  // Task Detail Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);

  // Computed values
  const todaysEvents = useMemo(() =>
    events.filter(e => isToday(e.start_date)),
    [events]
  );

  const upcomingEvents = useMemo(() =>
    events
      .filter(e => {
        const eventDate = new Date(e.start_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate >= today;
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 5),
    [events]
  );

  const importantEvents = useMemo(() =>
    events
      .filter(e => e.priority === 'high' || e.event_type === 'interview')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 5),
    [events]
  );

  const overdueTasks = useMemo(() =>
    tasks.filter(t => {
      if (t.status === 'completed') return false;
      if (!t.due_date) return false;
      return new Date(t.due_date) < new Date();
    }),
    [tasks]
  );

  const pendingTasks = useMemo(() =>
    tasks.filter(t => t.status === 'pending'),
    [tasks]
  );

  const inProgressTasks = useMemo(() =>
    tasks.filter(t => t.status === 'in_progress'),
    [tasks]
  );

  const completedTasks = useMemo(() =>
    tasks.filter(t => t.status === 'completed'),
    [tasks]
  );

  // Handlers
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleCreateEvent = async () => {
    if (!newEvent.title) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    setIsCreatingEvent(true);
    try {
      const dateStr = newEvent.start_date.toISOString().split('T')[0];
      const startTimeStr = newEvent.start_time.toTimeString().slice(0, 5);
      const endTimeStr = newEvent.end_time.toTimeString().slice(0, 5);

      await createEvent({
        title: newEvent.title,
        description: newEvent.description,
        event_type: newEvent.event_type,
        start_date: dateStr,
        start_time: startTimeStr,
        end_time: endTimeStr,
        location: newEvent.location,
        location_type: newEvent.location_type,
        meeting_link: newEvent.meeting_link,
        priority: newEvent.priority,
        maid_id: newEvent.maid_id || undefined,
        sponsor_id: newEvent.sponsor_id || undefined,
        send_notifications: newEvent.send_notifications,
        reminder_intervals: newEvent.reminder_intervals,
      });

      setShowCreateEvent(false);
      resetEventForm();
      Alert.alert('Success', 'Event created successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create event');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    setIsCreatingTask(true);
    try {
      const dateStr = newTask.due_date.toISOString().split('T')[0];

      await createTask({
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        due_date: dateStr,
        estimated_hours: newTask.estimated_hours,
      });

      setShowCreateTask(false);
      resetTaskForm();
      Alert.alert('Success', 'Task created successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(eventId);
              setShowEventDetail(false);
              setSelectedEvent(null);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
              setShowTaskDetail(false);
              setSelectedTask(null);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const handleJoinMeeting = (link: string) => {
    Linking.openURL(link).catch(() => {
      Alert.alert('Error', 'Could not open meeting link');
    });
  };

  const resetEventForm = () => {
    setNewEvent({
      title: '',
      description: '',
      event_type: 'meeting',
      start_date: new Date(),
      start_time: new Date(),
      end_time: new Date(),
      location: '',
      location_type: 'onsite',
      meeting_link: '',
      priority: 'medium',
      maid_id: '',
      sponsor_id: '',
      send_notifications: true,
      reminder_intervals: [1440, 60],
    });
  };

  const resetTaskForm = () => {
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      due_date: new Date(),
      estimated_hours: 1,
    });
  };

  const toggleReminderInterval = (value: number) => {
    setNewEvent(prev => ({
      ...prev,
      reminder_intervals: prev.reminder_intervals.includes(value)
        ? prev.reminder_intervals.filter(v => v !== value)
        : [...prev.reminder_intervals, value],
    }));
  };

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: 'Calendar & Tasks' }} />
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Calendar & Tasks' }} />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TabButton title="Overview" active={activeTab === 'overview'} onPress={() => setActiveTab('overview')} />
        <TabButton title="Calendar" active={activeTab === 'calendar'} onPress={() => setActiveTab('calendar')} />
        <TabButton title="Tasks" active={activeTab === 'tasks'} onPress={() => setActiveTab('tasks')} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#10B981']} />
        }
      >
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.overviewContainer}>
            {/* Stats */}
            <View style={styles.statsRow}>
              <StatCard title="Today" value={todaysEvents.length} icon="calendar" color="#3B82F6" />
              <StatCard title="Events" value={events.length} icon="calendar-outline" color="#8B5CF6" />
              <StatCard title="Tasks" value={tasks.length} icon="checkbox-outline" color="#10B981" />
            </View>

            {/* Today's Events */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Events</Text>
              {todaysEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No events today</Text>
                </View>
              ) : (
                todaysEvents.map((event, index) => (
                  <EventCard
                    key={`today-${event.id}-${index}`}
                    event={event}
                    onPress={() => {
                      setSelectedEvent(event);
                      setShowEventDetail(true);
                    }}
                  />
                ))
              )}
            </View>

            {/* Important Events */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Important Events</Text>
              {importantEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="alert-circle-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No high priority events</Text>
                </View>
              ) : (
                importantEvents.map((event, index) => (
                  <EventCard
                    key={`important-${event.id}-${index}`}
                    event={event}
                    onPress={() => {
                      setSelectedEvent(event);
                      setShowEventDetail(true);
                    }}
                  />
                ))
              )}
            </View>

            {/* Urgent Tasks */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Urgent Tasks</Text>
              {[...overdueTasks, ...inProgressTasks.filter(t => t.priority === 'high')].length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle-outline" size={40} color="#10B981" />
                  <Text style={styles.emptyStateText}>No urgent tasks</Text>
                </View>
              ) : (
                [...overdueTasks, ...inProgressTasks.filter(t => t.priority === 'high')].slice(0, 5).map((task, index) => (
                  <TaskCard
                    key={`urgent-${task.id}-${index}`}
                    task={task}
                    onPress={() => {
                      setSelectedTask(task);
                      setShowTaskDetail(true);
                    }}
                    onStatusChange={(status) => updateTaskStatus(task.id, status)}
                  />
                ))
              )}
            </View>
          </View>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <View style={styles.calendarContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              {upcomingEvents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="calendar-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No upcoming events</Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => setShowCreateEvent(true)}
                  >
                    <Text style={styles.emptyStateButtonText}>Create Event</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                events
                  .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                  .map((event, index) => (
                    <EventCard
                      key={`calendar-${event.id}-${index}`}
                      event={event}
                      onPress={() => {
                        setSelectedEvent(event);
                        setShowEventDetail(true);
                      }}
                    />
                  ))
              )}
            </View>
          </View>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <View style={styles.tasksContainer}>
            {/* Task Stats */}
            <View style={styles.taskStatsRow}>
              <View style={[styles.taskStatCard, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.taskStatValue, { color: '#F59E0B' }]}>{pendingTasks.length}</Text>
                <Text style={styles.taskStatLabel}>Pending</Text>
              </View>
              <View style={[styles.taskStatCard, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[styles.taskStatValue, { color: '#3B82F6' }]}>{inProgressTasks.length}</Text>
                <Text style={styles.taskStatLabel}>In Progress</Text>
              </View>
              <View style={[styles.taskStatCard, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.taskStatValue, { color: '#10B981' }]}>{completedTasks.length}</Text>
                <Text style={styles.taskStatLabel}>Completed</Text>
              </View>
            </View>

            {/* All Tasks */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Tasks</Text>
              {tasks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="checkbox-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyStateText}>No tasks yet</Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => setShowCreateTask(true)}
                  >
                    <Text style={styles.emptyStateButtonText}>Create Task</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                tasks
                  .sort((a, b) => {
                    if (a.status === 'completed' && b.status !== 'completed') return 1;
                    if (a.status !== 'completed' && b.status === 'completed') return -1;
                    return new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime();
                  })
                  .map((task, index) => (
                    <TaskCard
                      key={`alltask-${task.id}-${index}`}
                      task={task}
                      onPress={() => {
                        setSelectedTask(task);
                        setShowTaskDetail(true);
                      }}
                      onStatusChange={(status) => updateTaskStatus(task.id, status)}
                    />
                  ))
              )}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => setShowCreateTask(true)}
        >
          <Ionicons name="checkbox-outline" size={24} color="#10B981" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, styles.fabPrimary]}
          onPress={() => setShowCreateEvent(true)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Create Event Modal */}
      <Modal
        visible={showCreateEvent}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateEvent(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateEvent(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Event</Text>
            <TouchableOpacity onPress={handleCreateEvent} disabled={isCreatingEvent}>
              <Text style={[styles.modalSave, isCreatingEvent && styles.modalSaveDisabled]}>
                {isCreatingEvent ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Event Title */}
            <Text style={styles.inputLabel}>Event Title *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={EVENT_TITLES.includes(newEvent.title) ? newEvent.title : (newEvent.title ? '__custom__' : '')}
                onValueChange={(value) => {
                  if (value === '__custom__') {
                    // Keep custom value or clear for new input
                    if (!EVENT_TITLES.includes(newEvent.title)) {
                      // Already has custom value, keep it
                    } else {
                      setNewEvent(prev => ({ ...prev, title: '' }));
                    }
                  } else {
                    setNewEvent(prev => ({ ...prev, title: value }));
                  }
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select event title..." value="" />
                {EVENT_TITLES.map(title => (
                  <Picker.Item key={title} label={title} value={title} />
                ))}
                <Picker.Item label="Other (Custom)..." value="__custom__" />
              </Picker>
            </View>
            {(!EVENT_TITLES.includes(newEvent.title) || newEvent.title === '') && (
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Enter event title"
                value={EVENT_TITLES.includes(newEvent.title) ? '' : newEvent.title}
                onChangeText={(text) => setNewEvent(prev => ({ ...prev, title: text }))}
              />
            )}

            {/* Event Type */}
            <Text style={styles.inputLabel}>Event Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newEvent.event_type}
                onValueChange={(value) => setNewEvent(prev => ({ ...prev, event_type: value }))}
                style={styles.picker}
              >
                {EVENT_TYPES.map(type => (
                  <Picker.Item key={type.value} label={type.label} value={type.value} />
                ))}
              </Picker>
            </View>

            {/* Date */}
            <Text style={styles.inputLabel}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {newEvent.start_date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={newEvent.start_date}
                mode="date"
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setNewEvent(prev => ({ ...prev, start_date: date }));
                }}
              />
            )}

            {/* Time */}
            <View style={styles.timeRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.inputLabel}>Start Time</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                  <Text style={styles.dateButtonText}>
                    {newEvent.start_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.timeColumn}>
                <Text style={styles.inputLabel}>End Time</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                  <Text style={styles.dateButtonText}>
                    {newEvent.end_time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {showStartTimePicker && (
              <DateTimePicker
                value={newEvent.start_time}
                mode="time"
                onChange={(_, time) => {
                  setShowStartTimePicker(false);
                  if (time) setNewEvent(prev => ({ ...prev, start_time: time }));
                }}
              />
            )}
            {showEndTimePicker && (
              <DateTimePicker
                value={newEvent.end_time}
                mode="time"
                onChange={(_, time) => {
                  setShowEndTimePicker(false);
                  if (time) setNewEvent(prev => ({ ...prev, end_time: time }));
                }}
              />
            )}

            {/* Priority */}
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newEvent.priority}
                onValueChange={(value) => setNewEvent(prev => ({ ...prev, priority: value }))}
                style={styles.picker}
              >
                {PRIORITIES.map(p => (
                  <Picker.Item key={p.value} label={p.label} value={p.value} />
                ))}
              </Picker>
            </View>

            {/* Participants Section */}
            <View style={styles.sectionDivider}>
              <Ionicons name="people-outline" size={20} color="#10B981" />
              <Text style={styles.sectionDividerText}>Participants</Text>
            </View>

            <Text style={styles.inputLabel}>Maid</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newEvent.maid_id}
                onValueChange={(value) => setNewEvent(prev => ({ ...prev, maid_id: value }))}
                style={styles.picker}
              >
                <Picker.Item label="No maid selected" value="" />
                {maids.map((maid, index) => (
                  <Picker.Item key={`maid-${maid.id}-${index}`} label={maid.name} value={maid.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.inputLabel}>Sponsor</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newEvent.sponsor_id}
                onValueChange={(value) => setNewEvent(prev => ({ ...prev, sponsor_id: value }))}
                style={styles.picker}
              >
                <Picker.Item label="No sponsor selected" value="" />
                {sponsors.map((sponsor, index) => (
                  <Picker.Item key={`sponsor-${sponsor.id}-${index}`} label={sponsor.name} value={sponsor.id} />
                ))}
              </Picker>
            </View>

            {/* Location Section */}
            <View style={styles.sectionDivider}>
              <Ionicons name="location-outline" size={20} color="#10B981" />
              <Text style={styles.sectionDividerText}>Location & Meeting</Text>
            </View>

            <Text style={styles.inputLabel}>Location Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newEvent.location_type}
                onValueChange={(value) => setNewEvent(prev => ({ ...prev, location_type: value }))}
                style={styles.picker}
              >
                {LOCATION_TYPES.map(lt => (
                  <Picker.Item key={lt.value} label={lt.label} value={lt.value} />
                ))}
              </Picker>
            </View>

            {(newEvent.location_type === 'onsite' || newEvent.location_type === 'hybrid') && (
              <>
                <Text style={styles.inputLabel}>Physical Location</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter address or location"
                  value={newEvent.location}
                  onChangeText={(text) => setNewEvent(prev => ({ ...prev, location: text }))}
                />
              </>
            )}

            {(newEvent.location_type === 'online' || newEvent.location_type === 'hybrid') && (
              <>
                <Text style={styles.inputLabel}>Meeting Link (Zoom / Google Meet)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  value={newEvent.meeting_link}
                  onChangeText={(text) => setNewEvent(prev => ({ ...prev, meeting_link: text }))}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </>
            )}

            {/* Notifications Section */}
            <View style={styles.sectionDivider}>
              <Ionicons name="notifications-outline" size={20} color="#10B981" />
              <Text style={styles.sectionDividerText}>Notifications & Reminders</Text>
            </View>

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchLabel}>Send Notifications</Text>
                <Text style={styles.switchHint}>Notify maid and sponsor about this event</Text>
              </View>
              <Switch
                value={newEvent.send_notifications}
                onValueChange={(value) => setNewEvent(prev => ({ ...prev, send_notifications: value }))}
                trackColor={{ false: '#D1D5DB', true: '#10B981' }}
              />
            </View>

            {newEvent.send_notifications && (
              <View style={styles.reminderGrid}>
                {REMINDER_INTERVALS.map(interval => (
                  <TouchableOpacity
                    key={interval.value}
                    style={[
                      styles.reminderChip,
                      newEvent.reminder_intervals.includes(interval.value) && styles.reminderChipActive,
                    ]}
                    onPress={() => toggleReminderInterval(interval.value)}
                  >
                    <Text style={[
                      styles.reminderChipText,
                      newEvent.reminder_intervals.includes(interval.value) && styles.reminderChipTextActive,
                    ]}>
                      {interval.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Description */}
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add event description..."
              value={newEvent.description}
              onChangeText={(text) => setNewEvent(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />

            <View style={{ height: 50 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Create Task Modal */}
      <Modal
        visible={showCreateTask}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateTask(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateTask(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Task</Text>
            <TouchableOpacity onPress={handleCreateTask} disabled={isCreatingTask}>
              <Text style={[styles.modalSave, isCreatingTask && styles.modalSaveDisabled]}>
                {isCreatingTask ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Task Title */}
            <Text style={styles.inputLabel}>Task Title *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={TASK_TITLES.includes(newTask.title) ? newTask.title : (newTask.title ? '__custom__' : '')}
                onValueChange={(value) => {
                  if (value === '__custom__') {
                    if (!TASK_TITLES.includes(newTask.title)) {
                      // Already has custom value, keep it
                    } else {
                      setNewTask(prev => ({ ...prev, title: '' }));
                    }
                  } else {
                    setNewTask(prev => ({ ...prev, title: value }));
                  }
                }}
                style={styles.picker}
              >
                <Picker.Item label="Select task title..." value="" />
                {TASK_TITLES.map(title => (
                  <Picker.Item key={title} label={title} value={title} />
                ))}
                <Picker.Item label="Other (Custom)..." value="__custom__" />
              </Picker>
            </View>
            {(!TASK_TITLES.includes(newTask.title) || newTask.title === '') && (
              <TextInput
                style={[styles.input, { marginTop: 8 }]}
                placeholder="Enter task title"
                value={TASK_TITLES.includes(newTask.title) ? '' : newTask.title}
                onChangeText={(text) => setNewTask(prev => ({ ...prev, title: text }))}
              />
            )}

            {/* Priority */}
            <Text style={styles.inputLabel}>Priority</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newTask.priority}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                style={styles.picker}
              >
                {PRIORITIES.map(p => (
                  <Picker.Item key={p.value} label={p.label} value={p.value} />
                ))}
              </Picker>
            </View>

            {/* Due Date */}
            <Text style={styles.inputLabel}>Due Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowTaskDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {newTask.due_date.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            {showTaskDatePicker && (
              <DateTimePicker
                value={newTask.due_date}
                mode="date"
                onChange={(_, date) => {
                  setShowTaskDatePicker(false);
                  if (date) setNewTask(prev => ({ ...prev, due_date: date }));
                }}
              />
            )}

            {/* Description */}
            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add task description..."
              value={newTask.description}
              onChangeText={(text) => setNewTask(prev => ({ ...prev, description: text }))}
              multiline
              numberOfLines={3}
            />

            <View style={{ height: 50 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Event Detail Modal */}
      <Modal
        visible={showEventDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEventDetail(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEventDetail(false)}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Event Details</Text>
            <TouchableOpacity onPress={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {selectedEvent && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.detailTitle}>{selectedEvent.title}</Text>

              <View style={styles.detailBadges}>
                <View style={[styles.eventTypeBadge, { backgroundColor: getEventTypeColor(selectedEvent.event_type) + '20' }]}>
                  <Text style={[styles.eventTypeBadgeText, { color: getEventTypeColor(selectedEvent.event_type) }]}>
                    {EVENT_TYPES.find(t => t.value === selectedEvent.event_type)?.label || 'Other'}
                  </Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedEvent.priority) + '20' }]}>
                  <Text style={[styles.priorityBadgeText, { color: getPriorityColor(selectedEvent.priority) }]}>
                    {selectedEvent.priority.charAt(0).toUpperCase() + selectedEvent.priority.slice(1)} Priority
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                <Text style={styles.detailText}>{formatDate(selectedEvent.start_date)}</Text>
              </View>

              {selectedEvent.start_time && (
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {formatTime(selectedEvent.start_time)}
                    {selectedEvent.end_time && ` - ${formatTime(selectedEvent.end_time)}`}
                  </Text>
                </View>
              )}

              {selectedEvent.location && (
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>{selectedEvent.location}</Text>
                </View>
              )}

              {selectedEvent.meeting_link && (
                <TouchableOpacity
                  style={styles.meetingLinkButton}
                  onPress={() => handleJoinMeeting(selectedEvent.meeting_link!)}
                >
                  <Ionicons name="videocam" size={20} color="#fff" />
                  <Text style={styles.meetingLinkButtonText}>Join Meeting</Text>
                </TouchableOpacity>
              )}

              {selectedEvent.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.descriptionLabel}>Description</Text>
                  <Text style={styles.descriptionText}>{selectedEvent.description}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        visible={showTaskDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTaskDetail(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTaskDetail(false)}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Task Details</Text>
            <TouchableOpacity onPress={() => selectedTask && handleDeleteTask(selectedTask.id)}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {selectedTask && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.detailTitle}>{selectedTask.title}</Text>

              <View style={styles.detailBadges}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedTask.status) + '20' }]}>
                  <Text style={[styles.statusBadgeText, { color: getStatusColor(selectedTask.status) }]}>
                    {selectedTask.status.replace('_', ' ')}
                  </Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedTask.priority) + '20' }]}>
                  <Text style={[styles.priorityBadgeText, { color: getPriorityColor(selectedTask.priority) }]}>
                    {selectedTask.priority.charAt(0).toUpperCase() + selectedTask.priority.slice(1)} Priority
                  </Text>
                </View>
              </View>

              {selectedTask.due_date && (
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  <Text style={styles.detailText}>Due: {formatDate(selectedTask.due_date)}</Text>
                </View>
              )}

              {selectedTask.progress > 0 && (
                <View style={styles.progressSection}>
                  <Text style={styles.progressLabel}>Progress: {selectedTask.progress}%</Text>
                  <View style={styles.progressBarLarge}>
                    <View style={[styles.progressFillLarge, { width: `${selectedTask.progress}%` }]} />
                  </View>
                </View>
              )}

              {/* Quick Actions */}
              <View style={styles.quickActions}>
                {selectedTask.status !== 'in_progress' && selectedTask.status !== 'completed' && (
                  <TouchableOpacity
                    style={[styles.quickActionButton, { backgroundColor: '#DBEAFE' }]}
                    onPress={() => {
                      updateTaskStatus(selectedTask.id, 'in_progress');
                      setSelectedTask(prev => prev ? { ...prev, status: 'in_progress' } : null);
                    }}
                  >
                    <Ionicons name="play" size={20} color="#3B82F6" />
                    <Text style={[styles.quickActionText, { color: '#3B82F6' }]}>Start</Text>
                  </TouchableOpacity>
                )}
                {selectedTask.status !== 'completed' && (
                  <TouchableOpacity
                    style={[styles.quickActionButton, { backgroundColor: '#D1FAE5' }]}
                    onPress={() => {
                      updateTaskStatus(selectedTask.id, 'completed');
                      setSelectedTask(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null);
                    }}
                  >
                    <Ionicons name="checkmark" size={20} color="#10B981" />
                    <Text style={[styles.quickActionText, { color: '#10B981' }]}>Complete</Text>
                  </TouchableOpacity>
                )}
              </View>

              {selectedTask.description && (
                <View style={styles.descriptionSection}>
                  <Text style={styles.descriptionLabel}>Description</Text>
                  <Text style={styles.descriptionText}>{selectedTask.description}</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ============================================
// Styles
// ============================================

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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#ECFDF5',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#10B981',
  },
  content: {
    flex: 1,
  },
  overviewContainer: {
    padding: 16,
  },
  calendarContainer: {
    padding: 16,
  },
  tasksContainer: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderLeftWidth: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 4,
  },
  statTitle: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  emptyStateButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  eventTypeIndicator: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  todayBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  todayBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  eventDetails: {
    gap: 4,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  eventFooter: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  eventTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskCheckboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  taskDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  taskDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  taskStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  taskStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  taskStatValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  taskStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabPrimary: {
    backgroundColor: '#10B981',
  },
  fabSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  modalSaveDisabled: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    fontSize: 15,
    color: '#1F2937',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeColumn: {
    flex: 1,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  sectionDividerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  switchHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  reminderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  reminderChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  reminderChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  reminderChipText: {
    fontSize: 13,
    color: '#6B7280',
  },
  reminderChipTextActive: {
    color: '#10B981',
    fontWeight: '500',
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#4B5563',
  },
  meetingLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  meetingLinkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  descriptionSection: {
    marginTop: 16,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  progressBarLarge: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressFillLarge: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
