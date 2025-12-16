/**
 * PlacementConfirmationDialog Component
 *
 * Dialog for sponsors and agencies to confirm or reject a placement
 * after the 3-day trial period ends.
 *
 * Both parties must confirm for the placement to be finalized.
 * Shows countdown timer during trial and confirmation status.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building2,
  AlertTriangle,
  Loader2,
  Calendar,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { placementWorkflowService, WORKFLOW_STATES } from '@/services/placementWorkflowService';
import { toast } from '@/components/ui/use-toast';

const PlacementConfirmationDialog = ({
  isOpen,
  onClose,
  workflow,
  userRole, // 'sponsor' or 'agency'
  onConfirm,
  onReject,
}) => {
  const { user } = useAuth();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Calculate time remaining in trial
  useEffect(() => {
    if (workflow?.trial_end_date && workflow?.status === WORKFLOW_STATES.TRIAL_STARTED) {
      const updateTimer = () => {
        const now = new Date();
        const end = new Date(workflow.trial_end_date);
        const diff = end - now;

        if (diff <= 0) {
          setTimeRemaining({ days: 0, hours: 0, minutes: 0, expired: true });
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeRemaining({ days, hours, minutes, expired: false });
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [workflow]);

  // Get confirmation status
  const isSponsorConfirmed = workflow?.sponsor_confirmed;
  const isAgencyConfirmed = workflow?.agency_confirmed;
  const hasUserConfirmed = userRole === 'sponsor' ? isSponsorConfirmed : isAgencyConfirmed;
  const hasOtherPartyConfirmed = userRole === 'sponsor' ? isAgencyConfirmed : isSponsorConfirmed;
  const isTrialEnded = timeRemaining?.expired || workflow?.status === WORKFLOW_STATES.TRIAL_COMPLETED;

  // Handle confirmation
  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      if (userRole === 'sponsor') {
        await placementWorkflowService.sponsorConfirm(workflow.id);
      } else {
        await placementWorkflowService.agencyConfirm(workflow.id);
      }

      toast({
        title: 'Confirmation Submitted',
        description: hasOtherPartyConfirmed
          ? 'Placement confirmed! The maid has been marked as hired.'
          : 'Waiting for the other party to confirm.',
      });

      if (onConfirm) {
        onConfirm();
      }

      onClose();
    } catch (error) {
      console.error('Error confirming placement:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm placement. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // Handle rejection
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejecting the placement.',
        variant: 'warning',
      });
      return;
    }

    setIsRejecting(true);
    try {
      await placementWorkflowService.failPlacement(workflow.id, rejectReason);

      toast({
        title: 'Placement Rejected',
        description: 'The placement has been cancelled and the maid is now available.',
      });

      if (onReject) {
        onReject();
      }

      onClose();
    } catch (error) {
      console.error('Error rejecting placement:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject placement. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Placement Confirmation
          </DialogTitle>
          <DialogDescription>
            {isTrialEnded
              ? 'The trial period has ended. Please confirm or reject this placement.'
              : 'Review the trial progress and confirm when ready.'}
          </DialogDescription>
        </DialogHeader>

        {/* Trial countdown */}
        {workflow?.status === WORKFLOW_STATES.TRIAL_STARTED && timeRemaining && !timeRemaining.expired && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="font-medium text-orange-800">Trial Period Active</span>
            </div>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <span className="text-2xl font-bold text-orange-600">{timeRemaining.days}</span>
                <p className="text-xs text-orange-600">Days</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-orange-600">{timeRemaining.hours}</span>
                <p className="text-xs text-orange-600">Hours</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-orange-600">{timeRemaining.minutes}</span>
                <p className="text-xs text-orange-600">Minutes</p>
              </div>
            </div>
            <p className="text-sm text-orange-700 mt-2 text-center">
              Ends on {formatDate(workflow.trial_end_date)}
            </p>
          </div>
        )}

        {/* Trial ended notice */}
        {isTrialEnded && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">Trial Period Ended</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Please confirm if the placement was successful.
            </p>
          </div>
        )}

        {/* Maid info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            {workflow?.maid_profile?.profile_photo_url ? (
              <img
                src={workflow.maid_profile.profile_photo_url}
                alt={workflow.maid_profile.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-medium">{workflow?.maid_profile?.full_name || 'Maid'}</p>
              <p className="text-sm text-muted-foreground">
                Trial started: {formatDate(workflow?.trial_start_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Confirmation status */}
        <div className="space-y-3 mb-4">
          <h4 className="font-medium text-sm text-muted-foreground">Confirmation Status</h4>

          {/* Sponsor status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span>Sponsor</span>
            </div>
            {isSponsorConfirmed ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle className="w-3 h-3 mr-1" />
                Confirmed
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>

          {/* Agency status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              <span>Agency</span>
            </div>
            {isAgencyConfirmed ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                <CheckCircle className="w-3 h-3 mr-1" />
                Confirmed
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
        </div>

        {/* Platform fee info */}
        {workflow?.platform_fee_amount && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-purple-800">
              <strong>Platform Fee:</strong> {workflow.platform_fee_amount} {workflow.platform_fee_currency}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              This fee will be charged upon successful confirmation by both parties.
            </p>
          </div>
        )}

        {/* Already confirmed message */}
        {hasUserConfirmed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">You have confirmed this placement</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              {hasOtherPartyConfirmed
                ? 'Both parties have confirmed. The maid is now marked as hired!'
                : 'Waiting for the other party to confirm.'}
            </p>
          </div>
        )}

        {/* Reject form */}
        {showRejectForm && !hasUserConfirmed && (
          <div className="space-y-3 mb-4">
            <Label htmlFor="rejectReason">Reason for Rejection</Label>
            <Textarea
              id="rejectReason"
              placeholder="Please explain why this placement didn't work out..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {/* Action buttons */}
        <DialogFooter className="flex gap-2">
          {!hasUserConfirmed ? (
            <>
              {showRejectForm ? (
                <>
                  <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                    Back
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isRejecting || !rejectReason.trim()}
                  >
                    {isRejecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-2" />
                        Confirm Rejection
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setShowRejectForm(true)}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Placement
                      </>
                    )}
                  </Button>
                </>
              )}
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlacementConfirmationDialog;
