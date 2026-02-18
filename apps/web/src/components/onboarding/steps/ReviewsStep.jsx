import React from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '@/context/OnboardingContext';
import StepCard from '../shared/StepCard';
import StepNavigation from '../shared/StepNavigation';
import {
  MessageSquare,
  Star,
  ThumbsUp,
  Award,
  TrendingUp,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Sample reviews data
const REVIEWS = [
  {
    id: 1,
    author: 'Sarah M.',
    avatar: 'S',
    rating: 5,
    date: '2 days ago',
    text: 'Found an amazing helper within a week! The verification process gave me confidence.',
    type: 'sponsor',
    helpful: 24,
  },
  {
    id: 2,
    author: 'Fatima A.',
    avatar: 'F',
    rating: 5,
    date: '5 days ago',
    text: 'Got my first job through this platform. Very professional and easy to use.',
    type: 'maid',
    helpful: 18,
  },
  {
    id: 3,
    author: 'Ahmed K.',
    avatar: 'A',
    rating: 4,
    date: '1 week ago',
    text: 'Great platform for managing our agency. The analytics are really helpful.',
    type: 'agency',
    helpful: 12,
  },
  {
    id: 4,
    author: 'Maria L.',
    avatar: 'M',
    rating: 5,
    date: '1 week ago',
    text: 'Love the secure messaging feature. Makes communication so much easier.',
    type: 'sponsor',
    helpful: 15,
  },
  {
    id: 5,
    author: 'Grace T.',
    avatar: 'G',
    rating: 5,
    date: '2 weeks ago',
    text: 'The profile creation was simple and my employer found me quickly.',
    type: 'maid',
    helpful: 20,
  },
];

// Rating summary
const RATING_SUMMARY = {
  average: 4.8,
  total: 12847,
  distribution: [
    { stars: 5, percentage: 78 },
    { stars: 4, percentage: 15 },
    { stars: 3, percentage: 5 },
    { stars: 2, percentage: 1 },
    { stars: 1, percentage: 1 },
  ],
};

const ReviewsStep = () => {
  const { userType, nextStep, previousStep, awardPoints } = useOnboarding();

  // Filter reviews relevant to user type (show all for variety)
  const displayReviews = REVIEWS.slice(0, 4);

  const handleContinue = () => {
    awardPoints(10, 'Reviewed platform ratings');
    nextStep();
  };

  return (
    <div className="space-y-4">
      <StepCard
        title="What Users Say"
        description="Real reviews from our community"
        icon={MessageSquare}
        showHeader={true}
      >
        <div className="mt-4 space-y-4">
          {/* Rating Overview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/20"
          >
            <div className="flex items-center gap-4">
              {/* Average rating */}
              <div className="text-center">
                <p className="text-4xl font-bold text-white">{RATING_SUMMARY.average}</p>
                <div className="flex gap-0.5 justify-center mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-4 h-4',
                        i < Math.floor(RATING_SUMMARY.average)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {RATING_SUMMARY.total.toLocaleString()} reviews
                </p>
              </div>

              {/* Distribution bars */}
              <div className="flex-1 space-y-1">
                {RATING_SUMMARY.distribution.map((item) => (
                  <div key={item.stars} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-3">{item.stars}</span>
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-8">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Review cards */}
          <div className="space-y-3">
            {displayReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white/5 rounded-lg p-3 border border-white/10"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {review.avatar}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{review.author}</span>
                        <span className="text-xs text-gray-500">{review.date}</span>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-3 h-3',
                              i < review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-600'
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Review text */}
                    <p className="text-gray-300 text-xs leading-relaxed">{review.text}</p>

                    {/* Helpful count */}
                    <div className="flex items-center gap-1 mt-2 text-gray-500">
                      <ThumbsUp className="w-3 h-3" />
                      <span className="text-xs">{review.helpful} found helpful</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-3 gap-2"
          >
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <Award className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Top Rated</p>
              <p className="text-gray-400 text-xs">Platform</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">Growing</p>
              <p className="text-gray-400 text-xs">Community</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 text-center">
              <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-white text-xs font-medium">98%</p>
              <p className="text-gray-400 text-xs">Satisfaction</p>
            </div>
          </motion.div>
        </div>
      </StepCard>

      <StepNavigation
        onNext={handleContinue}
        onPrevious={previousStep}
        nextLabel="Continue"
      />
    </div>
  );
};

export default ReviewsStep;
