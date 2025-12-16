/**
 * Account Manager AI Service
 *
 * Provides AI-powered chat assistance for placement workflow queries.
 * Detects user intents and provides relevant information about:
 * - Placement status
 * - Interview schedules
 * - Trial periods
 * - Platform fees
 * - Guarantee policies
 *
 * Can be integrated with external AI APIs (OpenAI, Anthropic) for natural language processing.
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { WORKFLOW_STATES } from './placementWorkflowService';

// ============================================================================
// GRAPHQL DOCUMENTS
// ============================================================================

const GET_USER_ACTIVE_WORKFLOWS = gql`
  query GetUserActiveWorkflows($userId: String!) {
    placement_workflows(
      where: {
        _or: [
          { sponsor_id: { _eq: $userId } }
          { agency_id: { _eq: $userId } }
        ]
        status: { _nin: ["placement_confirmed", "placement_failed"] }
      }
      order_by: { updated_at: desc }
    ) {
      id
      status
      sponsor_id
      agency_id
      maid_id
      contact_date
      interview_scheduled_date
      interview_completed_date
      trial_start_date
      trial_end_date
      sponsor_confirmed
      agency_confirmed
      platform_fee_amount
      platform_fee_currency
      guarantee_end_date
      created_at
      updated_at
      maid_profile {
        id
        full_name
        profile_photo_url
      }
      sponsor_profile {
        full_name
      }
      agency_profile {
        full_name
        business_name
      }
    }
  }
`;

const GET_USER_COMPLETED_PLACEMENTS = gql`
  query GetUserCompletedPlacements($userId: String!) {
    placement_workflows(
      where: {
        _or: [
          { sponsor_id: { _eq: $userId } }
          { agency_id: { _eq: $userId } }
        ]
        status: { _eq: "placement_confirmed" }
      }
      order_by: { placement_confirmed_date: desc }
      limit: 10
    ) {
      id
      placement_confirmed_date
      platform_fee_amount
      platform_fee_currency
      guarantee_end_date
      maid_profile {
        full_name
      }
    }
  }
`;

const GET_AGENCY_BALANCE = gql`
  query GetAgencyBalance($agencyId: String!) {
    agency_credits(where: { agency_id: { _eq: $agencyId } }) {
      total_credits
      available_credits
      reserved_credits
    }
  }
`;

// ============================================================================
// INTENT DETECTION
// ============================================================================

const INTENTS = {
  PLACEMENT_STATUS: 'placement_status',
  INTERVIEW_SCHEDULE: 'interview_schedule',
  TRIAL_STATUS: 'trial_status',
  FEE_INFO: 'fee_info',
  GUARANTEE_POLICY: 'guarantee_policy',
  BALANCE_INFO: 'balance_info',
  HOW_TO_HIRE: 'how_to_hire',
  CONTACT_SUPPORT: 'contact_support',
  GENERAL_GREETING: 'general_greeting',
  UNKNOWN: 'unknown',
};

/**
 * Pattern-based intent detection
 * In production, this could be replaced with an ML model or external AI API
 */
const INTENT_PATTERNS = {
  [INTENTS.PLACEMENT_STATUS]: [
    /\b(placement|hiring|status|progress|workflow|application)\b/i,
    /\bwhere (is|are) (my|the) (placement|application|hiring)\b/i,
    /\b(what|check).*(status|progress)\b/i,
  ],
  [INTENTS.INTERVIEW_SCHEDULE]: [
    /\b(interview|meeting|appointment|schedule)\b/i,
    /\bwhen (is|are) (my|the) interview\b/i,
    /\b(book|schedule|reschedule).*(interview|meeting)\b/i,
  ],
  [INTENTS.TRIAL_STATUS]: [
    /\b(trial|trial period|trial days|trial remaining)\b/i,
    /\bhow (many|much) (days|time).*(trial|left)\b/i,
    /\b(trial).*(end|expire|finish)\b/i,
  ],
  [INTENTS.FEE_INFO]: [
    /\b(fee|fees|cost|price|payment|charge)\b/i,
    /\bhow much (is|are|does)\b/i,
    /\b(platform|placement|service) fee\b/i,
    /\b500\b/,
  ],
  [INTENTS.GUARANTEE_POLICY]: [
    /\b(guarantee|warranty|replacement|policy)\b/i,
    /\b(90|ninety) days?\b/i,
    /\bwhat (if|happens).*(not work|fail|problem)\b/i,
  ],
  [INTENTS.BALANCE_INFO]: [
    /\b(balance|credits|wallet|deposit)\b/i,
    /\bhow much (do i have|in my)\b/i,
    /\b(my|agency) (balance|credits)\b/i,
  ],
  [INTENTS.HOW_TO_HIRE]: [
    /\bhow (do|can|to) (i|we) (hire|employ|get)\b/i,
    /\b(steps|process|guide).*(hire|hiring)\b/i,
    /\bwhat (is|are) the (steps|process)\b/i,
  ],
  [INTENTS.CONTACT_SUPPORT]: [
    /\b(support|help|contact|speak|talk).*(human|agent|person)\b/i,
    /\bi need (help|assistance|support)\b/i,
    /\b(call|email|reach).*(support|team)\b/i,
  ],
  [INTENTS.GENERAL_GREETING]: [
    /^(hi|hello|hey|good morning|good afternoon|good evening)\b/i,
    /\bhow are you\b/i,
  ],
};

/**
 * Detect intent from user query
 */
const detectIntent = (query) => {
  const normalizedQuery = query.toLowerCase().trim();

  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedQuery)) {
        return intent;
      }
    }
  }

  return INTENTS.UNKNOWN;
};

// ============================================================================
// RESPONSE GENERATORS
// ============================================================================

/**
 * Generate response for placement status query
 */
const generatePlacementStatusResponse = (workflows, userRole) => {
  if (!workflows || workflows.length === 0) {
    return {
      message: "You don't have any active placements at the moment. Would you like to browse available maids or learn about our hiring process?",
      suggestions: ['How to hire a maid', 'Browse maids', 'Contact support'],
    };
  }

  const statusDescriptions = {
    [WORKFLOW_STATES.CONTACT_INITIATED]: 'Contact initiated - waiting for response',
    [WORKFLOW_STATES.INTERVIEW_SCHEDULED]: 'Interview scheduled',
    [WORKFLOW_STATES.INTERVIEW_COMPLETED]: 'Interview completed - awaiting next steps',
    [WORKFLOW_STATES.TRIAL_STARTED]: 'Trial period in progress',
    [WORKFLOW_STATES.TRIAL_COMPLETED]: 'Trial completed - awaiting confirmation',
  };

  const placements = workflows.map((w) => {
    const maidName = w.maid_profile?.full_name || 'Maid';
    const status = statusDescriptions[w.status] || w.status;
    return `- ${maidName}: ${status}`;
  });

  return {
    message: `You have ${workflows.length} active placement(s):\n\n${placements.join('\n')}\n\nWould you like more details about any of these?`,
    suggestions: ['Trial status', 'Interview details', 'Fee information'],
    workflows,
  };
};

/**
 * Generate response for interview schedule query
 */
const generateInterviewResponse = (workflows) => {
  const interviewWorkflows = workflows.filter(
    (w) => w.status === WORKFLOW_STATES.INTERVIEW_SCHEDULED
  );

  if (interviewWorkflows.length === 0) {
    const pendingWorkflows = workflows.filter(
      (w) => w.status === WORKFLOW_STATES.CONTACT_INITIATED
    );

    if (pendingWorkflows.length > 0) {
      return {
        message: "You don't have any scheduled interviews yet. You have pending contacts that haven't been scheduled. Would you like to schedule an interview?",
        suggestions: ['Schedule interview', 'View pending contacts', 'Contact support'],
      };
    }

    return {
      message: "You don't have any scheduled interviews. Start by contacting a maid or agency to set up an interview.",
      suggestions: ['Browse maids', 'How to hire', 'Contact support'],
    };
  }

  const interviews = interviewWorkflows.map((w) => {
    const maidName = w.maid_profile?.full_name || 'Maid';
    const date = w.interview_scheduled_date
      ? new Date(w.interview_scheduled_date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Date pending';
    return `- ${maidName}: ${date}`;
  });

  return {
    message: `Your upcoming interviews:\n\n${interviews.join('\n')}\n\nRemember to prepare any questions you have for the candidate!`,
    suggestions: ['Reschedule interview', 'Interview tips', 'Cancel interview'],
    workflows: interviewWorkflows,
  };
};

/**
 * Generate response for trial status query
 */
const generateTrialStatusResponse = (workflows) => {
  const trialWorkflows = workflows.filter(
    (w) => w.status === WORKFLOW_STATES.TRIAL_STARTED || w.status === WORKFLOW_STATES.TRIAL_COMPLETED
  );

  if (trialWorkflows.length === 0) {
    return {
      message: "You don't have any active trial periods. Trials begin after the maid starts working and last for 3 days.",
      suggestions: ['Placement status', 'How trials work', 'Contact support'],
    };
  }

  const trials = trialWorkflows.map((w) => {
    const maidName = w.maid_profile?.full_name || 'Maid';

    if (w.status === WORKFLOW_STATES.TRIAL_COMPLETED) {
      const confirmationStatus = [];
      if (w.sponsor_confirmed) confirmationStatus.push('Sponsor confirmed');
      else confirmationStatus.push('Sponsor pending');
      if (w.agency_confirmed) confirmationStatus.push('Agency confirmed');
      else confirmationStatus.push('Agency pending');

      return `- ${maidName}: Trial completed - ${confirmationStatus.join(', ')}`;
    }

    const endDate = new Date(w.trial_end_date);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) {
      return `- ${maidName}: Trial ended - confirmation required`;
    }

    return `- ${maidName}: ${daysRemaining} day(s) remaining (ends ${endDate.toLocaleDateString()})`;
  });

  return {
    message: `Your trial period status:\n\n${trials.join('\n')}\n\nAfter the trial, both you and the agency must confirm the placement for it to be finalized.`,
    suggestions: ['Confirm placement', 'Report issue', 'Contact support'],
    workflows: trialWorkflows,
  };
};

/**
 * Generate response for fee information query
 */
const generateFeeInfoResponse = (userCountry = 'AE') => {
  const feeByCountry = {
    AE: { amount: 500, currency: 'AED' },
    SA: { amount: 510, currency: 'SAR' },
    KW: { amount: 42, currency: 'KWD' },
    QA: { amount: 495, currency: 'QAR' },
    BH: { amount: 51, currency: 'BHD' },
    OM: { amount: 53, currency: 'OMR' },
    DEFAULT: { amount: 136, currency: 'USD' },
  };

  const fee = feeByCountry[userCountry] || feeByCountry.DEFAULT;

  return {
    message: `**Platform Service Fee**\n\nThe placement fee is **${fee.amount} ${fee.currency}** (approximately 500 AED equivalent).\n\n**How it works:**\n1. Agencies must maintain this balance to receive inquiries\n2. The fee is held during the placement process\n3. On successful placement confirmation, the fee becomes platform revenue\n4. If placement fails, the agency can use the balance for the next placement\n\n**What you get:**\n- 90-day replacement guarantee\n- Verified maid profiles\n- Secure payment handling\n- 24/7 support`,
    suggestions: ['Guarantee policy', 'Payment methods', 'Contact support'],
  };
};

/**
 * Generate response for guarantee policy query
 */
const generateGuaranteePolicyResponse = () => {
  return {
    message: `**90-Day Replacement Guarantee**\n\nWe offer industry-standard protection for your peace of mind:\n\n**Coverage Period:**\n- 90 days from placement confirmation date\n\n**What's Covered:**\n- Maid leaving without notice\n- Performance issues after proper communication\n- Compatibility problems despite good faith efforts\n\n**How to Claim:**\n1. Report the issue through the app\n2. Our team will review within 24-48 hours\n3. If approved, we'll help find a replacement\n\n**Note:** The guarantee requires that you've followed proper employment practices and communicated issues during the trial period.`,
    suggestions: ['Report an issue', 'Trial period info', 'Contact support'],
  };
};

/**
 * Generate response for balance info query (agency only)
 */
const generateBalanceInfoResponse = async (agencyId) => {
  try {
    const { data } = await apolloClient.query({
      query: GET_AGENCY_BALANCE,
      variables: { agencyId },
      fetchPolicy: 'network-only',
    });

    const balance = data?.agency_credits?.[0];

    if (!balance) {
      return {
        message: "You don't have an agency balance account set up yet. Please contact support to get started.",
        suggestions: ['Contact support', 'Set up wallet', 'Fee information'],
      };
    }

    return {
      message: `**Your Agency Balance**\n\n- **Available:** ${balance.available_credits} credits\n- **Reserved:** ${balance.reserved_credits} credits\n- **Total:** ${balance.total_credits} credits\n\n${
        balance.available_credits < 500
          ? '**Note:** Your available balance is below 500. Please deposit to continue receiving new sponsor inquiries.'
          : 'Your balance is sufficient to receive new sponsor inquiries.'
      }`,
      suggestions: ['Add funds', 'Fee information', 'Transaction history'],
    };
  } catch (error) {
    console.error('Error fetching balance:', error);
    return {
      message: "I couldn't retrieve your balance information. Please try again or contact support.",
      suggestions: ['Try again', 'Contact support'],
    };
  }
};

/**
 * Generate response for how to hire query
 */
const generateHowToHireResponse = () => {
  return {
    message: `**How to Hire a Maid - Step by Step**\n\n**1. Browse & Select**\n- Browse verified maid profiles\n- Filter by skills, experience, salary\n- Watch video CVs\n\n**2. Contact**\n- Click "Hire Now" or "Contact Agency"\n- Choose: Message, WhatsApp, or Book Interview\n\n**3. Interview**\n- Schedule a video or in-person interview\n- Ask about experience, expectations\n- Discuss salary and terms\n\n**4. Trial Period (3 Days)**\n- Maid starts working on trial\n- Evaluate compatibility\n- Address any concerns early\n\n**5. Confirm Placement**\n- Both parties confirm satisfaction\n- Placement is finalized\n- 90-day guarantee begins\n\n**Cost:** Platform fee is 500 AED (or equivalent)`,
    suggestions: ['Browse maids', 'Fee information', 'Contact support'],
  };
};

/**
 * Generate response for contact support query
 */
const generateContactSupportResponse = () => {
  return {
    message: `**Contact Support**\n\nOur team is here to help!\n\n**Options:**\n- **Live Chat:** Click the support button in the app\n- **Email:** support@ethiopianmaids.com\n- **WhatsApp:** +971-XX-XXX-XXXX\n- **Phone:** Available 9 AM - 6 PM GST\n\n**Response Times:**\n- Urgent issues: Within 2 hours\n- General inquiries: Within 24 hours\n\nIs there anything specific I can help you with before connecting you to support?`,
    suggestions: ['Report issue', 'Billing question', 'Technical help'],
  };
};

/**
 * Generate response for general greeting
 */
const generateGreetingResponse = () => {
  const greetings = [
    "Hello! I'm your Account Manager assistant. I can help you with placement status, interviews, trials, fees, and more. What would you like to know?",
    "Hi there! How can I assist you today? I can help with your placements, schedule information, or answer questions about our services.",
    "Welcome! I'm here to help with your hiring journey. Ask me about your placement status, upcoming interviews, or how our process works.",
  ];

  return {
    message: greetings[Math.floor(Math.random() * greetings.length)],
    suggestions: ['Placement status', 'How to hire', 'Fee information', 'Contact support'],
  };
};

/**
 * Generate response for unknown intent
 */
const generateUnknownResponse = () => {
  return {
    message: "I'm not sure I understood your question. I can help you with:\n\n- **Placement status** - Check your active placements\n- **Interview schedules** - View or manage interviews\n- **Trial periods** - Check trial status and deadlines\n- **Fees** - Learn about platform fees\n- **Guarantee** - Understand our 90-day policy\n\nOr you can contact our support team for personal assistance.",
    suggestions: ['Placement status', 'Fee information', 'Contact support'],
  };
};

// ============================================================================
// MAIN SERVICE
// ============================================================================

export const accountManagerAIService = {
  /**
   * Process a user query and return an appropriate response
   */
  async processQuery(userId, query, userRole = 'sponsor', userCountry = 'AE') {
    const intent = detectIntent(query);

    // Fetch user's active workflows for context-aware responses
    let workflows = [];
    try {
      const { data } = await apolloClient.query({
        query: GET_USER_ACTIVE_WORKFLOWS,
        variables: { userId },
        fetchPolicy: 'network-only',
      });
      workflows = data?.placement_workflows || [];
    } catch (error) {
      console.error('Error fetching workflows:', error);
    }

    // Generate response based on intent
    switch (intent) {
      case INTENTS.PLACEMENT_STATUS:
        return generatePlacementStatusResponse(workflows, userRole);

      case INTENTS.INTERVIEW_SCHEDULE:
        return generateInterviewResponse(workflows);

      case INTENTS.TRIAL_STATUS:
        return generateTrialStatusResponse(workflows);

      case INTENTS.FEE_INFO:
        return generateFeeInfoResponse(userCountry);

      case INTENTS.GUARANTEE_POLICY:
        return generateGuaranteePolicyResponse();

      case INTENTS.BALANCE_INFO:
        if (userRole === 'agency') {
          return await generateBalanceInfoResponse(userId);
        }
        return {
          message: 'Balance information is available for agency accounts. As a sponsor, you can view your payment history in your account settings.',
          suggestions: ['Payment history', 'Fee information', 'Contact support'],
        };

      case INTENTS.HOW_TO_HIRE:
        return generateHowToHireResponse();

      case INTENTS.CONTACT_SUPPORT:
        return generateContactSupportResponse();

      case INTENTS.GENERAL_GREETING:
        return generateGreetingResponse();

      default:
        return generateUnknownResponse();
    }
  },

  /**
   * Get quick action suggestions based on user's current state
   */
  async getQuickActions(userId, userRole = 'sponsor') {
    try {
      const { data } = await apolloClient.query({
        query: GET_USER_ACTIVE_WORKFLOWS,
        variables: { userId },
        fetchPolicy: 'network-only',
      });

      const workflows = data?.placement_workflows || [];
      const actions = [];

      // Check for pending confirmations
      const pendingConfirmations = workflows.filter(
        (w) => w.status === WORKFLOW_STATES.TRIAL_COMPLETED
      );
      if (pendingConfirmations.length > 0) {
        actions.push({
          type: 'confirm_placement',
          label: 'Confirm Placement',
          priority: 'high',
          count: pendingConfirmations.length,
        });
      }

      // Check for upcoming interviews
      const upcomingInterviews = workflows.filter(
        (w) => w.status === WORKFLOW_STATES.INTERVIEW_SCHEDULED
      );
      if (upcomingInterviews.length > 0) {
        actions.push({
          type: 'view_interviews',
          label: 'View Interviews',
          priority: 'medium',
          count: upcomingInterviews.length,
        });
      }

      // Check for active trials
      const activeTrials = workflows.filter(
        (w) => w.status === WORKFLOW_STATES.TRIAL_STARTED
      );
      if (activeTrials.length > 0) {
        actions.push({
          type: 'check_trial',
          label: 'Check Trial Status',
          priority: 'medium',
          count: activeTrials.length,
        });
      }

      // Default actions if nothing pending
      if (actions.length === 0) {
        actions.push(
          { type: 'browse_maids', label: 'Browse Maids', priority: 'low' },
          { type: 'view_favorites', label: 'View Favorites', priority: 'low' }
        );
      }

      return actions;
    } catch (error) {
      console.error('Error getting quick actions:', error);
      return [
        { type: 'browse_maids', label: 'Browse Maids', priority: 'low' },
        { type: 'contact_support', label: 'Contact Support', priority: 'low' },
      ];
    }
  },

  /**
   * Intent detection (exposed for testing)
   */
  detectIntent,

  /**
   * Available intents (exposed for reference)
   */
  INTENTS,
};

export default accountManagerAIService;
