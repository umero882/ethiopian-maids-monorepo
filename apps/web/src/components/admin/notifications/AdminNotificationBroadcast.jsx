/**
 * AdminNotificationBroadcast Component
 * Dialog for sending notifications from admin to users (forward notifications)
 */

import { useState, useCallback, useEffect } from 'react';
import { Send, Users, User, Building2, UserCheck, AlertCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { adminNotificationService } from '@/services/adminNotificationService';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { cn } from '@/lib/utils';

const TARGET_OPTIONS = [
  { value: 'all', label: 'All Users', icon: Users, description: 'Send to everyone on the platform' },
  { value: 'maids', label: 'All Maids', icon: UserCheck, description: 'Send to all registered maids' },
  { value: 'sponsors', label: 'All Sponsors', icon: User, description: 'Send to all sponsors' },
  { value: 'agencies', label: 'All Agencies', icon: Building2, description: 'Send to all agencies' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: 'text-gray-500' },
  { value: 'medium', label: 'Medium', color: 'text-blue-500' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
];

const NOTIFICATION_TEMPLATES = [
  {
    id: 'maintenance',
    title: 'Scheduled Maintenance',
    message: 'We will be performing scheduled maintenance on [DATE] from [START_TIME] to [END_TIME]. During this time, some features may be temporarily unavailable. We apologize for any inconvenience.',
    priority: 'high',
  },
  {
    id: 'feature',
    title: 'New Feature Available',
    message: 'We are excited to announce a new feature: [FEATURE_NAME]. [BRIEF_DESCRIPTION]. Check it out in your dashboard!',
    priority: 'medium',
  },
  {
    id: 'policy',
    title: 'Policy Update',
    message: 'We have updated our [POLICY_TYPE]. Please review the changes at your earliest convenience. The new policy will take effect on [DATE].',
    priority: 'medium',
  },
  {
    id: 'promotion',
    title: 'Special Offer',
    message: 'For a limited time, enjoy [DISCOUNT_DETAILS]. This offer is valid until [DATE]. Don\'t miss out!',
    priority: 'low',
  },
];

/**
 * AdminNotificationBroadcast Component
 */
export function AdminNotificationBroadcast({ open, onOpenChange }) {
  const { adminUser } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('compose');
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [target, setTarget] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [link, setLink] = useState('');

  // Estimated recipients
  const [estimatedCount, setEstimatedCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setMessage('');
      setPriority('medium');
      setLink('');
      setTarget('all');
      setShowPreview(false);
      setActiveTab('compose');
    }
  }, [open]);

  // Estimate recipient count when target changes
  useEffect(() => {
    const fetchCount = async () => {
      if (!target) return;

      setLoadingCount(true);
      try {
        let role = null;
        if (target === 'maids') role = 'maid';
        else if (target === 'sponsors') role = 'sponsor';
        else if (target === 'agencies') role = 'agency';

        if (role) {
          const result = await adminNotificationService.getUsersByRole(role);
          setEstimatedCount(result.data?.length || 0);
        } else if (target === 'all') {
          // Rough estimate - sum of all roles
          const [maids, sponsors, agencies] = await Promise.all([
            adminNotificationService.getUsersByRole('maid'),
            adminNotificationService.getUsersByRole('sponsor'),
            adminNotificationService.getUsersByRole('agency'),
          ]);
          setEstimatedCount(
            (maids.data?.length || 0) +
            (sponsors.data?.length || 0) +
            (agencies.data?.length || 0)
          );
        }
      } catch (err) {
        console.error('Error fetching count:', err);
      } finally {
        setLoadingCount(false);
      }
    };

    fetchCount();
  }, [target]);

  // Apply template
  const handleApplyTemplate = useCallback((template) => {
    setTitle(template.title);
    setMessage(template.message);
    setPriority(template.priority);
    setActiveTab('compose');
  }, []);

  // Send notification
  const handleSend = useCallback(async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a title and message',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // Get user IDs based on target
      let userIds = [];

      if (target === 'all') {
        const [maids, sponsors, agencies] = await Promise.all([
          adminNotificationService.getUsersByRole('maid'),
          adminNotificationService.getUsersByRole('sponsor'),
          adminNotificationService.getUsersByRole('agency'),
        ]);
        userIds = [
          ...(maids.data || []).map(u => u.id),
          ...(sponsors.data || []).map(u => u.id),
          ...(agencies.data || []).map(u => u.id),
        ];
      } else {
        let role = null;
        if (target === 'maids') role = 'maid';
        else if (target === 'sponsors') role = 'sponsor';
        else if (target === 'agencies') role = 'agency';

        if (role) {
          const result = await adminNotificationService.getUsersByRole(role);
          userIds = (result.data || []).map(u => u.id);
        }
      }

      if (userIds.length === 0) {
        toast({
          title: 'No Recipients',
          description: 'No users found for the selected target',
          variant: 'destructive',
        });
        setSending(false);
        return;
      }

      // Broadcast notification
      const result = await adminNotificationService.broadcastToUsers(userIds, {
        title: title.trim(),
        message: message.trim(),
        type: 'admin_announcement',
        priority,
        link: link.trim() || null,
      });

      if (result.error) {
        throw result.error;
      }

      toast({
        title: 'Notification Sent',
        description: `Successfully sent to ${result.data?.affected_rows || userIds.length} users`,
      });

      onOpenChange(false);
    } catch (err) {
      console.error('Error sending notification:', err);
      toast({
        title: 'Error',
        description: 'Failed to send notification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  }, [target, title, message, priority, link, onOpenChange]);

  const isValid = title.trim() && message.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            Broadcast Notification
          </DialogTitle>
          <DialogDescription>
            Send a notification to multiple users on the platform
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            <TabsContent value="compose" className="space-y-4 mt-4">
              {/* Target Selection */}
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TARGET_OPTIONS.map((option) => (
                    <Card
                      key={option.value}
                      className={cn(
                        'cursor-pointer transition-all hover:border-primary',
                        target === option.value && 'border-primary bg-primary/5'
                      )}
                      onClick={() => setTarget(option.value)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <option.icon className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium">{option.label}</p>
                          <p className="text-xs text-gray-500">{option.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {estimatedCount !== null && (
                  <p className="text-sm text-gray-500">
                    Estimated recipients: {loadingCount ? '...' : estimatedCount.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter notification title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
                <p className="text-xs text-gray-400">{title.length}/100 characters</p>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter notification message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-400">{message.length}/500 characters</p>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={option.color}>{option.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Link (optional) */}
              <div className="space-y-2">
                <Label htmlFor="link">Link (optional)</Label>
                <Input
                  id="link"
                  placeholder="/dashboard or https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
                <p className="text-xs text-gray-400">
                  Add a link for users to learn more or take action
                </p>
              </div>

              {/* Preview */}
              {isValid && (
                <Card className="border-dashed">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{title}</p>
                      {priority === 'urgent' && (
                        <Badge variant="destructive">Urgent</Badge>
                      )}
                      {priority === 'high' && (
                        <Badge className="bg-orange-500">High</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{message}</p>
                    {link && (
                      <p className="text-xs text-blue-600">{link}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="templates" className="space-y-3 mt-4">
              <p className="text-sm text-gray-500 mb-4">
                Select a template to quickly compose your notification
              </p>
              {NOTIFICATION_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleApplyTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {template.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {template.message}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!isValid || sending}
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send to {estimatedCount?.toLocaleString() || '...'} users
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AdminNotificationBroadcast;
