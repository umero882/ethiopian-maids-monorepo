/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* Auto-generated file - types are defined in graphql.ts */
import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;

export const OnNewApplicationsDocument = gql`
    subscription OnNewApplications($sponsorId: uuid!) {
  applications(
    where: {job: {sponsor_id: {_eq: $sponsorId}}}
    order_by: {created_at: desc}
    limit: 10
  ) {
    id
    status
    application_status
    cover_letter
    created_at
    updated_at
    job {
      id
      title
      status
    }
    maid_profile {
      id
      full_name
    }
  }
}
    `;

/**
 * __useOnNewApplicationsSubscription__
 *
 * To run a query within a React component, call `useOnNewApplicationsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnNewApplicationsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnNewApplicationsSubscription({
 *   variables: {
 *      sponsorId: // value for 'sponsorId'
 *   },
 * });
 */
export function useOnNewApplicationsSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnNewApplicationsSubscription, OnNewApplicationsSubscriptionVariables> & ({ variables: OnNewApplicationsSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnNewApplicationsSubscription, OnNewApplicationsSubscriptionVariables>(OnNewApplicationsDocument, options);
      }
export type OnNewApplicationsSubscriptionHookResult = ReturnType<typeof useOnNewApplicationsSubscription>;
export type OnNewApplicationsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnNewApplicationsSubscription>;
export const OnApplicationStatusChangeDocument = gql`
    subscription OnApplicationStatusChange($maidId: uuid!) {
  applications(
    where: {maid_id: {_eq: $maidId}}
    order_by: {updated_at: desc}
    limit: 10
  ) {
    id
    status
    application_status
    notes
    updated_at
    job {
      id
      title
    }
  }
}
    `;

/**
 * __useOnApplicationStatusChangeSubscription__
 *
 * To run a query within a React component, call `useOnApplicationStatusChangeSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnApplicationStatusChangeSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnApplicationStatusChangeSubscription({
 *   variables: {
 *      maidId: // value for 'maidId'
 *   },
 * });
 */
export function useOnApplicationStatusChangeSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnApplicationStatusChangeSubscription, OnApplicationStatusChangeSubscriptionVariables> & ({ variables: OnApplicationStatusChangeSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnApplicationStatusChangeSubscription, OnApplicationStatusChangeSubscriptionVariables>(OnApplicationStatusChangeDocument, options);
      }
export type OnApplicationStatusChangeSubscriptionHookResult = ReturnType<typeof useOnApplicationStatusChangeSubscription>;
export type OnApplicationStatusChangeSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnApplicationStatusChangeSubscription>;
export const OnBookingUpdatesDocument = gql`
    subscription OnBookingUpdates($sponsorId: uuid!) {
  bookings(
    where: {sponsor_id: {_eq: $sponsorId}}
    order_by: {updated_at: desc}
    limit: 10
  ) {
    id
    status
    start_date
    end_date
    salary_amount
    salary_currency
    updated_at
    maid_profile {
      id
      full_name
    }
  }
}
    `;

/**
 * __useOnBookingUpdatesSubscription__
 *
 * To run a query within a React component, call `useOnBookingUpdatesSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnBookingUpdatesSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnBookingUpdatesSubscription({
 *   variables: {
 *      sponsorId: // value for 'sponsorId'
 *   },
 * });
 */
export function useOnBookingUpdatesSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnBookingUpdatesSubscription, OnBookingUpdatesSubscriptionVariables> & ({ variables: OnBookingUpdatesSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnBookingUpdatesSubscription, OnBookingUpdatesSubscriptionVariables>(OnBookingUpdatesDocument, options);
      }
export type OnBookingUpdatesSubscriptionHookResult = ReturnType<typeof useOnBookingUpdatesSubscription>;
export type OnBookingUpdatesSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnBookingUpdatesSubscription>;
export const OnBookingRequestsDocument = gql`
    subscription OnBookingRequests($maidId: uuid!) {
  bookings(
    where: {maid_id: {_eq: $maidId}}
    order_by: {created_at: desc}
    limit: 10
  ) {
    id
    status
    start_date
    end_date
    salary_amount
    salary_currency
    created_at
    profile {
      id
      email
    }
  }
}
    `;

/**
 * __useOnBookingRequestsSubscription__
 *
 * To run a query within a React component, call `useOnBookingRequestsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnBookingRequestsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnBookingRequestsSubscription({
 *   variables: {
 *      maidId: // value for 'maidId'
 *   },
 * });
 */
export function useOnBookingRequestsSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnBookingRequestsSubscription, OnBookingRequestsSubscriptionVariables> & ({ variables: OnBookingRequestsSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnBookingRequestsSubscription, OnBookingRequestsSubscriptionVariables>(OnBookingRequestsDocument, options);
      }
export type OnBookingRequestsSubscriptionHookResult = ReturnType<typeof useOnBookingRequestsSubscription>;
export type OnBookingRequestsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnBookingRequestsSubscription>;
export const OnJobInteractionsDocument = gql`
    subscription OnJobInteractions($sponsorId: uuid!) {
  jobs(
    where: {sponsor_id: {_eq: $sponsorId}, status: {_eq: "active"}}
    order_by: {updated_at: desc}
  ) {
    id
    title
    status
    views_count
    applications_count
    updated_at
    applications_aggregate {
      aggregate {
        count
      }
    }
  }
}
    `;

/**
 * __useOnJobInteractionsSubscription__
 *
 * To run a query within a React component, call `useOnJobInteractionsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnJobInteractionsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnJobInteractionsSubscription({
 *   variables: {
 *      sponsorId: // value for 'sponsorId'
 *   },
 * });
 */
export function useOnJobInteractionsSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnJobInteractionsSubscription, OnJobInteractionsSubscriptionVariables> & ({ variables: OnJobInteractionsSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnJobInteractionsSubscription, OnJobInteractionsSubscriptionVariables>(OnJobInteractionsDocument, options);
      }
export type OnJobInteractionsSubscriptionHookResult = ReturnType<typeof useOnJobInteractionsSubscription>;
export type OnJobInteractionsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnJobInteractionsSubscription>;
export const OnAgencyMaidStatsDocument = gql`
    subscription OnAgencyMaidStats($agencyId: uuid!) {
  maid_profiles_aggregate(where: {agency_id: {_eq: $agencyId}}) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useOnAgencyMaidStatsSubscription__
 *
 * To run a query within a React component, call `useOnAgencyMaidStatsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnAgencyMaidStatsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnAgencyMaidStatsSubscription({
 *   variables: {
 *      agencyId: // value for 'agencyId'
 *   },
 * });
 */
export function useOnAgencyMaidStatsSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnAgencyMaidStatsSubscription, OnAgencyMaidStatsSubscriptionVariables> & ({ variables: OnAgencyMaidStatsSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnAgencyMaidStatsSubscription, OnAgencyMaidStatsSubscriptionVariables>(OnAgencyMaidStatsDocument, options);
      }
export type OnAgencyMaidStatsSubscriptionHookResult = ReturnType<typeof useOnAgencyMaidStatsSubscription>;
export type OnAgencyMaidStatsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnAgencyMaidStatsSubscription>;
export const OnNewReviewsDocument = gql`
    subscription OnNewReviews($maidId: uuid!) {
  reviews(
    where: {maid_id: {_eq: $maidId}}
    order_by: {created_at: desc}
    limit: 5
  ) {
    id
    rating
    comment
    created_at
    sponsor_id
  }
}
    `;

/**
 * __useOnNewReviewsSubscription__
 *
 * To run a query within a React component, call `useOnNewReviewsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnNewReviewsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnNewReviewsSubscription({
 *   variables: {
 *      maidId: // value for 'maidId'
 *   },
 * });
 */
export function useOnNewReviewsSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnNewReviewsSubscription, OnNewReviewsSubscriptionVariables> & ({ variables: OnNewReviewsSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnNewReviewsSubscription, OnNewReviewsSubscriptionVariables>(OnNewReviewsDocument, options);
      }
export type OnNewReviewsSubscriptionHookResult = ReturnType<typeof useOnNewReviewsSubscription>;
export type OnNewReviewsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnNewReviewsSubscription>;
export const OnNewMessagesDocument = gql`
    subscription OnNewMessages($userId: String!) {
  messages(
    where: {_or: [{receiver_id: {_eq: $userId}}, {sender_id: {_eq: $userId}}]}
    order_by: {created_at: desc}
    limit: 50
  ) {
    id
    content
    sender_id
    receiver_id
    read
    created_at
  }
}
    `;

/**
 * __useOnNewMessagesSubscription__
 *
 * To run a query within a React component, call `useOnNewMessagesSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnNewMessagesSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnNewMessagesSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useOnNewMessagesSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnNewMessagesSubscription, OnNewMessagesSubscriptionVariables> & ({ variables: OnNewMessagesSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnNewMessagesSubscription, OnNewMessagesSubscriptionVariables>(OnNewMessagesDocument, options);
      }
export type OnNewMessagesSubscriptionHookResult = ReturnType<typeof useOnNewMessagesSubscription>;
export type OnNewMessagesSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnNewMessagesSubscription>;
export const OnConversationMessagesDocument = gql`
    subscription OnConversationMessages($userId: String!, $otherUserId: String!) {
  messages(
    where: {_or: [{_and: [{sender_id: {_eq: $userId}}, {receiver_id: {_eq: $otherUserId}}]}, {_and: [{sender_id: {_eq: $otherUserId}}, {receiver_id: {_eq: $userId}}]}]}
    order_by: {created_at: asc}
  ) {
    id
    content
    sender_id
    receiver_id
    read
    created_at
  }
}
    `;

/**
 * __useOnConversationMessagesSubscription__
 *
 * To run a query within a React component, call `useOnConversationMessagesSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnConversationMessagesSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnConversationMessagesSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *      otherUserId: // value for 'otherUserId'
 *   },
 * });
 */
export function useOnConversationMessagesSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnConversationMessagesSubscription, OnConversationMessagesSubscriptionVariables> & ({ variables: OnConversationMessagesSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnConversationMessagesSubscription, OnConversationMessagesSubscriptionVariables>(OnConversationMessagesDocument, options);
      }
export type OnConversationMessagesSubscriptionHookResult = ReturnType<typeof useOnConversationMessagesSubscription>;
export type OnConversationMessagesSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnConversationMessagesSubscription>;
export const OnUnreadMessageCountDocument = gql`
    subscription OnUnreadMessageCount($userId: String!) {
  messages_aggregate(where: {receiver_id: {_eq: $userId}, read: {_eq: false}}) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useOnUnreadMessageCountSubscription__
 *
 * To run a query within a React component, call `useOnUnreadMessageCountSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnUnreadMessageCountSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnUnreadMessageCountSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useOnUnreadMessageCountSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnUnreadMessageCountSubscription, OnUnreadMessageCountSubscriptionVariables> & ({ variables: OnUnreadMessageCountSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnUnreadMessageCountSubscription, OnUnreadMessageCountSubscriptionVariables>(OnUnreadMessageCountDocument, options);
      }
export type OnUnreadMessageCountSubscriptionHookResult = ReturnType<typeof useOnUnreadMessageCountSubscription>;
export type OnUnreadMessageCountSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnUnreadMessageCountSubscription>;
export const OnNewNotificationDocument = gql`
    subscription OnNewNotification($userId: String!) {
  notifications(
    where: {user_id: {_eq: $userId}}
    order_by: {created_at: desc}
    limit: 1
  ) {
    id
    type
    title
    message
    link
    action_url
    related_id
    related_type
    read
    priority
    created_at
    expires_at
  }
}
    `;

/**
 * __useOnNewNotificationSubscription__
 *
 * To run a query within a React component, call `useOnNewNotificationSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnNewNotificationSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnNewNotificationSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useOnNewNotificationSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnNewNotificationSubscription, OnNewNotificationSubscriptionVariables> & ({ variables: OnNewNotificationSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnNewNotificationSubscription, OnNewNotificationSubscriptionVariables>(OnNewNotificationDocument, options);
      }
export type OnNewNotificationSubscriptionHookResult = ReturnType<typeof useOnNewNotificationSubscription>;
export type OnNewNotificationSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnNewNotificationSubscription>;
export const OnNotificationsUpdatedDocument = gql`
    subscription OnNotificationsUpdated($userId: String!, $limit: Int = 20) {
  notifications(
    where: {user_id: {_eq: $userId}, _or: [{expires_at: {_is_null: true}}, {expires_at: {_gt: "now()"}}]}
    order_by: {created_at: desc}
    limit: $limit
  ) {
    id
    type
    title
    message
    link
    action_url
    related_id
    related_type
    read
    read_at
    priority
    created_at
    expires_at
  }
}
    `;

/**
 * __useOnNotificationsUpdatedSubscription__
 *
 * To run a query within a React component, call `useOnNotificationsUpdatedSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnNotificationsUpdatedSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnNotificationsUpdatedSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useOnNotificationsUpdatedSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnNotificationsUpdatedSubscription, OnNotificationsUpdatedSubscriptionVariables> & ({ variables: OnNotificationsUpdatedSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnNotificationsUpdatedSubscription, OnNotificationsUpdatedSubscriptionVariables>(OnNotificationsUpdatedDocument, options);
      }
export type OnNotificationsUpdatedSubscriptionHookResult = ReturnType<typeof useOnNotificationsUpdatedSubscription>;
export type OnNotificationsUpdatedSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnNotificationsUpdatedSubscription>;
export const OnUnreadNotificationCountDocument = gql`
    subscription OnUnreadNotificationCount($userId: String!) {
  notifications_aggregate(
    where: {user_id: {_eq: $userId}, read: {_eq: false}, _or: [{expires_at: {_is_null: true}}, {expires_at: {_gt: "now()"}}]}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useOnUnreadNotificationCountSubscription__
 *
 * To run a query within a React component, call `useOnUnreadNotificationCountSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnUnreadNotificationCountSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnUnreadNotificationCountSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useOnUnreadNotificationCountSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnUnreadNotificationCountSubscription, OnUnreadNotificationCountSubscriptionVariables> & ({ variables: OnUnreadNotificationCountSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnUnreadNotificationCountSubscription, OnUnreadNotificationCountSubscriptionVariables>(OnUnreadNotificationCountDocument, options);
      }
export type OnUnreadNotificationCountSubscriptionHookResult = ReturnType<typeof useOnUnreadNotificationCountSubscription>;
export type OnUnreadNotificationCountSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnUnreadNotificationCountSubscription>;
export const OnUrgentNotificationsDocument = gql`
    subscription OnUrgentNotifications($userId: String!) {
  notifications(
    where: {user_id: {_eq: $userId}, read: {_eq: false}, priority: {_in: ["urgent", "high"]}, _or: [{expires_at: {_is_null: true}}, {expires_at: {_gt: "now()"}}]}
    order_by: [{priority: desc}, {created_at: desc}]
    limit: 10
  ) {
    id
    type
    title
    message
    link
    action_url
    priority
    created_at
  }
}
    `;

/**
 * __useOnUrgentNotificationsSubscription__
 *
 * To run a query within a React component, call `useOnUrgentNotificationsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnUrgentNotificationsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnUrgentNotificationsSubscription({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useOnUrgentNotificationsSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnUrgentNotificationsSubscription, OnUrgentNotificationsSubscriptionVariables> & ({ variables: OnUrgentNotificationsSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnUrgentNotificationsSubscription, OnUrgentNotificationsSubscriptionVariables>(OnUrgentNotificationsDocument, options);
      }
export type OnUrgentNotificationsSubscriptionHookResult = ReturnType<typeof useOnUrgentNotificationsSubscription>;
export type OnUrgentNotificationsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnUrgentNotificationsSubscription>;