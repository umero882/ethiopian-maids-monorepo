import React from 'react';
import { cn } from '@/lib/utils';

// Base skeleton pulse
const Skeleton = ({ className, ...props }) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />
);

// Card skeleton
const CardSkeleton = ({ className }) => (
  <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)}>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex gap-2 mt-4">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

// Table skeleton
const TableSkeleton = ({ rows = 5, cols = 4, className }) => (
  <div className={cn("rounded-lg border", className)}>
    <div className="p-4 border-b bg-muted/30">
      <div className="flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="p-4 border-b last:border-0">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Profile card skeleton
const ProfileCardSkeleton = ({ className }) => (
  <div className={cn("rounded-lg border bg-card p-6", className)}>
    <div className="flex items-center gap-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

// Dashboard stats skeleton
const DashboardStatsSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    ))}
  </div>
);

// Grid skeleton (for maid cards, job cards, etc.)
const GridSkeleton = ({ count = 6, cols = 3, className }) => (
  <div className={cn(`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-4`, className)}>
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);

// Chat/message skeleton
const MessageListSkeleton = ({ count = 5 }) => (
  <div className="space-y-4 p-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={cn("flex gap-3", i % 2 === 0 ? "" : "justify-end")}>
        {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />}
        <div className={cn("space-y-1", i % 2 === 0 ? "" : "items-end")}>
          <Skeleton className={cn("h-16 rounded-lg", i % 2 === 0 ? "w-48" : "w-36")} />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
);

// Form skeleton
const FormSkeleton = ({ fields = 4 }) => (
  <div className="space-y-6">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <Skeleton className="h-10 w-32" />
  </div>
);

export {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  ProfileCardSkeleton,
  DashboardStatsSkeleton,
  GridSkeleton,
  MessageListSkeleton,
  FormSkeleton,
};

export default Skeleton;
