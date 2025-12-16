/**
 * Terms Modal Component
 *
 * Full-screen modal for displaying Terms of Service and Privacy Policy.
 * Synced with mobile app implementation.
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Shield, X } from 'lucide-react';

const TermsModal = ({
  open,
  onClose,
  title = 'Terms of Service',
  content,
  type = 'terms', // 'terms' | 'privacy'
}) => {
  const Icon = type === 'privacy' ? Shield : FileText;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Icon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Please read carefully before accepting
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 py-4 max-h-[60vh]">
          <div className="prose prose-sm max-w-none px-1">
            <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
              {content}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onClose(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsModal;
