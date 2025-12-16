import React, { useEffect, useMemo, useState, useRef } from 'react';
import * as Icons from 'lucide-react';

const STORAGE_KEY = 'marquee_announcement_dismissed_v1';

// Fallback announcements
const DEFAULT_ANNOUNCEMENTS = [
  {
    id: '1',
    text: '1000+ Verified Domestic Workers Across GCC',
    icon: 'Users',
    color: 'text-blue-600',
    source: 'Platform',
  },
  {
    id: '2',
    text: '97% Successful Placement Rate This Month',
    icon: 'TrendingUp',
    color: 'text-green-600',
    source: 'Platform',
  },
  {
    id: '3',
    text: '24/7 Customer Support Now Available',
    icon: 'Headphones',
    color: 'text-purple-600',
    source: 'Platform',
  },
  {
    id: '4',
    text: 'Enhanced Search Features Now Live',
    icon: 'Sparkles',
    color: 'text-amber-600',
    source: 'Platform',
  },
  {
    id: '5',
    text: 'New Agencies Join Our Network Daily',
    icon: 'Award',
    color: 'text-red-600',
    source: 'Platform',
  },
];

const MarqueeAnnouncement = () => {
  const [dismissed, setDismissed] = useState(false);
  const [announcements] = useState(DEFAULT_ANNOUNCEMENTS);
  const marqueeRef = useRef(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'true') setDismissed(true);
    } catch (e) {
      console.warn('Marquee: unable to read dismissal flag');
    }
  }, []);

  // Force animation to start
  useEffect(() => {
    if (marqueeRef.current && !dismissed && announcements.length > 0) {
      console.log('[MarqueeAnnouncement] Starting animation with', announcements.length, 'items');
      // Force reflow to ensure animation starts
      marqueeRef.current.style.animation = 'none';
      marqueeRef.current.offsetHeight; // Force reflow
      setTimeout(() => {
        if (marqueeRef.current) {
          marqueeRef.current.style.animation = 'marqueeScroll 60s linear infinite';
          console.log('[MarqueeAnnouncement] Animation started');
        }
      }, 50);
    }
  }, [dismissed, announcements]);

  const loop = useMemo(() => {
    if (announcements.length === 0) return [];
    // Duplicate 4 times to create seamless scroll
    return [...announcements, ...announcements, ...announcements, ...announcements];
  }, [announcements]);

  if (dismissed) return null;
  if (announcements.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes marqueeScroll {
          from {
            transform: translateX(0%);
          }
          to {
            transform: translateX(-50%);
          }
        }

        .marquee-animate {
          animation: marqueeScroll 60s linear infinite !important;
          will-change: transform;
        }

        .marquee-animate:hover {
          animation-play-state: paused !important;
        }
      `}</style>

      <div role='region' aria-label='Latest Announcements' className='bg-gradient-to-r from-amber-50 via-amber-100/80 to-amber-50 border-b border-amber-200 shadow-sm'>
        <div className='relative overflow-hidden'>
          {/* Close button */}
          <div className='absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center gap-2'>
            <button
              type='button'
              onClick={() => {
                setDismissed(true);
                try { localStorage.setItem(STORAGE_KEY, 'true'); } catch (e) {
                  console.warn('Marquee: unable to persist dismissal');
                }
              }}
              aria-label='Dismiss announcements'
              className='p-1.5 text-amber-700 hover:text-amber-900 hover:bg-white/50 rounded-full transition-all duration-200'
            >
              <Icons.X className='w-4 h-4' />
            </button>
          </div>

          <div className='py-2 pr-16 overflow-hidden'>
            <div
              ref={marqueeRef}
              className='marquee-animate inline-flex items-center gap-6'
            >
              {loop.map((announcement, idx) => {
                const IconComponent = Icons[announcement.icon] || Icons.Info;

                return (
                  <div
                    key={`${announcement.id}-${idx}`}
                    className='inline-flex items-center gap-2.5 px-3 py-1.5 bg-white/60 border border-amber-200/60 rounded-lg hover:bg-white/80 hover:shadow-sm transition-all duration-200 flex-shrink-0 relative'
                    title={announcement.source}
                  >
                    {/* Icon */}
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full bg-white/80 ${announcement.color}`}>
                      <IconComponent className='w-3.5 h-3.5' />
                    </div>

                    {/* Text */}
                    <span className={`text-sm font-medium ${announcement.color} whitespace-nowrap`}>
                      {announcement.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gradient fade effects for smooth edges */}
          <div className='absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-amber-50 to-transparent pointer-events-none z-10'></div>
          <div className='absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-amber-50 to-transparent pointer-events-none z-10'></div>
        </div>
      </div>
    </>
  );
};

export default MarqueeAnnouncement;
