import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { agencyService } from '@/services/agencyService';
import { toast } from '@/components/ui/use-toast';
import UnifiedMaidForm from '@/components/profile/completion/UnifiedMaidForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Clear all maid form drafts from localStorage BEFORE component mounts
const clearAllMaidDrafts = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('maidFormDraft:')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('🧹 Cleared all maid form drafts:', keysToRemove.length);
  } catch (e) {
    console.warn('Could not clear drafts:', e);
  }
};

// Clear drafts immediately when module loads
clearAllMaidDrafts();

/**
 * AgencyAddMaidPage - Page for agencies to add new maids
 * Uses the UnifiedMaidForm for consistency with self-registration
 */
const AgencyAddMaidPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  // Generate unique key for this session to ensure fresh form
  const formKey = useMemo(() => `new-maid-${Date.now()}`, []);

  // Clear drafts again on mount to be safe
  useEffect(() => {
    clearAllMaidDrafts();
  }, []);

  // Handle form data updates from UnifiedMaidForm (not used for add page)
  const handleFormUpdate = () => {
    // No-op for add page - we don't track state here
  };

  // Handle form submission from UnifiedMaidForm
  const handleFormSubmit = async (formData) => {
    setSubmitting(true);
    try {

      // Create the maid profile using the agency service
      const result = await agencyService.createMaidProfile(formData, user?.id);


      toast({
        title: 'Success',
        description: 'Maid profile created successfully!',
      });

      // Navigate back to maids list
      navigate('/dashboard/agency/maids');
    } catch (error) {
      console.error('❌ AgencyAddMaidPage - Error creating maid:', error);
      toast({
        title: 'Error',
        description:
          error.message || 'Failed to create maid profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center space-x-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => navigate('/dashboard/agency/maids')}
        >
          <ArrowLeft className='mr-2 h-4 w-4' /> Back to Maids
        </Button>
        <h1 className='text-3xl font-bold text-gray-800'>Add New Maid</h1>
      </div>

      {/* Unified Maid Form - key forces fresh form, skipDraftRestore prevents loading old data */}
      <UnifiedMaidForm
        key={formKey}
        onUpdate={handleFormUpdate}
        onSubmit={handleFormSubmit}
        initialData={{}}
        mode='agency-managed'
        skipDraftRestore={true}
      />
    </div>
  );
};

export default AgencyAddMaidPage;
