import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const StepCard = ({
  title,
  description,
  icon: Icon,
  children,
  className,
  headerClassName,
  contentClassName,
  showHeader = true,
  variant = 'default', // 'default' | 'glass' | 'solid'
}) => {
  const getCardStyles = () => {
    switch (variant) {
      case 'glass':
        return 'bg-white/10 backdrop-blur-lg border-white/20 shadow-xl';
      case 'solid':
        return 'bg-white shadow-lg border-gray-200';
      default:
        return 'bg-white/10 backdrop-blur-sm border-white/20';
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          title: 'text-gray-900',
          description: 'text-gray-600',
        };
      default:
        return {
          title: 'text-white',
          description: 'text-gray-200',
        };
    }
  };

  const textStyles = getTextStyles();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className={cn(getCardStyles(), className)}>
        {showHeader && (title || description || Icon) && (
          <CardHeader className={cn('text-center pb-4', headerClassName)}>
            {Icon && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="mx-auto mb-2"
              >
                <div className={cn(
                  'inline-flex items-center justify-center w-12 h-12 rounded-full',
                  variant === 'solid' ? 'bg-purple-100' : 'bg-white/20'
                )}>
                  <Icon className={cn(
                    'w-6 h-6',
                    variant === 'solid' ? 'text-purple-600' : 'text-white'
                  )} />
                </div>
              </motion.div>
            )}
            {title && (
              <CardTitle className={cn('text-xl sm:text-2xl', textStyles.title)}>
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className={cn('text-sm sm:text-base', textStyles.description)}>
                {description}
              </CardDescription>
            )}
          </CardHeader>
        )}
        <CardContent className={cn('pt-0', contentClassName)}>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Tip component for helpful hints
export const StepTip = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cn(
        'mt-4 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30',
        className
      )}
    >
      <p className="text-sm text-yellow-200 flex items-start gap-2">
        <span className="text-yellow-400 flex-shrink-0">💡</span>
        <span>{children}</span>
      </p>
    </motion.div>
  );
};

// Points display for steps that award points
export const StepPoints = ({ points, className }) => {
  if (!points) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/20 px-2 py-1 rounded-full',
        className
      )}
    >
      <span>+{points} pts</span>
    </motion.div>
  );
};

// Error message for validation
export const StepError = ({ message, className }) => {
  if (!message) return null;

  return (
    <motion.p
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('text-sm text-red-400 mt-1', className)}
    >
      {message}
    </motion.p>
  );
};

// Optional badge for skippable steps
export const OptionalBadge = ({ className }) => {
  return (
    <span className={cn(
      'text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30',
      className
    )}>
      Optional
    </span>
  );
};

export default StepCard;
