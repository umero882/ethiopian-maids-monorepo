import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Phone,
  Video,
  FileText,
  GraduationCap,
  UserCheck,
  Archive,
  Star,
  Tag,
  Timer,
  Target,
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  Bell,
  Link,
  Mail,
  UserPlus
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import calendarService from '@/services/calendarService';
import { useAuth } from '@/contexts/AuthContext';
import { REMINDER_INTERVALS } from '@/services/eventReminderService';

const AgencyCalendarPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Filters
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialogs
  const [isCreateEventDialogOpen, setIsCreateEventDialogOpen] = useState(false);
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isEventDetailOpen, setIsEventDetailOpen] = useState(false);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'event' or 'task'
  const [itemToDelete, setItemToDelete] = useState(null);

  // Calendar view state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState('month'); // 'month', 'week', 'list'

  // Available maids and sponsors for selection
  const [availableMaids, setAvailableMaids] = useState([]);
  const [availableSponsors, setAvailableSponsors] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Form data
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: 'meeting',
    start_date: '',
    start_time: '',
    end_time: '',
    location: '',
    priority: 'medium',
    isCustomTitle: false,
    // New fields for participants and notifications
    maid_id: '',
    sponsor_id: '',
    meeting_link: '',
    location_type: 'onsite', // onsite, online, phone, hybrid
    send_notifications: true,
    reminder_intervals: [1440, 60], // Default: 1 day and 1 hour before
  });

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to_id: '',
    estimated_hours: 1,
    tags: [],
    isCustomTitle: false
  });

  // For agency users, their own ID is the agency_id
  const agencyId = user?.id;

  useEffect(() => {
    loadData();
    loadParticipants();
  }, [agencyId]);

  useEffect(() => {
    applyFilters();
  }, [events, tasks, eventTypeFilter, taskStatusFilter, taskPriorityFilter, searchTerm]);

  // Load available maids and sponsors for participant selection
  const loadParticipants = async () => {
    if (!agencyId) return;

    setLoadingParticipants(true);
    try {
      // Import services dynamically to avoid circular dependencies
      const { apolloClient } = await import('@ethio/api-client');
      const { gql } = await import('@apollo/client');

      // Load maids (profiles with user_type = 'maid')
      const maidsQuery = gql`
        query GetMaids($limit: Int) {
          profiles(
            where: { user_type: { _eq: "maid" } }
            limit: $limit
            order_by: { created_at: desc }
          ) {
            id
            full_name
            email
            phone
            photo_url
          }
        }
      `;

      const { data: maidsData } = await apolloClient.query({
        query: maidsQuery,
        variables: { limit: 100 },
        fetchPolicy: 'network-only',
      });

      if (maidsData?.profiles) {
        setAvailableMaids(maidsData.profiles.map(m => ({
          id: m.id,
          name: m.full_name || 'Unknown Maid',
          photo: m.photo_url,
        })));
      }

      // Load sponsors
      const sponsorsQuery = gql`
        query GetSponsors($limit: Int) {
          sponsors(limit: $limit, order_by: { created_at: desc }) {
            id
            full_name
            company_name
            email
            phone
            profile_id
          }
        }
      `;

      const { data: sponsorsData } = await apolloClient.query({
        query: sponsorsQuery,
        variables: { limit: 100 },
        fetchPolicy: 'network-only',
      });

      if (sponsorsData?.sponsors) {
        setAvailableSponsors(sponsorsData.sponsors.map(s => ({
          id: s.id,
          name: s.full_name || s.company_name || 'Unknown Sponsor',
          email: s.email,
          user_id: s.profile_id,
        })));
      }
    } catch (error) {
      console.error('Failed to load participants:', error);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [eventsResult, tasksResult] = await Promise.all([
        calendarService.getCalendarEventsWithFilters(agencyId),
        calendarService.getTasksWithFilters(agencyId)
      ]);

      if (eventsResult.error) {
        console.error('Failed to load events:', eventsResult.error);
      }
      if (tasksResult.error) {
        console.error('Failed to load tasks:', tasksResult.error);
      }

      setEvents(eventsResult.data || []);
      setTasks(tasksResult.data || []);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
      setEvents([]);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    // Filter events
    let filteredEvts = events;
    if (eventTypeFilter !== 'all') {
      filteredEvts = filteredEvts.filter(event => event.event_type === eventTypeFilter);
    }
    if (searchTerm) {
      filteredEvts = filteredEvts.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredEvents(filteredEvts);

    // Filter tasks
    let filteredTsks = tasks;
    if (taskStatusFilter !== 'all') {
      filteredTsks = filteredTsks.filter(task => task.status === taskStatusFilter);
    }
    if (taskPriorityFilter !== 'all') {
      filteredTsks = filteredTsks.filter(task => task.priority === taskPriorityFilter);
    }
    if (searchTerm) {
      filteredTsks = filteredTsks.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredTasks(filteredTsks);
  };

  const createEvent = async () => {
    setIsCreatingEvent(true);
    try {
      const result = await calendarService.createCalendarEvent(agencyId, newEvent);
      if (result.error) throw new Error(result.error.message);
      setEvents(prev => [...prev, result.data]);
      setIsCreateEventDialogOpen(false);
      setNewEvent({
        title: '',
        description: '',
        event_type: 'meeting',
        start_date: '',
        start_time: '',
        end_time: '',
        location: '',
        priority: 'medium',
        isCustomTitle: false,
        maid_id: '',
        sponsor_id: '',
        meeting_link: '',
        location_type: 'onsite',
        send_notifications: true,
        reminder_intervals: [1440, 60],
      });
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event: ' + error.message);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const createTask = async () => {
    setIsCreatingTask(true);
    try {
      // Clean UUID fields - convert empty strings to null
      const taskData = {
        ...newTask,
        assigned_to_id: newTask.assigned_to_id || null,
        related_maid_id: newTask.related_maid_id || null,
        related_sponsor_id: newTask.related_sponsor_id || null,
      };

      const result = await calendarService.createTask(agencyId, taskData);
      if (result.error) throw new Error(result.error.message);
      setTasks(prev => [...prev, result.data]);
      setIsCreateTaskDialogOpen(false);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assigned_to_id: '',
        estimated_hours: 1,
        tags: [],
        isCustomTitle: false
      });
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task: ' + error.message);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const updateTaskStatus = async (taskId, status, completion = null) => {
    try {
      const completionPercentage = completion !== null ? completion : (status === 'completed' ? 100 : 0);
      const result = await calendarService.updateTaskStatus(taskId, agencyId, status, completionPercentage);
      if (result.error) {
        console.error('Failed to update task status:', result.error);
        return;
      }
      setTasks(prev => prev.map(task =>
        task.id === taskId
          ? { ...task, status, completion_percentage: completionPercentage }
          : task
      ));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  // Delete event
  const deleteEvent = async (eventId) => {
    try {
      const result = await calendarService.deleteCalendarEvent(eventId, agencyId);
      if (result.error) {
        console.error('Failed to delete event:', result.error);
        alert('Failed to delete event: ' + result.error.message);
        return;
      }
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setIsEventDetailOpen(false);
      setSelectedEvent(null);
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Failed to delete event: ' + error.message);
    }
  };

  // Delete task
  const deleteTask = async (taskId) => {
    try {
      const result = await calendarService.deleteTask(taskId, agencyId);
      if (result.error) {
        console.error('Failed to delete task:', result.error);
        alert('Failed to delete task: ' + result.error.message);
        return;
      }
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setIsTaskDetailOpen(false);
      setSelectedTask(null);
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task: ' + error.message);
    }
  };

  // Update event
  const updateEvent = async () => {
    try {
      const result = await calendarService.updateCalendarEvent(selectedEvent.id, agencyId, selectedEvent);
      if (result.error) {
        console.error('Failed to update event:', result.error);
        alert('Failed to update event: ' + result.error.message);
        return;
      }
      setEvents(prev => prev.map(e => e.id === selectedEvent.id ? { ...e, ...selectedEvent } : e));
      setIsEditingEvent(false);
    } catch (error) {
      console.error('Failed to update event:', error);
      alert('Failed to update event: ' + error.message);
    }
  };

  // Update task
  const updateTask = async () => {
    try {
      const result = await calendarService.updateTask(selectedTask.id, agencyId, selectedTask);
      if (result.error) {
        console.error('Failed to update task:', result.error);
        alert('Failed to update task: ' + result.error.message);
        return;
      }
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...selectedTask } : t));
      setIsEditingTask(false);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task: ' + error.message);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deleteType === 'event' && itemToDelete) {
      deleteEvent(itemToDelete.id);
    } else if (deleteType === 'task' && itemToDelete) {
      deleteTask(itemToDelete.id);
    }
  };

  // Open event detail
  const openEventDetail = (event) => {
    setSelectedEvent({ ...event });
    setIsEventDetailOpen(true);
    setIsEditingEvent(false);
  };

  // Open task detail
  const openTaskDetail = (task) => {
    setSelectedTask({ ...task });
    setIsTaskDetailOpen(true);
    setIsEditingTask(false);
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return filteredEvents.filter(event => event.start_date === dateStr);
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const calendarDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  const getEventTypeBadge = (type) => {
    const typeConfig = {
      interview: { color: 'bg-blue-100 text-blue-800', icon: Users, label: 'Interview' },
      meeting: { color: 'bg-indigo-100 text-indigo-800', icon: Users, label: 'Meeting' },
      training: { color: 'bg-purple-100 text-purple-800', icon: GraduationCap, label: 'Training' },
      placement: { color: 'bg-green-100 text-green-800', icon: UserCheck, label: 'Placement' },
      followup: { color: 'bg-teal-100 text-teal-800', icon: Phone, label: 'Follow-up' },
      screening: { color: 'bg-orange-100 text-orange-800', icon: Eye, label: 'Screening' },
      orientation: { color: 'bg-cyan-100 text-cyan-800', icon: GraduationCap, label: 'Orientation' },
      medical: { color: 'bg-red-100 text-red-800', icon: Building2, label: 'Medical' },
      documentation: { color: 'bg-yellow-100 text-yellow-800', icon: FileText, label: 'Documentation' },
      other: { color: 'bg-gray-100 text-gray-800', icon: Calendar, label: 'Other' }
    };

    const config = typeConfig[type] || typeConfig.meeting;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      high: { color: 'bg-red-100 text-red-800', label: 'High' },
      medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
      low: { color: 'bg-green-100 text-green-800', label: 'Low' }
    };

    const config = priorityConfig[priority] || priorityConfig.medium;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Timer },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      overdue: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Calendar }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      // Handle different date formats
      let date;
      if (typeof dateString === 'string') {
        // If it's just a date string like "2025-12-04", add time to avoid timezone issues
        if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(dateString + 'T12:00:00');
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) return 'Invalid date';

      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid date';
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      // Handle time format HH:MM or HH:MM:SS
      const timeParts = timeString.split(':');
      if (timeParts.length < 2) return timeString;

      const hours = parseInt(timeParts[0], 10);
      const minutes = timeParts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;

      return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error, timeString);
      return timeString || '';
    }
  };

  const isToday = (dateString) => {
    if (!dateString) return false;
    try {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Extract just the date part if it's a full timestamp
      const dateOnly = typeof dateString === 'string'
        ? dateString.split('T')[0]
        : new Date(dateString).toISOString().split('T')[0];

      return dateOnly === todayStr;
    } catch (error) {
      return false;
    }
  };

  const EventCard = ({ event }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => openEventDetail(event)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium text-gray-900">{event.title}</h4>
              {isToday(event.start_date) && (
                <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5">Today</Badge>
              )}
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {formatDate(event.start_date)}
              </div>
              {event.start_time && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  {formatTime(event.start_time)}{event.end_time && ` - ${formatTime(event.end_time)}`}
                </div>
              )}
              {event.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {event.location}
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEventDetail(event); }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedEvent({...event}); setIsEditingEvent(true); setIsEventDetailOpen(true); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); setItemToDelete(event); setDeleteType('event'); setDeleteConfirmOpen(true); }}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between">
          {getEventTypeBadge(event.event_type)}
          {getPriorityBadge(event.priority)}
        </div>

        {event.participants?.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {event.participants.length} participant{event.participants.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const TaskCard = ({ task }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openTaskDetail(task)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-medium text-gray-900">{task.title}</h4>
              {task.status === 'overdue' && (
                <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">Overdue</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{task.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {task.due_date && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Due: {formatDate(task.due_date)}
                </div>
              )}
              {task.assigned_to?.name && (
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {task.assigned_to.name}
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openTaskDetail(task); }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedTask({...task}); setIsEditingTask(true); setIsTaskDetailOpen(true); }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {task.status !== 'completed' && (
                <DropdownMenuItem
                  className="text-green-600"
                  onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, 'completed', 100); }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              {task.status === 'pending' && (
                <DropdownMenuItem
                  className="text-blue-600"
                  onClick={(e) => { e.stopPropagation(); updateTaskStatus(task.id, 'in_progress', 10); }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Task
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); setItemToDelete(task); setDeleteType('task'); setDeleteConfirmOpen(true); }}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Progress</span>
            <span className="font-medium">{task.completion_percentage || 0}%</span>
          </div>
          <Progress value={task.completion_percentage || 0} className="h-2" />

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
            </div>
            {task.estimated_hours && (
              <div className="flex items-center text-sm text-gray-500">
                <Timer className="h-4 w-4 mr-1" />
                {task.estimated_hours}h
              </div>
            )}
          </div>

          {task.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{task.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const todaysEvents = filteredEvents.filter(event => isToday(event.start_date));
  const upcomingEvents = filteredEvents
    .filter(event => {
      const eventDate = new Date(event.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate > today;
    })
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
    .slice(0, 5);
  const overdueTasks = filteredTasks.filter(task => {
    if (task.status === 'overdue') return true;
    // Also check if due_date is in the past and status is not completed
    if (task.due_date && task.status !== 'completed') {
      const dueDate = new Date(task.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate < today;
    }
    return false;
  });
  const pendingTasks = filteredTasks.filter(task => task.status === 'pending');
  const inProgressTasks = filteredTasks.filter(task => task.status === 'in_progress');
  const completedTasks = filteredTasks.filter(task => task.status === 'completed');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendar & Tasks</h1>
        <p className="text-gray-600 mt-1">Manage your schedule and track important tasks</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            <Button onClick={() => setIsCreateEventDialogOpen(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              New Event
            </Button>
            <Button variant="outline" onClick={() => setIsCreateTaskDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Loading State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 text-center">
                    <div className="h-8 w-8 mx-auto bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 w-12 mx-auto bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 w-20 mx-auto bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('calendar')}>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{todaysEvents.length}</p>
                    <p className="text-xs text-gray-600">Events Today</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('calendar')}>
                  <CardContent className="p-4 text-center">
                    <Calendar className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                    <p className="text-xs text-gray-600">Total Events</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setTaskStatusFilter('all'); setActiveTab('tasks'); }}>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="h-6 w-6 mx-auto text-red-600 mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{overdueTasks.length}</p>
                    <p className="text-xs text-gray-600">Overdue</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setTaskStatusFilter('in_progress'); setActiveTab('tasks'); }}>
                  <CardContent className="p-4 text-center">
                    <Timer className="h-6 w-6 mx-auto text-yellow-600 mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{inProgressTasks.length}</p>
                    <p className="text-xs text-gray-600">In Progress</p>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setTaskStatusFilter('pending'); setActiveTab('tasks'); }}>
                  <CardContent className="p-4 text-center">
                    <Target className="h-6 w-6 mx-auto text-green-600 mb-1" />
                    <p className="text-2xl font-bold text-gray-900">{pendingTasks.length}</p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </CardContent>
                </Card>
              </div>

              {/* Empty State - Show when no data */}
              {events.length === 0 && tasks.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="flex space-x-4 mb-4">
                      <Calendar className="h-12 w-12 text-gray-300" />
                      <Target className="h-12 w-12 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Get Started</h3>
                    <p className="text-gray-500 text-center mb-6 max-w-md">
                      Create your first calendar event or task to start managing your schedule.
                    </p>
                    <div className="flex space-x-3">
                      <Button onClick={() => setIsCreateEventDialogOpen(true)}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Create Event
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreateTaskDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Content Grid - Show when there's data */}
              {(events.length > 0 || tasks.length > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Today's Events */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-base">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        Today's Events
                        {todaysEvents.length > 0 && (
                          <Badge className="ml-2 bg-blue-100 text-blue-800">{todaysEvents.length}</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {todaysEvents.length === 0 ? (
                        <div className="text-center py-6">
                          <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-500 text-sm">No events scheduled for today</p>
                          <Button variant="link" size="sm" onClick={() => setIsCreateEventDialogOpen(true)}>
                            Schedule an event
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {todaysEvents.map(event => (
                            <div
                              key={event.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                              onClick={() => openEventDetail(event)}
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {event.start_time && formatTime(event.start_time)}
                                  {event.location && ` • ${event.location}`}
                                </p>
                              </div>
                              {getEventTypeBadge(event.event_type)}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Upcoming Events */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-base">
                        <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                        Upcoming Events
                        {upcomingEvents.length > 0 && (
                          <Badge className="ml-2 bg-purple-100 text-purple-800">{upcomingEvents.length}</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {upcomingEvents.length === 0 ? (
                        <div className="text-center py-6">
                          <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-500 text-sm">No upcoming events</p>
                          <Button variant="link" size="sm" onClick={() => setIsCreateEventDialogOpen(true)}>
                            Schedule an event
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {upcomingEvents.map(event => (
                            <div
                              key={event.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                              onClick={() => openEventDetail(event)}
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {formatDate(event.start_date)}
                                  {event.start_time && ` at ${formatTime(event.start_time)}`}
                                </p>
                              </div>
                              {getEventTypeBadge(event.event_type)}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Important Events (High Priority / Interviews) */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-base">
                        <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
                        Important Events
                        {filteredEvents.filter(e => e.priority === 'high' || e.priority === 'urgent' || e.event_type === 'interview').length > 0 && (
                          <Badge className="ml-2 bg-orange-100 text-orange-800">
                            {filteredEvents.filter(e => e.priority === 'high' || e.priority === 'urgent' || e.event_type === 'interview').length}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {filteredEvents.filter(e => e.priority === 'high' || e.priority === 'urgent' || e.event_type === 'interview').length === 0 ? (
                        <div className="text-center py-6">
                          <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-500 text-sm">No high priority events</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredEvents
                            .filter(e => e.priority === 'high' || e.priority === 'urgent' || e.event_type === 'interview')
                            .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                            .slice(0, 5)
                            .map(event => (
                              <div
                                key={event.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                onClick={() => openEventDetail(event)}
                              >
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                                  <p className="text-sm text-gray-600">
                                    {formatDate(event.start_date)}
                                    {event.start_time && ` at ${formatTime(event.start_time)}`}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-1 ml-2">
                                  {getEventTypeBadge(event.event_type)}
                                  {event.priority === 'high' && (
                                    <Badge className="bg-red-100 text-red-800 text-xs">High</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Urgent Tasks */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-base">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                        Urgent Tasks
                        {[...overdueTasks, ...inProgressTasks.filter(t => t.priority === 'high')].length > 0 && (
                          <Badge className="ml-2 bg-red-100 text-red-800">
                            {[...overdueTasks, ...inProgressTasks.filter(t => t.priority === 'high')].length}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {[...overdueTasks, ...inProgressTasks.filter(t => t.priority === 'high')].length === 0 ? (
                        <div className="text-center py-6">
                          <CheckCircle className="h-8 w-8 mx-auto text-green-300 mb-2" />
                          <p className="text-gray-500 text-sm">No urgent tasks - Great job!</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {[...overdueTasks, ...inProgressTasks.filter(t => t.priority === 'high')].slice(0, 5).map(task => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                              onClick={() => openTaskDetail(task)}
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate">{task.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {task.due_date && `Due: ${formatDate(task.due_date)}`}
                                  {task.assigned_to?.name && ` • ${task.assigned_to.name}`}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1 ml-2">
                                {getStatusBadge(task.status)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* All Tasks Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-base">
                        <Target className="h-4 w-4 mr-2 text-green-600" />
                        Tasks Summary
                        <Badge className="ml-2 bg-gray-100 text-gray-800">{tasks.length} total</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tasks.length === 0 ? (
                        <div className="text-center py-6">
                          <Target className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                          <p className="text-gray-500 text-sm">No tasks yet</p>
                          <Button variant="link" size="sm" onClick={() => setIsCreateTaskDialogOpen(true)}>
                            Create your first task
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Progress overview */}
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Completion Rate</span>
                            <span className="font-medium">
                              {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
                            </span>
                          </div>
                          <Progress value={tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0} className="h-2" />

                          {/* Status breakdown */}
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            <div
                              className="text-center p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                              onClick={() => { setTaskStatusFilter('pending'); setActiveTab('tasks'); }}
                            >
                              <p className="text-lg font-semibold text-gray-700">{pendingTasks.length}</p>
                              <p className="text-xs text-gray-500">Pending</p>
                            </div>
                            <div
                              className="text-center p-2 bg-blue-50 rounded cursor-pointer hover:bg-blue-100"
                              onClick={() => { setTaskStatusFilter('in_progress'); setActiveTab('tasks'); }}
                            >
                              <p className="text-lg font-semibold text-blue-700">{inProgressTasks.length}</p>
                              <p className="text-xs text-blue-600">In Progress</p>
                            </div>
                            <div
                              className="text-center p-2 bg-green-50 rounded cursor-pointer hover:bg-green-100"
                              onClick={() => { setTaskStatusFilter('completed'); setActiveTab('tasks'); }}
                            >
                              <p className="text-lg font-semibold text-green-700">{completedTasks.length}</p>
                              <p className="text-xs text-green-600">Completed</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          {/* Calendar Header */}
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" aria-label="Previous month"
              aria-label="Previous month" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold min-w-[200px] text-center">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              aria-label='Next month'
              <Button variant="outline" size="icon" aria-label="Next month" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                Today
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Select value={calendarView} onValueChange={setCalendarView}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>

              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="placement">Placement</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="orientation">Orientation</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : calendarView === 'month' ? (
            <Card>
              <CardContent className="p-4">
                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    const dayEvents = day ? getEventsForDate(day) : [];
                    const isCurrentDay = day && isToday(day.toISOString().split('T')[0]);

                    return (
                      <div
                        key={index}
                        className={`min-h-[100px] p-2 border rounded-lg ${
                          day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                        } ${isCurrentDay ? 'border-blue-500 border-2' : 'border-gray-200'}`}
                      >
                        {day && (
                          <>
                            <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
                              {day.getDate()}
                            </div>
                            <div className="space-y-1">
                              {dayEvents.slice(0, 3).map(event => (
                                <div
                                  key={event.id}
                                  className={`text-xs p-1 rounded truncate cursor-pointer ${
                                    event.event_type === 'interview' ? 'bg-blue-100 text-blue-800' :
                                    event.event_type === 'document_review' ? 'bg-yellow-100 text-yellow-800' :
                                    event.event_type === 'follow_up' ? 'bg-green-100 text-green-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}
                                  onClick={() => openEventDetail(event)}
                                  title={event.title}
                                >
                                  {event.start_time && formatTime(event.start_time)} {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 3 && (
                                <div className="text-xs text-gray-500 pl-1">
                                  +{dayEvents.length - 3} more
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* List View */
            filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                  <p className="text-gray-500 text-center mb-6">
                    {eventTypeFilter !== 'all'
                      ? 'No events match your current filters.'
                      : 'Start by creating your first calendar event.'}
                  </p>
                  <Button onClick={() => setIsCreateEventDialogOpen(true)}>
                    <Calendar className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex space-x-2">
              <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                <SelectTrigger className="w-32">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={taskPriorityFilter} onValueChange={setTaskPriorityFilter}>
                <SelectTrigger className="w-32">
                  <Star className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-3 w-full bg-gray-200 rounded"></div>
                      <div className="h-2 w-full bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Target className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchTerm || taskStatusFilter !== 'all' || taskPriorityFilter !== 'all'
                    ? 'No tasks match your current filters.'
                    : 'Start by creating your first task.'}
                </p>
                <Button onClick={() => setIsCreateTaskDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Task
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Event Dialog */}
      <Dialog open={isCreateEventDialogOpen} onOpenChange={setIsCreateEventDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Event</DialogTitle>
            <DialogDescription>
              Schedule a new calendar event
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Event Title</Label>
              <Select
                value={newEvent.title}
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setNewEvent(prev => ({ ...prev, title: '', isCustomTitle: true }));
                  } else {
                    setNewEvent(prev => ({ ...prev, title: value, isCustomTitle: false }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maid Interview">Maid Interview</SelectItem>
                  <SelectItem value="Sponsor Meeting">Sponsor Meeting</SelectItem>
                  <SelectItem value="Document Verification">Document Verification</SelectItem>
                  <SelectItem value="Contract Signing">Contract Signing</SelectItem>
                  <SelectItem value="Medical Examination">Medical Examination</SelectItem>
                  <SelectItem value="Visa Interview">Visa Interview</SelectItem>
                  <SelectItem value="Embassy Appointment">Embassy Appointment</SelectItem>
                  <SelectItem value="Training Session">Training Session</SelectItem>
                  <SelectItem value="Orientation Meeting">Orientation Meeting</SelectItem>
                  <SelectItem value="Follow-up Call">Follow-up Call</SelectItem>
                  <SelectItem value="Payment Collection">Payment Collection</SelectItem>
                  <SelectItem value="Airport Pickup">Airport Pickup</SelectItem>
                  <SelectItem value="Airport Dropoff">Airport Dropoff</SelectItem>
                  <SelectItem value="Home Visit">Home Visit</SelectItem>
                  <SelectItem value="Complaint Resolution Meeting">Complaint Resolution Meeting</SelectItem>
                  <SelectItem value="custom">Other (Custom title)</SelectItem>
                </SelectContent>
              </Select>
              {newEvent.isCustomTitle && (
                <Input
                  id="event-title-custom"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter custom event title"
                  className="mt-2"
                  autoFocus
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea
                id="event-description"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter event description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <Select value={newEvent.event_type} onValueChange={(value) => setNewEvent(prev => ({ ...prev, event_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="placement">Placement</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="orientation">Orientation</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="documentation">Documentation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-priority">Priority</Label>
                <Select value={newEvent.priority} onValueChange={(value) => setNewEvent(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-date">Date</Label>
              <Input
                id="event-date"
                type="date"
                value={newEvent.start_date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, start_date: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>

            {/* Participants Section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                Participants
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event-maid">Maid</Label>
                  <Select
                    value={newEvent.maid_id}
                    onValueChange={(value) => setNewEvent(prev => ({ ...prev, maid_id: value === 'none' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select maid (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No maid</SelectItem>
                      {availableMaids.map(maid => (
                        <SelectItem key={maid.id} value={maid.id}>
                          {maid.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event-sponsor">Sponsor</Label>
                  <Select
                    value={newEvent.sponsor_id}
                    onValueChange={(value) => setNewEvent(prev => ({ ...prev, sponsor_id: value === 'none' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sponsor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No sponsor</SelectItem>
                      {availableSponsors.map(sponsor => (
                        <SelectItem key={sponsor.id} value={sponsor.id}>
                          {sponsor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Location & Meeting
              </h4>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location-type">Location Type</Label>
                  <Select
                    value={newEvent.location_type}
                    onValueChange={(value) => setNewEvent(prev => ({ ...prev, location_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onsite">On-site (In Person)</SelectItem>
                      <SelectItem value="online">Online (Video Call)</SelectItem>
                      <SelectItem value="phone">Phone Call</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(newEvent.location_type === 'onsite' || newEvent.location_type === 'hybrid') && (
                  <div className="space-y-2">
                    <Label htmlFor="event-location">Physical Location</Label>
                    <Input
                      id="event-location"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter address or location"
                    />
                  </div>
                )}

                {(newEvent.location_type === 'online' || newEvent.location_type === 'hybrid') && (
                  <div className="space-y-2">
                    <Label htmlFor="meeting-link" className="flex items-center">
                      <Video className="h-4 w-4 mr-1" />
                      Meeting Link (Zoom / Google Meet)
                    </Label>
                    <Input
                      id="meeting-link"
                      value={newEvent.meeting_link}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, meeting_link: e.target.value }))}
                      placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                    />
                    <p className="text-xs text-gray-500">
                      Paste your Zoom, Google Meet, or Microsoft Teams link
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications & Reminders Section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Notifications & Reminders
              </h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="send-notifications">Send Notifications</Label>
                    <p className="text-xs text-gray-500">
                      Notify maid and sponsor about this event
                    </p>
                  </div>
                  <Switch
                    id="send-notifications"
                    checked={newEvent.send_notifications}
                    onCheckedChange={(checked) => setNewEvent(prev => ({ ...prev, send_notifications: checked }))}
                  />
                </div>

                {newEvent.send_notifications && (
                  <div className="space-y-2">
                    <Label>Reminder Schedule</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {REMINDER_INTERVALS.map(interval => (
                        <div key={interval.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`reminder-${interval.value}`}
                            checked={newEvent.reminder_intervals.includes(interval.value)}
                            onCheckedChange={(checked) => {
                              setNewEvent(prev => ({
                                ...prev,
                                reminder_intervals: checked
                                  ? [...prev.reminder_intervals, interval.value]
                                  : prev.reminder_intervals.filter(v => v !== interval.value)
                              }));
                            }}
                          />
                          <label
                            htmlFor={`reminder-${interval.value}`}
                            className="text-sm text-gray-700 cursor-pointer"
                          >
                            {interval.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Participants will receive reminder notifications at selected times before the event
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateEventDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={createEvent}
              disabled={!newEvent.title || !newEvent.start_date || !newEvent.start_time || isCreatingEvent}
            >
              {isCreatingEvent ? 'Creating...' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskDialogOpen} onOpenChange={setIsCreateTaskDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Create a new task to track
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Select
                value={newTask.title}
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setNewTask(prev => ({ ...prev, title: '', isCustomTitle: true }));
                  } else {
                    setNewTask(prev => ({ ...prev, title: value, isCustomTitle: false }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Review maid application">Review maid application</SelectItem>
                  <SelectItem value="Verify documents">Verify documents</SelectItem>
                  <SelectItem value="Schedule interview">Schedule interview</SelectItem>
                  <SelectItem value="Conduct background check">Conduct background check</SelectItem>
                  <SelectItem value="Process visa application">Process visa application</SelectItem>
                  <SelectItem value="Arrange medical checkup">Arrange medical checkup</SelectItem>
                  <SelectItem value="Prepare contract">Prepare contract</SelectItem>
                  <SelectItem value="Coordinate travel arrangements">Coordinate travel arrangements</SelectItem>
                  <SelectItem value="Follow up with sponsor">Follow up with sponsor</SelectItem>
                  <SelectItem value="Follow up with maid">Follow up with maid</SelectItem>
                  <SelectItem value="Update maid profile">Update maid profile</SelectItem>
                  <SelectItem value="Send payment reminder">Send payment reminder</SelectItem>
                  <SelectItem value="Complete training session">Complete training session</SelectItem>
                  <SelectItem value="Resolve complaint">Resolve complaint</SelectItem>
                  <SelectItem value="custom">Other (Custom title)</SelectItem>
                </SelectContent>
              </Select>
              {newTask.isCustomTitle && (
                <Input
                  id="task-title-custom"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter custom task title"
                  className="mt-2"
                  autoFocus
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-hours">Estimated Hours</Label>
                <Input
                  id="task-hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newTask.estimated_hours}
                  onChange={(e) => setNewTask(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={createTask}
              disabled={!newTask.title || !newTask.due_date}
            >
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail/Edit Dialog */}
      <Dialog open={isEventDetailOpen} onOpenChange={setIsEventDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditingEvent ? 'Edit Event' : 'Event Details'}</DialogTitle>
            <DialogDescription>
              {isEditingEvent ? 'Update event information' : 'View event details'}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              {isEditingEvent ? (
                <>
                  <div className="space-y-2">
                    <Label>Event Title</Label>
                    <Input
                      value={selectedEvent.title || ''}
                      onChange={(e) => setSelectedEvent(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={selectedEvent.description || ''}
                      onChange={(e) => setSelectedEvent(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Event Type</Label>
                      <Select value={selectedEvent.event_type} onValueChange={(value) => setSelectedEvent(prev => ({ ...prev, event_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                          <SelectItem value="training">Training</SelectItem>
                          <SelectItem value="placement">Placement</SelectItem>
                          <SelectItem value="followup">Follow-up</SelectItem>
                          <SelectItem value="screening">Screening</SelectItem>
                          <SelectItem value="orientation">Orientation</SelectItem>
                          <SelectItem value="medical">Medical</SelectItem>
                          <SelectItem value="documentation">Documentation</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={selectedEvent.priority} onValueChange={(value) => setSelectedEvent(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={selectedEvent.start_date || ''}
                      onChange={(e) => setSelectedEvent(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={selectedEvent.start_time || ''}
                        onChange={(e) => setSelectedEvent(prev => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={selectedEvent.end_time || ''}
                        onChange={(e) => setSelectedEvent(prev => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input
                      value={selectedEvent.location || ''}
                      onChange={(e) => setSelectedEvent(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                      <div className="flex space-x-2">
                        {getEventTypeBadge(selectedEvent.event_type)}
                        {getPriorityBadge(selectedEvent.priority)}
                      </div>
                    </div>

                    {selectedEvent.description && (
                      <p className="text-gray-600">{selectedEvent.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(selectedEvent.start_date)}
                      </div>
                      {selectedEvent.start_time && (
                        <div className="flex items-center text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatTime(selectedEvent.start_time)}
                          {selectedEvent.end_time && ` - ${formatTime(selectedEvent.end_time)}`}
                        </div>
                      )}
                      {selectedEvent.location && (
                        <div className="flex items-center text-gray-600 col-span-2">
                          <MapPin className="h-4 w-4 mr-2" />
                          {selectedEvent.location}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            {isEditingEvent ? (
              <>
                <Button variant="outline" onClick={() => setIsEditingEvent(false)}>
                  Cancel
                </Button>
                <Button onClick={updateEvent}>
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="destructive" onClick={() => { setItemToDelete(selectedEvent); setDeleteType('event'); setDeleteConfirmOpen(true); }}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsEventDetailOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => setIsEditingEvent(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail/Edit Dialog */}
      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditingTask ? 'Edit Task' : 'Task Details'}</DialogTitle>
            <DialogDescription>
              {isEditingTask ? 'Update task information' : 'View and manage task'}
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              {isEditingTask ? (
                <>
                  <div className="space-y-2">
                    <Label>Task Title</Label>
                    <Input
                      value={selectedTask.title || ''}
                      onChange={(e) => setSelectedTask(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={selectedTask.description || ''}
                      onChange={(e) => setSelectedTask(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={selectedTask.priority} onValueChange={(value) => setSelectedTask(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={selectedTask.status} onValueChange={(value) => setSelectedTask(prev => ({ ...prev, status: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={selectedTask.due_date?.split('T')[0] || ''}
                        onChange={(e) => setSelectedTask(prev => ({ ...prev, due_date: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Estimated Hours</Label>
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={selectedTask.estimated_hours || 1}
                        onChange={(e) => setSelectedTask(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Progress: {selectedTask.completion_percentage || 0}%</Label>
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={selectedTask.completion_percentage || 0}
                      onChange={(e) => setSelectedTask(prev => ({ ...prev, completion_percentage: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{selectedTask.title}</h3>
                      <div className="flex space-x-2">
                        {getStatusBadge(selectedTask.status)}
                        {getPriorityBadge(selectedTask.priority)}
                      </div>
                    </div>

                    {selectedTask.description && (
                      <p className="text-gray-600">{selectedTask.description}</p>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium">{selectedTask.completion_percentage || 0}%</span>
                      </div>
                      <Progress value={selectedTask.completion_percentage || 0} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedTask.due_date && (
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          Due: {formatDate(selectedTask.due_date)}
                        </div>
                      )}
                      {selectedTask.estimated_hours && (
                        <div className="flex items-center text-gray-600">
                          <Timer className="h-4 w-4 mr-2" />
                          Est: {selectedTask.estimated_hours}h
                        </div>
                      )}
                      {selectedTask.assigned_to?.name && (
                        <div className="flex items-center text-gray-600">
                          <User className="h-4 w-4 mr-2" />
                          {selectedTask.assigned_to.name}
                        </div>
                      )}
                    </div>

                    {selectedTask.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedTask.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Quick Actions */}
                    {selectedTask.status !== 'completed' && (
                      <div className="flex space-x-2 pt-2">
                        {selectedTask.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => { updateTaskStatus(selectedTask.id, 'in_progress', 10); setSelectedTask(prev => ({...prev, status: 'in_progress', completion_percentage: 10})); }}>
                            <Play className="h-4 w-4 mr-1" />
                            Start Task
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="text-green-600" onClick={() => { updateTaskStatus(selectedTask.id, 'completed', 100); setSelectedTask(prev => ({...prev, status: 'completed', completion_percentage: 100})); }}>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Complete
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="flex justify-between">
            {isEditingTask ? (
              <>
                <Button variant="outline" onClick={() => setIsEditingTask(false)}>
                  Cancel
                </Button>
                <Button onClick={updateTask}>
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button variant="destructive" onClick={() => { setItemToDelete(selectedTask); setDeleteType('task'); setDeleteConfirmOpen(true); }}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsTaskDetailOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => setIsEditingTask(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteType === 'event' ? 'event' : 'task'}
              {itemToDelete && ` "${itemToDelete.title}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgencyCalendarPage;
