import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agencyService } from '@/services/agencyService';
import { toast } from '@/components/ui/use-toast';
import { uploadFile } from '@/lib/firebaseClient';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Save, Loader2, Trash2, Camera, Upload, X } from 'lucide-react';
import { getStatesByCountry } from '@/data/countryStateData';

// GCC Countries + Ethiopia + Others for Current Location
const CURRENT_COUNTRY_OPTIONS = [
  { label: 'GCC Countries', options: [
    'United Arab Emirates',
    'Saudi Arabia',
    'Qatar',
    'Kuwait',
    'Bahrain',
    'Oman',
  ]},
  { label: 'Africa', options: [
    'Ethiopia',
  ]},
  { label: 'Other', options: [
    'Other',
  ]},
];

// Flatten for easy lookup
const ALL_CURRENT_COUNTRIES = CURRENT_COUNTRY_OPTIONS.flatMap(group => group.options);

const AgencyEditMaidPage = () => {
  const { id } = useParams();
  console.log('✏️ AgencyEditMaidPage MOUNTED - Editing maid ID:', id);

  const navigate = useNavigate();
  const [maid, setMaid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    currentCountry: '',
    cityState: '',
    experience: '',
    status: '',
    skills: [],
    agencyNotes: '',
  });

  // Get cities/states based on current country selection
  const availableCitiesStates = formData.currentCountry && formData.currentCountry !== 'Other'
    ? getStatesByCountry(formData.currentCountry)
    : [];

  // Delete state
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Photo state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null); // For local blob preview only
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(null); // Actual Firebase URL
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Available skills for selection
  const availableSkills = [
    'Cooking',
    'Cleaning',
    'Childcare',
    'Elderly Care',
    'Laundry',
    'Pet Care',
    'Gardening',
    'Driving',
  ];

  useEffect(() => {
    const fetchMaid = async () => {
      try {
        const { data, error } = await agencyService.getAgencyMaidById(id);

        if (error) {
          setError(error);
          toast({
            title: 'Error loading maid details',
            description:
              error.message || 'An error occurred while loading maid details.',
            variant: 'destructive',
          });
        } else if (!data) {
          setError(new Error('Maid not found'));
          toast({
            title: 'Maid not found',
            description: 'The requested maid profile could not be found.',
            variant: 'destructive',
          });
        } else {
          console.log('=== MAID DATA LOADED ===');
          console.log('Full maid data:', data);
          console.log('profile_photo_url:', data.profile_photo_url);

          setMaid(data);
          // Initialize form data with maid data
          setFormData({
            name: data.name || '',
            country: data.country || '',
            currentCountry: data.currentCountry || data.current_location || '',
            cityState: data.cityState || data.state_province || '',
            experience: data.experience || '',
            status: data.status || 'pending',
            skills: data.skills || [],
            agencyNotes: data.agencyNotes || '',
          });
          // Set existing photo - only if it's a valid Firebase URL (not a blob URL)
          const existingPhoto = data.profile_photo_url || data.profileImageUrl ||
            (data.images && data.images.length > 0 ?
              (data.images.find(img => img.is_primary)?.file_url || data.images[0]?.file_url) : null);
          console.log('existingPhoto resolved to:', existingPhoto);
          if (existingPhoto && (existingPhoto.startsWith('https://') || existingPhoto.startsWith('http://'))) {
            // Only set if it's a real URL, not a blob URL
            if (!existingPhoto.startsWith('blob:')) {
              setPhotoPreview(existingPhoto);
              setUploadedPhotoUrl(existingPhoto);
            }
          }
        }
      } catch (err) {
        setError(err);
        toast({
          title: 'Error loading maid details',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMaid();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleStatusChange = (value) => {
    setFormData({
      ...formData,
      status: value,
    });
  };

  const handleCurrentCountryChange = (value) => {
    setFormData({
      ...formData,
      currentCountry: value,
      cityState: '', // Reset city/state when country changes
    });
  };

  const handleCityStateChange = (value) => {
    setFormData({
      ...formData,
      cityState: value,
    });
  };

  const handleSkillToggle = (skill) => {
    setFormData((prev) => {
      const newSkills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill];

      return {
        ...prev,
        skills: newSkills,
      };
    });
  };

  // Photo handling functions
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setPhotoFile(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadedPhotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) {
      console.warn('No photo file selected');
      return;
    }

    if (!id) {
      console.error('No maid ID available for photo upload');
      toast({
        title: 'Error',
        description: 'Cannot upload photo - maid ID not found.',
        variant: 'destructive',
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      // Generate unique file path for Firebase Storage
      // Use timestamp + random string to ensure uniqueness across all maids
      const fileExt = photoFile.name.split('.').pop();
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const fileName = `profile_${uniqueId}.${fileExt}`;
      // Store in maids/{maidId}/photos/ folder structure
      const filePath = `maids/${id}/photos/${fileName}`;

      console.log('Starting photo upload...', {
        maidId: id,
        fileName: photoFile.name,
        fileSize: photoFile.size,
        filePath
      });

      // Upload to Firebase Storage (signature: file, path, onProgress)
      const result = await uploadFile(photoFile, filePath);
      const publicUrl = result?.url;

      if (!publicUrl) {
        throw new Error('Upload succeeded but no URL returned');
      }

      console.log('Photo uploaded to Firebase:', publicUrl);

      // Update maid profile with new photo URL
      console.log('Updating maid profile with photo URL...');
      const { data: updateData, error: updateError } = await agencyService.updateAgencyMaid(id, {
        profile_photo_url: publicUrl,
      });

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      console.log('Maid profile updated successfully:', updateData);

      // Update both preview and uploaded URL
      setPhotoPreview(publicUrl);
      setUploadedPhotoUrl(publicUrl); // This is the real Firebase URL
      setPhotoFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: 'Photo updated',
        description: 'Profile photo has been successfully updated.',
      });
    } catch (err) {
      console.error('Photo upload error:', err);
      toast({
        title: 'Error uploading photo',
        description: err.message || 'Failed to upload photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // If there's a pending photo file that hasn't been uploaded yet, upload it first
      let finalPhotoUrl = uploadedPhotoUrl;

      if (photoFile) {
        console.log('[handleSubmit] Pending photo file detected, uploading first...');
        try {
          const fileExt = photoFile.name.split('.').pop();
          const uniqueId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const fileName = `profile_${uniqueId}.${fileExt}`;
          const filePath = `maids/${id}/photos/${fileName}`;

          const result = await uploadFile(photoFile, filePath);
          finalPhotoUrl = result?.url;

          if (finalPhotoUrl) {
            console.log('[handleSubmit] Photo uploaded successfully:', finalPhotoUrl);
            setUploadedPhotoUrl(finalPhotoUrl);
            setPhotoPreview(finalPhotoUrl);
            setPhotoFile(null);
          }
        } catch (uploadErr) {
          console.error('[handleSubmit] Photo upload failed:', uploadErr);
          toast({
            title: 'Photo upload failed',
            description: 'Failed to upload photo. Other changes will still be saved.',
            variant: 'destructive',
          });
        }
      }

      // Include the photo URL only if it's a valid Firebase URL (not blob URL)
      const submitData = {
        ...formData,
        // Only include finalPhotoUrl which is the actual Firebase Storage URL
        ...(finalPhotoUrl && { profile_photo_url: finalPhotoUrl }),
      };

      console.log('[handleSubmit] Submitting with profile_photo_url:', finalPhotoUrl);

      const { data, error } = await agencyService.updateAgencyMaid(
        id,
        submitData
      );

      if (error) {
        toast({
          title: 'Error updating maid profile',
          description:
            error.message || 'An error occurred while updating the profile.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Profile updated',
          description: 'The maid profile has been successfully updated.',
        });
        navigate(`/dashboard/agency/maids/${id}`);
      }
    } catch (err) {
      toast({
        title: 'Error updating maid profile',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle delete maid
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { data, error } = await agencyService.removeAgencyMaid(id);

      if (error) {
        toast({
          title: 'Error deleting maid',
          description: error.message || 'Failed to delete maid profile.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Maid deleted',
          description: 'The maid profile has been successfully deleted.',
        });
        navigate('/dashboard/agency/maids');
      }
    } catch (err) {
      toast({
        title: 'Error deleting maid',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto'></div>
          <p className='text-gray-600'>Loading maid details...</p>
        </div>
      </div>
    );
  }

  if (error || !maid) {
    return (
      <div className='flex flex-col items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='bg-red-100 text-red-700 p-4 rounded-lg max-w-md'>
            <p className='font-semibold'>Error loading maid details</p>
            <p>{error?.message || 'The requested maid could not be found.'}</p>
          </div>
          <Button
            onClick={() => navigate('/dashboard/agency/maids')}
            variant='outline'
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back to Maids
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate(`/dashboard/agency/maids/${id}`)}
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </Button>
          <h1 className='text-3xl font-bold text-gray-800'>
            Edit Maid Profile
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Profile Photo Section */}
        <Card className='shadow-lg border-0 mb-6'>
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>
              Update the maid's profile picture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col sm:flex-row items-center gap-6'>
              {/* Photo Preview */}
              <div className='relative'>
                <Avatar className='w-32 h-32 border-4 border-gray-100'>
                  <AvatarImage src={photoPreview} alt={formData.name || 'Profile photo'} />
                  <AvatarFallback className='text-3xl bg-purple-100 text-purple-600'>
                    {formData.name
                      ? formData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                      : 'M'}
                  </AvatarFallback>
                </Avatar>
                {photoPreview && (
                  <Button
                    type='button'
                    variant='destructive'
                    size='icon'
                    className='absolute -top-2 -right-2 h-8 w-8 rounded-full'
                    onClick={handleRemovePhoto}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                )}
              </div>

              {/* Upload Controls */}
              <div className='flex flex-col gap-3'>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handlePhotoSelect}
                  className='hidden'
                  id='photo-upload'
                />
                <div className='flex gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className='mr-2 h-4 w-4' />
                    {photoPreview ? 'Change Photo' : 'Select Photo'}
                  </Button>
                  {photoFile && (
                    <Button
                      type='button'
                      onClick={handleUploadPhoto}
                      disabled={uploadingPhoto}
                    >
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className='mr-2 h-4 w-4' />
                          Upload Photo
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <p className='text-xs text-gray-500'>
                  Accepted formats: JPG, PNG, GIF. Max size: 5MB
                </p>
                {photoFile && (
                  <p className='text-sm text-green-600'>
                    Selected: {photoFile.name}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          <Card className='shadow-lg border-0'>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update the maid's basic information
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Full Name</Label>
                <Input
                  id='name'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder='Enter full name'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='country'>Nationality</Label>
                <Input
                  id='country'
                  name='country'
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder='Enter country of origin'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='currentCountry'>Current Country <span className='text-red-500'>*</span></Label>
                <Select
                  value={formData.currentCountry}
                  onValueChange={handleCurrentCountryChange}
                >
                  <SelectTrigger id='currentCountry'>
                    <SelectValue placeholder='Select current country' />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENT_COUNTRY_OPTIONS.map((group) => (
                      <div key={group.label}>
                        <div className='px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50'>
                          {group.label}
                        </div>
                        {group.options.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='cityState'>
                  City / State <span className='text-red-500'>*</span>
                </Label>
                {formData.currentCountry && formData.currentCountry !== 'Other' && availableCitiesStates.length > 0 ? (
                  <Select
                    value={formData.cityState}
                    onValueChange={handleCityStateChange}
                  >
                    <SelectTrigger id='cityState'>
                      <SelectValue placeholder='Select city/state' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCitiesStates.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id='cityState'
                    name='cityState'
                    value={formData.cityState}
                    onChange={handleInputChange}
                    placeholder={formData.currentCountry ? 'Enter city or state' : 'Select a country first'}
                    disabled={!formData.currentCountry}
                  />
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='experience'>Experience</Label>
                <Input
                  id='experience'
                  name='experience'
                  value={formData.experience}
                  onChange={handleInputChange}
                  placeholder='e.g., 3 years'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='status'>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger id='status'>
                    <SelectValue placeholder='Select status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                    <SelectItem value='placed'>Placed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className='shadow-lg border-0'>
            <CardHeader>
              <CardTitle>Skills & Notes</CardTitle>
              <CardDescription>Update skills and agency notes</CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-3'>
                <Label>Skills</Label>
                <div className='grid grid-cols-2 gap-2'>
                  {availableSkills.map((skill) => (
                    <div key={skill} className='flex items-center space-x-2'>
                      <Checkbox
                        id={`skill-${skill}`}
                        checked={formData.skills.includes(skill)}
                        onCheckedChange={() => handleSkillToggle(skill)}
                      />
                      <Label
                        htmlFor={`skill-${skill}`}
                        className='cursor-pointer'
                      >
                        {skill}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='agencyNotes'>Agency Notes</Label>
                <Textarea
                  id='agencyNotes'
                  name='agencyNotes'
                  value={formData.agencyNotes}
                  onChange={handleInputChange}
                  placeholder='Internal notes about this maid'
                  className='min-h-[100px]'
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='mt-6 flex justify-between'>
          {/* Delete Button */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type='button'
                variant='destructive'
                disabled={deleting}
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Delete Maid
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Maid Profile</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{formData.name || 'this maid'}</strong>?
                  This action cannot be undone and will permanently remove the maid profile
                  and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className='bg-red-600 hover:bg-red-700'
                >
                  {deleting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className='mr-2 h-4 w-4' />
                      Delete
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Save/Cancel Buttons */}
          <div className='flex space-x-3'>
            <Button
              type='button'
              variant='outline'
              onClick={() => navigate(`/dashboard/agency/maids/${id}`)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Saving Changes
                </>
              ) : (
                <>
                  <Save className='mr-2 h-4 w-4' />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AgencyEditMaidPage;
