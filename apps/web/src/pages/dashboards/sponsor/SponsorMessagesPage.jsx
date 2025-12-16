/**
 * Sponsor Messages Page
 *
 * Uses the unified messaging component for consistent experience across all user types.
 */

import React from 'react';
import UnifiedMessagesPage from '@/components/messaging/UnifiedMessagesPage';

const SponsorMessagesPage = () => {
  return <UnifiedMessagesPage userType="sponsor" />;
};

export default SponsorMessagesPage;
