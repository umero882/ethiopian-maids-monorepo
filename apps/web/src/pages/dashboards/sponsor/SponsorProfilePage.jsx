import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { sponsorService } from '@/services/sponsorService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  User, Loader2, Save, X, MapPin, Users, DollarSign, Heart,
  Home, Briefcase, Building2, Clock, Calendar, Shield, Star,
  Camera, Check, Globe, Languages, ChevronDown, ChevronUp,
  Edit3, Eye, Upload, FileText, CreditCard, Crown, Zap,
  Bell, Mail, MessageSquare, Lock, TrendingUp, UserPlus,
} from 'lucide-react';
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate';
import { cn } from '@/lib/utils';

// ─── Constants matching onboarding steps ────────────────────────────────────

const OCCUPATIONS = [
  'Business Owner', 'Government Employee', 'Private Sector Employee',
  'Self-Employed', 'Retired', 'Diplomat', 'Medical Professional',
  'Legal Professional', 'Engineer', 'Educator', 'Military/Police',
  'Homemaker', 'Other',
];

const GCC_COUNTRIES = [
  'United Arab Emirates', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Bahrain', 'Oman',
];

const GCC_CITIES = {
  'United Arab Emirates': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Al Ain', 'Fujairah', 'Ras Al Khaimah', 'Other'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah', 'Khobar', 'Dhahran', 'Other'],
  'Kuwait': ['Kuwait City', 'Hawalli', 'Salmiya', 'Jahra', 'Farwaniya', 'Other'],
  'Qatar': ['Doha', 'Al Wakrah', 'Al Khor', 'Lusail', 'Other'],
  'Bahrain': ['Manama', 'Muharraq', 'Riffa', 'Other'],
  'Oman': ['Muscat', 'Salalah', 'Sohar', 'Other'],
};

const FAMILY_SIZES = [
  { value: '1', label: '1 person (Single)' },
  { value: '2', label: '2 people (Couple)' },
  { value: '3-4', label: '3-4 people (Small family)' },
  { value: '5-6', label: '5-6 people (Medium family)' },
  { value: '7+', label: '7+ people (Large family)' },
];

const CHILDREN_OPTIONS = [
  { value: 'none', label: 'No children' },
  { value: 'infants', label: 'Infants (0-2 years)' },
  { value: 'toddlers', label: 'Toddlers (2-5 years)' },
  { value: 'children', label: 'Children (5-12 years)' },
  { value: 'teenagers', label: 'Teenagers (12+ years)' },
  { value: 'mixed', label: 'Mixed ages' },
];

const ELDERLY_OPTIONS = [
  { value: 'none', label: 'No elderly members' },
  { value: 'one', label: 'One elderly member' },
  { value: 'multiple', label: 'Multiple elderly members' },
];

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'compound', label: 'Compound Villa' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'bi-weekly', label: 'Bi-Weekly' },
  { value: 'weekly', label: 'Weekly' },
];

const CONTRACT_DURATIONS = [
  { value: '1-year', label: '1 Year (Standard)' },
  { value: '2-years', label: '2 Years (Extended)' },
  { value: '6-months', label: '6 Months (Short-term)' },
  { value: 'flexible', label: 'Flexible' },
];

const BENEFITS_OPTIONS = [
  { value: 'food', label: 'Food Provided' },
  { value: 'housing', label: 'Housing Provided' },
  { value: 'insurance', label: 'Health Insurance' },
  { value: 'annual_leave', label: 'Annual Leave' },
  { value: 'ticket_home', label: 'Annual Ticket Home' },
  { value: 'phone', label: 'Phone Allowance' },
];

const POPULAR_NATIONALITIES = ['Ethiopian', 'Filipino', 'Indonesian', 'Sri Lankan', 'Indian', 'Bangladeshi'];
const POPULAR_LANGUAGES = ['English', 'Arabic', 'Hindi', 'Tagalog', 'Indonesian', 'Amharic', 'Urdu'];

const LIVING_ARRANGEMENTS = [
  { value: 'live-in', label: 'Live-in', description: 'Worker lives in your home' },
  { value: 'live-out', label: 'Live-out', description: 'Worker commutes daily' },
  { value: 'flexible', label: 'Flexible', description: 'Open to discussion' },
];

const ROOM_AMENITIES = [
  { value: 'private_room', label: 'Private Room' },
  { value: 'private_bathroom', label: 'Private Bathroom' },
  { value: 'ac', label: 'Air Conditioning' },
  { value: 'tv', label: 'TV' },
  { value: 'wifi', label: 'WiFi Access' },
  { value: 'window', label: 'Window/Ventilation' },
];

const WORKING_HOURS_OPTIONS = [
  { value: 'full-time', label: 'Full-time (48 hrs/week)' },
  { value: 'part-time', label: 'Part-time (24 hrs/week)' },
  { value: 'flexible', label: 'Flexible Hours' },
];

const DAYS_OFF_OPTIONS = [
  { value: '1-per-week', label: '1 day per week' },
  { value: '2-per-week', label: '2 days per week' },
  { value: '1-per-month', label: '1 day per month' },
  { value: 'negotiable', label: 'Negotiable' },
];

const CURRENCIES = ['USD', 'AED', 'SAR', 'KWD', 'QAR', 'BHD', 'OMR', 'EUR', 'GBP'];

const PREMIUM_FEATURES = [
  { feature: 'Profile Views', free: '10/month', premium: 'Unlimited' },
  { feature: 'Contact Maids', free: '3/month', premium: 'Unlimited' },
  { feature: 'Background Checks', free: 'Basic', premium: 'Full Report' },
  { feature: 'Saved Searches', free: '1', premium: 'Unlimited' },
  { feature: 'Priority Support', free: false, premium: true },
  { feature: 'Verified Badge', free: false, premium: true },
];

const PREMIUM_PLANS = [
  { id: 'monthly', label: 'Monthly', price: 29, period: '/mo', tag: null },
  { id: 'quarterly', label: 'Quarterly', price: 69, period: '/3mo', tag: 'Save 20%', popular: true },
  { id: 'yearly', label: 'Yearly', price: 199, period: '/yr', tag: 'Save 40%' },
];

const SPONSOR_NOTIFICATIONS = [
  { key: 'new_maids', icon: UserPlus, title: 'New Maids Available', description: 'When new domestic workers match your preferences', defaultEnabled: true },
  { key: 'applications', icon: FileText, title: 'Application Updates', description: 'Updates on your maid applications and bookings', defaultEnabled: true },
  { key: 'payments', icon: CreditCard, title: 'Payment Updates', description: 'Payment confirmations and billing reminders', defaultEnabled: true },
  { key: 'messages', icon: MessageSquare, title: 'Messages', description: 'New messages from maids and agencies', defaultEnabled: true },
  { key: 'security', icon: Lock, title: 'Security Alerts', description: 'Login attempts and account security updates', defaultEnabled: true, required: true },
  { key: 'marketing', icon: TrendingUp, title: 'Tips & Updates', description: 'Hiring tips, platform updates, and promotions', defaultEnabled: false },
];

// ─── Helper Components ──────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title, subtitle, color = 'purple' }) => {
  const colorMap = {
    purple: 'from-purple-500 to-indigo-600',
    blue: 'from-blue-500 to-cyan-600',
    green: 'from-emerald-500 to-teal-600',
    orange: 'from-orange-500 to-amber-600',
    pink: 'from-pink-500 to-rose-600',
    slate: 'from-slate-500 to-gray-600',
  };
  return (
    <CardHeader className={`bg-gradient-to-r ${colorMap[color]} text-white rounded-t-lg py-4`}>
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-lg">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-lg text-white">{title}</CardTitle>
          {subtitle && <p className="text-sm text-white/80 mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </CardHeader>
  );
};

const FieldRow = ({ label, value, children, isEditing, required }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </Label>
    {isEditing ? children : (
      <div className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded-md min-h-[38px] flex items-center">
        {value || <span className="text-gray-400 italic">Not set</span>}
      </div>
    )}
  </div>
);

const TagList = ({ items, emptyText = 'None selected' }) => {
  if (!items || items.length === 0) {
    return <span className="text-gray-400 italic text-sm">{emptyText}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="secondary" className="text-xs">
          {item}
        </Badge>
      ))}
    </div>
  );
};

const ToggleChip = ({ label, selected, onClick, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
      selected
        ? 'bg-purple-100 border-purple-400 text-purple-700'
        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300',
      disabled && 'opacity-60 cursor-not-allowed'
    )}
  >
    {selected && <Check className="h-3 w-3 inline mr-1" />}
    {label}
  </button>
);

// ─── Main Component ─────────────────────────────────────────────────────────

const SponsorProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [errors, setErrors] = useState({});

  // Identity verification state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facePhoto, setFacePhoto] = useState(null);
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);

  // Notification preferences state
  const [notifications, setNotifications] = useState(() => {
    const defaults = {};
    SPONSOR_NOTIFICATIONS.forEach(n => { defaults[n.key] = n.defaultEnabled; });
    return defaults;
  });

  // Premium plan state
  const [selectedPlan, setSelectedPlan] = useState(null);

  const initialProfile = {
    full_name: '',
    occupation: '',
    company: '',
    family_size: '',
    children_ages: '',
    elderly: '',
    accommodation_type: '',
    city: '',
    country: '',
    address: '',
    salary_budget_min: '',
    salary_budget_max: '',
    currency: 'AED',
    payment_frequency: '',
    contract_duration: '',
    benefits: [],
    preferred_nationality: [],
    preferred_languages: [],
    preferred_religion: '',
    living_arrangement: '',
    room_amenities: [],
    working_hours: '',
    days_off: '',
    live_in_required: true,
    overtime_available: false,
    working_hours_per_day: 8,
    days_off_per_week: 1,
    elderly_care_needed: false,
    children_count: 0,
    additional_benefits: [],
    identity_verified: false,
    background_check_completed: false,
    active_job_postings: 0,
    total_hires: 0,
    average_rating: 0,
  };

  const {
    data: profileData,
    update: updateProfile,
    isUpdating,
    setData: setProfileData,
  } = useOptimisticUpdate(initialProfile, {
    showToast: false,
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isEditing) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditing]);

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);

      const { data, error } = await sponsorService.getSponsorProfile(user.id);

      // Load extra fields from localStorage (fields without DB columns)
      let extra = {};
      try {
        const stored = localStorage.getItem(`sponsor_extra_${user.id}`);
        if (stored) extra = JSON.parse(stored);
      } catch (e) {
        // Failed to load extra fields from localStorage
      }

      if (error) {
        if (error.code !== 'PROFILE_NOT_FOUND') {
          toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
        }
      } else if (data) {
        const sanitized = {
          ...data,
          salary_budget_min: data.salary_budget_min ?? '',
          salary_budget_max: data.salary_budget_max ?? '',
          address: data.address ?? '',
          accommodation_type: data.accommodation_type ?? '',
          // DB columns for sponsor-specific fields
          occupation: data.occupation ?? '',
          company: data.company ?? '',
          payment_frequency: data.payment_frequency ?? '',
          contract_duration: data.contract_duration ?? '',
          room_amenities: data.room_amenities ?? [],
          // Fields with DB↔UI mapping (reverse-mapped in getSponsorProfile)
          preferred_religion: data.preferred_religion ?? '',
          living_arrangement: extra.living_arrangement ?? data.living_arrangement ?? '',
          working_hours: extra.working_hours ?? data.working_hours ?? '',
          days_off: extra.days_off ?? data.days_off ?? '',
          family_size: data.family_size ?? '',
          children_ages: extra.children_ages_label ?? data.children_ages ?? '',
          elderly: extra.elderly ?? data.elderly ?? '',
          benefits: data.benefits ?? data.additional_benefits ?? [],
          preferred_nationality: data.preferred_nationality ?? [],
          preferred_languages: data.preferred_languages ?? [],
          currency: data.currency ?? 'AED',
        };
        setProfileData(sanitized);
        setAvatarPreview(data.avatar_url);

        // Restore identity verification files from localStorage
        if (extra.face_photo_url) setFacePhoto(extra.face_photo_url);
        if (extra.id_front_url) setIdFront({ name: 'ID Front', preview: extra.id_front_url, type: 'image/jpeg' });
        if (extra.id_back_url) setIdBack({ name: 'ID Back', preview: extra.id_back_url, type: 'image/jpeg' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfileData({ ...profileData, [field]: value });
    if (errors[field]) {
      setErrors((prev) => { const u = { ...prev }; delete u[field]; return u; });
    }
  };

  const toggleArrayItem = (field, item) => {
    const arr = profileData[field] || [];
    const newArr = arr.includes(item)
      ? arr.filter((i) => i !== item)
      : [...arr, item];
    handleChange(field, newArr);
  };

  const validateForm = () => {
    const e = {};
    if (!profileData.full_name?.trim()) e.full_name = 'Required';
    if (!profileData.country?.trim()) e.country = 'Required';
    if (!profileData.city?.trim()) e.city = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!user?.id || !validateForm()) {
      toast({ title: 'Validation Error', description: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    const result = await updateProfile(profileData, async (data) => {
      let avatarUrl = data.avatar_url;
      if (avatarFile) {
        const { data: upload, error: uploadErr } = await sponsorService.uploadAvatar(user.id, avatarFile);
        if (!uploadErr) {
          avatarUrl = upload.url;
          setAvatarPreview(upload.url);
        }
      }

      // Upload identity verification files to Firebase Storage if present
      // Initialize URLs from current state (preserve existing URLs across saves)
      let facePhotoUrl = facePhoto && !facePhoto.startsWith('data:') ? facePhoto : null;
      let idFrontUrl = idFront?.preview && !idFront.preview.startsWith('data:') ? idFront.preview : null;
      let idBackUrl = idBack?.preview && !idBack.preview.startsWith('data:') ? idBack.preview : null;

      if (facePhoto && facePhoto.startsWith('data:')) {
        try {
          const { storage } = await import('@/lib/firebaseClient');
          const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
          const storageRef = ref(storage, `identity/${user.id}/face-photo.jpg`);
          await uploadString(storageRef, facePhoto, 'data_url');
          facePhotoUrl = await getDownloadURL(storageRef);
          setFacePhoto(facePhotoUrl); // Update state to URL so next save doesn't re-upload
        } catch (e) {
          // Face photo upload failed
        }
      }

      if (idFront?.preview && idFront.preview.startsWith('data:')) {
        try {
          const { storage } = await import('@/lib/firebaseClient');
          const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
          const ext = idFront.type === 'application/pdf' ? 'pdf' : 'jpg';
          const storageRef = ref(storage, `identity/${user.id}/id-front.${ext}`);
          await uploadString(storageRef, idFront.preview, 'data_url');
          idFrontUrl = await getDownloadURL(storageRef);
          setIdFront({ ...idFront, preview: idFrontUrl }); // Update state to URL
        } catch (e) {
          // ID front upload failed
        }
      }

      if (idBack?.preview && idBack.preview.startsWith('data:')) {
        try {
          const { storage } = await import('@/lib/firebaseClient');
          const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
          const ext = idBack.type === 'application/pdf' ? 'pdf' : 'jpg';
          const storageRef = ref(storage, `identity/${user.id}/id-back.${ext}`);
          await uploadString(storageRef, idBack.preview, 'data_url');
          idBackUrl = await getDownloadURL(storageRef);
          setIdBack({ ...idBack, preview: idBackUrl }); // Update state to URL
        } catch (e) {
          // ID back upload failed
        }
      }

      // Save DB-column fields via Cloud Function
      const saveData = { ...data, avatar_url: avatarUrl };
      const { error } = await sponsorService.updateSponsorProfile(user.id, saveData);
      if (error) throw new Error(error.message || 'Failed to save');

      // Save extra fields (without dedicated DB columns) to localStorage
      const extraFields = {
        living_arrangement: data.living_arrangement || '',
        working_hours: data.working_hours || '',
        days_off: data.days_off || '',
        elderly: data.elderly || '',
        children_ages_label: data.children_ages || '',
        face_photo_url: facePhotoUrl || null,
        id_front_url: idFrontUrl || null,
        id_back_url: idBackUrl || null,
      };
      try {
        localStorage.setItem(`sponsor_extra_${user.id}`, JSON.stringify(extraFields));
      } catch (e) {
        // Failed to save extra fields to localStorage
      }

      return data;
    });

    if (result.success) {
      toast({ title: 'Saved', description: 'Profile updated successfully' });
      setIsEditing(false);
      setAvatarFile(null);
    } else {
      toast({ title: 'Error', description: result.error?.message || 'Save failed', variant: 'destructive' });
    }
  };

  const handleCancel = () => setShowDiscardDialog(true);
  const confirmDiscard = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setAvatarPreview(profileData.avatar_url);
    setShowDiscardDialog(false);
    setErrors({});
    loadProfile();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Upload an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Too large', description: 'Max 5MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    setAvatarFile(file);
  };

  // Camera handlers for identity verification
  const cameraStreamRef = useRef(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      // Store stream and activate camera - video element renders on next frame
      cameraStreamRef.current = stream;
      setCameraActive(true);
    } catch {
      toast({ title: 'Camera Error', description: 'Unable to access camera. Please check permissions.', variant: 'destructive' });
    }
  }, []);

  // Assign stream to video element once it's rendered
  useEffect(() => {
    if (cameraActive && cameraStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [cameraActive]);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // Mirror for selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setFacePhoto(dataUrl);
    stopCamera();
  }, [stopCamera]);

  const handleIdUpload = (side) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast({ title: 'Invalid file', description: 'Please upload JPG, PNG, or PDF', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Too large', description: 'Max 10MB', variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === 'front') setIdFront({ name: file.name, preview: reader.result, type: file.type });
      else setIdBack({ name: file.name, preview: reader.result, type: file.type });
    };
    reader.readAsDataURL(file);
  };

  const toggleNotification = (key) => {
    const notif = SPONSOR_NOTIFICATIONS.find(n => n.key === key);
    if (notif?.required) return; // Can't disable required notifications
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const enableAllNotifications = () => {
    const all = {};
    SPONSOR_NOTIFICATIONS.forEach(n => { all[n.key] = true; });
    setNotifications(all);
  };

  // Verification progress count
  const verificationCount = [facePhoto, idFront, profileData.identity_verified].filter(Boolean).length;

  // Calculate completion
  const completionFields = [
    'full_name', 'city', 'country', 'family_size', 'accommodation_type',
    'preferred_languages', 'salary_budget_min', 'living_arrangement', 'working_hours',
  ];
  const filledCount = completionFields.filter((f) => {
    const v = profileData[f];
    if (v === null || v === undefined) return false;
    if (typeof v === 'boolean') return true;
    if (typeof v === 'number') return true;
    if (Array.isArray(v)) return v.length > 0;
    return v !== '';
  }).length;
  const completionPct = Math.round((filledCount / completionFields.length) * 100);

  const anim = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  });

  const availableCities = profileData.country ? GCC_CITIES[profileData.country] || [] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div {...anim(0)}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-purple-200 bg-gray-100">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profileData.full_name || 'My Profile'}
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {profileData.occupation || 'Sponsor'} {profileData.company ? `at ${profileData.company}` : ''}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={completionPct} className="h-1.5 w-24" />
                <span className="text-xs text-gray-500">{completionPct}% complete</span>
              </div>
            </div>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Edit3 className="h-4 w-4" /> Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Section 1: Personal Information ─────────────────────────────── */}
      <motion.div {...anim(0.05)}>
        <Card>
          <SectionHeader icon={User} title="Personal Information" subtitle="Your basic details" color="blue" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FieldRow label="Full Name" value={profileData.full_name} isEditing={isEditing} required>
                <Input
                  value={profileData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  className={errors.full_name ? 'border-red-500' : ''}
                />
                {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
              </FieldRow>

              <FieldRow label="Occupation" value={profileData.occupation} isEditing={isEditing}>
                <Select value={profileData.occupation} onValueChange={(v) => handleChange('occupation', v)}>
                  <SelectTrigger><SelectValue placeholder="Select occupation" /></SelectTrigger>
                  <SelectContent>
                    {OCCUPATIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow label="Company / Employer" value={profileData.company} isEditing={isEditing}>
                <Input
                  value={profileData.company || ''}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="Optional"
                />
              </FieldRow>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 2: Location ─────────────────────────────────────────── */}
      <motion.div {...anim(0.1)}>
        <Card>
          <SectionHeader icon={MapPin} title="Location" subtitle="Where you are based" color="green" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FieldRow label="Country" value={profileData.country} isEditing={isEditing} required>
                <Select
                  value={profileData.country}
                  onValueChange={(v) => {
                    handleChange('country', v);
                    if (v !== profileData.country) handleChange('city', '');
                  }}
                >
                  <SelectTrigger className={errors.country ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {GCC_COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
              </FieldRow>

              <FieldRow label="City" value={profileData.city} isEditing={isEditing} required>
                <Select value={profileData.city} onValueChange={(v) => handleChange('city', v)}>
                  <SelectTrigger className={errors.city ? 'border-red-500' : ''}>
                    <SelectValue placeholder={availableCities.length ? 'Select city' : 'Select country first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </FieldRow>

              <div className="md:col-span-2">
                <FieldRow label="Full Address" value={profileData.address} isEditing={isEditing}>
                  <Textarea
                    value={profileData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Street address, building, apartment..."
                    rows={2}
                  />
                </FieldRow>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 3: Family & Household ──────────────────────────────── */}
      <motion.div {...anim(0.15)}>
        <Card>
          <SectionHeader icon={Users} title="Family & Household" subtitle="Your household details" color="purple" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FieldRow
                label="Family Size"
                value={FAMILY_SIZES.find((f) => f.value === String(profileData.family_size))?.label || profileData.family_size}
                isEditing={isEditing}
              >
                <Select value={String(profileData.family_size)} onValueChange={(v) => handleChange('family_size', v)}>
                  <SelectTrigger><SelectValue placeholder="Select family size" /></SelectTrigger>
                  <SelectContent>
                    {FAMILY_SIZES.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow
                label="Children"
                value={CHILDREN_OPTIONS.find((c) => c.value === profileData.children_ages)?.label || (typeof profileData.children_ages === 'string' ? profileData.children_ages : '')}
                isEditing={isEditing}
              >
                <Select value={typeof profileData.children_ages === 'string' ? profileData.children_ages : ''} onValueChange={(v) => handleChange('children_ages', v)}>
                  <SelectTrigger><SelectValue placeholder="Select children age group" /></SelectTrigger>
                  <SelectContent>
                    {CHILDREN_OPTIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow
                label="Elderly Care"
                value={ELDERLY_OPTIONS.find((e) => e.value === profileData.elderly)?.label || (profileData.elderly_care_needed ? 'Yes' : 'No')}
                isEditing={isEditing}
              >
                <Select value={profileData.elderly || ''} onValueChange={(v) => handleChange('elderly', v)}>
                  <SelectTrigger><SelectValue placeholder="Elderly members?" /></SelectTrigger>
                  <SelectContent>
                    {ELDERLY_OPTIONS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow
                label="Property Type"
                value={PROPERTY_TYPES.find((p) => p.value === profileData.accommodation_type)?.label || profileData.accommodation_type}
                isEditing={isEditing}
              >
                <Select value={profileData.accommodation_type || ''} onValueChange={(v) => handleChange('accommodation_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Select property type" /></SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 4: Budget & Contract ───────────────────────────────── */}
      <motion.div {...anim(0.2)}>
        <Card>
          <SectionHeader icon={DollarSign} title="Budget & Contract" subtitle="Salary and contract terms" color="orange" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FieldRow
                label="Minimum Salary"
                value={profileData.salary_budget_min ? `${profileData.salary_budget_min} ${profileData.currency}` : null}
                isEditing={isEditing}
              >
                <Input
                  type="number"
                  value={profileData.salary_budget_min}
                  onChange={(e) => handleChange('salary_budget_min', e.target.value)}
                  placeholder="e.g. 1500"
                />
              </FieldRow>

              <FieldRow
                label="Maximum Salary"
                value={profileData.salary_budget_max ? `${profileData.salary_budget_max} ${profileData.currency}` : null}
                isEditing={isEditing}
              >
                <Input
                  type="number"
                  value={profileData.salary_budget_max}
                  onChange={(e) => handleChange('salary_budget_max', e.target.value)}
                  placeholder="e.g. 2500"
                />
              </FieldRow>

              <FieldRow label="Currency" value={profileData.currency} isEditing={isEditing}>
                <Select value={profileData.currency} onValueChange={(v) => handleChange('currency', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow
                label="Payment Frequency"
                value={PAYMENT_FREQUENCIES.find((p) => p.value === profileData.payment_frequency)?.label}
                isEditing={isEditing}
              >
                <Select value={profileData.payment_frequency || ''} onValueChange={(v) => handleChange('payment_frequency', v)}>
                  <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_FREQUENCIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow
                label="Contract Duration"
                value={CONTRACT_DURATIONS.find((c) => c.value === profileData.contract_duration)?.label}
                isEditing={isEditing}
              >
                <Select value={profileData.contract_duration || ''} onValueChange={(v) => handleChange('contract_duration', v)}>
                  <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                  <SelectContent>
                    {CONTRACT_DURATIONS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>
            </div>

            {/* Benefits */}
            <div className="mt-6">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Benefits Offered</Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {BENEFITS_OPTIONS.map((b) => (
                    <ToggleChip
                      key={b.value}
                      label={b.label}
                      selected={(profileData.benefits || profileData.additional_benefits || []).includes(b.value)}
                      onClick={() => toggleArrayItem('benefits', b.value)}
                    />
                  ))}
                </div>
              ) : (
                <TagList items={profileData.benefits || profileData.additional_benefits} emptyText="No benefits specified" />
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 5: Maid Preferences ────────────────────────────────── */}
      <motion.div {...anim(0.25)}>
        <Card>
          <SectionHeader icon={Heart} title="Maid Preferences" subtitle="Your ideal domestic worker" color="pink" />
          <CardContent className="p-6 space-y-6">
            {/* Preferred Nationalities */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Preferred Nationalities</Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {POPULAR_NATIONALITIES.map((nat) => (
                    <ToggleChip
                      key={nat}
                      label={nat}
                      selected={(profileData.preferred_nationality || []).includes(nat)}
                      onClick={() => toggleArrayItem('preferred_nationality', nat)}
                    />
                  ))}
                </div>
              ) : (
                <TagList items={profileData.preferred_nationality} emptyText="No preference" />
              )}
            </div>

            {/* Preferred Languages */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Preferred Languages</Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {POPULAR_LANGUAGES.map((lang) => (
                    <ToggleChip
                      key={lang}
                      label={lang}
                      selected={(profileData.preferred_languages || []).includes(lang)}
                      onClick={() => toggleArrayItem('preferred_languages', lang)}
                    />
                  ))}
                </div>
              ) : (
                <TagList items={profileData.preferred_languages} emptyText="No preference" />
              )}
            </div>

            {/* Religion Preference */}
            <FieldRow
              label="Religion Preference"
              value={profileData.preferred_religion || 'No preference'}
              isEditing={isEditing}
            >
              <Select value={profileData.preferred_religion || ''} onValueChange={(v) => handleChange('preferred_religion', v)}>
                <SelectTrigger><SelectValue placeholder="No preference" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-preference">No Preference</SelectItem>
                  <SelectItem value="Islam">Islam</SelectItem>
                  <SelectItem value="Christianity">Christianity</SelectItem>
                  <SelectItem value="Hinduism">Hinduism</SelectItem>
                  <SelectItem value="Buddhism">Buddhism</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 6: Work Arrangement ─────────────────────────────────── */}
      <motion.div {...anim(0.3)}>
        <Card>
          <SectionHeader icon={Home} title="Work Arrangement" subtitle="Living and working conditions" color="green" />
          <CardContent className="p-6 space-y-6">
            {/* Living Arrangement */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Living Arrangement</Label>
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {LIVING_ARRANGEMENTS.map((la) => (
                    <button
                      key={la.value}
                      type="button"
                      onClick={() => handleChange('living_arrangement', la.value)}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all',
                        profileData.living_arrangement === la.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <p className="font-semibold text-sm">{la.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{la.description}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded-md">
                  {LIVING_ARRANGEMENTS.find((la) => la.value === profileData.living_arrangement)?.label || (
                    profileData.live_in_required ? 'Live-in' : 'Not specified'
                  )}
                </div>
              )}
            </div>

            {/* Room Amenities - only if live-in */}
            {(profileData.living_arrangement === 'live-in' || profileData.live_in_required) && (
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Room Amenities Provided</Label>
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {ROOM_AMENITIES.map((am) => (
                      <ToggleChip
                        key={am.value}
                        label={am.label}
                        selected={(profileData.room_amenities || []).includes(am.value)}
                        onClick={() => toggleArrayItem('room_amenities', am.value)}
                      />
                    ))}
                  </div>
                ) : (
                  <TagList items={(profileData.room_amenities || []).map((v) => ROOM_AMENITIES.find((a) => a.value === v)?.label || v)} emptyText="None specified" />
                )}
              </div>
            )}

            {/* Working Hours & Days Off */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FieldRow
                label="Working Hours"
                value={WORKING_HOURS_OPTIONS.find((w) => w.value === profileData.working_hours)?.label || (profileData.working_hours_per_day ? `${profileData.working_hours_per_day} hrs/day` : null)}
                isEditing={isEditing}
              >
                <Select value={profileData.working_hours || ''} onValueChange={(v) => handleChange('working_hours', v)}>
                  <SelectTrigger><SelectValue placeholder="Select hours" /></SelectTrigger>
                  <SelectContent>
                    {WORKING_HOURS_OPTIONS.map((w) => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow
                label="Days Off"
                value={DAYS_OFF_OPTIONS.find((d) => d.value === profileData.days_off)?.label || (profileData.days_off_per_week ? `${profileData.days_off_per_week}/week` : null)}
                isEditing={isEditing}
              >
                <Select value={profileData.days_off || ''} onValueChange={(v) => handleChange('days_off', v)}>
                  <SelectTrigger><SelectValue placeholder="Select days off" /></SelectTrigger>
                  <SelectContent>
                    {DAYS_OFF_OPTIONS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>
            </div>

            {/* Overtime toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-sm font-medium text-gray-700">Overtime Available</Label>
                <p className="text-xs text-gray-500">Will overtime work be offered?</p>
              </div>
              {isEditing ? (
                <Switch
                  checked={profileData.overtime_available}
                  onCheckedChange={(v) => handleChange('overtime_available', v)}
                />
              ) : (
                <Badge variant={profileData.overtime_available ? 'default' : 'secondary'}>
                  {profileData.overtime_available ? 'Yes' : 'No'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 7: Verification & Account ──────────────────────────── */}
      <motion.div {...anim(0.35)}>
        <Card>
          <SectionHeader icon={Shield} title="Verification & Account" subtitle="Your verification status" color="slate" />
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={cn(
                'p-4 rounded-lg text-center',
                profileData.identity_verified ? 'bg-green-50' : 'bg-gray-50'
              )}>
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2',
                  profileData.identity_verified ? 'bg-green-100' : 'bg-gray-200'
                )}>
                  <Shield className={cn('h-5 w-5', profileData.identity_verified ? 'text-green-600' : 'text-gray-400')} />
                </div>
                <p className="text-xs font-medium text-gray-700">Identity</p>
                <p className={cn('text-xs', profileData.identity_verified ? 'text-green-600' : 'text-gray-400')}>
                  {profileData.identity_verified ? 'Verified' : 'Pending'}
                </p>
              </div>

              <div className={cn(
                'p-4 rounded-lg text-center',
                profileData.background_check_completed ? 'bg-green-50' : 'bg-gray-50'
              )}>
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2',
                  profileData.background_check_completed ? 'bg-green-100' : 'bg-gray-200'
                )}>
                  <Check className={cn('h-5 w-5', profileData.background_check_completed ? 'text-green-600' : 'text-gray-400')} />
                </div>
                <p className="text-xs font-medium text-gray-700">Background</p>
                <p className={cn('text-xs', profileData.background_check_completed ? 'text-green-600' : 'text-gray-400')}>
                  {profileData.background_check_completed ? 'Completed' : 'Pending'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-50 text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 bg-blue-100">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-xs font-medium text-gray-700">Total Hires</p>
                <p className="text-lg font-bold text-blue-700">{profileData.total_hires || 0}</p>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 text-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 bg-amber-100">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <p className="text-xs font-medium text-gray-700">Rating</p>
                <p className="text-lg font-bold text-amber-700">
                  {profileData.average_rating ? profileData.average_rating.toFixed(1) : '0.0'}
                </p>
              </div>
            </div>

            {(!profileData.identity_verified || !profileData.background_check_completed) && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Complete your verification to build trust with domestic workers and agencies. Verified sponsors get 2x more responses.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 8: Identity Verification ──────────────────────────── */}
      <motion.div {...anim(0.4)}>
        <Card>
          <SectionHeader icon={Shield} title="Identity Verification" subtitle="Verify your identity to build trust" color="blue" />
          <CardContent className="p-6 space-y-6">
            {/* Verification Progress */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-blue-800">Verification Progress</span>
                  <span className="text-blue-600">{verificationCount}/3 completed</span>
                </div>
                <Progress value={(verificationCount / 3) * 100} className="h-2" />
              </div>
            </div>

            {/* Face Photo */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Face Photo
                {facePhoto && <Check className="h-4 w-4 inline ml-2 text-green-500" />}
              </Label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
                {facePhoto ? (
                  <div className="relative w-48 mx-auto">
                    <img src={facePhoto} alt="Face photo" className="w-48 h-48 object-cover rounded-xl" />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setFacePhoto(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ) : isEditing ? (
                  <div className="text-center space-y-4">
                    {cameraActive ? (
                      <div className="space-y-3">
                        <div className="relative w-64 h-48 mx-auto rounded-xl overflow-hidden bg-black">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                          />
                          <div className="absolute inset-0 border-4 border-white/30 rounded-xl pointer-events-none" />
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="flex justify-center gap-2">
                          <Button onClick={capturePhoto} size="sm" className="gap-1">
                            <Camera className="h-4 w-4" /> Capture
                          </Button>
                          <Button onClick={stopCamera} variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 mb-3">Take a clear face photo for verification</p>
                        <Button onClick={startCamera} variant="outline" size="sm" className="gap-1">
                          <Camera className="h-4 w-4" /> Open Camera
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Camera className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No face photo uploaded</p>
                    <p className="text-xs text-gray-400 mt-1">Click Edit Profile to add one</p>
                  </div>
                )}
              </div>
            </div>

            {/* ID Document Upload */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                ID / Passport Document
                {idFront && <Check className="h-4 w-4 inline ml-2 text-green-500" />}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Front */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2 text-center">Front Side (Required)</p>
                  {idFront ? (
                    <div className="relative">
                      {idFront.type === 'application/pdf' ? (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <FileText className="h-8 w-8 text-red-500" />
                          <span className="text-sm text-gray-700 truncate">{idFront.name}</span>
                        </div>
                      ) : (
                        <img src={idFront.preview} alt="ID Front" className="w-full h-32 object-cover rounded-lg" />
                      )}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => setIdFront(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : isEditing ? (
                    <label className="flex flex-col items-center gap-2 cursor-pointer py-4">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-xs text-gray-500">Upload front side</span>
                      <span className="text-xs text-gray-400">JPG, PNG, PDF up to 10MB</span>
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleIdUpload('front')} className="hidden" />
                    </label>
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Not uploaded</p>
                    </div>
                  )}
                </div>

                {/* Back */}
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 mb-2 text-center">Back Side (Optional)</p>
                  {idBack ? (
                    <div className="relative">
                      {idBack.type === 'application/pdf' ? (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <FileText className="h-8 w-8 text-red-500" />
                          <span className="text-sm text-gray-700 truncate">{idBack.name}</span>
                        </div>
                      ) : (
                        <img src={idBack.preview} alt="ID Back" className="w-full h-32 object-cover rounded-lg" />
                      )}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => setIdBack(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ) : isEditing ? (
                    <label className="flex flex-col items-center gap-2 cursor-pointer py-4">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-xs text-gray-500">Upload back side</span>
                      <span className="text-xs text-gray-400">JPG, PNG, PDF up to 10MB</span>
                      <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleIdUpload('back')} className="hidden" />
                    </label>
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="h-6 w-6 text-gray-300 mx-auto mb-1" />
                      <p className="text-xs text-gray-400">Not uploaded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {verificationCount < 3 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Verified sponsors receive 2x more responses from domestic workers. Complete your verification to build trust.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 9: Premium / Upgrade ──────────────────────────────── */}
      <motion.div {...anim(0.45)}>
        <Card className="overflow-hidden">
          <SectionHeader icon={Crown} title="Premium Plan" subtitle="Unlock premium features for a better experience" color="orange" />
          <CardContent className="p-6 space-y-6">
            {/* Feature Comparison Table */}
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Feature</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Free</th>
                    <th className="text-center py-3 px-4 font-medium text-orange-600">
                      <div className="flex items-center justify-center gap-1">
                        <Crown className="h-4 w-4" /> Premium
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PREMIUM_FEATURES.map((f, i) => (
                    <tr key={f.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="py-2.5 px-4 text-gray-700">{f.feature}</td>
                      <td className="py-2.5 px-4 text-center">
                        {typeof f.free === 'boolean' ? (
                          f.free ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />
                        ) : (
                          <span className="text-gray-500">{f.free}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {typeof f.premium === 'boolean' ? (
                          f.premium ? <Check className="h-4 w-4 text-orange-500 mx-auto" /> : <X className="h-4 w-4 text-gray-300 mx-auto" />
                        ) : (
                          <span className="font-medium text-orange-700">{f.premium}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Plan Selection Cards */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Choose a Plan</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PREMIUM_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id === selectedPlan ? null : plan.id)}
                    className={cn(
                      'relative p-4 rounded-xl border-2 text-center transition-all',
                      selectedPlan === plan.id
                        ? 'border-orange-500 bg-orange-50 shadow-md'
                        : 'border-gray-200 hover:border-orange-200',
                      plan.popular && !selectedPlan && 'border-orange-300 bg-orange-50/30'
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                        <Badge className="bg-orange-500 text-white text-[10px] px-2">Popular</Badge>
                      </div>
                    )}
                    {plan.tag && (
                      <Badge variant="secondary" className="mb-2 text-[10px]">{plan.tag}</Badge>
                    )}
                    <p className="text-lg font-bold text-gray-900">${plan.price}</p>
                    <p className="text-xs text-gray-500">{plan.period}</p>
                    <p className="text-sm font-medium mt-1">{plan.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Current plan status */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className={cn('h-5 w-5', profileData.selected_premium_plan ? 'text-orange-500' : 'text-gray-400')} />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {profileData.selected_premium_plan
                      ? `Current Plan: ${PREMIUM_PLANS.find(p => p.id === profileData.selected_premium_plan)?.label || 'Premium'}`
                      : 'Free Plan'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profileData.selected_premium_plan ? 'You have premium access' : 'Upgrade to unlock all features'}
                  </p>
                </div>
              </div>
              {selectedPlan && selectedPlan !== profileData.selected_premium_plan && (
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 gap-1">
                  <Crown className="h-3.5 w-3.5" /> Upgrade
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 10: Notification Preferences ─────────────────────── */}
      <motion.div {...anim(0.5)}>
        <Card>
          <SectionHeader icon={Bell} title="Notifications" subtitle="Manage how you stay updated" color="purple" />
          <CardContent className="p-6 space-y-1">
            {/* Enable all */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b">
              <span className="text-sm font-medium text-gray-700">Enable all notifications</span>
              <Button
                variant="outline"
                size="sm"
                onClick={enableAllNotifications}
                className="text-xs"
              >
                Enable All
              </Button>
            </div>

            {/* Individual toggles */}
            {SPONSOR_NOTIFICATIONS.map((notif) => {
              const Icon = notif.icon;
              return (
                <div
                  key={notif.key}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      notifications[notif.key] ? 'bg-purple-100' : 'bg-gray-100'
                    )}>
                      <Icon className={cn(
                        'h-4.5 w-4.5',
                        notifications[notif.key] ? 'text-purple-600' : 'text-gray-400'
                      )} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                        {notif.title}
                        {notif.required && (
                          <Badge variant="secondary" className="text-[10px] py-0">Required</Badge>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{notif.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications[notif.key]}
                    onCheckedChange={() => toggleNotification(notif.key)}
                    disabled={notif.required}
                  />
                </div>
              );
            })}

            {/* Email notification note */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-start gap-2">
              <Mail className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-500">
                Important notifications will also be sent to your registered email address.
                You can unsubscribe from marketing emails at any time.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Floating Save Bar (when editing) ────────────────────────────── */}
      {isEditing && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-50"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm text-gray-600">You have unsaved changes</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isUpdating} size="sm">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isUpdating} size="sm">
                {isUpdating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save Changes
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Discard Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Any unsaved changes will be lost. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard} className="bg-red-600 hover:bg-red-700">
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SponsorProfilePage;
