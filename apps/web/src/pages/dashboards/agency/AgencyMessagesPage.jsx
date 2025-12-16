/**
 * Agency Messages Page
 *
 * Uses the unified messaging component for consistent experience across all user types.
 * This replaces the old AgencyMessagingPage which used a different data approach.
 */

import React from 'react';
import UnifiedMessagesPage from '@/components/messaging/UnifiedMessagesPage';

const AgencyMessagesPage = () => {
  return <UnifiedMessagesPage userType="agency" />;
};

export default AgencyMessagesPage;
