import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshCw, Trash2, Clock, CheckCircle } from 'lucide-react';
import { USER_TYPE_THEMES } from '@/data/onboardingConfig';

const DraftRecoveryModal = ({
  isOpen,
  onContinue,
  onStartFresh,
  draftData,
}) => {
  if (!isOpen || !draftData) return null;

  const theme = draftData.userType ? USER_TYPE_THEMES[draftData.userType] : null;
  const progressPercentage = draftData.currentStep && draftData.totalSteps
    ? Math.round((draftData.currentStep / draftData.totalSteps) * 100)
    : 0;

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md"
          >
            <Card className="bg-white/95 backdrop-blur-lg shadow-2xl border-0">
              <CardHeader className="text-center pb-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="mx-auto mb-3"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100">
                    <RefreshCw className="w-8 h-8 text-purple-600" />
                  </div>
                </motion.div>
                <CardTitle className="text-xl text-gray-900">
                  Continue Where You Left Off?
                </CardTitle>
                <CardDescription className="text-gray-600">
                  We found an unfinished registration
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Draft summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {/* User type */}
                  {theme && (
                    <div className="flex items-center gap-3">
                      <img
                        src={theme.icon}
                        alt={theme.label}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{theme.label}</p>
                        <p className="text-sm text-gray-500">Account type</p>
                      </div>
                    </div>
                  )}

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium text-gray-900">{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Points earned */}
                  {draftData.gamification?.points > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-gray-600">
                        {draftData.gamification.points} points earned
                      </span>
                    </div>
                  )}

                  {/* Last saved */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Last saved {formatTimeAgo(draftData.gamification?.startedAt)}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={onContinue}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                    size="lg"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Continue Registration
                  </Button>

                  <Button
                    onClick={onStartFresh}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Start Fresh
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-500">
                  Your progress is saved for 7 days
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DraftRecoveryModal;
