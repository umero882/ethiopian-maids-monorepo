/**
 * Agency Profile Page — Scrollable Single-Page Layout
 *
 * Mirrors the SponsorProfilePage pattern: Card-based sections, global isEditing
 * toggle, framer-motion animations, profile completion progress bar.
 * Each section corresponds to one onboarding step.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { agencyService } from '@/services/agencyService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Building2,
  FileText,
  MapPin,
  Phone,
  User,
  Briefcase,
  Shield,
  Crown,
  Loader2,
  Save,
  X,
  Camera,
  Check,
  Edit3,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  XCircle,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate';
import { cn } from '@/lib/utils';

import {
  COUNTRY_DATA,
  getCitiesForCountry,
  getCountryOptions,
  WORKER_TYPES,
  SERVICE_CATEGORIES,
  ALL_SPECIALIZATIONS,
  VERIFICATION_STATUS_CONFIG,
  getVerificationStatusConfig,
  isProfileComplete,
} from '@/constants/agencyData';

// ─── Inline Constants ────────────────────────────────────────────────────────

const AGENCY_TYPES = [
  'Recruitment Agency',
  'Placement Agency',
  'Manpower Services',
  'Employment Bureau',
  'Staffing Company',
  'Other',
];

const YEARS_IN_BUSINESS = [
  { value: '0', label: 'Less than 1 year' },
  { value: '1', label: '1-3 years' },
  { value: '3', label: '3-5 years' },
  { value: '5', label: '5-10 years' },
  { value: '10', label: '10+ years' },
];

const POSITION_OPTIONS = [
  'Owner',
  'CEO',
  'General Manager',
  'Operations Manager',
  'HR Manager',
  'Branch Manager',
  'Director',
  'Partner',
  'Other',
];

const RECRUITMENT_COUNTRIES = [
  'Ethiopia',
  'Philippines',
  'Indonesia',
  'Sri Lanka',
  'Bangladesh',
  'Nepal',
  'Kenya',
  'Uganda',
  'India',
  'Myanmar',
];

// ─── Helper Components ──────────────────────────────────────────────────────

const SectionHeader = ({ icon: Icon, title, subtitle, color = 'blue' }) => {
  const colorMap = {
    blue: 'from-blue-500 to-cyan-600',
    orange: 'from-orange-500 to-amber-600',
    green: 'from-emerald-500 to-teal-600',
    purple: 'from-purple-500 to-indigo-600',
    indigo: 'from-indigo-500 to-violet-600',
    yellow: 'from-yellow-500 to-orange-500',
    teal: 'from-teal-500 to-cyan-600',
    slate: 'from-slate-500 to-gray-600',
    amber: 'from-amber-500 to-yellow-600',
    red: 'from-red-500 to-rose-600',
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
        ? 'bg-blue-100 border-blue-400 text-blue-700'
        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300',
      disabled && 'opacity-60 cursor-not-allowed'
    )}
  >
    {selected && <Check className="h-3 w-3 inline mr-1" />}
    {label}
  </button>
);

const VerificationBadge = ({ status }) => {
  const config = getVerificationStatusConfig(status);
  const iconMap = {
    verified: CheckCircle2,
    pending: Clock,
    rejected: XCircle,
  };
  const Icon = iconMap[status?.toLowerCase()] || Clock;
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
      config.bgColor, config.textColor
    )}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
};

const DocumentCard = ({ label, url, verificationStatus, isEditing, onUpload }) => {
  const fileInputRef = useRef(null);
  const hasDoc = !!url;
  const triggerUpload = () => fileInputRef.current?.click();
  return (
    <div className={cn(
      'border rounded-lg p-4 space-y-2',
      hasDoc ? 'border-gray-200' : 'border-dashed border-gray-300'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {hasDoc && verificationStatus && (
          <VerificationBadge status={verificationStatus} />
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={onUpload} className="hidden" />
      {hasDoc ? (
        <div className="flex items-center gap-2">
          <div className="w-16 h-16 rounded-md overflow-hidden border bg-gray-50 flex items-center justify-center">
            {typeof url === 'string' && (url.endsWith('.pdf') || url.includes('pdf')) ? (
              <FileText className="h-8 w-8 text-gray-400" />
            ) : (
              <img src={url} alt={label} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 text-xs text-gray-500">Document uploaded</div>
          {isEditing && (
            <Button variant="outline" size="sm" onClick={triggerUpload}>
              <Upload className="h-3 w-3 mr-1" /> Replace
            </Button>
          )}
        </div>
      ) : (
        isEditing ? (
          <div
            onClick={triggerUpload}
            className="flex flex-col items-center justify-center py-4 cursor-pointer text-gray-400 hover:text-gray-500 transition-colors"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') triggerUpload(); }}
          >
            <Upload className="h-8 w-8 mb-1" />
            <span className="text-xs">Click to upload</span>
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic py-2">No document uploaded</p>
        )
      )}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────

const AgencyProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [tradeLicenseFile, setTradeLicenseFile] = useState(null);
  const [tradeLicensePreview, setTradeLicensePreview] = useState(null);
  const [repIdFile, setRepIdFile] = useState(null);
  const [repIdPreview, setRepIdPreview] = useState(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showIdNumber, setShowIdNumber] = useState(false);
  const [errors, setErrors] = useState({});

  const initialProfile = {
    full_name: '',
    license_number: '',
    established_year: '',
    agency_description: '',
    country: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    authorized_person_name: '',
    authorized_person_position: '',
    authorized_person_phone: '',
    authorized_person_email: '',
    authorized_person_id_number: '',
    authorized_person_id_document: null,
    service_countries: [],
    specialization: [],
    trade_license_document: null,
    logo_url: null,
    verification_status: 'pending',
    authorized_person_id_verification_status: 'pending',
    trade_license_verification_status: 'pending',
    verified: false,
    total_maids: 0,
    active_maids: 0,
    successful_placements: 0,
  };

  const {
    data: profileData,
    update: updateProfile,
    isUpdating,
    setData: setProfileData,
  } = useOptimisticUpdate(initialProfile, { showToast: false });

  // Extra fields stored in localStorage (no DB columns)
  const [extraFields, setExtraFields] = useState({
    agency_type: '',
    placement_fee_percentage: '',
    guarantee_period_months: '',
    support_hours_start: '',
    support_hours_end: '',
    alt_phone: '',
    terms_accepted_at: null,
    privacy_accepted_at: null,
    subscription_tier: 'free',
    subscription_expires_at: null,
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

      const { data, error } = await agencyService.getAgencyProfile(user.id);

      // Load extra fields from localStorage
      let extra = {};
      try {
        const stored = localStorage.getItem(`agency_extra_${user.id}`);
        if (stored) extra = JSON.parse(stored);
      } catch (e) {
        console.warn('Failed to load extra fields from localStorage:', e);
      }

      if (error) {
        if (error.code !== 'PROFILE_NOT_FOUND') {
          toast({ title: 'Error', description: 'Failed to load profile', variant: 'destructive' });
        }
      } else if (data) {
        const sanitized = {
          ...data,
          full_name: data.full_name || user.agencyName || user.full_name || '',
          license_number: data.license_number || '',
          established_year: data.established_year ?? '',
          agency_description: data.agency_description || '',
          country: data.country || '',
          city: data.city || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || user.email || '',
          website: data.website || '',
          authorized_person_name: data.authorized_person_name || '',
          authorized_person_position: data.authorized_person_position || '',
          authorized_person_phone: data.authorized_person_phone || '',
          authorized_person_email: data.authorized_person_email || '',
          authorized_person_id_number: data.authorized_person_id_number || '',
          authorized_person_id_document: data.authorized_person_id_document || null,
          service_countries: data.service_countries || [],
          specialization: data.specialization || [],
          trade_license_document: data.trade_license_document || null,
          logo_url: data.logo_url || null,
          verification_status: data.verification_status || 'pending',
          authorized_person_id_verification_status: data.authorized_person_id_verification_status || 'pending',
          trade_license_verification_status: data.trade_license_verification_status || 'pending',
          verified: data.verified || false,
          total_maids: data.total_maids || 0,
          active_maids: data.active_maids || 0,
          successful_placements: data.successful_placements || 0,
        };
        setProfileData(sanitized);
        setLogoPreview(data.logo_url);

        setExtraFields({
          agency_type: extra.agency_type || '',
          placement_fee_percentage: extra.placement_fee_percentage || '',
          guarantee_period_months: extra.guarantee_period_months || '',
          support_hours_start: extra.support_hours_start || '',
          support_hours_end: extra.support_hours_end || '',
          alt_phone: extra.alt_phone || '',
          terms_accepted_at: extra.terms_accepted_at || null,
          privacy_accepted_at: extra.privacy_accepted_at || null,
          subscription_tier: extra.subscription_tier || 'free',
          subscription_expires_at: extra.subscription_expires_at || null,
        });
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

  const handleExtraChange = (field, value) => {
    setExtraFields((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, item) => {
    const arr = profileData[field] || [];
    const newArr = arr.includes(item)
      ? arr.filter((i) => i !== item)
      : [...arr, item];
    handleChange(field, newArr);
  };

  const toggleServiceCountry = (country) => {
    const arr = profileData.service_countries || [];
    const newArr = arr.includes(country)
      ? arr.filter((c) => c !== country)
      : [...arr, country];
    handleChange('service_countries', newArr);
  };

  const validateForm = () => {
    const e = {};
    if (!profileData.full_name?.trim()) e.full_name = 'Agency name is required';
    if (!profileData.license_number?.trim()) e.license_number = 'License number is required';
    if (!profileData.country?.trim()) e.country = 'Country is required';
    if (!profileData.city?.trim()) e.city = 'City is required';
    if (!profileData.phone?.trim()) e.phone = 'Office phone is required';
    if (!profileData.email?.trim()) e.email = 'Business email is required';
    if (!profileData.authorized_person_name?.trim()) e.authorized_person_name = 'Representative name is required';
    if (!profileData.authorized_person_position?.trim()) e.authorized_person_position = 'Position is required';
    if (!profileData.authorized_person_phone?.trim()) e.authorized_person_phone = 'Representative phone is required';
    if (!profileData.authorized_person_email?.trim()) e.authorized_person_email = 'Representative email is required';
    if (!profileData.specialization || profileData.specialization.length === 0) e.specialization = 'Select at least one service';
    if (!profileData.agency_description?.trim() || profileData.agency_description.trim().length < 100) {
      e.agency_description = 'Description must be at least 100 characters';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!user?.id || !validateForm()) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    const result = await updateProfile(profileData, async (data) => {
      let logoUrl = data.logo_url;
      let tradeLicenseUrl = data.trade_license_document;
      let repIdUrl = data.authorized_person_id_document;

      // Lazy-load Firebase Storage helpers once
      const uploadToStorage = async (file, path) => {
        const { storage } = await import('@/lib/firebaseClient');
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      };

      // Upload logo if changed
      if (logoFile) {
        try {
          logoUrl = await uploadToStorage(logoFile, `agencies/${user.id}/logo.${logoFile.name.split('.').pop()}`);
          setLogoPreview(logoUrl);
        } catch (e) {
          console.warn('Failed to upload logo:', e);
        }
      }

      // Upload trade license if changed
      if (tradeLicenseFile) {
        try {
          tradeLicenseUrl = await uploadToStorage(tradeLicenseFile, `agencies/${user.id}/trade_license.${tradeLicenseFile.name.split('.').pop()}`);
          setTradeLicensePreview(tradeLicenseUrl);
        } catch (e) {
          console.warn('Failed to upload trade license:', e);
        }
      }

      // Upload representative ID if changed
      if (repIdFile) {
        try {
          repIdUrl = await uploadToStorage(repIdFile, `agencies/${user.id}/rep_id.${repIdFile.name.split('.').pop()}`);
          setRepIdPreview(repIdUrl);
        } catch (e) {
          console.warn('Failed to upload representative ID:', e);
        }
      }

      // Build DB-column save payload
      const saveData = {
        full_name: data.full_name,
        license_number: data.license_number,
        established_year: data.established_year ? parseInt(data.established_year, 10) : null,
        agency_description: data.agency_description,
        country: data.country,
        city: data.city,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        authorized_person_name: data.authorized_person_name,
        authorized_person_position: data.authorized_person_position,
        authorized_person_phone: data.authorized_person_phone,
        authorized_person_email: data.authorized_person_email,
        authorized_person_id_number: data.authorized_person_id_number,
        authorized_person_id_document: repIdUrl,
        service_countries: data.service_countries,
        specialization: data.specialization,
        trade_license_document: tradeLicenseUrl,
        logo_url: logoUrl,
      };

      // Remove undefined/null for clean update
      Object.keys(saveData).forEach((key) => {
        if (saveData[key] === undefined) delete saveData[key];
      });

      const { error } = await agencyService.updateAgencyProfile(saveData);
      if (error) throw new Error(error.message || 'Failed to save');

      // Save extra fields (no DB columns) to localStorage
      try {
        localStorage.setItem(`agency_extra_${user.id}`, JSON.stringify(extraFields));
      } catch (e) {
        console.warn('Failed to save extra fields to localStorage:', e);
      }

      return data;
    });

    if (result.success) {
      toast({ title: 'Saved', description: 'Profile updated successfully' });
      setIsEditing(false);
      setLogoFile(null);
      setTradeLicenseFile(null);
      setRepIdFile(null);
    } else {
      toast({ title: 'Error', description: result.error?.message || 'Save failed', variant: 'destructive' });
    }
  };

  const handleCancel = () => setShowDiscardDialog(true);

  const confirmDiscard = () => {
    setIsEditing(false);
    setLogoFile(null);
    setLogoPreview(profileData.logo_url);
    setTradeLicenseFile(null);
    setTradeLicensePreview(null);
    setRepIdFile(null);
    setRepIdPreview(null);
    setShowDiscardDialog(false);
    setErrors({});
    loadProfile();
  };

  const handleLogoChange = (e) => {
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
    reader.onloadend = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
    setLogoFile(file);
  };

  const handleDocUpload = (field) => (e) => {
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
      if (field === 'trade_license_document') {
        setTradeLicenseFile(file);
        setTradeLicensePreview(reader.result);
      } else if (field === 'authorized_person_id_document') {
        setRepIdFile(file);
        setRepIdPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ─── Profile Completion Calculation ──────────────────────────────────────

  const completionFields = [
    { key: 'full_name', check: (v) => !!v?.trim() },
    { key: 'license_number', check: (v) => !!v?.trim() },
    { key: 'logo_url', check: (v) => !!v },
    { key: 'trade_license_document', check: (v) => !!v },
    { key: 'authorized_person_id_document', check: (v) => !!v },
    { key: 'country', check: (v) => !!v?.trim() },
    { key: 'city', check: (v) => !!v?.trim() },
    { key: 'phone', check: (v) => !!v?.trim() },
    { key: 'email', check: (v) => !!v?.trim() },
    { key: 'authorized_person_name', check: (v) => !!v?.trim() },
    { key: 'authorized_person_position', check: (v) => !!v?.trim() },
    { key: 'authorized_person_phone', check: (v) => !!v?.trim() },
    { key: 'authorized_person_email', check: (v) => !!v?.trim() },
    { key: 'specialization', check: (v) => Array.isArray(v) && v.length > 0 },
    { key: 'agency_description', check: (v) => !!v?.trim() && v.trim().length >= 100 },
  ];

  const filledCount = completionFields.filter((f) => f.check(profileData[f.key])).length;
  const completionPct = Math.round((filledCount / completionFields.length) * 100);

  const availableCities = profileData.country ? getCitiesForCountry(profileData.country) : [];

  const descriptionLength = (profileData.agency_description || '').length;

  const anim = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  });

  // ─── Loading State ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading your agency profile...</p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">

      {/* ── Header Banner ────────────────────────────────────────────────── */}
      <motion.div {...anim(0)}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {/* Agency Logo */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-4 border-blue-200 bg-gray-100">
                {logoPreview ? (
                  <img src={logoPreview} alt="Agency Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-gray-400" />
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profileData.full_name || 'My Agency'}
                </h1>
                {profileData.verified && (
                  <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                  </Badge>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-0.5">
                {profileData.country && profileData.city
                  ? `${profileData.city}, ${profileData.country}`
                  : 'Location not set'}
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

      {/* ── Section 1: Agency Basic Information ──────────────────────────── */}
      <motion.div {...anim(0.05)}>
        <Card>
          <SectionHeader icon={Building2} title="Agency Basic Information" subtitle="Your agency details" color="blue" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FieldRow label="Agency Name" value={profileData.full_name} isEditing={isEditing} required>
                <Input
                  value={profileData.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  placeholder="Enter agency name"
                  className={errors.full_name ? 'border-red-500' : ''}
                />
                {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name}</p>}
              </FieldRow>

              <FieldRow label="Trade License Number" value={profileData.license_number} isEditing={isEditing} required>
                <Input
                  value={profileData.license_number}
                  onChange={(e) => handleChange('license_number', e.target.value)}
                  placeholder="Enter license number"
                  className={errors.license_number ? 'border-red-500' : ''}
                />
                {errors.license_number && <p className="text-xs text-red-500 mt-1">{errors.license_number}</p>}
              </FieldRow>

              <FieldRow
                label="Agency Type"
                value={extraFields.agency_type}
                isEditing={isEditing}
              >
                <Select value={extraFields.agency_type} onValueChange={(v) => handleExtraChange('agency_type', v)}>
                  <SelectTrigger><SelectValue placeholder="Select agency type" /></SelectTrigger>
                  <SelectContent>
                    {AGENCY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow
                label="Years in Business"
                value={YEARS_IN_BUSINESS.find((y) => y.value === String(profileData.established_year))?.label || (profileData.established_year ? `Since ${profileData.established_year}` : null)}
                isEditing={isEditing}
              >
                <Select
                  value={String(profileData.established_year || '')}
                  onValueChange={(v) => handleChange('established_year', v)}
                >
                  <SelectTrigger><SelectValue placeholder="Select years" /></SelectTrigger>
                  <SelectContent>
                    {YEARS_IN_BUSINESS.map((y) => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldRow>

              <div className="md:col-span-2">
                <FieldRow
                  label="Website"
                  value={profileData.website ? (
                    <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                      {profileData.website} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                  isEditing={isEditing}
                >
                  <Input
                    type="url"
                    value={profileData.website || ''}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://www.youragency.com"
                  />
                </FieldRow>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 2: Identity & Documents ──────────────────────────────── */}
      <motion.div {...anim(0.1)}>
        <Card>
          <SectionHeader icon={FileText} title="Identity & Documents" subtitle="Agency verification documents" color="orange" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DocumentCard
                label="Agency Logo"
                url={logoPreview}
                isEditing={isEditing}
                onUpload={handleLogoChange}
              />
              <DocumentCard
                label="Trade License"
                url={tradeLicensePreview || profileData.trade_license_document}
                verificationStatus={profileData.trade_license_verification_status}
                isEditing={isEditing}
                onUpload={handleDocUpload('trade_license_document')}
              />
              <DocumentCard
                label="Representative ID"
                url={repIdPreview || profileData.authorized_person_id_document}
                verificationStatus={profileData.authorized_person_id_verification_status}
                isEditing={isEditing}
                onUpload={handleDocUpload('authorized_person_id_document')}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 3: Office Location ───────────────────────────────────── */}
      <motion.div {...anim(0.15)}>
        <Card>
          <SectionHeader icon={MapPin} title="Office Location" subtitle="Business location & service areas" color="green" />
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
                    {getCountryOptions().map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                <FieldRow label="Office Address" value={profileData.address} isEditing={isEditing}>
                  <Textarea
                    value={profileData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Street address, building, floor..."
                    rows={2}
                  />
                </FieldRow>
              </div>
            </div>

            {/* Recruitment Countries */}
            <div className="mt-6">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Recruitment Countries</Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {RECRUITMENT_COUNTRIES.map((c) => (
                    <ToggleChip
                      key={c}
                      label={c}
                      selected={(profileData.service_countries || []).includes(c)}
                      onClick={() => toggleServiceCountry(c)}
                    />
                  ))}
                </div>
              ) : (
                <TagList items={profileData.service_countries} emptyText="No countries specified" />
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 4: Contact Information ────────────────────────────────── */}
      <motion.div {...anim(0.2)}>
        <Card>
          <SectionHeader icon={Phone} title="Contact Information" subtitle="Business contact details" color="purple" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FieldRow
                label="Office Phone"
                value={profileData.phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    {profileData.phone}
                    {profileData.verified && <VerificationBadge status="verified" />}
                  </span>
                ) : null}
                isEditing={isEditing}
                required
              >
                <Input
                  value={profileData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+971 XX XXX XXXX"
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </FieldRow>

              <FieldRow
                label="Business Email"
                value={profileData.email ? (
                  <span className="inline-flex items-center gap-1.5">
                    {profileData.email}
                    {profileData.verified && <VerificationBadge status="verified" />}
                  </span>
                ) : null}
                isEditing={isEditing}
                required
              >
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="agency@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </FieldRow>

              <FieldRow label="Alt Phone" value={extraFields.alt_phone} isEditing={isEditing}>
                <Input
                  value={extraFields.alt_phone || ''}
                  onChange={(e) => handleExtraChange('alt_phone', e.target.value)}
                  placeholder="Alternative phone number"
                />
              </FieldRow>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-gray-700">Support Hours</Label>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={extraFields.support_hours_start || ''}
                      onChange={(e) => handleExtraChange('support_hours_start', e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <Input
                      type="time"
                      value={extraFields.support_hours_end || ''}
                      onChange={(e) => handleExtraChange('support_hours_end', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                ) : (
                  <div className="text-sm text-gray-900 py-2 px-3 bg-gray-50 rounded-md min-h-[38px] flex items-center">
                    {extraFields.support_hours_start && extraFields.support_hours_end
                      ? `${extraFields.support_hours_start} - ${extraFields.support_hours_end}`
                      : <span className="text-gray-400 italic">Not set</span>
                    }
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 5: Authorized Representative ─────────────────────────── */}
      <motion.div {...anim(0.25)}>
        <Card>
          <SectionHeader icon={User} title="Authorized Representative" subtitle="Person authorized to act on behalf of the agency" color="indigo" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FieldRow label="Full Name" value={profileData.authorized_person_name} isEditing={isEditing} required>
                <Input
                  value={profileData.authorized_person_name}
                  onChange={(e) => handleChange('authorized_person_name', e.target.value)}
                  placeholder="Full name of representative"
                  className={errors.authorized_person_name ? 'border-red-500' : ''}
                />
                {errors.authorized_person_name && <p className="text-xs text-red-500 mt-1">{errors.authorized_person_name}</p>}
              </FieldRow>

              <FieldRow label="Position" value={profileData.authorized_person_position} isEditing={isEditing} required>
                <Select
                  value={profileData.authorized_person_position}
                  onValueChange={(v) => handleChange('authorized_person_position', v)}
                >
                  <SelectTrigger className={errors.authorized_person_position ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITION_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.authorized_person_position && <p className="text-xs text-red-500 mt-1">{errors.authorized_person_position}</p>}
              </FieldRow>

              <FieldRow
                label="Direct Phone"
                value={profileData.authorized_person_phone ? (
                  <span className="inline-flex items-center gap-1.5">
                    {profileData.authorized_person_phone}
                    {profileData.verified && <VerificationBadge status="verified" />}
                  </span>
                ) : null}
                isEditing={isEditing}
                required
              >
                <Input
                  value={profileData.authorized_person_phone}
                  onChange={(e) => handleChange('authorized_person_phone', e.target.value)}
                  placeholder="+971 XX XXX XXXX"
                  className={errors.authorized_person_phone ? 'border-red-500' : ''}
                />
                {errors.authorized_person_phone && <p className="text-xs text-red-500 mt-1">{errors.authorized_person_phone}</p>}
              </FieldRow>

              <FieldRow
                label="Email"
                value={profileData.authorized_person_email ? (
                  <span className="inline-flex items-center gap-1.5">
                    {profileData.authorized_person_email}
                    {profileData.verified && <VerificationBadge status="verified" />}
                  </span>
                ) : null}
                isEditing={isEditing}
                required
              >
                <Input
                  type="email"
                  value={profileData.authorized_person_email}
                  onChange={(e) => handleChange('authorized_person_email', e.target.value)}
                  placeholder="representative@agency.com"
                  className={errors.authorized_person_email ? 'border-red-500' : ''}
                />
                {errors.authorized_person_email && <p className="text-xs text-red-500 mt-1">{errors.authorized_person_email}</p>}
              </FieldRow>

              <div className="md:col-span-2">
                <FieldRow
                  label="ID Number"
                  value={profileData.authorized_person_id_number ? (
                    <span className="inline-flex items-center gap-2">
                      {showIdNumber
                        ? profileData.authorized_person_id_number
                        : profileData.authorized_person_id_number.replace(/./g, '*').slice(0, -4) + profileData.authorized_person_id_number.slice(-4)
                      }
                      <button type="button" onClick={() => setShowIdNumber(!showIdNumber)} className="text-gray-400 hover:text-gray-600">
                        {showIdNumber ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </span>
                  ) : null}
                  isEditing={isEditing}
                >
                  <Input
                    value={profileData.authorized_person_id_number || ''}
                    onChange={(e) => handleChange('authorized_person_id_number', e.target.value)}
                    placeholder="National ID or passport number"
                  />
                </FieldRow>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 6: Services Offered ───────────────────────────────────── */}
      <motion.div {...anim(0.3)}>
        <Card>
          <SectionHeader icon={Briefcase} title="Services Offered" subtitle="Worker types & service categories" color="yellow" />
          <CardContent className="p-6 space-y-6">
            {/* Worker Types */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Worker Types {isEditing && <span className="text-red-500">*</span>}
              </Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {WORKER_TYPES.map((w) => (
                    <ToggleChip
                      key={w}
                      label={w}
                      selected={(profileData.specialization || []).includes(w)}
                      onClick={() => toggleArrayItem('specialization', w)}
                    />
                  ))}
                </div>
              ) : (
                <TagList
                  items={(profileData.specialization || []).filter((s) => WORKER_TYPES.includes(s))}
                  emptyText="No worker types selected"
                />
              )}
              {errors.specialization && <p className="text-xs text-red-500 mt-1">{errors.specialization}</p>}
            </div>

            {/* Service Categories */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Service Categories</Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {SERVICE_CATEGORIES.map((s) => (
                    <ToggleChip
                      key={s}
                      label={s}
                      selected={(profileData.specialization || []).includes(s)}
                      onClick={() => toggleArrayItem('specialization', s)}
                    />
                  ))}
                </div>
              ) : (
                <TagList
                  items={(profileData.specialization || []).filter((s) => SERVICE_CATEGORIES.includes(s))}
                  emptyText="No service categories selected"
                />
              )}
            </div>

            {/* Other Specializations (items not matching WORKER_TYPES or SERVICE_CATEGORIES) */}
            {(() => {
              const others = (profileData.specialization || []).filter(
                (s) => !WORKER_TYPES.includes(s) && !SERVICE_CATEGORIES.includes(s)
              );
              if (others.length === 0 && !isEditing) return null;
              return (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Other Specializations</Label>
                  <TagList items={others} emptyText="None" />
                </div>
              );
            })()}

            {/* Fee & Guarantee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FieldRow
                label="Placement Fee %"
                value={extraFields.placement_fee_percentage ? `${extraFields.placement_fee_percentage}%` : null}
                isEditing={isEditing}
              >
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={extraFields.placement_fee_percentage}
                  onChange={(e) => handleExtraChange('placement_fee_percentage', e.target.value)}
                  placeholder="e.g. 10"
                />
              </FieldRow>

              <FieldRow
                label="Guarantee Period"
                value={extraFields.guarantee_period_months ? `${extraFields.guarantee_period_months} months` : null}
                isEditing={isEditing}
              >
                <Input
                  type="number"
                  min="0"
                  max="24"
                  value={extraFields.guarantee_period_months}
                  onChange={(e) => handleExtraChange('guarantee_period_months', e.target.value)}
                  placeholder="e.g. 3"
                />
              </FieldRow>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 7: Agency Description ─────────────────────────────────── */}
      <motion.div {...anim(0.35)}>
        <Card>
          <SectionHeader icon={FileText} title="Agency Description" subtitle="Tell sponsors about your agency" color="teal" />
          <CardContent className="p-6">
            <FieldRow
              label="About Your Agency"
              value={profileData.agency_description}
              isEditing={isEditing}
              required
            >
              <Textarea
                value={profileData.agency_description || ''}
                onChange={(e) => handleChange('agency_description', e.target.value)}
                placeholder="Describe your agency's experience, values, and what makes you stand out... (minimum 100 characters)"
                rows={5}
                maxLength={1000}
                className={errors.agency_description ? 'border-red-500' : ''}
              />
              <div className="flex items-center justify-between mt-1.5">
                <div>
                  {errors.agency_description && <p className="text-xs text-red-500">{errors.agency_description}</p>}
                </div>
                <p className={cn(
                  'text-xs',
                  descriptionLength < 100 ? 'text-red-500' : descriptionLength > 900 ? 'text-amber-500' : 'text-gray-400'
                )}>
                  {descriptionLength}/1000
                  {descriptionLength < 100 && ` (min 100)`}
                </p>
              </div>
            </FieldRow>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 8: Terms & Agreements ─────────────────────────────────── */}
      <motion.div {...anim(0.4)}>
        <Card>
          <SectionHeader icon={Shield} title="Terms & Agreements" subtitle="Review acceptance status" color="slate" />
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Terms of Service</p>
                    <p className="text-xs text-gray-500">
                      {extraFields.terms_accepted_at
                        ? `Accepted on ${new Date(extraFields.terms_accepted_at).toLocaleDateString()}`
                        : 'Accepted during registration'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Accepted</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Privacy Policy</p>
                    <p className="text-xs text-gray-500">
                      {extraFields.privacy_accepted_at
                        ? `Accepted on ${new Date(extraFields.privacy_accepted_at).toLocaleDateString()}`
                        : 'Accepted during registration'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Accepted</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {completionPct === 100 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-800">Profile Completion</p>
                    <p className="text-xs text-gray-500">{completionPct}% of required fields filled</p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    completionPct === 100
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  )}
                >
                  {completionPct === 100 ? 'Complete' : 'In Progress'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Section 9: Subscription Plan ──────────────────────────────────── */}
      <motion.div {...anim(0.45)}>
        <Card>
          <SectionHeader icon={Crown} title="Subscription Plan" subtitle="Your current plan and billing" color="amber" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  extraFields.subscription_tier === 'premium' ? 'bg-amber-100' : 'bg-gray-100'
                )}>
                  <Crown className={cn(
                    'h-5 w-5',
                    extraFields.subscription_tier === 'premium' ? 'text-amber-600' : 'text-gray-400'
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {extraFields.subscription_tier === 'premium' ? 'Premium Plan' : 'Free Plan'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {extraFields.subscription_expires_at
                      ? `Expires: ${new Date(extraFields.subscription_expires_at).toLocaleDateString()}`
                      : extraFields.subscription_tier === 'premium'
                        ? 'Active subscription'
                        : 'Upgrade to unlock premium features'}
                  </p>
                </div>
              </div>
              {extraFields.subscription_tier !== 'premium' && (
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 gap-1">
                  <Crown className="h-3.5 w-3.5" /> Upgrade
                </Button>
              )}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{profileData.total_maids || 0}</p>
                <p className="text-xs text-gray-500">Total Workers</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{profileData.active_maids || 0}</p>
                <p className="text-xs text-gray-500">Active Workers</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{profileData.successful_placements || 0}</p>
                <p className="text-xs text-gray-500">Placements</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Floating Save Bar (when editing) ─────────────────────────────── */}
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

      {/* ── Discard Dialog ───────────────────────────────────────────────── */}
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

export default AgencyProfilePage;
