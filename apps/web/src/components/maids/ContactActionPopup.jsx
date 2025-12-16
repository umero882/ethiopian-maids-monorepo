/**
 * ContactActionPopup Component
 *
 * Displays a popup with contact options when user clicks "Hire Now" or "Contact Agency"
 *
 * For Independent Maids:
 * - Message Maid (opens chat)
 * - WhatsApp Chat (wa.me deep link)
 * - Book Interview (opens booking dialog)
 *
 * For Agency Maids:
 * - Message Agency (opens chat)
 * - WhatsApp Agency (wa.me deep link)
 * - Book Interview (opens booking dialog)
 *
 * Also handles agency balance gate:
 * - Checks if agency has sufficient balance (500)
 * - Shows notification if balance insufficient
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Phone,
  Calendar,
  Building2,
  User,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { agencyBalanceService } from '@/services/agencyBalanceService';
import { placementWorkflowService } from '@/services/placementWorkflowService';
import { toast } from '@/components/ui/use-toast';
import BookingRequestDialog from './BookingRequestDialog';

// WhatsApp icon component
const WhatsAppIcon = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const ContactActionPopup = ({
  isOpen,
  onClose,
  maid,
  agency = null,
  onBookingSuccess,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [balanceCheck, setBalanceCheck] = useState(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [isInitiatingContact, setIsInitiatingContact] = useState(false);

  const isAgencyManaged = !!(agency || maid?.agency_id || maid?.is_agency_managed);
  const contactEntity = isAgencyManaged ? agency : maid;
  const contactName = isAgencyManaged
    ? agency?.full_name || agency?.business_name || 'Agency'
    : maid?.full_name || 'Maid';

  // Get phone number for WhatsApp
  const phoneNumber = isAgencyManaged
    ? agency?.business_phone || agency?.phone_number
    : maid?.phone_number;

  // Format phone for WhatsApp (remove spaces, dashes, etc.)
  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;
    // Remove all non-numeric characters except +
    let formatted = phone.replace(/[^\d+]/g, '');
    // Ensure it starts with country code
    if (!formatted.startsWith('+')) {
      // Default to Ethiopian country code if no code
      formatted = '+251' + formatted;
    }
    return formatted.replace('+', '');
  };

  const whatsappPhone = formatPhoneForWhatsApp(phoneNumber);

  // Check agency balance when popup opens (for agency maids)
  useEffect(() => {
    if (isOpen && isAgencyManaged && agency?.id) {
      checkAgencyBalance();
    }
  }, [isOpen, isAgencyManaged, agency?.id]);

  const checkAgencyBalance = async () => {
    setIsCheckingBalance(true);
    try {
      const sponsorCountry = user?.country || user?.location_country || 'AE';
      const result = await agencyBalanceService.checkAgencyBalance(agency.id, sponsorCountry);
      setBalanceCheck(result);

      if (!result.hasSufficientBalance) {
        // Notify agency about insufficient balance
        await agencyBalanceService.notifyInsufficientBalance(
          agency.user_id || agency.id,
          result.required,
          result.currency
        );
      }
    } catch (error) {
      console.error('Error checking agency balance:', error);
      setBalanceCheck({ hasSufficientBalance: true }); // Allow contact on error
    } finally {
      setIsCheckingBalance(false);
    }
  };

  // Handle message action
  const handleMessage = async () => {
    if (isAgencyManaged && !balanceCheck?.hasSufficientBalance) {
      showInsufficientBalanceToast();
      return;
    }

    // Initiate contact workflow
    await initiateContactWorkflow();

    // Navigate to messages
    const recipientId = isAgencyManaged ? agency?.user_id || agency?.id : maid?.user_id || maid?.id;
    navigate(`/messages?recipient=${recipientId}`);
    onClose();
  };

  // Handle WhatsApp action
  const handleWhatsApp = async () => {
    if (isAgencyManaged && !balanceCheck?.hasSufficientBalance) {
      showInsufficientBalanceToast();
      return;
    }

    if (!whatsappPhone) {
      toast({
        title: 'Phone Number Unavailable',
        description: 'Contact phone number is not available.',
        variant: 'destructive',
      });
      return;
    }

    // Initiate contact workflow
    await initiateContactWorkflow();

    // Open WhatsApp with pre-filled message
    const message = isAgencyManaged
      ? `Hello, I'm interested in hiring ${maid?.full_name || 'a maid'} through your agency.`
      : `Hello ${maid?.full_name || ''}, I'm interested in hiring you through Ethiopian Maids platform.`;

    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  // Handle book interview action
  const handleBookInterview = async () => {
    if (isAgencyManaged && !balanceCheck?.hasSufficientBalance) {
      showInsufficientBalanceToast();
      return;
    }

    setShowBookingDialog(true);
  };

  // Initiate contact workflow
  const initiateContactWorkflow = async () => {
    if (isInitiatingContact) return;

    setIsInitiatingContact(true);
    try {
      const sponsorCountry = user?.country || user?.location_country || 'AE';

      await placementWorkflowService.initiateContact({
        sponsorId: user?.uid || user?.id,
        agencyId: isAgencyManaged ? agency?.id : null,
        maidId: maid?.id,
        sponsorCountry,
      });

      toast({
        title: 'Contact Initiated',
        description: 'Your interest has been recorded. The workflow has started.',
      });
    } catch (error) {
      console.error('Error initiating contact:', error);
      // Don't block the action on error
    } finally {
      setIsInitiatingContact(false);
    }
  };

  // Show insufficient balance toast
  const showInsufficientBalanceToast = () => {
    toast({
      title: 'Agency Temporarily Unavailable',
      description: 'This agency is currently not accepting new inquiries. Please try again later.',
      variant: 'warning',
    });
  };

  // Handle booking dialog close
  const handleBookingClose = () => {
    setShowBookingDialog(false);
  };

  // Handle booking success
  const handleBookingSuccess = async (booking) => {
    // Initiate contact workflow
    await initiateContactWorkflow();

    setShowBookingDialog(false);
    onClose();

    if (onBookingSuccess) {
      onBookingSuccess(booking);
    }
  };

  // Render loading state
  if (isCheckingBalance) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Checking availability...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render insufficient balance state for agency maids
  if (isAgencyManaged && balanceCheck && !balanceCheck.hasSufficientBalance) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              Agency Temporarily Unavailable
            </DialogTitle>
            <DialogDescription>
              This agency is currently not accepting new inquiries. The agency has been notified.
              Please try again later or browse other available maids.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen && !showBookingDialog} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isAgencyManaged ? (
                <>
                  <Building2 className="w-5 h-5 text-primary" />
                  Contact Agency
                </>
              ) : (
                <>
                  <User className="w-5 h-5 text-primary" />
                  Hire {maid?.full_name || 'Maid'}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Choose how you'd like to connect with {contactName}
            </DialogDescription>
          </DialogHeader>

          {/* Maid info summary */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
            {maid?.profile_photo_url ? (
              <img
                src={maid.profile_photo_url}
                alt={maid.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-medium">{maid?.full_name || 'Maid'}</p>
              {isAgencyManaged && (
                <Badge variant="outline" className="text-xs mt-1">
                  <Building2 className="w-3 h-3 mr-1" />
                  {agency?.full_name || 'Agency Managed'}
                </Badge>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Message option */}
            <Button
              variant="outline"
              className="w-full justify-start h-14 text-left"
              onClick={handleMessage}
              disabled={isInitiatingContact}
            >
              <MessageCircle className="w-5 h-5 mr-3 text-blue-600" />
              <div>
                <p className="font-medium">
                  Message {isAgencyManaged ? 'Agency' : 'Maid'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Send a message through the platform
                </p>
              </div>
            </Button>

            {/* WhatsApp option */}
            <Button
              variant="outline"
              className="w-full justify-start h-14 text-left"
              onClick={handleWhatsApp}
              disabled={!whatsappPhone || isInitiatingContact}
            >
              <WhatsAppIcon className="w-5 h-5 mr-3 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">
                  WhatsApp {isAgencyManaged ? 'Agency' : 'Maid'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {whatsappPhone ? 'Open WhatsApp chat' : 'Phone number not available'}
                </p>
              </div>
              {whatsappPhone && <ExternalLink className="w-4 h-4 text-gray-400" />}
            </Button>

            {/* Book Interview option */}
            <Button
              variant="outline"
              className="w-full justify-start h-14 text-left"
              onClick={handleBookInterview}
              disabled={isInitiatingContact}
            >
              <Calendar className="w-5 h-5 mr-3 text-purple-600" />
              <div>
                <p className="font-medium">Book Interview</p>
                <p className="text-xs text-muted-foreground">
                  Schedule an interview or meeting
                </p>
              </div>
            </Button>
          </div>

          {/* Cancel button */}
          <div className="flex justify-end mt-4 pt-4 border-t">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Request Dialog */}
      {showBookingDialog && (
        <BookingRequestDialog
          open={showBookingDialog}
          onOpenChange={handleBookingClose}
          maid={maid}
          agency={agency}
          onSuccess={handleBookingSuccess}
        />
      )}
    </>
  );
};

export default ContactActionPopup;
