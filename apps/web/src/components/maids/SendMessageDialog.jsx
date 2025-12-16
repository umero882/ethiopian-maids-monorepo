/**
 * SendMessageDialog - Dialog for sending messages to maids
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { messageService } from '@/services/messageService';
import {
  Send,
  Loader2,
  MessageCircle,
  User,
  CheckCircle,
} from 'lucide-react';

const SendMessageDialog = ({ open, onClose, maid, user }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter a message to send.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await messageService.sendMessage({
        senderId: user.uid,
        recipientId: maid.id,
        subject: subject.trim() || `Message from ${user.displayName || 'Sponsor'}`,
        content: message.trim(),
        messageType: 'inquiry',
      });

      if (error) throw error;

      setSent(true);
      toast({
        title: 'Message Sent',
        description: `Your message has been sent to ${maid.full_name || 'the maid'}.`,
      });

      // Reset and close after a short delay
      setTimeout(() => {
        setSubject('');
        setMessage('');
        setSent(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error sending message:', err);
      toast({
        title: 'Failed to Send',
        description: 'Could not send your message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setSubject('');
      setMessage('');
      setSent(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-600" />
            Send Message
          </DialogTitle>
          <DialogDescription>
            Send a message to {maid?.full_name || 'this maid'}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-8 text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
            <p className="text-gray-600">
              Your message has been delivered to {maid?.full_name || 'the maid'}.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Recipient Info */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {maid?.profile_photo_url ? (
                <img
                  src={maid.profile_photo_url}
                  alt={maid.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">{maid?.full_name || 'Maid'}</p>
                <p className="text-sm text-gray-500">
                  {maid?.primary_profession || maid?.nationality || 'Domestic Worker'}
                </p>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                placeholder="e.g., Inquiry about availability"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={sending}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                placeholder="Write your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={sending}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                {message.length}/1000 characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleSend}
                disabled={sending || !message.trim()}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SendMessageDialog;
