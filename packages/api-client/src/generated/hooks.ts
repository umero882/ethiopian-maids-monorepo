/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* Auto-generated file - types are defined in graphql.ts */
import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;

export const CreateAgencyProfileDocument = gql`
    mutation CreateAgencyProfile($data: agency_profiles_insert_input!) {
  insert_agency_profiles_one(object: $data) {
    id
    full_name
    license_number
    registration_country
    business_phone
    business_email
    website_url
    agency_description
    specialization
    service_countries
    placement_fee_percentage
    subscription_tier
    created_at
  }
}
    `;

/**
 * __useCreateAgencyProfileMutation__
 *
 * To run a mutation, you first call `useCreateAgencyProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateAgencyProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createAgencyProfileMutation, { data, loading, error }] = useCreateAgencyProfileMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateAgencyProfileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateAgencyProfileMutation, CreateAgencyProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateAgencyProfileMutation, CreateAgencyProfileMutationVariables>(CreateAgencyProfileDocument, options);
      }
export type CreateAgencyProfileMutationHookResult = ReturnType<typeof useCreateAgencyProfileMutation>;
export type CreateAgencyProfileMutationResult = ApolloReactCommon.MutationResult<CreateAgencyProfileMutation>;
export type CreateAgencyProfileMutationOptions = ApolloReactCommon.BaseMutationOptions<CreateAgencyProfileMutation, CreateAgencyProfileMutationVariables>;
export const UpdateAgencyProfileDocument = gql`
    mutation UpdateAgencyProfile($id: String!, $data: agency_profiles_set_input!) {
  update_agency_profiles_by_pk(pk_columns: {id: $id}, _set: $data) {
    id
    full_name
    license_number
    registration_country
    established_year
    business_address
    business_phone
    business_email
    website_url
    contact_person_name
    contact_person_title
    head_office_address
    agency_description
    support_hours_start
    support_hours_end
    emergency_contact_phone
    authorized_person_name
    authorized_person_position
    authorized_person_phone
    authorized_person_email
    authorized_person_id_number
    contact_phone_verified
    official_email_verified
    authorized_person_phone_verified
    authorized_person_email_verified
    specialization
    service_countries
    placement_fee_percentage
    guarantee_period_months
    license_verified
    accreditation_bodies
    certifications
    license_expiry_date
    total_maids_managed
    successful_placements
    active_listings
    average_rating
    subscription_tier
    subscription_expires_at
    logo_url
    logo_file_preview
    trade_license_document
    authorized_person_id_document
    agency_contract_template
    trade_license_verification_status
    authorized_person_id_verification_status
    contract_template_verification_status
    updated_at
  }
}
    `;

/**
 * __useUpdateAgencyProfileMutation__
 *
 * To run a mutation, you first call `useUpdateAgencyProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAgencyProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAgencyProfileMutation, { data, loading, error }] = useUpdateAgencyProfileMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateAgencyProfileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateAgencyProfileMutation, UpdateAgencyProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateAgencyProfileMutation, UpdateAgencyProfileMutationVariables>(UpdateAgencyProfileDocument, options);
      }
export type UpdateAgencyProfileMutationHookResult = ReturnType<typeof useUpdateAgencyProfileMutation>;
export type UpdateAgencyProfileMutationResult = ApolloReactCommon.MutationResult<UpdateAgencyProfileMutation>;
export type UpdateAgencyProfileMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateAgencyProfileMutation, UpdateAgencyProfileMutationVariables>;
export const DeleteAgencyProfileDocument = gql`
    mutation DeleteAgencyProfile($id: String!) {
  delete_agency_profiles_by_pk(id: $id) {
    id
  }
}
    `;

/**
 * __useDeleteAgencyProfileMutation__
 *
 * To run a mutation, you first call `useDeleteAgencyProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAgencyProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteAgencyProfileMutation, { data, loading, error }] = useDeleteAgencyProfileMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteAgencyProfileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteAgencyProfileMutation, DeleteAgencyProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteAgencyProfileMutation, DeleteAgencyProfileMutationVariables>(DeleteAgencyProfileDocument, options);
      }
export type DeleteAgencyProfileMutationHookResult = ReturnType<typeof useDeleteAgencyProfileMutation>;
export type DeleteAgencyProfileMutationResult = ApolloReactCommon.MutationResult<DeleteAgencyProfileMutation>;
export type DeleteAgencyProfileMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteAgencyProfileMutation, DeleteAgencyProfileMutationVariables>;
export const UpdateAgencyMetricsDocument = gql`
    mutation UpdateAgencyMetrics($id: String!, $totalMaidsManaged: Int, $successfulPlacements: Int, $activeListings: Int, $averageRating: numeric) {
  update_agency_profiles_by_pk(
    pk_columns: {id: $id}
    _set: {total_maids_managed: $totalMaidsManaged, successful_placements: $successfulPlacements, active_listings: $activeListings, average_rating: $averageRating}
  ) {
    id
    total_maids_managed
    successful_placements
    active_listings
    average_rating
    updated_at
  }
}
    `;

/**
 * __useUpdateAgencyMetricsMutation__
 *
 * To run a mutation, you first call `useUpdateAgencyMetricsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAgencyMetricsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAgencyMetricsMutation, { data, loading, error }] = useUpdateAgencyMetricsMutation({
 *   variables: {
 *      id: // value for 'id'
 *      totalMaidsManaged: // value for 'totalMaidsManaged'
 *      successfulPlacements: // value for 'successfulPlacements'
 *      activeListings: // value for 'activeListings'
 *      averageRating: // value for 'averageRating'
 *   },
 * });
 */
export function useUpdateAgencyMetricsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateAgencyMetricsMutation, UpdateAgencyMetricsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateAgencyMetricsMutation, UpdateAgencyMetricsMutationVariables>(UpdateAgencyMetricsDocument, options);
      }
export type UpdateAgencyMetricsMutationHookResult = ReturnType<typeof useUpdateAgencyMetricsMutation>;
export type UpdateAgencyMetricsMutationResult = ApolloReactCommon.MutationResult<UpdateAgencyMetricsMutation>;
export type UpdateAgencyMetricsMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateAgencyMetricsMutation, UpdateAgencyMetricsMutationVariables>;
export const IncrementTotalMaidsManagedDocument = gql`
    mutation IncrementTotalMaidsManaged($id: String!) {
  update_agency_profiles_by_pk(
    pk_columns: {id: $id}
    _inc: {total_maids_managed: 1}
  ) {
    id
    total_maids_managed
    updated_at
  }
}
    `;

/**
 * __useIncrementTotalMaidsManagedMutation__
 *
 * To run a mutation, you first call `useIncrementTotalMaidsManagedMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIncrementTotalMaidsManagedMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [incrementTotalMaidsManagedMutation, { data, loading, error }] = useIncrementTotalMaidsManagedMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useIncrementTotalMaidsManagedMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<IncrementTotalMaidsManagedMutation, IncrementTotalMaidsManagedMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<IncrementTotalMaidsManagedMutation, IncrementTotalMaidsManagedMutationVariables>(IncrementTotalMaidsManagedDocument, options);
      }
export type IncrementTotalMaidsManagedMutationHookResult = ReturnType<typeof useIncrementTotalMaidsManagedMutation>;
export type IncrementTotalMaidsManagedMutationResult = ApolloReactCommon.MutationResult<IncrementTotalMaidsManagedMutation>;
export type IncrementTotalMaidsManagedMutationOptions = ApolloReactCommon.BaseMutationOptions<IncrementTotalMaidsManagedMutation, IncrementTotalMaidsManagedMutationVariables>;
export const DecrementTotalMaidsManagedDocument = gql`
    mutation DecrementTotalMaidsManaged($id: String!) {
  update_agency_profiles_by_pk(
    pk_columns: {id: $id}
    _inc: {total_maids_managed: -1}
  ) {
    id
    total_maids_managed
    updated_at
  }
}
    `;

/**
 * __useDecrementTotalMaidsManagedMutation__
 *
 * To run a mutation, you first call `useDecrementTotalMaidsManagedMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDecrementTotalMaidsManagedMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [decrementTotalMaidsManagedMutation, { data, loading, error }] = useDecrementTotalMaidsManagedMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDecrementTotalMaidsManagedMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DecrementTotalMaidsManagedMutation, DecrementTotalMaidsManagedMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DecrementTotalMaidsManagedMutation, DecrementTotalMaidsManagedMutationVariables>(DecrementTotalMaidsManagedDocument, options);
      }
export type DecrementTotalMaidsManagedMutationHookResult = ReturnType<typeof useDecrementTotalMaidsManagedMutation>;
export type DecrementTotalMaidsManagedMutationResult = ApolloReactCommon.MutationResult<DecrementTotalMaidsManagedMutation>;
export type DecrementTotalMaidsManagedMutationOptions = ApolloReactCommon.BaseMutationOptions<DecrementTotalMaidsManagedMutation, DecrementTotalMaidsManagedMutationVariables>;
export const IncrementSuccessfulPlacementsDocument = gql`
    mutation IncrementSuccessfulPlacements($id: String!) {
  update_agency_profiles_by_pk(
    pk_columns: {id: $id}
    _inc: {successful_placements: 1}
  ) {
    id
    successful_placements
    updated_at
  }
}
    `;

/**
 * __useIncrementSuccessfulPlacementsMutation__
 *
 * To run a mutation, you first call `useIncrementSuccessfulPlacementsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIncrementSuccessfulPlacementsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [incrementSuccessfulPlacementsMutation, { data, loading, error }] = useIncrementSuccessfulPlacementsMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useIncrementSuccessfulPlacementsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<IncrementSuccessfulPlacementsMutation, IncrementSuccessfulPlacementsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<IncrementSuccessfulPlacementsMutation, IncrementSuccessfulPlacementsMutationVariables>(IncrementSuccessfulPlacementsDocument, options);
      }
export type IncrementSuccessfulPlacementsMutationHookResult = ReturnType<typeof useIncrementSuccessfulPlacementsMutation>;
export type IncrementSuccessfulPlacementsMutationResult = ApolloReactCommon.MutationResult<IncrementSuccessfulPlacementsMutation>;
export type IncrementSuccessfulPlacementsMutationOptions = ApolloReactCommon.BaseMutationOptions<IncrementSuccessfulPlacementsMutation, IncrementSuccessfulPlacementsMutationVariables>;
export const IncrementActiveListingsDocument = gql`
    mutation IncrementActiveListings($id: String!) {
  update_agency_profiles_by_pk(pk_columns: {id: $id}, _inc: {active_listings: 1}) {
    id
    active_listings
    updated_at
  }
}
    `;

/**
 * __useIncrementActiveListingsMutation__
 *
 * To run a mutation, you first call `useIncrementActiveListingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIncrementActiveListingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [incrementActiveListingsMutation, { data, loading, error }] = useIncrementActiveListingsMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useIncrementActiveListingsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<IncrementActiveListingsMutation, IncrementActiveListingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<IncrementActiveListingsMutation, IncrementActiveListingsMutationVariables>(IncrementActiveListingsDocument, options);
      }
export type IncrementActiveListingsMutationHookResult = ReturnType<typeof useIncrementActiveListingsMutation>;
export type IncrementActiveListingsMutationResult = ApolloReactCommon.MutationResult<IncrementActiveListingsMutation>;
export type IncrementActiveListingsMutationOptions = ApolloReactCommon.BaseMutationOptions<IncrementActiveListingsMutation, IncrementActiveListingsMutationVariables>;
export const DecrementActiveListingsDocument = gql`
    mutation DecrementActiveListings($id: String!) {
  update_agency_profiles_by_pk(pk_columns: {id: $id}, _inc: {active_listings: -1}) {
    id
    active_listings
    updated_at
  }
}
    `;

/**
 * __useDecrementActiveListingsMutation__
 *
 * To run a mutation, you first call `useDecrementActiveListingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDecrementActiveListingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [decrementActiveListingsMutation, { data, loading, error }] = useDecrementActiveListingsMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDecrementActiveListingsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DecrementActiveListingsMutation, DecrementActiveListingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DecrementActiveListingsMutation, DecrementActiveListingsMutationVariables>(DecrementActiveListingsDocument, options);
      }
export type DecrementActiveListingsMutationHookResult = ReturnType<typeof useDecrementActiveListingsMutation>;
export type DecrementActiveListingsMutationResult = ApolloReactCommon.MutationResult<DecrementActiveListingsMutation>;
export type DecrementActiveListingsMutationOptions = ApolloReactCommon.BaseMutationOptions<DecrementActiveListingsMutation, DecrementActiveListingsMutationVariables>;
export const UpdateAgencyAverageRatingDocument = gql`
    mutation UpdateAgencyAverageRating($id: String!, $rating: numeric!) {
  update_agency_profiles_by_pk(
    pk_columns: {id: $id}
    _set: {average_rating: $rating}
  ) {
    id
    average_rating
    updated_at
  }
}
    `;

/**
 * __useUpdateAgencyAverageRatingMutation__
 *
 * To run a mutation, you first call `useUpdateAgencyAverageRatingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAgencyAverageRatingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAgencyAverageRatingMutation, { data, loading, error }] = useUpdateAgencyAverageRatingMutation({
 *   variables: {
 *      id: // value for 'id'
 *      rating: // value for 'rating'
 *   },
 * });
 */
export function useUpdateAgencyAverageRatingMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateAgencyAverageRatingMutation, UpdateAgencyAverageRatingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateAgencyAverageRatingMutation, UpdateAgencyAverageRatingMutationVariables>(UpdateAgencyAverageRatingDocument, options);
      }
export type UpdateAgencyAverageRatingMutationHookResult = ReturnType<typeof useUpdateAgencyAverageRatingMutation>;
export type UpdateAgencyAverageRatingMutationResult = ApolloReactCommon.MutationResult<UpdateAgencyAverageRatingMutation>;
export type UpdateAgencyAverageRatingMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateAgencyAverageRatingMutation, UpdateAgencyAverageRatingMutationVariables>;
export const VerifyAgencyLicenseDocument = gql`
    mutation VerifyAgencyLicense($id: String!) {
  update_agency_profiles_by_pk(
    pk_columns: {id: $id}
    _set: {license_verified: true}
  ) {
    id
    license_verified
    updated_at
  }
}
    `;

/**
 * __useVerifyAgencyLicenseMutation__
 *
 * To run a mutation, you first call `useVerifyAgencyLicenseMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useVerifyAgencyLicenseMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [verifyAgencyLicenseMutation, { data, loading, error }] = useVerifyAgencyLicenseMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useVerifyAgencyLicenseMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<VerifyAgencyLicenseMutation, VerifyAgencyLicenseMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<VerifyAgencyLicenseMutation, VerifyAgencyLicenseMutationVariables>(VerifyAgencyLicenseDocument, options);
      }
export type VerifyAgencyLicenseMutationHookResult = ReturnType<typeof useVerifyAgencyLicenseMutation>;
export type VerifyAgencyLicenseMutationResult = ApolloReactCommon.MutationResult<VerifyAgencyLicenseMutation>;
export type VerifyAgencyLicenseMutationOptions = ApolloReactCommon.BaseMutationOptions<VerifyAgencyLicenseMutation, VerifyAgencyLicenseMutationVariables>;
export const UpdateVerificationStatusesDocument = gql`
    mutation UpdateVerificationStatuses($id: String!, $tradeLicenseStatus: String, $authorizedPersonIdStatus: String, $contractTemplateStatus: String) {
  update_agency_profiles_by_pk(
    pk_columns: {id: $id}
    _set: {trade_license_verification_status: $tradeLicenseStatus, authorized_person_id_verification_status: $authorizedPersonIdStatus, contract_template_verification_status: $contractTemplateStatus}
  ) {
    id
    trade_license_verification_status
    authorized_person_id_verification_status
    contract_template_verification_status
    updated_at
  }
}
    `;

/**
 * __useUpdateVerificationStatusesMutation__
 *
 * To run a mutation, you first call `useUpdateVerificationStatusesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateVerificationStatusesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateVerificationStatusesMutation, { data, loading, error }] = useUpdateVerificationStatusesMutation({
 *   variables: {
 *      id: // value for 'id'
 *      tradeLicenseStatus: // value for 'tradeLicenseStatus'
 *      authorizedPersonIdStatus: // value for 'authorizedPersonIdStatus'
 *      contractTemplateStatus: // value for 'contractTemplateStatus'
 *   },
 * });
 */
export function useUpdateVerificationStatusesMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateVerificationStatusesMutation, UpdateVerificationStatusesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateVerificationStatusesMutation, UpdateVerificationStatusesMutationVariables>(UpdateVerificationStatusesDocument, options);
      }
export type UpdateVerificationStatusesMutationHookResult = ReturnType<typeof useUpdateVerificationStatusesMutation>;
export type UpdateVerificationStatusesMutationResult = ApolloReactCommon.MutationResult<UpdateVerificationStatusesMutation>;
export type UpdateVerificationStatusesMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateVerificationStatusesMutation, UpdateVerificationStatusesMutationVariables>;
export const UpdateSubscriptionTierDocument = gql`
    mutation UpdateSubscriptionTier($id: String!, $tier: String!, $expiresAt: timestamptz) {
  update_agency_profiles_by_pk(
    pk_columns: {id: $id}
    _set: {subscription_tier: $tier, subscription_expires_at: $expiresAt}
  ) {
    id
    subscription_tier
    subscription_expires_at
    updated_at
  }
}
    `;

/**
 * __useUpdateSubscriptionTierMutation__
 *
 * To run a mutation, you first call `useUpdateSubscriptionTierMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSubscriptionTierMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSubscriptionTierMutation, { data, loading, error }] = useUpdateSubscriptionTierMutation({
 *   variables: {
 *      id: // value for 'id'
 *      tier: // value for 'tier'
 *      expiresAt: // value for 'expiresAt'
 *   },
 * });
 */
export function useUpdateSubscriptionTierMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateSubscriptionTierMutation, UpdateSubscriptionTierMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateSubscriptionTierMutation, UpdateSubscriptionTierMutationVariables>(UpdateSubscriptionTierDocument, options);
      }
export type UpdateSubscriptionTierMutationHookResult = ReturnType<typeof useUpdateSubscriptionTierMutation>;
export type UpdateSubscriptionTierMutationResult = ApolloReactCommon.MutationResult<UpdateSubscriptionTierMutation>;
export type UpdateSubscriptionTierMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateSubscriptionTierMutation, UpdateSubscriptionTierMutationVariables>;
export const CreateBookingRequestDocument = gql`
    mutation CreateBookingRequest($data: booking_requests_insert_input!) {
  insert_booking_requests_one(object: $data) {
    id
    maid_id
    sponsor_id
    status
    start_date
    end_date
    message
    special_requirements
    amount
    currency
    payment_status
    created_at
  }
}
    `;

/**
 * __useCreateBookingRequestMutation__
 *
 * To run a mutation, you first call `useCreateBookingRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateBookingRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createBookingRequestMutation, { data, loading, error }] = useCreateBookingRequestMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateBookingRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateBookingRequestMutation, CreateBookingRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateBookingRequestMutation, CreateBookingRequestMutationVariables>(CreateBookingRequestDocument, options);
      }
export type CreateBookingRequestMutationHookResult = ReturnType<typeof useCreateBookingRequestMutation>;
export type CreateBookingRequestMutationResult = ApolloReactCommon.MutationResult<CreateBookingRequestMutation>;
export type CreateBookingRequestMutationOptions = ApolloReactCommon.BaseMutationOptions<CreateBookingRequestMutation, CreateBookingRequestMutationVariables>;
export const UpdateBookingRequestDocument = gql`
    mutation UpdateBookingRequest($id: uuid!, $data: booking_requests_set_input!) {
  update_booking_requests_by_pk(pk_columns: {id: $id}, _set: $data) {
    id
    maid_id
    sponsor_id
    status
    start_date
    end_date
    message
    special_requirements
    amount
    currency
    payment_status
    updated_at
  }
}
    `;

/**
 * __useUpdateBookingRequestMutation__
 *
 * To run a mutation, you first call `useUpdateBookingRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateBookingRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateBookingRequestMutation, { data, loading, error }] = useUpdateBookingRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateBookingRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateBookingRequestMutation, UpdateBookingRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateBookingRequestMutation, UpdateBookingRequestMutationVariables>(UpdateBookingRequestDocument, options);
      }
export type UpdateBookingRequestMutationHookResult = ReturnType<typeof useUpdateBookingRequestMutation>;
export type UpdateBookingRequestMutationResult = ApolloReactCommon.MutationResult<UpdateBookingRequestMutation>;
export type UpdateBookingRequestMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateBookingRequestMutation, UpdateBookingRequestMutationVariables>;
export const UpdateBookingStatusDocument = gql`
    mutation UpdateBookingStatus($id: uuid!, $status: String!) {
  update_booking_requests_by_pk(
    pk_columns: {id: $id}
    _set: {status: $status, updated_at: "now()"}
  ) {
    id
    status
    updated_at
  }
}
    `;

/**
 * __useUpdateBookingStatusMutation__
 *
 * To run a mutation, you first call `useUpdateBookingStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateBookingStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateBookingStatusMutation, { data, loading, error }] = useUpdateBookingStatusMutation({
 *   variables: {
 *      id: // value for 'id'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useUpdateBookingStatusMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateBookingStatusMutation, UpdateBookingStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateBookingStatusMutation, UpdateBookingStatusMutationVariables>(UpdateBookingStatusDocument, options);
      }
export type UpdateBookingStatusMutationHookResult = ReturnType<typeof useUpdateBookingStatusMutation>;
export type UpdateBookingStatusMutationResult = ApolloReactCommon.MutationResult<UpdateBookingStatusMutation>;
export type UpdateBookingStatusMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateBookingStatusMutation, UpdateBookingStatusMutationVariables>;
export const AcceptBookingRequestDocument = gql`
    mutation AcceptBookingRequest($id: uuid!) {
  update_booking_requests_by_pk(
    pk_columns: {id: $id}
    _set: {status: "accepted", responded_at: "now()", updated_at: "now()"}
  ) {
    id
    status
    responded_at
    updated_at
  }
}
    `;

/**
 * __useAcceptBookingRequestMutation__
 *
 * To run a mutation, you first call `useAcceptBookingRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAcceptBookingRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [acceptBookingRequestMutation, { data, loading, error }] = useAcceptBookingRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useAcceptBookingRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<AcceptBookingRequestMutation, AcceptBookingRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<AcceptBookingRequestMutation, AcceptBookingRequestMutationVariables>(AcceptBookingRequestDocument, options);
      }
export type AcceptBookingRequestMutationHookResult = ReturnType<typeof useAcceptBookingRequestMutation>;
export type AcceptBookingRequestMutationResult = ApolloReactCommon.MutationResult<AcceptBookingRequestMutation>;
export type AcceptBookingRequestMutationOptions = ApolloReactCommon.BaseMutationOptions<AcceptBookingRequestMutation, AcceptBookingRequestMutationVariables>;
export const RejectBookingRequestDocument = gql`
    mutation RejectBookingRequest($id: uuid!, $rejectionReason: String) {
  update_booking_requests_by_pk(
    pk_columns: {id: $id}
    _set: {status: "rejected", rejection_reason: $rejectionReason, responded_at: "now()", updated_at: "now()"}
  ) {
    id
    status
    rejection_reason
    responded_at
    updated_at
  }
}
    `;

/**
 * __useRejectBookingRequestMutation__
 *
 * To run a mutation, you first call `useRejectBookingRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRejectBookingRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rejectBookingRequestMutation, { data, loading, error }] = useRejectBookingRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *      rejectionReason: // value for 'rejectionReason'
 *   },
 * });
 */
export function useRejectBookingRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RejectBookingRequestMutation, RejectBookingRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RejectBookingRequestMutation, RejectBookingRequestMutationVariables>(RejectBookingRequestDocument, options);
      }
export type RejectBookingRequestMutationHookResult = ReturnType<typeof useRejectBookingRequestMutation>;
export type RejectBookingRequestMutationResult = ApolloReactCommon.MutationResult<RejectBookingRequestMutation>;
export type RejectBookingRequestMutationOptions = ApolloReactCommon.BaseMutationOptions<RejectBookingRequestMutation, RejectBookingRequestMutationVariables>;
export const CancelBookingRequestDocument = gql`
    mutation CancelBookingRequest($id: uuid!) {
  update_booking_requests_by_pk(
    pk_columns: {id: $id}
    _set: {status: "cancelled", updated_at: "now()"}
  ) {
    id
    status
    updated_at
  }
}
    `;

/**
 * __useCancelBookingRequestMutation__
 *
 * To run a mutation, you first call `useCancelBookingRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCancelBookingRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [cancelBookingRequestMutation, { data, loading, error }] = useCancelBookingRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useCancelBookingRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CancelBookingRequestMutation, CancelBookingRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CancelBookingRequestMutation, CancelBookingRequestMutationVariables>(CancelBookingRequestDocument, options);
      }
export type CancelBookingRequestMutationHookResult = ReturnType<typeof useCancelBookingRequestMutation>;
export type CancelBookingRequestMutationResult = ApolloReactCommon.MutationResult<CancelBookingRequestMutation>;
export type CancelBookingRequestMutationOptions = ApolloReactCommon.BaseMutationOptions<CancelBookingRequestMutation, CancelBookingRequestMutationVariables>;
export const CompleteBookingRequestDocument = gql`
    mutation CompleteBookingRequest($id: uuid!) {
  update_booking_requests_by_pk(
    pk_columns: {id: $id}
    _set: {status: "completed", updated_at: "now()"}
  ) {
    id
    status
    updated_at
  }
}
    `;

/**
 * __useCompleteBookingRequestMutation__
 *
 * To run a mutation, you first call `useCompleteBookingRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCompleteBookingRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [completeBookingRequestMutation, { data, loading, error }] = useCompleteBookingRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useCompleteBookingRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CompleteBookingRequestMutation, CompleteBookingRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CompleteBookingRequestMutation, CompleteBookingRequestMutationVariables>(CompleteBookingRequestDocument, options);
      }
export type CompleteBookingRequestMutationHookResult = ReturnType<typeof useCompleteBookingRequestMutation>;
export type CompleteBookingRequestMutationResult = ApolloReactCommon.MutationResult<CompleteBookingRequestMutation>;
export type CompleteBookingRequestMutationOptions = ApolloReactCommon.BaseMutationOptions<CompleteBookingRequestMutation, CompleteBookingRequestMutationVariables>;
export const UpdateBookingPaymentDocument = gql`
    mutation UpdateBookingPayment($id: uuid!, $paymentStatus: String!, $paymentMethod: String, $paymentReference: String) {
  update_booking_requests_by_pk(
    pk_columns: {id: $id}
    _set: {payment_status: $paymentStatus, payment_method: $paymentMethod, payment_reference: $paymentReference, payment_date: "now()", updated_at: "now()"}
  ) {
    id
    payment_status
    payment_method
    payment_date
    payment_reference
    updated_at
  }
}
    `;

/**
 * __useUpdateBookingPaymentMutation__
 *
 * To run a mutation, you first call `useUpdateBookingPaymentMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateBookingPaymentMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateBookingPaymentMutation, { data, loading, error }] = useUpdateBookingPaymentMutation({
 *   variables: {
 *      id: // value for 'id'
 *      paymentStatus: // value for 'paymentStatus'
 *      paymentMethod: // value for 'paymentMethod'
 *      paymentReference: // value for 'paymentReference'
 *   },
 * });
 */
export function useUpdateBookingPaymentMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateBookingPaymentMutation, UpdateBookingPaymentMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateBookingPaymentMutation, UpdateBookingPaymentMutationVariables>(UpdateBookingPaymentDocument, options);
      }
export type UpdateBookingPaymentMutationHookResult = ReturnType<typeof useUpdateBookingPaymentMutation>;
export type UpdateBookingPaymentMutationResult = ApolloReactCommon.MutationResult<UpdateBookingPaymentMutation>;
export type UpdateBookingPaymentMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateBookingPaymentMutation, UpdateBookingPaymentMutationVariables>;
export const DeleteBookingRequestDocument = gql`
    mutation DeleteBookingRequest($id: uuid!) {
  delete_booking_requests_by_pk(id: $id) {
    id
    status
  }
}
    `;

/**
 * __useDeleteBookingRequestMutation__
 *
 * To run a mutation, you first call `useDeleteBookingRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteBookingRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteBookingRequestMutation, { data, loading, error }] = useDeleteBookingRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteBookingRequestMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteBookingRequestMutation, DeleteBookingRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteBookingRequestMutation, DeleteBookingRequestMutationVariables>(DeleteBookingRequestDocument, options);
      }
export type DeleteBookingRequestMutationHookResult = ReturnType<typeof useDeleteBookingRequestMutation>;
export type DeleteBookingRequestMutationResult = ApolloReactCommon.MutationResult<DeleteBookingRequestMutation>;
export type DeleteBookingRequestMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteBookingRequestMutation, DeleteBookingRequestMutationVariables>;
export const BulkUpdateBookingStatusDocument = gql`
    mutation BulkUpdateBookingStatus($ids: [uuid!]!, $status: String!) {
  update_booking_requests(
    where: {id: {_in: $ids}}
    _set: {status: $status, updated_at: "now()"}
  ) {
    affected_rows
    returning {
      id
      status
      updated_at
    }
  }
}
    `;

/**
 * __useBulkUpdateBookingStatusMutation__
 *
 * To run a mutation, you first call `useBulkUpdateBookingStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBulkUpdateBookingStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [bulkUpdateBookingStatusMutation, { data, loading, error }] = useBulkUpdateBookingStatusMutation({
 *   variables: {
 *      ids: // value for 'ids'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useBulkUpdateBookingStatusMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<BulkUpdateBookingStatusMutation, BulkUpdateBookingStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<BulkUpdateBookingStatusMutation, BulkUpdateBookingStatusMutationVariables>(BulkUpdateBookingStatusDocument, options);
      }
export type BulkUpdateBookingStatusMutationHookResult = ReturnType<typeof useBulkUpdateBookingStatusMutation>;
export type BulkUpdateBookingStatusMutationResult = ApolloReactCommon.MutationResult<BulkUpdateBookingStatusMutation>;
export type BulkUpdateBookingStatusMutationOptions = ApolloReactCommon.BaseMutationOptions<BulkUpdateBookingStatusMutation, BulkUpdateBookingStatusMutationVariables>;
export const RescheduleBookingDocument = gql`
    mutation RescheduleBooking($id: uuid!, $startDate: date!, $endDate: date!) {
  update_booking_requests_by_pk(
    pk_columns: {id: $id}
    _set: {start_date: $startDate, end_date: $endDate, status: "rescheduled", updated_at: "now()"}
  ) {
    id
    start_date
    end_date
    status
    updated_at
  }
}
    `;

/**
 * __useRescheduleBookingMutation__
 *
 * To run a mutation, you first call `useRescheduleBookingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRescheduleBookingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [rescheduleBookingMutation, { data, loading, error }] = useRescheduleBookingMutation({
 *   variables: {
 *      id: // value for 'id'
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useRescheduleBookingMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RescheduleBookingMutation, RescheduleBookingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RescheduleBookingMutation, RescheduleBookingMutationVariables>(RescheduleBookingDocument, options);
      }
export type RescheduleBookingMutationHookResult = ReturnType<typeof useRescheduleBookingMutation>;
export type RescheduleBookingMutationResult = ApolloReactCommon.MutationResult<RescheduleBookingMutation>;
export type RescheduleBookingMutationOptions = ApolloReactCommon.BaseMutationOptions<RescheduleBookingMutation, RescheduleBookingMutationVariables>;
export const CreateConversationDocument = gql`
    mutation CreateConversation($data: conversations_insert_input!) {
  insert_conversations_one(object: $data) {
    id
    participant1_id
    participant1_type
    participant2_id
    participant2_type
    status
    created_at
  }
}
    `;

/**
 * __useCreateConversationMutation__
 *
 * To run a mutation, you first call `useCreateConversationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateConversationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createConversationMutation, { data, loading, error }] = useCreateConversationMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateConversationMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateConversationMutation, CreateConversationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateConversationMutation, CreateConversationMutationVariables>(CreateConversationDocument, options);
      }
export type CreateConversationMutationHookResult = ReturnType<typeof useCreateConversationMutation>;
export type CreateConversationMutationResult = ApolloReactCommon.MutationResult<CreateConversationMutation>;
export type CreateConversationMutationOptions = ApolloReactCommon.BaseMutationOptions<CreateConversationMutation, CreateConversationMutationVariables>;
export const UpdateConversationDocument = gql`
    mutation UpdateConversation($id: uuid!, $data: conversations_set_input!) {
  update_conversations_by_pk(pk_columns: {id: $id}, _set: $data) {
    id
    participant1_id
    participant2_id
    status
    last_message_at
    last_message_preview
    participant1_unread_count
    participant2_unread_count
    updated_at
  }
}
    `;

/**
 * __useUpdateConversationMutation__
 *
 * To run a mutation, you first call `useUpdateConversationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateConversationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateConversationMutation, { data, loading, error }] = useUpdateConversationMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateConversationMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateConversationMutation, UpdateConversationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateConversationMutation, UpdateConversationMutationVariables>(UpdateConversationDocument, options);
      }
export type UpdateConversationMutationHookResult = ReturnType<typeof useUpdateConversationMutation>;
export type UpdateConversationMutationResult = ApolloReactCommon.MutationResult<UpdateConversationMutation>;
export type UpdateConversationMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateConversationMutation, UpdateConversationMutationVariables>;
export const ArchiveConversationDocument = gql`
    mutation ArchiveConversation($id: uuid!) {
  update_conversations_by_pk(pk_columns: {id: $id}, _set: {status: "archived"}) {
    id
    status
    updated_at
  }
}
    `;

/**
 * __useArchiveConversationMutation__
 *
 * To run a mutation, you first call `useArchiveConversationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useArchiveConversationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [archiveConversationMutation, { data, loading, error }] = useArchiveConversationMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useArchiveConversationMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ArchiveConversationMutation, ArchiveConversationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ArchiveConversationMutation, ArchiveConversationMutationVariables>(ArchiveConversationDocument, options);
      }
export type ArchiveConversationMutationHookResult = ReturnType<typeof useArchiveConversationMutation>;
export type ArchiveConversationMutationResult = ApolloReactCommon.MutationResult<ArchiveConversationMutation>;
export type ArchiveConversationMutationOptions = ApolloReactCommon.BaseMutationOptions<ArchiveConversationMutation, ArchiveConversationMutationVariables>;
export const DeleteConversationDocument = gql`
    mutation DeleteConversation($id: uuid!) {
  update_conversations_by_pk(pk_columns: {id: $id}, _set: {status: "deleted"}) {
    id
    status
    updated_at
  }
}
    `;

/**
 * __useDeleteConversationMutation__
 *
 * To run a mutation, you first call `useDeleteConversationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteConversationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteConversationMutation, { data, loading, error }] = useDeleteConversationMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteConversationMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteConversationMutation, DeleteConversationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteConversationMutation, DeleteConversationMutationVariables>(DeleteConversationDocument, options);
      }
export type DeleteConversationMutationHookResult = ReturnType<typeof useDeleteConversationMutation>;
export type DeleteConversationMutationResult = ApolloReactCommon.MutationResult<DeleteConversationMutation>;
export type DeleteConversationMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteConversationMutation, DeleteConversationMutationVariables>;
export const MarkConversationAsReadDocument = gql`
    mutation MarkConversationAsRead($id: uuid!, $userId: String!) {
  update_conversations_by_pk(
    pk_columns: {id: $id}
    _set: {participant1_unread_count: 0, participant2_unread_count: 0}
  ) {
    id
    participant1_unread_count
    participant2_unread_count
    updated_at
  }
}
    `;

/**
 * __useMarkConversationAsReadMutation__
 *
 * To run a mutation, you first call `useMarkConversationAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkConversationAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markConversationAsReadMutation, { data, loading, error }] = useMarkConversationAsReadMutation({
 *   variables: {
 *      id: // value for 'id'
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useMarkConversationAsReadMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<MarkConversationAsReadMutation, MarkConversationAsReadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<MarkConversationAsReadMutation, MarkConversationAsReadMutationVariables>(MarkConversationAsReadDocument, options);
      }
export type MarkConversationAsReadMutationHookResult = ReturnType<typeof useMarkConversationAsReadMutation>;
export type MarkConversationAsReadMutationResult = ApolloReactCommon.MutationResult<MarkConversationAsReadMutation>;
export type MarkConversationAsReadMutationOptions = ApolloReactCommon.BaseMutationOptions<MarkConversationAsReadMutation, MarkConversationAsReadMutationVariables>;
export const IncrementUnreadCountDocument = gql`
    mutation IncrementUnreadCount($id: uuid!, $participantField: String!) {
  update_conversations_by_pk(
    pk_columns: {id: $id}
    _inc: {participant1_unread_count: 1}
  ) {
    id
    participant1_unread_count
    participant2_unread_count
  }
}
    `;

/**
 * __useIncrementUnreadCountMutation__
 *
 * To run a mutation, you first call `useIncrementUnreadCountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIncrementUnreadCountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [incrementUnreadCountMutation, { data, loading, error }] = useIncrementUnreadCountMutation({
 *   variables: {
 *      id: // value for 'id'
 *      participantField: // value for 'participantField'
 *   },
 * });
 */
export function useIncrementUnreadCountMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<IncrementUnreadCountMutation, IncrementUnreadCountMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<IncrementUnreadCountMutation, IncrementUnreadCountMutationVariables>(IncrementUnreadCountDocument, options);
      }
export type IncrementUnreadCountMutationHookResult = ReturnType<typeof useIncrementUnreadCountMutation>;
export type IncrementUnreadCountMutationResult = ApolloReactCommon.MutationResult<IncrementUnreadCountMutation>;
export type IncrementUnreadCountMutationOptions = ApolloReactCommon.BaseMutationOptions<IncrementUnreadCountMutation, IncrementUnreadCountMutationVariables>;
export const SendMessageDocument = gql`
    mutation SendMessage($data: messages_insert_input!) {
  insert_messages_one(object: $data) {
    id
    conversation_id
    sender_id
    recipient_id
    subject
    content
    message_type
    job_id
    application_id
    is_read
    attachments
    created_at
  }
}
    `;

/**
 * __useSendMessageMutation__
 *
 * To run a mutation, you first call `useSendMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSendMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sendMessageMutation, { data, loading, error }] = useSendMessageMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useSendMessageMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SendMessageMutation, SendMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<SendMessageMutation, SendMessageMutationVariables>(SendMessageDocument, options);
      }
export type SendMessageMutationHookResult = ReturnType<typeof useSendMessageMutation>;
export type SendMessageMutationResult = ApolloReactCommon.MutationResult<SendMessageMutation>;
export type SendMessageMutationOptions = ApolloReactCommon.BaseMutationOptions<SendMessageMutation, SendMessageMutationVariables>;
export const UpdateMessageDocument = gql`
    mutation UpdateMessage($id: uuid!, $data: messages_set_input!) {
  update_messages(where: {id: {_eq: $id}}, _set: $data) {
    affected_rows
    returning {
      id
      content
      is_read
      read_at
      is_archived
      updated_at
    }
  }
}
    `;

/**
 * __useUpdateMessageMutation__
 *
 * To run a mutation, you first call `useUpdateMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMessageMutation, { data, loading, error }] = useUpdateMessageMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateMessageMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateMessageMutation, UpdateMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateMessageMutation, UpdateMessageMutationVariables>(UpdateMessageDocument, options);
      }
export type UpdateMessageMutationHookResult = ReturnType<typeof useUpdateMessageMutation>;
export type UpdateMessageMutationResult = ApolloReactCommon.MutationResult<UpdateMessageMutation>;
export type UpdateMessageMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateMessageMutation, UpdateMessageMutationVariables>;
export const MarkMessageAsReadDocument = gql`
    mutation MarkMessageAsRead($id: uuid!) {
  update_messages(
    where: {id: {_eq: $id}}
    _set: {is_read: true, read_at: "now()"}
  ) {
    affected_rows
    returning {
      id
      is_read
      read_at
      updated_at
    }
  }
}
    `;

/**
 * __useMarkMessageAsReadMutation__
 *
 * To run a mutation, you first call `useMarkMessageAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkMessageAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markMessageAsReadMutation, { data, loading, error }] = useMarkMessageAsReadMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useMarkMessageAsReadMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<MarkMessageAsReadMutation, MarkMessageAsReadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<MarkMessageAsReadMutation, MarkMessageAsReadMutationVariables>(MarkMessageAsReadDocument, options);
      }
export type MarkMessageAsReadMutationHookResult = ReturnType<typeof useMarkMessageAsReadMutation>;
export type MarkMessageAsReadMutationResult = ApolloReactCommon.MutationResult<MarkMessageAsReadMutation>;
export type MarkMessageAsReadMutationOptions = ApolloReactCommon.BaseMutationOptions<MarkMessageAsReadMutation, MarkMessageAsReadMutationVariables>;
export const MarkMultipleMessagesAsReadDocument = gql`
    mutation MarkMultipleMessagesAsRead($ids: [uuid!]!) {
  update_messages(
    where: {id: {_in: $ids}}
    _set: {is_read: true, read_at: "now()"}
  ) {
    affected_rows
    returning {
      id
      is_read
      read_at
    }
  }
}
    `;

/**
 * __useMarkMultipleMessagesAsReadMutation__
 *
 * To run a mutation, you first call `useMarkMultipleMessagesAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkMultipleMessagesAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markMultipleMessagesAsReadMutation, { data, loading, error }] = useMarkMultipleMessagesAsReadMutation({
 *   variables: {
 *      ids: // value for 'ids'
 *   },
 * });
 */
export function useMarkMultipleMessagesAsReadMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<MarkMultipleMessagesAsReadMutation, MarkMultipleMessagesAsReadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<MarkMultipleMessagesAsReadMutation, MarkMultipleMessagesAsReadMutationVariables>(MarkMultipleMessagesAsReadDocument, options);
      }
export type MarkMultipleMessagesAsReadMutationHookResult = ReturnType<typeof useMarkMultipleMessagesAsReadMutation>;
export type MarkMultipleMessagesAsReadMutationResult = ApolloReactCommon.MutationResult<MarkMultipleMessagesAsReadMutation>;
export type MarkMultipleMessagesAsReadMutationOptions = ApolloReactCommon.BaseMutationOptions<MarkMultipleMessagesAsReadMutation, MarkMultipleMessagesAsReadMutationVariables>;
export const ArchiveMessageDocument = gql`
    mutation ArchiveMessage($id: uuid!) {
  update_messages(where: {id: {_eq: $id}}, _set: {is_archived: true}) {
    affected_rows
    returning {
      id
      is_archived
      updated_at
    }
  }
}
    `;

/**
 * __useArchiveMessageMutation__
 *
 * To run a mutation, you first call `useArchiveMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useArchiveMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [archiveMessageMutation, { data, loading, error }] = useArchiveMessageMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useArchiveMessageMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ArchiveMessageMutation, ArchiveMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ArchiveMessageMutation, ArchiveMessageMutationVariables>(ArchiveMessageDocument, options);
      }
export type ArchiveMessageMutationHookResult = ReturnType<typeof useArchiveMessageMutation>;
export type ArchiveMessageMutationResult = ApolloReactCommon.MutationResult<ArchiveMessageMutation>;
export type ArchiveMessageMutationOptions = ApolloReactCommon.BaseMutationOptions<ArchiveMessageMutation, ArchiveMessageMutationVariables>;
export const ArchiveMultipleMessagesDocument = gql`
    mutation ArchiveMultipleMessages($ids: [uuid!]!) {
  update_messages(where: {id: {_in: $ids}}, _set: {is_archived: true}) {
    affected_rows
    returning {
      id
      is_archived
    }
  }
}
    `;

/**
 * __useArchiveMultipleMessagesMutation__
 *
 * To run a mutation, you first call `useArchiveMultipleMessagesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useArchiveMultipleMessagesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [archiveMultipleMessagesMutation, { data, loading, error }] = useArchiveMultipleMessagesMutation({
 *   variables: {
 *      ids: // value for 'ids'
 *   },
 * });
 */
export function useArchiveMultipleMessagesMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ArchiveMultipleMessagesMutation, ArchiveMultipleMessagesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ArchiveMultipleMessagesMutation, ArchiveMultipleMessagesMutationVariables>(ArchiveMultipleMessagesDocument, options);
      }
export type ArchiveMultipleMessagesMutationHookResult = ReturnType<typeof useArchiveMultipleMessagesMutation>;
export type ArchiveMultipleMessagesMutationResult = ApolloReactCommon.MutationResult<ArchiveMultipleMessagesMutation>;
export type ArchiveMultipleMessagesMutationOptions = ApolloReactCommon.BaseMutationOptions<ArchiveMultipleMessagesMutation, ArchiveMultipleMessagesMutationVariables>;
export const DeleteMessageDocument = gql`
    mutation DeleteMessage($id: uuid!) {
  delete_messages(where: {id: {_eq: $id}}) {
    affected_rows
  }
}
    `;

/**
 * __useDeleteMessageMutation__
 *
 * To run a mutation, you first call `useDeleteMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMessageMutation, { data, loading, error }] = useDeleteMessageMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteMessageMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteMessageMutation, DeleteMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteMessageMutation, DeleteMessageMutationVariables>(DeleteMessageDocument, options);
      }
export type DeleteMessageMutationHookResult = ReturnType<typeof useDeleteMessageMutation>;
export type DeleteMessageMutationResult = ApolloReactCommon.MutationResult<DeleteMessageMutation>;
export type DeleteMessageMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteMessageMutation, DeleteMessageMutationVariables>;
export const DeleteMultipleMessagesDocument = gql`
    mutation DeleteMultipleMessages($ids: [uuid!]!) {
  delete_messages(where: {id: {_in: $ids}}) {
    affected_rows
  }
}
    `;

/**
 * __useDeleteMultipleMessagesMutation__
 *
 * To run a mutation, you first call `useDeleteMultipleMessagesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMultipleMessagesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMultipleMessagesMutation, { data, loading, error }] = useDeleteMultipleMessagesMutation({
 *   variables: {
 *      ids: // value for 'ids'
 *   },
 * });
 */
export function useDeleteMultipleMessagesMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteMultipleMessagesMutation, DeleteMultipleMessagesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteMultipleMessagesMutation, DeleteMultipleMessagesMutationVariables>(DeleteMultipleMessagesDocument, options);
      }
export type DeleteMultipleMessagesMutationHookResult = ReturnType<typeof useDeleteMultipleMessagesMutation>;
export type DeleteMultipleMessagesMutationResult = ApolloReactCommon.MutationResult<DeleteMultipleMessagesMutation>;
export type DeleteMultipleMessagesMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteMultipleMessagesMutation, DeleteMultipleMessagesMutationVariables>;
export const MarkAllUserMessagesAsReadDocument = gql`
    mutation MarkAllUserMessagesAsRead($userId: String!) {
  update_messages(
    where: {recipient_id: {_eq: $userId}, is_read: {_eq: false}}
    _set: {is_read: true, read_at: "now()"}
  ) {
    affected_rows
    returning {
      id
      is_read
    }
  }
}
    `;

/**
 * __useMarkAllUserMessagesAsReadMutation__
 *
 * To run a mutation, you first call `useMarkAllUserMessagesAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkAllUserMessagesAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markAllUserMessagesAsReadMutation, { data, loading, error }] = useMarkAllUserMessagesAsReadMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useMarkAllUserMessagesAsReadMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<MarkAllUserMessagesAsReadMutation, MarkAllUserMessagesAsReadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<MarkAllUserMessagesAsReadMutation, MarkAllUserMessagesAsReadMutationVariables>(MarkAllUserMessagesAsReadDocument, options);
      }
export type MarkAllUserMessagesAsReadMutationHookResult = ReturnType<typeof useMarkAllUserMessagesAsReadMutation>;
export type MarkAllUserMessagesAsReadMutationResult = ApolloReactCommon.MutationResult<MarkAllUserMessagesAsReadMutation>;
export type MarkAllUserMessagesAsReadMutationOptions = ApolloReactCommon.BaseMutationOptions<MarkAllUserMessagesAsReadMutation, MarkAllUserMessagesAsReadMutationVariables>;
export const CreateJobDocument = gql`
    mutation CreateJob($data: jobs_insert_input!) {
  insert_jobs_one(object: $data) {
    id
    title
    description
    job_type
    country
    city
    status
    salary_min
    salary_max
    currency
    created_at
    updated_at
  }
}
    `;

/**
 * __useCreateJobMutation__
 *
 * To run a mutation, you first call `useCreateJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createJobMutation, { data, loading, error }] = useCreateJobMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateJobMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateJobMutation, CreateJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateJobMutation, CreateJobMutationVariables>(CreateJobDocument, options);
      }
export type CreateJobMutationHookResult = ReturnType<typeof useCreateJobMutation>;
export type CreateJobMutationResult = ApolloReactCommon.MutationResult<CreateJobMutation>;
export type CreateJobMutationOptions = ApolloReactCommon.BaseMutationOptions<CreateJobMutation, CreateJobMutationVariables>;
export const UpdateJobDocument = gql`
    mutation UpdateJob($id: uuid!, $data: jobs_set_input!) {
  update_jobs_by_pk(pk_columns: {id: $id}, _set: $data) {
    id
    title
    description
    job_type
    country
    city
    status
    salary_min
    salary_max
    currency
    updated_at
  }
}
    `;

/**
 * __useUpdateJobMutation__
 *
 * To run a mutation, you first call `useUpdateJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateJobMutation, { data, loading, error }] = useUpdateJobMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateJobMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateJobMutation, UpdateJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateJobMutation, UpdateJobMutationVariables>(UpdateJobDocument, options);
      }
export type UpdateJobMutationHookResult = ReturnType<typeof useUpdateJobMutation>;
export type UpdateJobMutationResult = ApolloReactCommon.MutationResult<UpdateJobMutation>;
export type UpdateJobMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateJobMutation, UpdateJobMutationVariables>;
export const DeleteJobDocument = gql`
    mutation DeleteJob($id: uuid!) {
  delete_jobs_by_pk(id: $id) {
    id
    title
  }
}
    `;

/**
 * __useDeleteJobMutation__
 *
 * To run a mutation, you first call `useDeleteJobMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteJobMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteJobMutation, { data, loading, error }] = useDeleteJobMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteJobMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteJobMutation, DeleteJobMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteJobMutation, DeleteJobMutationVariables>(DeleteJobDocument, options);
      }
export type DeleteJobMutationHookResult = ReturnType<typeof useDeleteJobMutation>;
export type DeleteJobMutationResult = ApolloReactCommon.MutationResult<DeleteJobMutation>;
export type DeleteJobMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteJobMutation, DeleteJobMutationVariables>;
export const ChangeJobStatusDocument = gql`
    mutation ChangeJobStatus($id: uuid!, $status: String!) {
  update_jobs_by_pk(
    pk_columns: {id: $id}
    _set: {status: $status, updated_at: "now()"}
  ) {
    id
    status
    updated_at
  }
}
    `;

/**
 * __useChangeJobStatusMutation__
 *
 * To run a mutation, you first call `useChangeJobStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useChangeJobStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [changeJobStatusMutation, { data, loading, error }] = useChangeJobStatusMutation({
 *   variables: {
 *      id: // value for 'id'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useChangeJobStatusMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ChangeJobStatusMutation, ChangeJobStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ChangeJobStatusMutation, ChangeJobStatusMutationVariables>(ChangeJobStatusDocument, options);
      }
export type ChangeJobStatusMutationHookResult = ReturnType<typeof useChangeJobStatusMutation>;
export type ChangeJobStatusMutationResult = ApolloReactCommon.MutationResult<ChangeJobStatusMutation>;
export type ChangeJobStatusMutationOptions = ApolloReactCommon.BaseMutationOptions<ChangeJobStatusMutation, ChangeJobStatusMutationVariables>;
export const ToggleJobFeaturedDocument = gql`
    mutation ToggleJobFeatured($id: uuid!, $featured: Boolean!, $featuredUntil: timestamptz) {
  update_jobs_by_pk(
    pk_columns: {id: $id}
    _set: {featured: $featured, featured_until: $featuredUntil, updated_at: "now()"}
  ) {
    id
    featured
    featured_until
    updated_at
  }
}
    `;

/**
 * __useToggleJobFeaturedMutation__
 *
 * To run a mutation, you first call `useToggleJobFeaturedMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useToggleJobFeaturedMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [toggleJobFeaturedMutation, { data, loading, error }] = useToggleJobFeaturedMutation({
 *   variables: {
 *      id: // value for 'id'
 *      featured: // value for 'featured'
 *      featuredUntil: // value for 'featuredUntil'
 *   },
 * });
 */
export function useToggleJobFeaturedMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ToggleJobFeaturedMutation, ToggleJobFeaturedMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ToggleJobFeaturedMutation, ToggleJobFeaturedMutationVariables>(ToggleJobFeaturedDocument, options);
      }
export type ToggleJobFeaturedMutationHookResult = ReturnType<typeof useToggleJobFeaturedMutation>;
export type ToggleJobFeaturedMutationResult = ApolloReactCommon.MutationResult<ToggleJobFeaturedMutation>;
export type ToggleJobFeaturedMutationOptions = ApolloReactCommon.BaseMutationOptions<ToggleJobFeaturedMutation, ToggleJobFeaturedMutationVariables>;
export const IncrementJobViewsDocument = gql`
    mutation IncrementJobViews($id: uuid!) {
  update_jobs_by_pk(pk_columns: {id: $id}, _inc: {views_count: 1}) {
    id
    views_count
  }
}
    `;

/**
 * __useIncrementJobViewsMutation__
 *
 * To run a mutation, you first call `useIncrementJobViewsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIncrementJobViewsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [incrementJobViewsMutation, { data, loading, error }] = useIncrementJobViewsMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useIncrementJobViewsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<IncrementJobViewsMutation, IncrementJobViewsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<IncrementJobViewsMutation, IncrementJobViewsMutationVariables>(IncrementJobViewsDocument, options);
      }
export type IncrementJobViewsMutationHookResult = ReturnType<typeof useIncrementJobViewsMutation>;
export type IncrementJobViewsMutationResult = ApolloReactCommon.MutationResult<IncrementJobViewsMutation>;
export type IncrementJobViewsMutationOptions = ApolloReactCommon.BaseMutationOptions<IncrementJobViewsMutation, IncrementJobViewsMutationVariables>;
export const SubmitApplicationDocument = gql`
    mutation SubmitApplication($data: applications_insert_input!) {
  insert_applications_one(object: $data) {
    id
    job_id
    maid_id
    status
    application_status
    cover_letter
    notes
    created_at
    job {
      id
      title
      sponsor_id
    }
  }
}
    `;

/**
 * __useSubmitApplicationMutation__
 *
 * To run a mutation, you first call `useSubmitApplicationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSubmitApplicationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [submitApplicationMutation, { data, loading, error }] = useSubmitApplicationMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useSubmitApplicationMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SubmitApplicationMutation, SubmitApplicationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<SubmitApplicationMutation, SubmitApplicationMutationVariables>(SubmitApplicationDocument, options);
      }
export type SubmitApplicationMutationHookResult = ReturnType<typeof useSubmitApplicationMutation>;
export type SubmitApplicationMutationResult = ApolloReactCommon.MutationResult<SubmitApplicationMutation>;
export type SubmitApplicationMutationOptions = ApolloReactCommon.BaseMutationOptions<SubmitApplicationMutation, SubmitApplicationMutationVariables>;
export const UpdateApplicationStatusDocument = gql`
    mutation UpdateApplicationStatus($id: uuid!, $status: String!, $notes: String) {
  update_applications_by_pk(
    pk_columns: {id: $id}
    _set: {status: $status, application_status: $status, notes: $notes, updated_at: "now()"}
  ) {
    id
    status
    application_status
    notes
    updated_at
  }
}
    `;

/**
 * __useUpdateApplicationStatusMutation__
 *
 * To run a mutation, you first call `useUpdateApplicationStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateApplicationStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateApplicationStatusMutation, { data, loading, error }] = useUpdateApplicationStatusMutation({
 *   variables: {
 *      id: // value for 'id'
 *      status: // value for 'status'
 *      notes: // value for 'notes'
 *   },
 * });
 */
export function useUpdateApplicationStatusMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateApplicationStatusMutation, UpdateApplicationStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateApplicationStatusMutation, UpdateApplicationStatusMutationVariables>(UpdateApplicationStatusDocument, options);
      }
export type UpdateApplicationStatusMutationHookResult = ReturnType<typeof useUpdateApplicationStatusMutation>;
export type UpdateApplicationStatusMutationResult = ApolloReactCommon.MutationResult<UpdateApplicationStatusMutation>;
export type UpdateApplicationStatusMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateApplicationStatusMutation, UpdateApplicationStatusMutationVariables>;
export const AddApplicationNotesDocument = gql`
    mutation AddApplicationNotes($id: uuid!, $notes: String!) {
  update_applications_by_pk(
    pk_columns: {id: $id}
    _set: {notes: $notes, updated_at: "now()"}
  ) {
    id
    notes
    updated_at
  }
}
    `;

/**
 * __useAddApplicationNotesMutation__
 *
 * To run a mutation, you first call `useAddApplicationNotesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddApplicationNotesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addApplicationNotesMutation, { data, loading, error }] = useAddApplicationNotesMutation({
 *   variables: {
 *      id: // value for 'id'
 *      notes: // value for 'notes'
 *   },
 * });
 */
export function useAddApplicationNotesMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<AddApplicationNotesMutation, AddApplicationNotesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<AddApplicationNotesMutation, AddApplicationNotesMutationVariables>(AddApplicationNotesDocument, options);
      }
export type AddApplicationNotesMutationHookResult = ReturnType<typeof useAddApplicationNotesMutation>;
export type AddApplicationNotesMutationResult = ApolloReactCommon.MutationResult<AddApplicationNotesMutation>;
export type AddApplicationNotesMutationOptions = ApolloReactCommon.BaseMutationOptions<AddApplicationNotesMutation, AddApplicationNotesMutationVariables>;
export const WithdrawApplicationDocument = gql`
    mutation WithdrawApplication($id: uuid!) {
  update_applications_by_pk(
    pk_columns: {id: $id}
    _set: {status: "withdrawn", updated_at: "now()"}
  ) {
    id
    status
    updated_at
  }
}
    `;

/**
 * __useWithdrawApplicationMutation__
 *
 * To run a mutation, you first call `useWithdrawApplicationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useWithdrawApplicationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [withdrawApplicationMutation, { data, loading, error }] = useWithdrawApplicationMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useWithdrawApplicationMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<WithdrawApplicationMutation, WithdrawApplicationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<WithdrawApplicationMutation, WithdrawApplicationMutationVariables>(WithdrawApplicationDocument, options);
      }
export type WithdrawApplicationMutationHookResult = ReturnType<typeof useWithdrawApplicationMutation>;
export type WithdrawApplicationMutationResult = ApolloReactCommon.MutationResult<WithdrawApplicationMutation>;
export type WithdrawApplicationMutationOptions = ApolloReactCommon.BaseMutationOptions<WithdrawApplicationMutation, WithdrawApplicationMutationVariables>;
export const IncrementApplicationsCountDocument = gql`
    mutation IncrementApplicationsCount($jobId: uuid!) {
  update_jobs_by_pk(pk_columns: {id: $jobId}, _inc: {applications_count: 1}) {
    id
    applications_count
  }
}
    `;

/**
 * __useIncrementApplicationsCountMutation__
 *
 * To run a mutation, you first call `useIncrementApplicationsCountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIncrementApplicationsCountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [incrementApplicationsCountMutation, { data, loading, error }] = useIncrementApplicationsCountMutation({
 *   variables: {
 *      jobId: // value for 'jobId'
 *   },
 * });
 */
export function useIncrementApplicationsCountMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<IncrementApplicationsCountMutation, IncrementApplicationsCountMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<IncrementApplicationsCountMutation, IncrementApplicationsCountMutationVariables>(IncrementApplicationsCountDocument, options);
      }
export type IncrementApplicationsCountMutationHookResult = ReturnType<typeof useIncrementApplicationsCountMutation>;
export type IncrementApplicationsCountMutationResult = ApolloReactCommon.MutationResult<IncrementApplicationsCountMutation>;
export type IncrementApplicationsCountMutationOptions = ApolloReactCommon.BaseMutationOptions<IncrementApplicationsCountMutation, IncrementApplicationsCountMutationVariables>;
export const MarkExpiredJobsDocument = gql`
    mutation MarkExpiredJobs {
  update_jobs(
    where: {status: {_eq: "active"}, expires_at: {_lt: "now()"}}
    _set: {status: "expired", updated_at: "now()"}
  ) {
    affected_rows
    returning {
      id
      title
      status
    }
  }
}
    `;

/**
 * __useMarkExpiredJobsMutation__
 *
 * To run a mutation, you first call `useMarkExpiredJobsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkExpiredJobsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markExpiredJobsMutation, { data, loading, error }] = useMarkExpiredJobsMutation({
 *   variables: {
 *   },
 * });
 */
export function useMarkExpiredJobsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<MarkExpiredJobsMutation, MarkExpiredJobsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<MarkExpiredJobsMutation, MarkExpiredJobsMutationVariables>(MarkExpiredJobsDocument, options);
      }
export type MarkExpiredJobsMutationHookResult = ReturnType<typeof useMarkExpiredJobsMutation>;
export type MarkExpiredJobsMutationResult = ApolloReactCommon.MutationResult<MarkExpiredJobsMutation>;
export type MarkExpiredJobsMutationOptions = ApolloReactCommon.BaseMutationOptions<MarkExpiredJobsMutation, MarkExpiredJobsMutationVariables>;
export const UpdateMaidProfileCompleteDocument = gql`
    mutation UpdateMaidProfileComplete($id: String!, $data: maid_profiles_set_input!) {
  update_maid_profiles_by_pk(pk_columns: {id: $id}, _set: $data) {
    id
    full_name
    experience_years
    skills
    languages
    availability_status
    preferred_salary_min
    preferred_salary_max
    about_me
    updated_at
  }
}
    `;

/**
 * __useUpdateMaidProfileCompleteMutation__
 *
 * To run a mutation, you first call `useUpdateMaidProfileCompleteMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMaidProfileCompleteMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMaidProfileCompleteMutation, { data, loading, error }] = useUpdateMaidProfileCompleteMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateMaidProfileCompleteMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateMaidProfileCompleteMutation, UpdateMaidProfileCompleteMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateMaidProfileCompleteMutation, UpdateMaidProfileCompleteMutationVariables>(UpdateMaidProfileCompleteDocument, options);
      }
export type UpdateMaidProfileCompleteMutationHookResult = ReturnType<typeof useUpdateMaidProfileCompleteMutation>;
export type UpdateMaidProfileCompleteMutationResult = ApolloReactCommon.MutationResult<UpdateMaidProfileCompleteMutation>;
export type UpdateMaidProfileCompleteMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateMaidProfileCompleteMutation, UpdateMaidProfileCompleteMutationVariables>;
export const AddToFavoritesDocument = gql`
    mutation AddToFavorites($sponsorId: String!, $maidId: String!) {
  insert_favorites_one(object: {sponsor_id: $sponsorId, maid_id: $maidId}) {
    sponsor_id
    maid_id
    created_at
  }
}
    `;

/**
 * __useAddToFavoritesMutation__
 *
 * To run a mutation, you first call `useAddToFavoritesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddToFavoritesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addToFavoritesMutation, { data, loading, error }] = useAddToFavoritesMutation({
 *   variables: {
 *      sponsorId: // value for 'sponsorId'
 *      maidId: // value for 'maidId'
 *   },
 * });
 */
export function useAddToFavoritesMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<AddToFavoritesMutation, AddToFavoritesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<AddToFavoritesMutation, AddToFavoritesMutationVariables>(AddToFavoritesDocument, options);
      }
export type AddToFavoritesMutationHookResult = ReturnType<typeof useAddToFavoritesMutation>;
export type AddToFavoritesMutationResult = ApolloReactCommon.MutationResult<AddToFavoritesMutation>;
export type AddToFavoritesMutationOptions = ApolloReactCommon.BaseMutationOptions<AddToFavoritesMutation, AddToFavoritesMutationVariables>;
export const RemoveFromFavoritesDocument = gql`
    mutation RemoveFromFavorites($sponsorId: String!, $maidId: String!) {
  delete_favorites(
    where: {sponsor_id: {_eq: $sponsorId}, maid_id: {_eq: $maidId}}
  ) {
    affected_rows
  }
}
    `;

/**
 * __useRemoveFromFavoritesMutation__
 *
 * To run a mutation, you first call `useRemoveFromFavoritesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveFromFavoritesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeFromFavoritesMutation, { data, loading, error }] = useRemoveFromFavoritesMutation({
 *   variables: {
 *      sponsorId: // value for 'sponsorId'
 *      maidId: // value for 'maidId'
 *   },
 * });
 */
export function useRemoveFromFavoritesMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RemoveFromFavoritesMutation, RemoveFromFavoritesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RemoveFromFavoritesMutation, RemoveFromFavoritesMutationVariables>(RemoveFromFavoritesDocument, options);
      }
export type RemoveFromFavoritesMutationHookResult = ReturnType<typeof useRemoveFromFavoritesMutation>;
export type RemoveFromFavoritesMutationResult = ApolloReactCommon.MutationResult<RemoveFromFavoritesMutation>;
export type RemoveFromFavoritesMutationOptions = ApolloReactCommon.BaseMutationOptions<RemoveFromFavoritesMutation, RemoveFromFavoritesMutationVariables>;
export const IncrementMaidProfileViewsDocument = gql`
    mutation IncrementMaidProfileViews($id: String!) {
  update_maid_profiles_by_pk(pk_columns: {id: $id}, _inc: {profile_views: 1}) {
    id
    profile_views
  }
}
    `;

/**
 * __useIncrementMaidProfileViewsMutation__
 *
 * To run a mutation, you first call `useIncrementMaidProfileViewsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIncrementMaidProfileViewsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [incrementMaidProfileViewsMutation, { data, loading, error }] = useIncrementMaidProfileViewsMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useIncrementMaidProfileViewsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<IncrementMaidProfileViewsMutation, IncrementMaidProfileViewsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<IncrementMaidProfileViewsMutation, IncrementMaidProfileViewsMutationVariables>(IncrementMaidProfileViewsDocument, options);
      }
export type IncrementMaidProfileViewsMutationHookResult = ReturnType<typeof useIncrementMaidProfileViewsMutation>;
export type IncrementMaidProfileViewsMutationResult = ApolloReactCommon.MutationResult<IncrementMaidProfileViewsMutation>;
export type IncrementMaidProfileViewsMutationOptions = ApolloReactCommon.BaseMutationOptions<IncrementMaidProfileViewsMutation, IncrementMaidProfileViewsMutationVariables>;
export const UpdateMaidProfileDocument = gql`
    mutation UpdateMaidProfile($id: String!, $data: maid_profiles_set_input!) {
  update_maid_profiles_by_pk(pk_columns: {id: $id}, _set: $data) {
    id
    full_name
    experience_years
    languages
    availability_status
    about_me
    updated_at
  }
}
    `;

/**
 * __useUpdateMaidProfileMutation__
 *
 * To run a mutation, you first call `useUpdateMaidProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMaidProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMaidProfileMutation, { data, loading, error }] = useUpdateMaidProfileMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateMaidProfileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateMaidProfileMutation, UpdateMaidProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateMaidProfileMutation, UpdateMaidProfileMutationVariables>(UpdateMaidProfileDocument, options);
      }
export type UpdateMaidProfileMutationHookResult = ReturnType<typeof useUpdateMaidProfileMutation>;
export type UpdateMaidProfileMutationResult = ApolloReactCommon.MutationResult<UpdateMaidProfileMutation>;
export type UpdateMaidProfileMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateMaidProfileMutation, UpdateMaidProfileMutationVariables>;
export const CreateNotificationDocument = gql`
    mutation CreateNotification($data: notifications_insert_input!) {
  insert_notifications_one(object: $data) {
    id
    user_id
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
 * __useCreateNotificationMutation__
 *
 * To run a mutation, you first call `useCreateNotificationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNotificationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNotificationMutation, { data, loading, error }] = useCreateNotificationMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateNotificationMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateNotificationMutation, CreateNotificationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateNotificationMutation, CreateNotificationMutationVariables>(CreateNotificationDocument, options);
      }
export type CreateNotificationMutationHookResult = ReturnType<typeof useCreateNotificationMutation>;
export type CreateNotificationMutationResult = ApolloReactCommon.MutationResult<CreateNotificationMutation>;
export type CreateNotificationMutationOptions = ApolloReactCommon.BaseMutationOptions<CreateNotificationMutation, CreateNotificationMutationVariables>;
export const CreateMultipleNotificationsDocument = gql`
    mutation CreateMultipleNotifications($data: [notifications_insert_input!]!) {
  insert_notifications(objects: $data) {
    affected_rows
    returning {
      id
      user_id
      type
      title
      message
      priority
      created_at
    }
  }
}
    `;

/**
 * __useCreateMultipleNotificationsMutation__
 *
 * To run a mutation, you first call `useCreateMultipleNotificationsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateMultipleNotificationsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createMultipleNotificationsMutation, { data, loading, error }] = useCreateMultipleNotificationsMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateMultipleNotificationsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateMultipleNotificationsMutation, CreateMultipleNotificationsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateMultipleNotificationsMutation, CreateMultipleNotificationsMutationVariables>(CreateMultipleNotificationsDocument, options);
      }
export type CreateMultipleNotificationsMutationHookResult = ReturnType<typeof useCreateMultipleNotificationsMutation>;
export type CreateMultipleNotificationsMutationResult = ApolloReactCommon.MutationResult<CreateMultipleNotificationsMutation>;
export type CreateMultipleNotificationsMutationOptions = ApolloReactCommon.BaseMutationOptions<CreateMultipleNotificationsMutation, CreateMultipleNotificationsMutationVariables>;
export const UpdateNotificationDocument = gql`
    mutation UpdateNotification($id: uuid!, $data: notifications_set_input!) {
  update_notifications_by_pk(pk_columns: {id: $id}, _set: $data) {
    id
    type
    title
    message
    link
    action_url
    read
    read_at
    priority
    expires_at
  }
}
    `;

/**
 * __useUpdateNotificationMutation__
 *
 * To run a mutation, you first call `useUpdateNotificationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNotificationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNotificationMutation, { data, loading, error }] = useUpdateNotificationMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateNotificationMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateNotificationMutation, UpdateNotificationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateNotificationMutation, UpdateNotificationMutationVariables>(UpdateNotificationDocument, options);
      }
export type UpdateNotificationMutationHookResult = ReturnType<typeof useUpdateNotificationMutation>;
export type UpdateNotificationMutationResult = ApolloReactCommon.MutationResult<UpdateNotificationMutation>;
export type UpdateNotificationMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateNotificationMutation, UpdateNotificationMutationVariables>;
export const MarkNotificationAsReadDocument = gql`
    mutation MarkNotificationAsRead($id: uuid!) {
  update_notifications_by_pk(
    pk_columns: {id: $id}
    _set: {read: true, read_at: "now()"}
  ) {
    id
    read
    read_at
  }
}
    `;

/**
 * __useMarkNotificationAsReadMutation__
 *
 * To run a mutation, you first call `useMarkNotificationAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkNotificationAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markNotificationAsReadMutation, { data, loading, error }] = useMarkNotificationAsReadMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useMarkNotificationAsReadMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>(MarkNotificationAsReadDocument, options);
      }
export type MarkNotificationAsReadMutationHookResult = ReturnType<typeof useMarkNotificationAsReadMutation>;
export type MarkNotificationAsReadMutationResult = ApolloReactCommon.MutationResult<MarkNotificationAsReadMutation>;
export type MarkNotificationAsReadMutationOptions = ApolloReactCommon.BaseMutationOptions<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>;
export const MarkMultipleNotificationsAsReadDocument = gql`
    mutation MarkMultipleNotificationsAsRead($ids: [uuid!]!) {
  update_notifications(
    where: {id: {_in: $ids}}
    _set: {read: true, read_at: "now()"}
  ) {
    affected_rows
    returning {
      id
      read
      read_at
    }
  }
}
    `;

/**
 * __useMarkMultipleNotificationsAsReadMutation__
 *
 * To run a mutation, you first call `useMarkMultipleNotificationsAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkMultipleNotificationsAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markMultipleNotificationsAsReadMutation, { data, loading, error }] = useMarkMultipleNotificationsAsReadMutation({
 *   variables: {
 *      ids: // value for 'ids'
 *   },
 * });
 */
export function useMarkMultipleNotificationsAsReadMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<MarkMultipleNotificationsAsReadMutation, MarkMultipleNotificationsAsReadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<MarkMultipleNotificationsAsReadMutation, MarkMultipleNotificationsAsReadMutationVariables>(MarkMultipleNotificationsAsReadDocument, options);
      }
export type MarkMultipleNotificationsAsReadMutationHookResult = ReturnType<typeof useMarkMultipleNotificationsAsReadMutation>;
export type MarkMultipleNotificationsAsReadMutationResult = ApolloReactCommon.MutationResult<MarkMultipleNotificationsAsReadMutation>;
export type MarkMultipleNotificationsAsReadMutationOptions = ApolloReactCommon.BaseMutationOptions<MarkMultipleNotificationsAsReadMutation, MarkMultipleNotificationsAsReadMutationVariables>;
export const MarkAllUserNotificationsAsReadDocument = gql`
    mutation MarkAllUserNotificationsAsRead($userId: String!) {
  update_notifications(
    where: {user_id: {_eq: $userId}, read: {_eq: false}}
    _set: {read: true, read_at: "now()"}
  ) {
    affected_rows
    returning {
      id
      read
    }
  }
}
    `;

/**
 * __useMarkAllUserNotificationsAsReadMutation__
 *
 * To run a mutation, you first call `useMarkAllUserNotificationsAsReadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkAllUserNotificationsAsReadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markAllUserNotificationsAsReadMutation, { data, loading, error }] = useMarkAllUserNotificationsAsReadMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useMarkAllUserNotificationsAsReadMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<MarkAllUserNotificationsAsReadMutation, MarkAllUserNotificationsAsReadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<MarkAllUserNotificationsAsReadMutation, MarkAllUserNotificationsAsReadMutationVariables>(MarkAllUserNotificationsAsReadDocument, options);
      }
export type MarkAllUserNotificationsAsReadMutationHookResult = ReturnType<typeof useMarkAllUserNotificationsAsReadMutation>;
export type MarkAllUserNotificationsAsReadMutationResult = ApolloReactCommon.MutationResult<MarkAllUserNotificationsAsReadMutation>;
export type MarkAllUserNotificationsAsReadMutationOptions = ApolloReactCommon.BaseMutationOptions<MarkAllUserNotificationsAsReadMutation, MarkAllUserNotificationsAsReadMutationVariables>;
export const MarkNotificationAsUnreadDocument = gql`
    mutation MarkNotificationAsUnread($id: uuid!) {
  update_notifications_by_pk(
    pk_columns: {id: $id}
    _set: {read: false, read_at: null}
  ) {
    id
    read
    read_at
  }
}
    `;

/**
 * __useMarkNotificationAsUnreadMutation__
 *
 * To run a mutation, you first call `useMarkNotificationAsUnreadMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useMarkNotificationAsUnreadMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [markNotificationAsUnreadMutation, { data, loading, error }] = useMarkNotificationAsUnreadMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useMarkNotificationAsUnreadMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<MarkNotificationAsUnreadMutation, MarkNotificationAsUnreadMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<MarkNotificationAsUnreadMutation, MarkNotificationAsUnreadMutationVariables>(MarkNotificationAsUnreadDocument, options);
      }
export type MarkNotificationAsUnreadMutationHookResult = ReturnType<typeof useMarkNotificationAsUnreadMutation>;
export type MarkNotificationAsUnreadMutationResult = ApolloReactCommon.MutationResult<MarkNotificationAsUnreadMutation>;
export type MarkNotificationAsUnreadMutationOptions = ApolloReactCommon.BaseMutationOptions<MarkNotificationAsUnreadMutation, MarkNotificationAsUnreadMutationVariables>;
export const DeleteNotificationDocument = gql`
    mutation DeleteNotification($id: uuid!) {
  delete_notifications_by_pk(id: $id) {
    id
    type
    title
  }
}
    `;

/**
 * __useDeleteNotificationMutation__
 *
 * To run a mutation, you first call `useDeleteNotificationMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteNotificationMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteNotificationMutation, { data, loading, error }] = useDeleteNotificationMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteNotificationMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteNotificationMutation, DeleteNotificationMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteNotificationMutation, DeleteNotificationMutationVariables>(DeleteNotificationDocument, options);
      }
export type DeleteNotificationMutationHookResult = ReturnType<typeof useDeleteNotificationMutation>;
export type DeleteNotificationMutationResult = ApolloReactCommon.MutationResult<DeleteNotificationMutation>;
export type DeleteNotificationMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteNotificationMutation, DeleteNotificationMutationVariables>;
export const DeleteMultipleNotificationsDocument = gql`
    mutation DeleteMultipleNotifications($ids: [uuid!]!) {
  delete_notifications(where: {id: {_in: $ids}}) {
    affected_rows
  }
}
    `;

/**
 * __useDeleteMultipleNotificationsMutation__
 *
 * To run a mutation, you first call `useDeleteMultipleNotificationsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMultipleNotificationsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMultipleNotificationsMutation, { data, loading, error }] = useDeleteMultipleNotificationsMutation({
 *   variables: {
 *      ids: // value for 'ids'
 *   },
 * });
 */
export function useDeleteMultipleNotificationsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteMultipleNotificationsMutation, DeleteMultipleNotificationsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteMultipleNotificationsMutation, DeleteMultipleNotificationsMutationVariables>(DeleteMultipleNotificationsDocument, options);
      }
export type DeleteMultipleNotificationsMutationHookResult = ReturnType<typeof useDeleteMultipleNotificationsMutation>;
export type DeleteMultipleNotificationsMutationResult = ApolloReactCommon.MutationResult<DeleteMultipleNotificationsMutation>;
export type DeleteMultipleNotificationsMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteMultipleNotificationsMutation, DeleteMultipleNotificationsMutationVariables>;
export const DeleteAllReadNotificationsDocument = gql`
    mutation DeleteAllReadNotifications($userId: String!) {
  delete_notifications(where: {user_id: {_eq: $userId}, read: {_eq: true}}) {
    affected_rows
  }
}
    `;

/**
 * __useDeleteAllReadNotificationsMutation__
 *
 * To run a mutation, you first call `useDeleteAllReadNotificationsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAllReadNotificationsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteAllReadNotificationsMutation, { data, loading, error }] = useDeleteAllReadNotificationsMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useDeleteAllReadNotificationsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteAllReadNotificationsMutation, DeleteAllReadNotificationsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteAllReadNotificationsMutation, DeleteAllReadNotificationsMutationVariables>(DeleteAllReadNotificationsDocument, options);
      }
export type DeleteAllReadNotificationsMutationHookResult = ReturnType<typeof useDeleteAllReadNotificationsMutation>;
export type DeleteAllReadNotificationsMutationResult = ApolloReactCommon.MutationResult<DeleteAllReadNotificationsMutation>;
export type DeleteAllReadNotificationsMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteAllReadNotificationsMutation, DeleteAllReadNotificationsMutationVariables>;
export const DeleteExpiredNotificationsDocument = gql`
    mutation DeleteExpiredNotifications($userId: String!) {
  delete_notifications(
    where: {user_id: {_eq: $userId}, expires_at: {_lt: "now()"}}
  ) {
    affected_rows
  }
}
    `;

/**
 * __useDeleteExpiredNotificationsMutation__
 *
 * To run a mutation, you first call `useDeleteExpiredNotificationsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteExpiredNotificationsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteExpiredNotificationsMutation, { data, loading, error }] = useDeleteExpiredNotificationsMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useDeleteExpiredNotificationsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteExpiredNotificationsMutation, DeleteExpiredNotificationsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteExpiredNotificationsMutation, DeleteExpiredNotificationsMutationVariables>(DeleteExpiredNotificationsDocument, options);
      }
export type DeleteExpiredNotificationsMutationHookResult = ReturnType<typeof useDeleteExpiredNotificationsMutation>;
export type DeleteExpiredNotificationsMutationResult = ApolloReactCommon.MutationResult<DeleteExpiredNotificationsMutation>;
export type DeleteExpiredNotificationsMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteExpiredNotificationsMutation, DeleteExpiredNotificationsMutationVariables>;
export const UpdateNotificationPriorityDocument = gql`
    mutation UpdateNotificationPriority($id: uuid!, $priority: String!) {
  update_notifications_by_pk(pk_columns: {id: $id}, _set: {priority: $priority}) {
    id
    priority
  }
}
    `;

/**
 * __useUpdateNotificationPriorityMutation__
 *
 * To run a mutation, you first call `useUpdateNotificationPriorityMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNotificationPriorityMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNotificationPriorityMutation, { data, loading, error }] = useUpdateNotificationPriorityMutation({
 *   variables: {
 *      id: // value for 'id'
 *      priority: // value for 'priority'
 *   },
 * });
 */
export function useUpdateNotificationPriorityMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateNotificationPriorityMutation, UpdateNotificationPriorityMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateNotificationPriorityMutation, UpdateNotificationPriorityMutationVariables>(UpdateNotificationPriorityDocument, options);
      }
export type UpdateNotificationPriorityMutationHookResult = ReturnType<typeof useUpdateNotificationPriorityMutation>;
export type UpdateNotificationPriorityMutationResult = ApolloReactCommon.MutationResult<UpdateNotificationPriorityMutation>;
export type UpdateNotificationPriorityMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateNotificationPriorityMutation, UpdateNotificationPriorityMutationVariables>;
export const CreatePlacementWorkflowDocument = gql`
    mutation CreatePlacementWorkflow($sponsorId: String!, $agencyId: String, $maidId: String!, $platformFeeAmount: numeric!, $platformFeeCurrency: String!) {
  insert_placement_workflows_one(
    object: {sponsor_id: $sponsorId, agency_id: $agencyId, maid_id: $maidId, status: "contact_initiated", platform_fee_amount: $platformFeeAmount, platform_fee_currency: $platformFeeCurrency, fee_status: "pending"}
  ) {
    id
    status
    contact_date
    platform_fee_amount
    platform_fee_currency
    created_at
  }
}
    `;

/**
 * __useCreatePlacementWorkflowMutation__
 *
 * To run a mutation, you first call `useCreatePlacementWorkflowMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePlacementWorkflowMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPlacementWorkflowMutation, { data, loading, error }] = useCreatePlacementWorkflowMutation({
 *   variables: {
 *      sponsorId: // value for 'sponsorId'
 *      agencyId: // value for 'agencyId'
 *      maidId: // value for 'maidId'
 *      platformFeeAmount: // value for 'platformFeeAmount'
 *      platformFeeCurrency: // value for 'platformFeeCurrency'
 *   },
 * });
 */
export function useCreatePlacementWorkflowMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreatePlacementWorkflowMutation, CreatePlacementWorkflowMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreatePlacementWorkflowMutation, CreatePlacementWorkflowMutationVariables>(CreatePlacementWorkflowDocument, options);
      }
export type CreatePlacementWorkflowMutationHookResult = ReturnType<typeof useCreatePlacementWorkflowMutation>;
export type CreatePlacementWorkflowMutationResult = ApolloReactCommon.MutationResult<CreatePlacementWorkflowMutation>;
export type CreatePlacementWorkflowMutationOptions = ApolloReactCommon.BaseMutationOptions<CreatePlacementWorkflowMutation, CreatePlacementWorkflowMutationVariables>;
export const UpdatePlacementWorkflowStatusDocument = gql`
    mutation UpdatePlacementWorkflowStatus($id: uuid!, $status: String!, $feeStatus: String, $notes: jsonb) {
  update_placement_workflows_by_pk(
    pk_columns: {id: $id}
    _set: {status: $status, fee_status: $feeStatus, notes: $notes}
  ) {
    id
    status
    fee_status
    updated_at
  }
}
    `;

/**
 * __useUpdatePlacementWorkflowStatusMutation__
 *
 * To run a mutation, you first call `useUpdatePlacementWorkflowStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePlacementWorkflowStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePlacementWorkflowStatusMutation, { data, loading, error }] = useUpdatePlacementWorkflowStatusMutation({
 *   variables: {
 *      id: // value for 'id'
 *      status: // value for 'status'
 *      feeStatus: // value for 'feeStatus'
 *      notes: // value for 'notes'
 *   },
 * });
 */
export function useUpdatePlacementWorkflowStatusMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdatePlacementWorkflowStatusMutation, UpdatePlacementWorkflowStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdatePlacementWorkflowStatusMutation, UpdatePlacementWorkflowStatusMutationVariables>(UpdatePlacementWorkflowStatusDocument, options);
      }
export type UpdatePlacementWorkflowStatusMutationHookResult = ReturnType<typeof useUpdatePlacementWorkflowStatusMutation>;
export type UpdatePlacementWorkflowStatusMutationResult = ApolloReactCommon.MutationResult<UpdatePlacementWorkflowStatusMutation>;
export type UpdatePlacementWorkflowStatusMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdatePlacementWorkflowStatusMutation, UpdatePlacementWorkflowStatusMutationVariables>;
export const ScheduleInterviewDocument = gql`
    mutation ScheduleInterview($id: uuid!, $interviewDate: timestamptz!) {
  update_placement_workflows_by_pk(
    pk_columns: {id: $id}
    _set: {status: "interview_scheduled", interview_scheduled_date: $interviewDate}
  ) {
    id
    status
    interview_scheduled_date
    updated_at
  }
}
    `;

/**
 * __useScheduleInterviewMutation__
 *
 * To run a mutation, you first call `useScheduleInterviewMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useScheduleInterviewMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [scheduleInterviewMutation, { data, loading, error }] = useScheduleInterviewMutation({
 *   variables: {
 *      id: // value for 'id'
 *      interviewDate: // value for 'interviewDate'
 *   },
 * });
 */
export function useScheduleInterviewMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ScheduleInterviewMutation, ScheduleInterviewMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ScheduleInterviewMutation, ScheduleInterviewMutationVariables>(ScheduleInterviewDocument, options);
      }
export type ScheduleInterviewMutationHookResult = ReturnType<typeof useScheduleInterviewMutation>;
export type ScheduleInterviewMutationResult = ApolloReactCommon.MutationResult<ScheduleInterviewMutation>;
export type ScheduleInterviewMutationOptions = ApolloReactCommon.BaseMutationOptions<ScheduleInterviewMutation, ScheduleInterviewMutationVariables>;
export const CompleteInterviewDocument = gql`
    mutation CompleteInterview($id: uuid!, $outcome: String!) {
  update_placement_workflows_by_pk(
    pk_columns: {id: $id}
    _set: {status: "interview_completed", interview_outcome: $outcome, interview_completed_date: "now()"}
  ) {
    id
    status
    interview_outcome
    interview_completed_date
    updated_at
  }
}
    `;

/**
 * __useCompleteInterviewMutation__
 *
 * To run a mutation, you first call `useCompleteInterviewMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCompleteInterviewMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [completeInterviewMutation, { data, loading, error }] = useCompleteInterviewMutation({
 *   variables: {
 *      id: // value for 'id'
 *      outcome: // value for 'outcome'
 *   },
 * });
 */
export function useCompleteInterviewMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CompleteInterviewMutation, CompleteInterviewMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CompleteInterviewMutation, CompleteInterviewMutationVariables>(CompleteInterviewDocument, options);
      }
export type CompleteInterviewMutationHookResult = ReturnType<typeof useCompleteInterviewMutation>;
export type CompleteInterviewMutationResult = ApolloReactCommon.MutationResult<CompleteInterviewMutation>;
export type CompleteInterviewMutationOptions = ApolloReactCommon.BaseMutationOptions<CompleteInterviewMutation, CompleteInterviewMutationVariables>;
export const StartTrialPeriodDocument = gql`
    mutation StartTrialPeriod($id: uuid!, $trialEndDate: timestamptz!) {
  update_placement_workflows_by_pk(
    pk_columns: {id: $id}
    _set: {status: "trial_started", trial_start_date: "now()", trial_end_date: $trialEndDate, fee_status: "held"}
  ) {
    id
    status
    trial_start_date
    trial_end_date
    fee_status
    updated_at
  }
}
    `;

/**
 * __useStartTrialPeriodMutation__
 *
 * To run a mutation, you first call `useStartTrialPeriodMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useStartTrialPeriodMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [startTrialPeriodMutation, { data, loading, error }] = useStartTrialPeriodMutation({
 *   variables: {
 *      id: // value for 'id'
 *      trialEndDate: // value for 'trialEndDate'
 *   },
 * });
 */
export function useStartTrialPeriodMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<StartTrialPeriodMutation, StartTrialPeriodMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<StartTrialPeriodMutation, StartTrialPeriodMutationVariables>(StartTrialPeriodDocument, options);
      }
export type StartTrialPeriodMutationHookResult = ReturnType<typeof useStartTrialPeriodMutation>;
export type StartTrialPeriodMutationResult = ApolloReactCommon.MutationResult<StartTrialPeriodMutation>;
export type StartTrialPeriodMutationOptions = ApolloReactCommon.BaseMutationOptions<StartTrialPeriodMutation, StartTrialPeriodMutationVariables>;
export const SponsorConfirmPlacementDocument = gql`
    mutation SponsorConfirmPlacement($id: uuid!) {
  update_placement_workflows_by_pk(
    pk_columns: {id: $id}
    _set: {sponsor_confirmed: true}
  ) {
    id
    sponsor_confirmed
    agency_confirmed
    updated_at
  }
}
    `;

/**
 * __useSponsorConfirmPlacementMutation__
 *
 * To run a mutation, you first call `useSponsorConfirmPlacementMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSponsorConfirmPlacementMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [sponsorConfirmPlacementMutation, { data, loading, error }] = useSponsorConfirmPlacementMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useSponsorConfirmPlacementMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<SponsorConfirmPlacementMutation, SponsorConfirmPlacementMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<SponsorConfirmPlacementMutation, SponsorConfirmPlacementMutationVariables>(SponsorConfirmPlacementDocument, options);
      }
export type SponsorConfirmPlacementMutationHookResult = ReturnType<typeof useSponsorConfirmPlacementMutation>;
export type SponsorConfirmPlacementMutationResult = ApolloReactCommon.MutationResult<SponsorConfirmPlacementMutation>;
export type SponsorConfirmPlacementMutationOptions = ApolloReactCommon.BaseMutationOptions<SponsorConfirmPlacementMutation, SponsorConfirmPlacementMutationVariables>;
export const AgencyConfirmPlacementDocument = gql`
    mutation AgencyConfirmPlacement($id: uuid!) {
  update_placement_workflows_by_pk(
    pk_columns: {id: $id}
    _set: {agency_confirmed: true}
  ) {
    id
    sponsor_confirmed
    agency_confirmed
    updated_at
  }
}
    `;

/**
 * __useAgencyConfirmPlacementMutation__
 *
 * To run a mutation, you first call `useAgencyConfirmPlacementMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAgencyConfirmPlacementMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [agencyConfirmPlacementMutation, { data, loading, error }] = useAgencyConfirmPlacementMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useAgencyConfirmPlacementMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<AgencyConfirmPlacementMutation, AgencyConfirmPlacementMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<AgencyConfirmPlacementMutation, AgencyConfirmPlacementMutationVariables>(AgencyConfirmPlacementDocument, options);
      }
export type AgencyConfirmPlacementMutationHookResult = ReturnType<typeof useAgencyConfirmPlacementMutation>;
export type AgencyConfirmPlacementMutationResult = ApolloReactCommon.MutationResult<AgencyConfirmPlacementMutation>;
export type AgencyConfirmPlacementMutationOptions = ApolloReactCommon.BaseMutationOptions<AgencyConfirmPlacementMutation, AgencyConfirmPlacementMutationVariables>;
export const ConfirmPlacementDocument = gql`
    mutation ConfirmPlacement($id: uuid!, $guaranteeEndDate: timestamptz!) {
  update_placement_workflows_by_pk(
    pk_columns: {id: $id}
    _set: {status: "placement_confirmed", trial_outcome: "passed", fee_status: "earned", placement_confirmed_date: "now()", guarantee_end_date: $guaranteeEndDate}
  ) {
    id
    status
    fee_status
    placement_confirmed_date
    guarantee_end_date
    platform_fee_amount
    platform_fee_currency
    agency_id
    maid_id
    sponsor_id
    updated_at
  }
}
    `;

/**
 * __useConfirmPlacementMutation__
 *
 * To run a mutation, you first call `useConfirmPlacementMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useConfirmPlacementMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [confirmPlacementMutation, { data, loading, error }] = useConfirmPlacementMutation({
 *   variables: {
 *      id: // value for 'id'
 *      guaranteeEndDate: // value for 'guaranteeEndDate'
 *   },
 * });
 */
export function useConfirmPlacementMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ConfirmPlacementMutation, ConfirmPlacementMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ConfirmPlacementMutation, ConfirmPlacementMutationVariables>(ConfirmPlacementDocument, options);
      }
export type ConfirmPlacementMutationHookResult = ReturnType<typeof useConfirmPlacementMutation>;
export type ConfirmPlacementMutationResult = ApolloReactCommon.MutationResult<ConfirmPlacementMutation>;
export type ConfirmPlacementMutationOptions = ApolloReactCommon.BaseMutationOptions<ConfirmPlacementMutation, ConfirmPlacementMutationVariables>;
export const FailPlacementDocument = gql`
    mutation FailPlacement($id: uuid!, $reason: String!, $stage: String) {
  update_placement_workflows_by_pk(
    pk_columns: {id: $id}
    _set: {status: "placement_failed", trial_outcome: "failed", fee_status: "returned", failure_reason: $reason, failure_stage: $stage}
  ) {
    id
    status
    fee_status
    failure_reason
    failure_stage
    agency_id
    maid_id
    sponsor_id
    updated_at
  }
}
    `;

/**
 * __useFailPlacementMutation__
 *
 * To run a mutation, you first call `useFailPlacementMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useFailPlacementMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [failPlacementMutation, { data, loading, error }] = useFailPlacementMutation({
 *   variables: {
 *      id: // value for 'id'
 *      reason: // value for 'reason'
 *      stage: // value for 'stage'
 *   },
 * });
 */
export function useFailPlacementMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<FailPlacementMutation, FailPlacementMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<FailPlacementMutation, FailPlacementMutationVariables>(FailPlacementDocument, options);
      }
export type FailPlacementMutationHookResult = ReturnType<typeof useFailPlacementMutation>;
export type FailPlacementMutationResult = ApolloReactCommon.MutationResult<FailPlacementMutation>;
export type FailPlacementMutationOptions = ApolloReactCommon.BaseMutationOptions<FailPlacementMutation, FailPlacementMutationVariables>;
export const UpdateMaidHiredStatusDocument = gql`
    mutation UpdateMaidHiredStatus($maidId: String!, $hiredStatus: String!, $currentPlacementId: uuid, $hiredBySponsorId: String, $hiredDate: timestamptz, $trialStartDate: timestamptz, $trialEndDate: timestamptz) {
  update_maid_profiles(
    where: {id: {_eq: $maidId}}
    _set: {hired_status: $hiredStatus, current_placement_id: $currentPlacementId, hired_by_sponsor_id: $hiredBySponsorId, hired_date: $hiredDate, trial_start_date: $trialStartDate, trial_end_date: $trialEndDate}
  ) {
    affected_rows
    returning {
      id
      hired_status
      current_placement_id
      hired_by_sponsor_id
      hired_date
      trial_start_date
      trial_end_date
    }
  }
}
    `;

/**
 * __useUpdateMaidHiredStatusMutation__
 *
 * To run a mutation, you first call `useUpdateMaidHiredStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMaidHiredStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMaidHiredStatusMutation, { data, loading, error }] = useUpdateMaidHiredStatusMutation({
 *   variables: {
 *      maidId: // value for 'maidId'
 *      hiredStatus: // value for 'hiredStatus'
 *      currentPlacementId: // value for 'currentPlacementId'
 *      hiredBySponsorId: // value for 'hiredBySponsorId'
 *      hiredDate: // value for 'hiredDate'
 *      trialStartDate: // value for 'trialStartDate'
 *      trialEndDate: // value for 'trialEndDate'
 *   },
 * });
 */
export function useUpdateMaidHiredStatusMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateMaidHiredStatusMutation, UpdateMaidHiredStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateMaidHiredStatusMutation, UpdateMaidHiredStatusMutationVariables>(UpdateMaidHiredStatusDocument, options);
      }
export type UpdateMaidHiredStatusMutationHookResult = ReturnType<typeof useUpdateMaidHiredStatusMutation>;
export type UpdateMaidHiredStatusMutationResult = ApolloReactCommon.MutationResult<UpdateMaidHiredStatusMutation>;
export type UpdateMaidHiredStatusMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateMaidHiredStatusMutation, UpdateMaidHiredStatusMutationVariables>;
export const ResetMaidToAvailableDocument = gql`
    mutation ResetMaidToAvailable($maidId: String!) {
  update_maid_profiles(
    where: {id: {_eq: $maidId}}
    _set: {hired_status: "available", current_placement_id: null, hired_by_sponsor_id: null, hired_date: null, trial_start_date: null, trial_end_date: null}
  ) {
    affected_rows
    returning {
      id
      hired_status
    }
  }
}
    `;

/**
 * __useResetMaidToAvailableMutation__
 *
 * To run a mutation, you first call `useResetMaidToAvailableMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useResetMaidToAvailableMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [resetMaidToAvailableMutation, { data, loading, error }] = useResetMaidToAvailableMutation({
 *   variables: {
 *      maidId: // value for 'maidId'
 *   },
 * });
 */
export function useResetMaidToAvailableMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<ResetMaidToAvailableMutation, ResetMaidToAvailableMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<ResetMaidToAvailableMutation, ResetMaidToAvailableMutationVariables>(ResetMaidToAvailableDocument, options);
      }
export type ResetMaidToAvailableMutationHookResult = ReturnType<typeof useResetMaidToAvailableMutation>;
export type ResetMaidToAvailableMutationResult = ApolloReactCommon.MutationResult<ResetMaidToAvailableMutation>;
export type ResetMaidToAvailableMutationOptions = ApolloReactCommon.BaseMutationOptions<ResetMaidToAvailableMutation, ResetMaidToAvailableMutationVariables>;
export const HoldAgencyFeeDocument = gql`
    mutation HoldAgencyFee($id: uuid!) {
  update_placement_workflows_by_pk(
    pk_columns: {id: $id}
    _set: {fee_status: "held"}
  ) {
    id
    fee_status
    platform_fee_amount
    platform_fee_currency
    updated_at
  }
}
    `;

/**
 * __useHoldAgencyFeeMutation__
 *
 * To run a mutation, you first call `useHoldAgencyFeeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useHoldAgencyFeeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [holdAgencyFeeMutation, { data, loading, error }] = useHoldAgencyFeeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useHoldAgencyFeeMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<HoldAgencyFeeMutation, HoldAgencyFeeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<HoldAgencyFeeMutation, HoldAgencyFeeMutationVariables>(HoldAgencyFeeDocument, options);
      }
export type HoldAgencyFeeMutationHookResult = ReturnType<typeof useHoldAgencyFeeMutation>;
export type HoldAgencyFeeMutationResult = ApolloReactCommon.MutationResult<HoldAgencyFeeMutation>;
export type HoldAgencyFeeMutationOptions = ApolloReactCommon.BaseMutationOptions<HoldAgencyFeeMutation, HoldAgencyFeeMutationVariables>;
export const RefundAgencyFeeDocument = gql`
    mutation RefundAgencyFee($id: uuid!) {
  update_placement_workflows_by_pk(
    pk_columns: {id: $id}
    _set: {fee_status: "refunded"}
  ) {
    id
    fee_status
    platform_fee_amount
    platform_fee_currency
    updated_at
  }
}
    `;

/**
 * __useRefundAgencyFeeMutation__
 *
 * To run a mutation, you first call `useRefundAgencyFeeMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRefundAgencyFeeMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [refundAgencyFeeMutation, { data, loading, error }] = useRefundAgencyFeeMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useRefundAgencyFeeMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<RefundAgencyFeeMutation, RefundAgencyFeeMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<RefundAgencyFeeMutation, RefundAgencyFeeMutationVariables>(RefundAgencyFeeDocument, options);
      }
export type RefundAgencyFeeMutationHookResult = ReturnType<typeof useRefundAgencyFeeMutation>;
export type RefundAgencyFeeMutationResult = ApolloReactCommon.MutationResult<RefundAgencyFeeMutation>;
export type RefundAgencyFeeMutationOptions = ApolloReactCommon.BaseMutationOptions<RefundAgencyFeeMutation, RefundAgencyFeeMutationVariables>;
export const UpdateWorkflowNotesDocument = gql`
    mutation UpdateWorkflowNotes($id: uuid!, $notes: jsonb!) {
  update_placement_workflows_by_pk(pk_columns: {id: $id}, _set: {notes: $notes}) {
    id
    notes
    updated_at
  }
}
    `;

/**
 * __useUpdateWorkflowNotesMutation__
 *
 * To run a mutation, you first call `useUpdateWorkflowNotesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateWorkflowNotesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateWorkflowNotesMutation, { data, loading, error }] = useUpdateWorkflowNotesMutation({
 *   variables: {
 *      id: // value for 'id'
 *      notes: // value for 'notes'
 *   },
 * });
 */
export function useUpdateWorkflowNotesMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateWorkflowNotesMutation, UpdateWorkflowNotesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateWorkflowNotesMutation, UpdateWorkflowNotesMutationVariables>(UpdateWorkflowNotesDocument, options);
      }
export type UpdateWorkflowNotesMutationHookResult = ReturnType<typeof useUpdateWorkflowNotesMutation>;
export type UpdateWorkflowNotesMutationResult = ApolloReactCommon.MutationResult<UpdateWorkflowNotesMutation>;
export type UpdateWorkflowNotesMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateWorkflowNotesMutation, UpdateWorkflowNotesMutationVariables>;
export const IncrementReminderCountDocument = gql`
    mutation IncrementReminderCount($id: uuid!) {
  update_placement_workflows_by_pk(
    pk_columns: {id: $id}
    _inc: {reminder_sent_count: 1}
  ) {
    id
    reminder_sent_count
    updated_at
  }
}
    `;

/**
 * __useIncrementReminderCountMutation__
 *
 * To run a mutation, you first call `useIncrementReminderCountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIncrementReminderCountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [incrementReminderCountMutation, { data, loading, error }] = useIncrementReminderCountMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useIncrementReminderCountMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<IncrementReminderCountMutation, IncrementReminderCountMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<IncrementReminderCountMutation, IncrementReminderCountMutationVariables>(IncrementReminderCountDocument, options);
      }
export type IncrementReminderCountMutationHookResult = ReturnType<typeof useIncrementReminderCountMutation>;
export type IncrementReminderCountMutationResult = ApolloReactCommon.MutationResult<IncrementReminderCountMutation>;
export type IncrementReminderCountMutationOptions = ApolloReactCommon.BaseMutationOptions<IncrementReminderCountMutation, IncrementReminderCountMutationVariables>;
export const UpdateMaidProfileDataDocument = gql`
    mutation UpdateMaidProfileData($userId: String!, $maidProfileId: String!, $profileData: profiles_set_input!, $maidData: maid_profiles_set_input!) {
  update_profiles_by_pk(pk_columns: {id: $userId}, _set: $profileData) {
    id
    updated_at
  }
  update_maid_profiles_by_pk(pk_columns: {id: $maidProfileId}, _set: $maidData) {
    id
    user_id
    updated_at
  }
}
    `;

/**
 * __useUpdateMaidProfileDataMutation__
 *
 * To run a mutation, you first call `useUpdateMaidProfileDataMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMaidProfileDataMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMaidProfileDataMutation, { data, loading, error }] = useUpdateMaidProfileDataMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      maidProfileId: // value for 'maidProfileId'
 *      profileData: // value for 'profileData'
 *      maidData: // value for 'maidData'
 *   },
 * });
 */
export function useUpdateMaidProfileDataMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateMaidProfileDataMutation, UpdateMaidProfileDataMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateMaidProfileDataMutation, UpdateMaidProfileDataMutationVariables>(UpdateMaidProfileDataDocument, options);
      }
export type UpdateMaidProfileDataMutationHookResult = ReturnType<typeof useUpdateMaidProfileDataMutation>;
export type UpdateMaidProfileDataMutationResult = ApolloReactCommon.MutationResult<UpdateMaidProfileDataMutation>;
export type UpdateMaidProfileDataMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateMaidProfileDataMutation, UpdateMaidProfileDataMutationVariables>;
export const UpdateSponsorProfileDataDocument = gql`
    mutation UpdateSponsorProfileData($userId: String!, $profileData: profiles_set_input!, $sponsorData: sponsor_profiles_set_input!) {
  update_profiles_by_pk(pk_columns: {id: $userId}, _set: $profileData) {
    id
    updated_at
  }
  update_sponsor_profiles_by_pk(pk_columns: {id: $userId}, _set: $sponsorData) {
    id
    updated_at
  }
}
    `;

/**
 * __useUpdateSponsorProfileDataMutation__
 *
 * To run a mutation, you first call `useUpdateSponsorProfileDataMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSponsorProfileDataMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSponsorProfileDataMutation, { data, loading, error }] = useUpdateSponsorProfileDataMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      profileData: // value for 'profileData'
 *      sponsorData: // value for 'sponsorData'
 *   },
 * });
 */
export function useUpdateSponsorProfileDataMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateSponsorProfileDataMutation, UpdateSponsorProfileDataMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateSponsorProfileDataMutation, UpdateSponsorProfileDataMutationVariables>(UpdateSponsorProfileDataDocument, options);
      }
export type UpdateSponsorProfileDataMutationHookResult = ReturnType<typeof useUpdateSponsorProfileDataMutation>;
export type UpdateSponsorProfileDataMutationResult = ApolloReactCommon.MutationResult<UpdateSponsorProfileDataMutation>;
export type UpdateSponsorProfileDataMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateSponsorProfileDataMutation, UpdateSponsorProfileDataMutationVariables>;
export const UpdateAgencyProfileDataDocument = gql`
    mutation UpdateAgencyProfileData($userId: String!, $profileData: profiles_set_input!, $agencyData: agency_profiles_set_input!) {
  update_profiles_by_pk(pk_columns: {id: $userId}, _set: $profileData) {
    id
    updated_at
  }
  update_agency_profiles_by_pk(pk_columns: {id: $userId}, _set: $agencyData) {
    id
    updated_at
  }
}
    `;

/**
 * __useUpdateAgencyProfileDataMutation__
 *
 * To run a mutation, you first call `useUpdateAgencyProfileDataMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAgencyProfileDataMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAgencyProfileDataMutation, { data, loading, error }] = useUpdateAgencyProfileDataMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      profileData: // value for 'profileData'
 *      agencyData: // value for 'agencyData'
 *   },
 * });
 */
export function useUpdateAgencyProfileDataMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateAgencyProfileDataMutation, UpdateAgencyProfileDataMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateAgencyProfileDataMutation, UpdateAgencyProfileDataMutationVariables>(UpdateAgencyProfileDataDocument, options);
      }
export type UpdateAgencyProfileDataMutationHookResult = ReturnType<typeof useUpdateAgencyProfileDataMutation>;
export type UpdateAgencyProfileDataMutationResult = ApolloReactCommon.MutationResult<UpdateAgencyProfileDataMutation>;
export type UpdateAgencyProfileDataMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateAgencyProfileDataMutation, UpdateAgencyProfileDataMutationVariables>;
export const UpdateProfileAvatarUrlDocument = gql`
    mutation UpdateProfileAvatarUrl($userId: String!, $avatarUrl: String!) {
  update_profiles_by_pk(pk_columns: {id: $userId}, _set: {avatar_url: $avatarUrl}) {
    id
    avatar_url
    updated_at
  }
}
    `;

/**
 * __useUpdateProfileAvatarUrlMutation__
 *
 * To run a mutation, you first call `useUpdateProfileAvatarUrlMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProfileAvatarUrlMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProfileAvatarUrlMutation, { data, loading, error }] = useUpdateProfileAvatarUrlMutation({
 *   variables: {
 *      userId: // value for 'userId'
 *      avatarUrl: // value for 'avatarUrl'
 *   },
 * });
 */
export function useUpdateProfileAvatarUrlMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateProfileAvatarUrlMutation, UpdateProfileAvatarUrlMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateProfileAvatarUrlMutation, UpdateProfileAvatarUrlMutationVariables>(UpdateProfileAvatarUrlDocument, options);
      }
export type UpdateProfileAvatarUrlMutationHookResult = ReturnType<typeof useUpdateProfileAvatarUrlMutation>;
export type UpdateProfileAvatarUrlMutationResult = ApolloReactCommon.MutationResult<UpdateProfileAvatarUrlMutation>;
export type UpdateProfileAvatarUrlMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateProfileAvatarUrlMutation, UpdateProfileAvatarUrlMutationVariables>;
export const CreateSponsorProfileDocument = gql`
    mutation CreateSponsorProfile($data: sponsor_profiles_insert_input!) {
  insert_sponsor_profiles_one(object: $data) {
    id
    full_name
    household_size
    number_of_children
    city
    country
    salary_budget_min
    salary_budget_max
    currency
    identity_verified
    background_check_completed
    created_at
    updated_at
  }
}
    `;

/**
 * __useCreateSponsorProfileMutation__
 *
 * To run a mutation, you first call `useCreateSponsorProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSponsorProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSponsorProfileMutation, { data, loading, error }] = useCreateSponsorProfileMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateSponsorProfileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateSponsorProfileMutation, CreateSponsorProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateSponsorProfileMutation, CreateSponsorProfileMutationVariables>(CreateSponsorProfileDocument, options);
      }
export type CreateSponsorProfileMutationHookResult = ReturnType<typeof useCreateSponsorProfileMutation>;
export type CreateSponsorProfileMutationResult = ApolloReactCommon.MutationResult<CreateSponsorProfileMutation>;
export type CreateSponsorProfileMutationOptions = ApolloReactCommon.BaseMutationOptions<CreateSponsorProfileMutation, CreateSponsorProfileMutationVariables>;
export const UpdateSponsorProfileDocument = gql`
    mutation UpdateSponsorProfile($id: String!, $data: sponsor_profiles_set_input!) {
  update_sponsor_profiles_by_pk(pk_columns: {id: $id}, _set: $data) {
    id
    full_name
    household_size
    number_of_children
    children_ages
    elderly_care_needed
    pets
    pet_types
    city
    country
    address
    accommodation_type
    preferred_nationality
    preferred_experience_years
    required_skills
    preferred_languages
    salary_budget_min
    salary_budget_max
    currency
    live_in_required
    working_hours_per_day
    days_off_per_week
    overtime_available
    additional_benefits
    identity_verified
    background_check_completed
    active_job_postings
    total_hires
    average_rating
    updated_at
  }
}
    `;

/**
 * __useUpdateSponsorProfileMutation__
 *
 * To run a mutation, you first call `useUpdateSponsorProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSponsorProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSponsorProfileMutation, { data, loading, error }] = useUpdateSponsorProfileMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateSponsorProfileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateSponsorProfileMutation, UpdateSponsorProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateSponsorProfileMutation, UpdateSponsorProfileMutationVariables>(UpdateSponsorProfileDocument, options);
      }
export type UpdateSponsorProfileMutationHookResult = ReturnType<typeof useUpdateSponsorProfileMutation>;
export type UpdateSponsorProfileMutationResult = ApolloReactCommon.MutationResult<UpdateSponsorProfileMutation>;
export type UpdateSponsorProfileMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateSponsorProfileMutation, UpdateSponsorProfileMutationVariables>;
export const DeleteSponsorProfileDocument = gql`
    mutation DeleteSponsorProfile($id: String!) {
  delete_sponsor_profiles_by_pk(id: $id) {
    id
  }
}
    `;

/**
 * __useDeleteSponsorProfileMutation__
 *
 * To run a mutation, you first call `useDeleteSponsorProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteSponsorProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteSponsorProfileMutation, { data, loading, error }] = useDeleteSponsorProfileMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteSponsorProfileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteSponsorProfileMutation, DeleteSponsorProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteSponsorProfileMutation, DeleteSponsorProfileMutationVariables>(DeleteSponsorProfileDocument, options);
      }
export type DeleteSponsorProfileMutationHookResult = ReturnType<typeof useDeleteSponsorProfileMutation>;
export type DeleteSponsorProfileMutationResult = ApolloReactCommon.MutationResult<DeleteSponsorProfileMutation>;
export type DeleteSponsorProfileMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteSponsorProfileMutation, DeleteSponsorProfileMutationVariables>;
export const IncrementActiveJobPostingsDocument = gql`
    mutation IncrementActiveJobPostings($id: String!) {
  update_sponsor_profiles_by_pk(
    pk_columns: {id: $id}
    _inc: {active_job_postings: 1}
  ) {
    id
    active_job_postings
  }
}
    `;

/**
 * __useIncrementActiveJobPostingsMutation__
 *
 * To run a mutation, you first call `useIncrementActiveJobPostingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIncrementActiveJobPostingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [incrementActiveJobPostingsMutation, { data, loading, error }] = useIncrementActiveJobPostingsMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useIncrementActiveJobPostingsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<IncrementActiveJobPostingsMutation, IncrementActiveJobPostingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<IncrementActiveJobPostingsMutation, IncrementActiveJobPostingsMutationVariables>(IncrementActiveJobPostingsDocument, options);
      }
export type IncrementActiveJobPostingsMutationHookResult = ReturnType<typeof useIncrementActiveJobPostingsMutation>;
export type IncrementActiveJobPostingsMutationResult = ApolloReactCommon.MutationResult<IncrementActiveJobPostingsMutation>;
export type IncrementActiveJobPostingsMutationOptions = ApolloReactCommon.BaseMutationOptions<IncrementActiveJobPostingsMutation, IncrementActiveJobPostingsMutationVariables>;
export const DecrementActiveJobPostingsDocument = gql`
    mutation DecrementActiveJobPostings($id: String!) {
  update_sponsor_profiles_by_pk(
    pk_columns: {id: $id}
    _inc: {active_job_postings: -1}
  ) {
    id
    active_job_postings
  }
}
    `;

/**
 * __useDecrementActiveJobPostingsMutation__
 *
 * To run a mutation, you first call `useDecrementActiveJobPostingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDecrementActiveJobPostingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [decrementActiveJobPostingsMutation, { data, loading, error }] = useDecrementActiveJobPostingsMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDecrementActiveJobPostingsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DecrementActiveJobPostingsMutation, DecrementActiveJobPostingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DecrementActiveJobPostingsMutation, DecrementActiveJobPostingsMutationVariables>(DecrementActiveJobPostingsDocument, options);
      }
export type DecrementActiveJobPostingsMutationHookResult = ReturnType<typeof useDecrementActiveJobPostingsMutation>;
export type DecrementActiveJobPostingsMutationResult = ApolloReactCommon.MutationResult<DecrementActiveJobPostingsMutation>;
export type DecrementActiveJobPostingsMutationOptions = ApolloReactCommon.BaseMutationOptions<DecrementActiveJobPostingsMutation, DecrementActiveJobPostingsMutationVariables>;
export const IncrementTotalHiresDocument = gql`
    mutation IncrementTotalHires($id: String!) {
  update_sponsor_profiles_by_pk(pk_columns: {id: $id}, _inc: {total_hires: 1}) {
    id
    total_hires
  }
}
    `;

/**
 * __useIncrementTotalHiresMutation__
 *
 * To run a mutation, you first call `useIncrementTotalHiresMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useIncrementTotalHiresMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [incrementTotalHiresMutation, { data, loading, error }] = useIncrementTotalHiresMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useIncrementTotalHiresMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<IncrementTotalHiresMutation, IncrementTotalHiresMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<IncrementTotalHiresMutation, IncrementTotalHiresMutationVariables>(IncrementTotalHiresDocument, options);
      }
export type IncrementTotalHiresMutationHookResult = ReturnType<typeof useIncrementTotalHiresMutation>;
export type IncrementTotalHiresMutationResult = ApolloReactCommon.MutationResult<IncrementTotalHiresMutation>;
export type IncrementTotalHiresMutationOptions = ApolloReactCommon.BaseMutationOptions<IncrementTotalHiresMutation, IncrementTotalHiresMutationVariables>;
export const UpdateSponsorAverageRatingDocument = gql`
    mutation UpdateSponsorAverageRating($id: String!, $rating: numeric!) {
  update_sponsor_profiles_by_pk(
    pk_columns: {id: $id}
    _set: {average_rating: $rating}
  ) {
    id
    average_rating
  }
}
    `;

/**
 * __useUpdateSponsorAverageRatingMutation__
 *
 * To run a mutation, you first call `useUpdateSponsorAverageRatingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateSponsorAverageRatingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateSponsorAverageRatingMutation, { data, loading, error }] = useUpdateSponsorAverageRatingMutation({
 *   variables: {
 *      id: // value for 'id'
 *      rating: // value for 'rating'
 *   },
 * });
 */
export function useUpdateSponsorAverageRatingMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateSponsorAverageRatingMutation, UpdateSponsorAverageRatingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateSponsorAverageRatingMutation, UpdateSponsorAverageRatingMutationVariables>(UpdateSponsorAverageRatingDocument, options);
      }
export type UpdateSponsorAverageRatingMutationHookResult = ReturnType<typeof useUpdateSponsorAverageRatingMutation>;
export type UpdateSponsorAverageRatingMutationResult = ApolloReactCommon.MutationResult<UpdateSponsorAverageRatingMutation>;
export type UpdateSponsorAverageRatingMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateSponsorAverageRatingMutation, UpdateSponsorAverageRatingMutationVariables>;
export const InsertWhatsAppMessageDocument = gql`
    mutation InsertWhatsAppMessage($data: whatsapp_messages_insert_input!) {
  insert_whatsapp_messages_one(object: $data) {
    id
    phone_number
    message_content
    message_type
    sender
    received_at
    ai_response
    processed
    created_at
  }
}
    `;

/**
 * __useInsertWhatsAppMessageMutation__
 *
 * To run a mutation, you first call `useInsertWhatsAppMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInsertWhatsAppMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [insertWhatsAppMessageMutation, { data, loading, error }] = useInsertWhatsAppMessageMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useInsertWhatsAppMessageMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<InsertWhatsAppMessageMutation, InsertWhatsAppMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<InsertWhatsAppMessageMutation, InsertWhatsAppMessageMutationVariables>(InsertWhatsAppMessageDocument, options);
      }
export type InsertWhatsAppMessageMutationHookResult = ReturnType<typeof useInsertWhatsAppMessageMutation>;
export type InsertWhatsAppMessageMutationResult = ApolloReactCommon.MutationResult<InsertWhatsAppMessageMutation>;
export type InsertWhatsAppMessageMutationOptions = ApolloReactCommon.BaseMutationOptions<InsertWhatsAppMessageMutation, InsertWhatsAppMessageMutationVariables>;
export const UpdateWhatsAppMessageDocument = gql`
    mutation UpdateWhatsAppMessage($id: uuid!, $data: whatsapp_messages_set_input!) {
  update_whatsapp_messages_by_pk(pk_columns: {id: $id}, _set: $data) {
    id
    processed
    ai_response
  }
}
    `;

/**
 * __useUpdateWhatsAppMessageMutation__
 *
 * To run a mutation, you first call `useUpdateWhatsAppMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateWhatsAppMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateWhatsAppMessageMutation, { data, loading, error }] = useUpdateWhatsAppMessageMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateWhatsAppMessageMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateWhatsAppMessageMutation, UpdateWhatsAppMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateWhatsAppMessageMutation, UpdateWhatsAppMessageMutationVariables>(UpdateWhatsAppMessageDocument, options);
      }
export type UpdateWhatsAppMessageMutationHookResult = ReturnType<typeof useUpdateWhatsAppMessageMutation>;
export type UpdateWhatsAppMessageMutationResult = ApolloReactCommon.MutationResult<UpdateWhatsAppMessageMutation>;
export type UpdateWhatsAppMessageMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateWhatsAppMessageMutation, UpdateWhatsAppMessageMutationVariables>;
export const CreateMaidBookingDocument = gql`
    mutation CreateMaidBooking($data: maid_bookings_insert_input!) {
  insert_maid_bookings_one(object: $data) {
    id
    phone_number
    sponsor_name
    sponsor_id
    maid_id
    maid_name
    booking_type
    booking_date
    status
    notes
    metadata
    created_at
  }
}
    `;

/**
 * __useCreateMaidBookingMutation__
 *
 * To run a mutation, you first call `useCreateMaidBookingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateMaidBookingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createMaidBookingMutation, { data, loading, error }] = useCreateMaidBookingMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateMaidBookingMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<CreateMaidBookingMutation, CreateMaidBookingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<CreateMaidBookingMutation, CreateMaidBookingMutationVariables>(CreateMaidBookingDocument, options);
      }
export type CreateMaidBookingMutationHookResult = ReturnType<typeof useCreateMaidBookingMutation>;
export type CreateMaidBookingMutationResult = ApolloReactCommon.MutationResult<CreateMaidBookingMutation>;
export type CreateMaidBookingMutationOptions = ApolloReactCommon.BaseMutationOptions<CreateMaidBookingMutation, CreateMaidBookingMutationVariables>;
export const UpdateMaidBookingDocument = gql`
    mutation UpdateMaidBooking($id: uuid!, $data: maid_bookings_set_input!) {
  update_maid_bookings_by_pk(pk_columns: {id: $id}, _set: $data) {
    id
    status
    maid_name
    sponsor_name
    booking_date
    booking_type
    notes
    metadata
    updated_at
  }
}
    `;

/**
 * __useUpdateMaidBookingMutation__
 *
 * To run a mutation, you first call `useUpdateMaidBookingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMaidBookingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMaidBookingMutation, { data, loading, error }] = useUpdateMaidBookingMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateMaidBookingMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateMaidBookingMutation, UpdateMaidBookingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateMaidBookingMutation, UpdateMaidBookingMutationVariables>(UpdateMaidBookingDocument, options);
      }
export type UpdateMaidBookingMutationHookResult = ReturnType<typeof useUpdateMaidBookingMutation>;
export type UpdateMaidBookingMutationResult = ApolloReactCommon.MutationResult<UpdateMaidBookingMutation>;
export type UpdateMaidBookingMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateMaidBookingMutation, UpdateMaidBookingMutationVariables>;
export const UpdateMaidBookingStatusDocument = gql`
    mutation UpdateMaidBookingStatus($id: uuid!, $status: String!, $notes: String) {
  update_maid_bookings_by_pk(
    pk_columns: {id: $id}
    _set: {status: $status, notes: $notes, updated_at: "now()"}
  ) {
    id
    status
    notes
    updated_at
  }
}
    `;

/**
 * __useUpdateMaidBookingStatusMutation__
 *
 * To run a mutation, you first call `useUpdateMaidBookingStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateMaidBookingStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateMaidBookingStatusMutation, { data, loading, error }] = useUpdateMaidBookingStatusMutation({
 *   variables: {
 *      id: // value for 'id'
 *      status: // value for 'status'
 *      notes: // value for 'notes'
 *   },
 * });
 */
export function useUpdateMaidBookingStatusMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateMaidBookingStatusMutation, UpdateMaidBookingStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateMaidBookingStatusMutation, UpdateMaidBookingStatusMutationVariables>(UpdateMaidBookingStatusDocument, options);
      }
export type UpdateMaidBookingStatusMutationHookResult = ReturnType<typeof useUpdateMaidBookingStatusMutation>;
export type UpdateMaidBookingStatusMutationResult = ApolloReactCommon.MutationResult<UpdateMaidBookingStatusMutation>;
export type UpdateMaidBookingStatusMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateMaidBookingStatusMutation, UpdateMaidBookingStatusMutationVariables>;
export const DeleteMaidBookingDocument = gql`
    mutation DeleteMaidBooking($id: uuid!) {
  delete_maid_bookings_by_pk(id: $id) {
    id
  }
}
    `;

/**
 * __useDeleteMaidBookingMutation__
 *
 * To run a mutation, you first call `useDeleteMaidBookingMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteMaidBookingMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteMaidBookingMutation, { data, loading, error }] = useDeleteMaidBookingMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteMaidBookingMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteMaidBookingMutation, DeleteMaidBookingMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteMaidBookingMutation, DeleteMaidBookingMutationVariables>(DeleteMaidBookingDocument, options);
      }
export type DeleteMaidBookingMutationHookResult = ReturnType<typeof useDeleteMaidBookingMutation>;
export type DeleteMaidBookingMutationResult = ApolloReactCommon.MutationResult<DeleteMaidBookingMutation>;
export type DeleteMaidBookingMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteMaidBookingMutation, DeleteMaidBookingMutationVariables>;
export const BulkUpdateMaidBookingStatusDocument = gql`
    mutation BulkUpdateMaidBookingStatus($ids: [uuid!]!, $status: String!) {
  update_maid_bookings(
    where: {id: {_in: $ids}}
    _set: {status: $status, updated_at: "now()"}
  ) {
    affected_rows
    returning {
      id
      status
      updated_at
    }
  }
}
    `;

/**
 * __useBulkUpdateMaidBookingStatusMutation__
 *
 * To run a mutation, you first call `useBulkUpdateMaidBookingStatusMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBulkUpdateMaidBookingStatusMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [bulkUpdateMaidBookingStatusMutation, { data, loading, error }] = useBulkUpdateMaidBookingStatusMutation({
 *   variables: {
 *      ids: // value for 'ids'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useBulkUpdateMaidBookingStatusMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<BulkUpdateMaidBookingStatusMutation, BulkUpdateMaidBookingStatusMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<BulkUpdateMaidBookingStatusMutation, BulkUpdateMaidBookingStatusMutationVariables>(BulkUpdateMaidBookingStatusDocument, options);
      }
export type BulkUpdateMaidBookingStatusMutationHookResult = ReturnType<typeof useBulkUpdateMaidBookingStatusMutation>;
export type BulkUpdateMaidBookingStatusMutationResult = ApolloReactCommon.MutationResult<BulkUpdateMaidBookingStatusMutation>;
export type BulkUpdateMaidBookingStatusMutationOptions = ApolloReactCommon.BaseMutationOptions<BulkUpdateMaidBookingStatusMutation, BulkUpdateMaidBookingStatusMutationVariables>;
export const UpdatePlatformSettingsDocument = gql`
    mutation UpdatePlatformSettings($id: uuid!, $data: platform_settings_set_input!) {
  update_platform_settings_by_pk(pk_columns: {id: $id}, _set: $data) {
    id
    platform_name
    about_platform
    support_email
    support_phone
    working_hours
    available_services
    ai_model
    ai_temperature
    max_context_messages
    max_tokens
    auto_response_enabled
    business_hours_only
    greeting_message
    offline_message
    error_message
    whatsapp_webhook_url
    validate_signature
    rate_limiting_enabled
    rate_limit
    notify_new_messages
    notify_bookings
    notify_errors
    notification_email
    auto_confirm_bookings
    send_reminders
    send_followups
    debug_mode
    store_ai_responses
    allowed_numbers
    blocked_numbers
    cache_timeout
    timeout
    updated_at
  }
}
    `;

/**
 * __useUpdatePlatformSettingsMutation__
 *
 * To run a mutation, you first call `useUpdatePlatformSettingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePlatformSettingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePlatformSettingsMutation, { data, loading, error }] = useUpdatePlatformSettingsMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdatePlatformSettingsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdatePlatformSettingsMutation, UpdatePlatformSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdatePlatformSettingsMutation, UpdatePlatformSettingsMutationVariables>(UpdatePlatformSettingsDocument, options);
      }
export type UpdatePlatformSettingsMutationHookResult = ReturnType<typeof useUpdatePlatformSettingsMutation>;
export type UpdatePlatformSettingsMutationResult = ApolloReactCommon.MutationResult<UpdatePlatformSettingsMutation>;
export type UpdatePlatformSettingsMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdatePlatformSettingsMutation, UpdatePlatformSettingsMutationVariables>;
export const InsertPlatformSettingsDocument = gql`
    mutation InsertPlatformSettings($data: platform_settings_insert_input!) {
  insert_platform_settings_one(object: $data) {
    id
    platform_name
    created_at
  }
}
    `;

/**
 * __useInsertPlatformSettingsMutation__
 *
 * To run a mutation, you first call `useInsertPlatformSettingsMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useInsertPlatformSettingsMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [insertPlatformSettingsMutation, { data, loading, error }] = useInsertPlatformSettingsMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useInsertPlatformSettingsMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<InsertPlatformSettingsMutation, InsertPlatformSettingsMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<InsertPlatformSettingsMutation, InsertPlatformSettingsMutationVariables>(InsertPlatformSettingsDocument, options);
      }
export type InsertPlatformSettingsMutationHookResult = ReturnType<typeof useInsertPlatformSettingsMutation>;
export type InsertPlatformSettingsMutationResult = ApolloReactCommon.MutationResult<InsertPlatformSettingsMutation>;
export type InsertPlatformSettingsMutationOptions = ApolloReactCommon.BaseMutationOptions<InsertPlatformSettingsMutation, InsertPlatformSettingsMutationVariables>;
export const DeleteWhatsAppMessageDocument = gql`
    mutation DeleteWhatsAppMessage($id: uuid!) {
  delete_whatsapp_messages_by_pk(id: $id) {
    id
  }
}
    `;

/**
 * __useDeleteWhatsAppMessageMutation__
 *
 * To run a mutation, you first call `useDeleteWhatsAppMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteWhatsAppMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteWhatsAppMessageMutation, { data, loading, error }] = useDeleteWhatsAppMessageMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteWhatsAppMessageMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<DeleteWhatsAppMessageMutation, DeleteWhatsAppMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<DeleteWhatsAppMessageMutation, DeleteWhatsAppMessageMutationVariables>(DeleteWhatsAppMessageDocument, options);
      }
export type DeleteWhatsAppMessageMutationHookResult = ReturnType<typeof useDeleteWhatsAppMessageMutation>;
export type DeleteWhatsAppMessageMutationResult = ApolloReactCommon.MutationResult<DeleteWhatsAppMessageMutation>;
export type DeleteWhatsAppMessageMutationOptions = ApolloReactCommon.BaseMutationOptions<DeleteWhatsAppMessageMutation, DeleteWhatsAppMessageMutationVariables>;
export const BulkDeleteWhatsAppMessagesDocument = gql`
    mutation BulkDeleteWhatsAppMessages($phoneNumber: String!) {
  delete_whatsapp_messages(where: {phone_number: {_eq: $phoneNumber}}) {
    affected_rows
  }
}
    `;

/**
 * __useBulkDeleteWhatsAppMessagesMutation__
 *
 * To run a mutation, you first call `useBulkDeleteWhatsAppMessagesMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBulkDeleteWhatsAppMessagesMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [bulkDeleteWhatsAppMessagesMutation, { data, loading, error }] = useBulkDeleteWhatsAppMessagesMutation({
 *   variables: {
 *      phoneNumber: // value for 'phoneNumber'
 *   },
 * });
 */
export function useBulkDeleteWhatsAppMessagesMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<BulkDeleteWhatsAppMessagesMutation, BulkDeleteWhatsAppMessagesMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<BulkDeleteWhatsAppMessagesMutation, BulkDeleteWhatsAppMessagesMutationVariables>(BulkDeleteWhatsAppMessagesDocument, options);
      }
export type BulkDeleteWhatsAppMessagesMutationHookResult = ReturnType<typeof useBulkDeleteWhatsAppMessagesMutation>;
export type BulkDeleteWhatsAppMessagesMutationResult = ApolloReactCommon.MutationResult<BulkDeleteWhatsAppMessagesMutation>;
export type BulkDeleteWhatsAppMessagesMutationOptions = ApolloReactCommon.BaseMutationOptions<BulkDeleteWhatsAppMessagesMutation, BulkDeleteWhatsAppMessagesMutationVariables>;
export const GetAgencyProfileCompleteDocument = gql`
    query GetAgencyProfileComplete($id: String!) {
  agency_profiles_by_pk(id: $id) {
    id
    full_name
    license_number
    registration_country
    established_year
    business_address
    business_phone
    business_email
    website_url
    contact_person_name
    contact_person_title
    head_office_address
    agency_description
    support_hours_start
    support_hours_end
    emergency_contact_phone
    authorized_person_name
    authorized_person_position
    authorized_person_phone
    authorized_person_email
    authorized_person_id_number
    contact_phone_verified
    official_email_verified
    authorized_person_phone_verified
    authorized_person_email_verified
    specialization
    service_countries
    placement_fee_percentage
    guarantee_period_months
    license_verified
    accreditation_bodies
    certifications
    license_expiry_date
    total_maids_managed
    successful_placements
    active_listings
    average_rating
    subscription_tier
    subscription_expires_at
    logo_url
    logo_file_preview
    trade_license_document
    authorized_person_id_document
    agency_contract_template
    trade_license_verification_status
    authorized_person_id_verification_status
    contract_template_verification_status
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetAgencyProfileCompleteQuery__
 *
 * To run a query within a React component, call `useGetAgencyProfileCompleteQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAgencyProfileCompleteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAgencyProfileCompleteQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetAgencyProfileCompleteQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetAgencyProfileCompleteQuery, GetAgencyProfileCompleteQueryVariables> & ({ variables: GetAgencyProfileCompleteQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAgencyProfileCompleteQuery, GetAgencyProfileCompleteQueryVariables>(GetAgencyProfileCompleteDocument, options);
      }
export function useGetAgencyProfileCompleteLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAgencyProfileCompleteQuery, GetAgencyProfileCompleteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAgencyProfileCompleteQuery, GetAgencyProfileCompleteQueryVariables>(GetAgencyProfileCompleteDocument, options);
        }
export function useGetAgencyProfileCompleteSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAgencyProfileCompleteQuery, GetAgencyProfileCompleteQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAgencyProfileCompleteQuery, GetAgencyProfileCompleteQueryVariables>(GetAgencyProfileCompleteDocument, options);
        }
export type GetAgencyProfileCompleteQueryHookResult = ReturnType<typeof useGetAgencyProfileCompleteQuery>;
export type GetAgencyProfileCompleteLazyQueryHookResult = ReturnType<typeof useGetAgencyProfileCompleteLazyQuery>;
export type GetAgencyProfileCompleteSuspenseQueryHookResult = ReturnType<typeof useGetAgencyProfileCompleteSuspenseQuery>;
export type GetAgencyProfileCompleteQueryResult = ApolloReactCommon.QueryResult<GetAgencyProfileCompleteQuery, GetAgencyProfileCompleteQueryVariables>;
export function refetchGetAgencyProfileCompleteQuery(variables: GetAgencyProfileCompleteQueryVariables) {
      return { query: GetAgencyProfileCompleteDocument, variables: variables }
    }
export const GetAgencyProfileDocument = gql`
    query GetAgencyProfile($id: String!) {
  agency_profiles_by_pk(id: $id) {
    id
    full_name
    license_number
    registration_country
    business_phone
    business_email
    website_url
    agency_description
    specialization
    service_countries
    average_rating
    total_maids_managed
    successful_placements
    active_listings
    subscription_tier
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetAgencyProfileQuery__
 *
 * To run a query within a React component, call `useGetAgencyProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAgencyProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAgencyProfileQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetAgencyProfileQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetAgencyProfileQuery, GetAgencyProfileQueryVariables> & ({ variables: GetAgencyProfileQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAgencyProfileQuery, GetAgencyProfileQueryVariables>(GetAgencyProfileDocument, options);
      }
export function useGetAgencyProfileLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAgencyProfileQuery, GetAgencyProfileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAgencyProfileQuery, GetAgencyProfileQueryVariables>(GetAgencyProfileDocument, options);
        }
export function useGetAgencyProfileSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAgencyProfileQuery, GetAgencyProfileQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAgencyProfileQuery, GetAgencyProfileQueryVariables>(GetAgencyProfileDocument, options);
        }
export type GetAgencyProfileQueryHookResult = ReturnType<typeof useGetAgencyProfileQuery>;
export type GetAgencyProfileLazyQueryHookResult = ReturnType<typeof useGetAgencyProfileLazyQuery>;
export type GetAgencyProfileSuspenseQueryHookResult = ReturnType<typeof useGetAgencyProfileSuspenseQuery>;
export type GetAgencyProfileQueryResult = ApolloReactCommon.QueryResult<GetAgencyProfileQuery, GetAgencyProfileQueryVariables>;
export function refetchGetAgencyProfileQuery(variables: GetAgencyProfileQueryVariables) {
      return { query: GetAgencyProfileDocument, variables: variables }
    }
export const ListAgencyProfilesDocument = gql`
    query ListAgencyProfiles($limit: Int = 20, $offset: Int = 0, $where: agency_profiles_bool_exp, $orderBy: [agency_profiles_order_by!] = [{created_at: desc}]) {
  agency_profiles(
    limit: $limit
    offset: $offset
    where: $where
    order_by: $orderBy
  ) {
    id
    full_name
    license_number
    registration_country
    business_phone
    website_url
    specialization
    service_countries
    average_rating
    total_maids_managed
    successful_placements
    license_verified
    subscription_tier
    created_at
  }
  agency_profiles_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useListAgencyProfilesQuery__
 *
 * To run a query within a React component, call `useListAgencyProfilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useListAgencyProfilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListAgencyProfilesQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      where: // value for 'where'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useListAgencyProfilesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<ListAgencyProfilesQuery, ListAgencyProfilesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ListAgencyProfilesQuery, ListAgencyProfilesQueryVariables>(ListAgencyProfilesDocument, options);
      }
export function useListAgencyProfilesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ListAgencyProfilesQuery, ListAgencyProfilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ListAgencyProfilesQuery, ListAgencyProfilesQueryVariables>(ListAgencyProfilesDocument, options);
        }
export function useListAgencyProfilesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ListAgencyProfilesQuery, ListAgencyProfilesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<ListAgencyProfilesQuery, ListAgencyProfilesQueryVariables>(ListAgencyProfilesDocument, options);
        }
export type ListAgencyProfilesQueryHookResult = ReturnType<typeof useListAgencyProfilesQuery>;
export type ListAgencyProfilesLazyQueryHookResult = ReturnType<typeof useListAgencyProfilesLazyQuery>;
export type ListAgencyProfilesSuspenseQueryHookResult = ReturnType<typeof useListAgencyProfilesSuspenseQuery>;
export type ListAgencyProfilesQueryResult = ApolloReactCommon.QueryResult<ListAgencyProfilesQuery, ListAgencyProfilesQueryVariables>;
export function refetchListAgencyProfilesQuery(variables?: ListAgencyProfilesQueryVariables) {
      return { query: ListAgencyProfilesDocument, variables: variables }
    }
export const GetAgencySettingsDocument = gql`
    query GetAgencySettings($id: String!) {
  agency_profiles_by_pk(id: $id) {
    id
    full_name
    business_phone
    business_email
    website_url
    agency_description
    head_office_address
    support_hours_start
    support_hours_end
    emergency_contact_phone
    authorized_person_name
    authorized_person_position
    authorized_person_phone
    authorized_person_email
    contact_phone_verified
    official_email_verified
    authorized_person_phone_verified
    authorized_person_email_verified
    logo_url
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetAgencySettingsQuery__
 *
 * To run a query within a React component, call `useGetAgencySettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAgencySettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAgencySettingsQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetAgencySettingsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetAgencySettingsQuery, GetAgencySettingsQueryVariables> & ({ variables: GetAgencySettingsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAgencySettingsQuery, GetAgencySettingsQueryVariables>(GetAgencySettingsDocument, options);
      }
export function useGetAgencySettingsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAgencySettingsQuery, GetAgencySettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAgencySettingsQuery, GetAgencySettingsQueryVariables>(GetAgencySettingsDocument, options);
        }
export function useGetAgencySettingsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAgencySettingsQuery, GetAgencySettingsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAgencySettingsQuery, GetAgencySettingsQueryVariables>(GetAgencySettingsDocument, options);
        }
export type GetAgencySettingsQueryHookResult = ReturnType<typeof useGetAgencySettingsQuery>;
export type GetAgencySettingsLazyQueryHookResult = ReturnType<typeof useGetAgencySettingsLazyQuery>;
export type GetAgencySettingsSuspenseQueryHookResult = ReturnType<typeof useGetAgencySettingsSuspenseQuery>;
export type GetAgencySettingsQueryResult = ApolloReactCommon.QueryResult<GetAgencySettingsQuery, GetAgencySettingsQueryVariables>;
export function refetchGetAgencySettingsQuery(variables: GetAgencySettingsQueryVariables) {
      return { query: GetAgencySettingsDocument, variables: variables }
    }
export const SearchAgenciesDocument = gql`
    query SearchAgencies($searchTerm: String!, $limit: Int = 10) {
  agency_profiles(
    where: {_or: [{full_name: {_ilike: $searchTerm}}, {registration_country: {_ilike: $searchTerm}}, {service_countries: {_contains: [$searchTerm]}}], license_verified: {_eq: true}}
    limit: $limit
    order_by: [{average_rating: desc_nulls_last}, {created_at: desc}]
  ) {
    id
    full_name
    registration_country
    average_rating
    total_maids_managed
    successful_placements
    specialization
    service_countries
  }
}
    `;

/**
 * __useSearchAgenciesQuery__
 *
 * To run a query within a React component, call `useSearchAgenciesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchAgenciesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchAgenciesQuery({
 *   variables: {
 *      searchTerm: // value for 'searchTerm'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useSearchAgenciesQuery(baseOptions: ApolloReactHooks.QueryHookOptions<SearchAgenciesQuery, SearchAgenciesQueryVariables> & ({ variables: SearchAgenciesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SearchAgenciesQuery, SearchAgenciesQueryVariables>(SearchAgenciesDocument, options);
      }
export function useSearchAgenciesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SearchAgenciesQuery, SearchAgenciesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SearchAgenciesQuery, SearchAgenciesQueryVariables>(SearchAgenciesDocument, options);
        }
export function useSearchAgenciesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<SearchAgenciesQuery, SearchAgenciesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<SearchAgenciesQuery, SearchAgenciesQueryVariables>(SearchAgenciesDocument, options);
        }
export type SearchAgenciesQueryHookResult = ReturnType<typeof useSearchAgenciesQuery>;
export type SearchAgenciesLazyQueryHookResult = ReturnType<typeof useSearchAgenciesLazyQuery>;
export type SearchAgenciesSuspenseQueryHookResult = ReturnType<typeof useSearchAgenciesSuspenseQuery>;
export type SearchAgenciesQueryResult = ApolloReactCommon.QueryResult<SearchAgenciesQuery, SearchAgenciesQueryVariables>;
export function refetchSearchAgenciesQuery(variables: SearchAgenciesQueryVariables) {
      return { query: SearchAgenciesDocument, variables: variables }
    }
export const GetBookingRequestCompleteDocument = gql`
    query GetBookingRequestComplete($id: uuid!) {
  booking_requests_by_pk(id: $id) {
    id
    maid_id
    sponsor_id
    agency_id
    status
    requested_start_date
    requested_duration_months
    offered_salary
    currency
    message
    rejection_reason
    start_date
    end_date
    special_requirements
    amount
    payment_status
    payment_method
    payment_date
    payment_reference
    created_at
    updated_at
    responded_at
  }
}
    `;

/**
 * __useGetBookingRequestCompleteQuery__
 *
 * To run a query within a React component, call `useGetBookingRequestCompleteQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBookingRequestCompleteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBookingRequestCompleteQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetBookingRequestCompleteQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetBookingRequestCompleteQuery, GetBookingRequestCompleteQueryVariables> & ({ variables: GetBookingRequestCompleteQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetBookingRequestCompleteQuery, GetBookingRequestCompleteQueryVariables>(GetBookingRequestCompleteDocument, options);
      }
export function useGetBookingRequestCompleteLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetBookingRequestCompleteQuery, GetBookingRequestCompleteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetBookingRequestCompleteQuery, GetBookingRequestCompleteQueryVariables>(GetBookingRequestCompleteDocument, options);
        }
export function useGetBookingRequestCompleteSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetBookingRequestCompleteQuery, GetBookingRequestCompleteQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetBookingRequestCompleteQuery, GetBookingRequestCompleteQueryVariables>(GetBookingRequestCompleteDocument, options);
        }
export type GetBookingRequestCompleteQueryHookResult = ReturnType<typeof useGetBookingRequestCompleteQuery>;
export type GetBookingRequestCompleteLazyQueryHookResult = ReturnType<typeof useGetBookingRequestCompleteLazyQuery>;
export type GetBookingRequestCompleteSuspenseQueryHookResult = ReturnType<typeof useGetBookingRequestCompleteSuspenseQuery>;
export type GetBookingRequestCompleteQueryResult = ApolloReactCommon.QueryResult<GetBookingRequestCompleteQuery, GetBookingRequestCompleteQueryVariables>;
export function refetchGetBookingRequestCompleteQuery(variables: GetBookingRequestCompleteQueryVariables) {
      return { query: GetBookingRequestCompleteDocument, variables: variables }
    }
export const GetBookingRequestDocument = gql`
    query GetBookingRequest($id: uuid!) {
  booking_requests_by_pk(id: $id) {
    id
    maid_id
    sponsor_id
    status
    start_date
    end_date
    message
    special_requirements
    amount
    currency
    payment_status
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetBookingRequestQuery__
 *
 * To run a query within a React component, call `useGetBookingRequestQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBookingRequestQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBookingRequestQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetBookingRequestQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetBookingRequestQuery, GetBookingRequestQueryVariables> & ({ variables: GetBookingRequestQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetBookingRequestQuery, GetBookingRequestQueryVariables>(GetBookingRequestDocument, options);
      }
export function useGetBookingRequestLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetBookingRequestQuery, GetBookingRequestQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetBookingRequestQuery, GetBookingRequestQueryVariables>(GetBookingRequestDocument, options);
        }
export function useGetBookingRequestSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetBookingRequestQuery, GetBookingRequestQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetBookingRequestQuery, GetBookingRequestQueryVariables>(GetBookingRequestDocument, options);
        }
export type GetBookingRequestQueryHookResult = ReturnType<typeof useGetBookingRequestQuery>;
export type GetBookingRequestLazyQueryHookResult = ReturnType<typeof useGetBookingRequestLazyQuery>;
export type GetBookingRequestSuspenseQueryHookResult = ReturnType<typeof useGetBookingRequestSuspenseQuery>;
export type GetBookingRequestQueryResult = ApolloReactCommon.QueryResult<GetBookingRequestQuery, GetBookingRequestQueryVariables>;
export function refetchGetBookingRequestQuery(variables: GetBookingRequestQueryVariables) {
      return { query: GetBookingRequestDocument, variables: variables }
    }
export const ListBookingRequestsDocument = gql`
    query ListBookingRequests($limit: Int = 20, $offset: Int = 0, $where: booking_requests_bool_exp, $orderBy: [booking_requests_order_by!] = [{created_at: desc}]) {
  booking_requests(
    limit: $limit
    offset: $offset
    where: $where
    order_by: $orderBy
  ) {
    id
    maid_id
    sponsor_id
    status
    start_date
    end_date
    message
    amount
    currency
    payment_status
    created_at
    updated_at
  }
  booking_requests_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useListBookingRequestsQuery__
 *
 * To run a query within a React component, call `useListBookingRequestsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListBookingRequestsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListBookingRequestsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      where: // value for 'where'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useListBookingRequestsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<ListBookingRequestsQuery, ListBookingRequestsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ListBookingRequestsQuery, ListBookingRequestsQueryVariables>(ListBookingRequestsDocument, options);
      }
export function useListBookingRequestsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ListBookingRequestsQuery, ListBookingRequestsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ListBookingRequestsQuery, ListBookingRequestsQueryVariables>(ListBookingRequestsDocument, options);
        }
export function useListBookingRequestsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ListBookingRequestsQuery, ListBookingRequestsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<ListBookingRequestsQuery, ListBookingRequestsQueryVariables>(ListBookingRequestsDocument, options);
        }
export type ListBookingRequestsQueryHookResult = ReturnType<typeof useListBookingRequestsQuery>;
export type ListBookingRequestsLazyQueryHookResult = ReturnType<typeof useListBookingRequestsLazyQuery>;
export type ListBookingRequestsSuspenseQueryHookResult = ReturnType<typeof useListBookingRequestsSuspenseQuery>;
export type ListBookingRequestsQueryResult = ApolloReactCommon.QueryResult<ListBookingRequestsQuery, ListBookingRequestsQueryVariables>;
export function refetchListBookingRequestsQuery(variables?: ListBookingRequestsQueryVariables) {
      return { query: ListBookingRequestsDocument, variables: variables }
    }
export const GetSponsorBookingsDocument = gql`
    query GetSponsorBookings($sponsorId: String!, $limit: Int = 20, $offset: Int = 0) {
  booking_requests(
    where: {sponsor_id: {_eq: $sponsorId}}
    limit: $limit
    offset: $offset
    order_by: [{created_at: desc}]
  ) {
    id
    maid_id
    sponsor_id
    status
    start_date
    end_date
    message
    amount
    currency
    payment_status
    created_at
    updated_at
  }
  booking_requests_aggregate(where: {sponsor_id: {_eq: $sponsorId}}) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetSponsorBookingsQuery__
 *
 * To run a query within a React component, call `useGetSponsorBookingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSponsorBookingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSponsorBookingsQuery({
 *   variables: {
 *      sponsorId: // value for 'sponsorId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetSponsorBookingsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetSponsorBookingsQuery, GetSponsorBookingsQueryVariables> & ({ variables: GetSponsorBookingsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSponsorBookingsQuery, GetSponsorBookingsQueryVariables>(GetSponsorBookingsDocument, options);
      }
export function useGetSponsorBookingsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSponsorBookingsQuery, GetSponsorBookingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSponsorBookingsQuery, GetSponsorBookingsQueryVariables>(GetSponsorBookingsDocument, options);
        }
export function useGetSponsorBookingsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSponsorBookingsQuery, GetSponsorBookingsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSponsorBookingsQuery, GetSponsorBookingsQueryVariables>(GetSponsorBookingsDocument, options);
        }
export type GetSponsorBookingsQueryHookResult = ReturnType<typeof useGetSponsorBookingsQuery>;
export type GetSponsorBookingsLazyQueryHookResult = ReturnType<typeof useGetSponsorBookingsLazyQuery>;
export type GetSponsorBookingsSuspenseQueryHookResult = ReturnType<typeof useGetSponsorBookingsSuspenseQuery>;
export type GetSponsorBookingsQueryResult = ApolloReactCommon.QueryResult<GetSponsorBookingsQuery, GetSponsorBookingsQueryVariables>;
export function refetchGetSponsorBookingsQuery(variables: GetSponsorBookingsQueryVariables) {
      return { query: GetSponsorBookingsDocument, variables: variables }
    }
export const GetMaidBookingsDocument = gql`
    query GetMaidBookings($maidId: String!, $limit: Int = 20, $offset: Int = 0) {
  booking_requests(
    where: {maid_id: {_eq: $maidId}}
    limit: $limit
    offset: $offset
    order_by: [{created_at: desc}]
  ) {
    id
    maid_id
    sponsor_id
    status
    start_date
    end_date
    message
    amount
    currency
    payment_status
    created_at
    updated_at
  }
  booking_requests_aggregate(where: {maid_id: {_eq: $maidId}}) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetMaidBookingsQuery__
 *
 * To run a query within a React component, call `useGetMaidBookingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMaidBookingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMaidBookingsQuery({
 *   variables: {
 *      maidId: // value for 'maidId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetMaidBookingsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetMaidBookingsQuery, GetMaidBookingsQueryVariables> & ({ variables: GetMaidBookingsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMaidBookingsQuery, GetMaidBookingsQueryVariables>(GetMaidBookingsDocument, options);
      }
export function useGetMaidBookingsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMaidBookingsQuery, GetMaidBookingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMaidBookingsQuery, GetMaidBookingsQueryVariables>(GetMaidBookingsDocument, options);
        }
export function useGetMaidBookingsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMaidBookingsQuery, GetMaidBookingsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMaidBookingsQuery, GetMaidBookingsQueryVariables>(GetMaidBookingsDocument, options);
        }
export type GetMaidBookingsQueryHookResult = ReturnType<typeof useGetMaidBookingsQuery>;
export type GetMaidBookingsLazyQueryHookResult = ReturnType<typeof useGetMaidBookingsLazyQuery>;
export type GetMaidBookingsSuspenseQueryHookResult = ReturnType<typeof useGetMaidBookingsSuspenseQuery>;
export type GetMaidBookingsQueryResult = ApolloReactCommon.QueryResult<GetMaidBookingsQuery, GetMaidBookingsQueryVariables>;
export function refetchGetMaidBookingsQuery(variables: GetMaidBookingsQueryVariables) {
      return { query: GetMaidBookingsDocument, variables: variables }
    }
export const GetBookingsByStatusDocument = gql`
    query GetBookingsByStatus($status: String!, $limit: Int = 20, $offset: Int = 0) {
  booking_requests(
    where: {status: {_eq: $status}}
    limit: $limit
    offset: $offset
    order_by: [{created_at: desc}]
  ) {
    id
    maid_id
    sponsor_id
    status
    start_date
    end_date
    message
    amount
    currency
    payment_status
    created_at
    updated_at
  }
  booking_requests_aggregate(where: {status: {_eq: $status}}) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetBookingsByStatusQuery__
 *
 * To run a query within a React component, call `useGetBookingsByStatusQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBookingsByStatusQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBookingsByStatusQuery({
 *   variables: {
 *      status: // value for 'status'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetBookingsByStatusQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetBookingsByStatusQuery, GetBookingsByStatusQueryVariables> & ({ variables: GetBookingsByStatusQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetBookingsByStatusQuery, GetBookingsByStatusQueryVariables>(GetBookingsByStatusDocument, options);
      }
export function useGetBookingsByStatusLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetBookingsByStatusQuery, GetBookingsByStatusQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetBookingsByStatusQuery, GetBookingsByStatusQueryVariables>(GetBookingsByStatusDocument, options);
        }
export function useGetBookingsByStatusSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetBookingsByStatusQuery, GetBookingsByStatusQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetBookingsByStatusQuery, GetBookingsByStatusQueryVariables>(GetBookingsByStatusDocument, options);
        }
export type GetBookingsByStatusQueryHookResult = ReturnType<typeof useGetBookingsByStatusQuery>;
export type GetBookingsByStatusLazyQueryHookResult = ReturnType<typeof useGetBookingsByStatusLazyQuery>;
export type GetBookingsByStatusSuspenseQueryHookResult = ReturnType<typeof useGetBookingsByStatusSuspenseQuery>;
export type GetBookingsByStatusQueryResult = ApolloReactCommon.QueryResult<GetBookingsByStatusQuery, GetBookingsByStatusQueryVariables>;
export function refetchGetBookingsByStatusQuery(variables: GetBookingsByStatusQueryVariables) {
      return { query: GetBookingsByStatusDocument, variables: variables }
    }
export const GetBookingStatisticsDocument = gql`
    query GetBookingStatistics($sponsorId: String) {
  total: booking_requests_aggregate(where: {sponsor_id: {_eq: $sponsorId}}) {
    aggregate {
      count
    }
  }
  pending: booking_requests_aggregate(
    where: {sponsor_id: {_eq: $sponsorId}, status: {_eq: "pending"}}
  ) {
    aggregate {
      count
    }
  }
  accepted: booking_requests_aggregate(
    where: {sponsor_id: {_eq: $sponsorId}, status: {_eq: "accepted"}}
  ) {
    aggregate {
      count
    }
  }
  rejected: booking_requests_aggregate(
    where: {sponsor_id: {_eq: $sponsorId}, status: {_eq: "rejected"}}
  ) {
    aggregate {
      count
    }
  }
  cancelled: booking_requests_aggregate(
    where: {sponsor_id: {_eq: $sponsorId}, status: {_eq: "cancelled"}}
  ) {
    aggregate {
      count
    }
  }
  completed: booking_requests_aggregate(
    where: {sponsor_id: {_eq: $sponsorId}, status: {_eq: "completed"}}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetBookingStatisticsQuery__
 *
 * To run a query within a React component, call `useGetBookingStatisticsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBookingStatisticsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBookingStatisticsQuery({
 *   variables: {
 *      sponsorId: // value for 'sponsorId'
 *   },
 * });
 */
export function useGetBookingStatisticsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetBookingStatisticsQuery, GetBookingStatisticsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetBookingStatisticsQuery, GetBookingStatisticsQueryVariables>(GetBookingStatisticsDocument, options);
      }
export function useGetBookingStatisticsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetBookingStatisticsQuery, GetBookingStatisticsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetBookingStatisticsQuery, GetBookingStatisticsQueryVariables>(GetBookingStatisticsDocument, options);
        }
export function useGetBookingStatisticsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetBookingStatisticsQuery, GetBookingStatisticsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetBookingStatisticsQuery, GetBookingStatisticsQueryVariables>(GetBookingStatisticsDocument, options);
        }
export type GetBookingStatisticsQueryHookResult = ReturnType<typeof useGetBookingStatisticsQuery>;
export type GetBookingStatisticsLazyQueryHookResult = ReturnType<typeof useGetBookingStatisticsLazyQuery>;
export type GetBookingStatisticsSuspenseQueryHookResult = ReturnType<typeof useGetBookingStatisticsSuspenseQuery>;
export type GetBookingStatisticsQueryResult = ApolloReactCommon.QueryResult<GetBookingStatisticsQuery, GetBookingStatisticsQueryVariables>;
export function refetchGetBookingStatisticsQuery(variables?: GetBookingStatisticsQueryVariables) {
      return { query: GetBookingStatisticsDocument, variables: variables }
    }
export const GetConversationDocument = gql`
    query GetConversation($id: uuid!) {
  conversations_by_pk(id: $id) {
    id
    participant1_id
    participant1_type
    participant2_id
    participant2_type
    agency_id
    status
    last_message_at
    last_message_preview
    participant1_unread_count
    participant2_unread_count
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetConversationQuery__
 *
 * To run a query within a React component, call `useGetConversationQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetConversationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetConversationQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetConversationQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetConversationQuery, GetConversationQueryVariables> & ({ variables: GetConversationQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetConversationQuery, GetConversationQueryVariables>(GetConversationDocument, options);
      }
export function useGetConversationLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetConversationQuery, GetConversationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetConversationQuery, GetConversationQueryVariables>(GetConversationDocument, options);
        }
export function useGetConversationSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetConversationQuery, GetConversationQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetConversationQuery, GetConversationQueryVariables>(GetConversationDocument, options);
        }
export type GetConversationQueryHookResult = ReturnType<typeof useGetConversationQuery>;
export type GetConversationLazyQueryHookResult = ReturnType<typeof useGetConversationLazyQuery>;
export type GetConversationSuspenseQueryHookResult = ReturnType<typeof useGetConversationSuspenseQuery>;
export type GetConversationQueryResult = ApolloReactCommon.QueryResult<GetConversationQuery, GetConversationQueryVariables>;
export function refetchGetConversationQuery(variables: GetConversationQueryVariables) {
      return { query: GetConversationDocument, variables: variables }
    }
export const ListUserConversationsDocument = gql`
    query ListUserConversations($userId: String!, $limit: Int = 20, $offset: Int = 0, $status: String = "active") {
  conversations(
    where: {_and: [{_or: [{participant1_id: {_eq: $userId}}, {participant2_id: {_eq: $userId}}]}, {status: {_eq: $status}}]}
    limit: $limit
    offset: $offset
    order_by: [{last_message_at: desc_nulls_last}, {created_at: desc}]
  ) {
    id
    participant1_id
    participant1_type
    participant2_id
    participant2_type
    status
    last_message_at
    last_message_preview
    participant1_unread_count
    participant2_unread_count
    created_at
  }
  conversations_aggregate(
    where: {_and: [{_or: [{participant1_id: {_eq: $userId}}, {participant2_id: {_eq: $userId}}]}, {status: {_eq: $status}}]}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useListUserConversationsQuery__
 *
 * To run a query within a React component, call `useListUserConversationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListUserConversationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListUserConversationsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useListUserConversationsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<ListUserConversationsQuery, ListUserConversationsQueryVariables> & ({ variables: ListUserConversationsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ListUserConversationsQuery, ListUserConversationsQueryVariables>(ListUserConversationsDocument, options);
      }
export function useListUserConversationsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ListUserConversationsQuery, ListUserConversationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ListUserConversationsQuery, ListUserConversationsQueryVariables>(ListUserConversationsDocument, options);
        }
export function useListUserConversationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ListUserConversationsQuery, ListUserConversationsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<ListUserConversationsQuery, ListUserConversationsQueryVariables>(ListUserConversationsDocument, options);
        }
export type ListUserConversationsQueryHookResult = ReturnType<typeof useListUserConversationsQuery>;
export type ListUserConversationsLazyQueryHookResult = ReturnType<typeof useListUserConversationsLazyQuery>;
export type ListUserConversationsSuspenseQueryHookResult = ReturnType<typeof useListUserConversationsSuspenseQuery>;
export type ListUserConversationsQueryResult = ApolloReactCommon.QueryResult<ListUserConversationsQuery, ListUserConversationsQueryVariables>;
export function refetchListUserConversationsQuery(variables: ListUserConversationsQueryVariables) {
      return { query: ListUserConversationsDocument, variables: variables }
    }
export const FindConversationBetweenUsersDocument = gql`
    query FindConversationBetweenUsers($user1Id: String!, $user2Id: String!) {
  conversations(
    where: {_or: [{_and: [{participant1_id: {_eq: $user1Id}}, {participant2_id: {_eq: $user2Id}}]}, {_and: [{participant1_id: {_eq: $user2Id}}, {participant2_id: {_eq: $user1Id}}]}], status: {_neq: "deleted"}}
    limit: 1
  ) {
    id
    participant1_id
    participant1_type
    participant2_id
    participant2_type
    status
    last_message_at
    last_message_preview
    participant1_unread_count
    participant2_unread_count
    created_at
  }
}
    `;

/**
 * __useFindConversationBetweenUsersQuery__
 *
 * To run a query within a React component, call `useFindConversationBetweenUsersQuery` and pass it any options that fit your needs.
 * When your component renders, `useFindConversationBetweenUsersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFindConversationBetweenUsersQuery({
 *   variables: {
 *      user1Id: // value for 'user1Id'
 *      user2Id: // value for 'user2Id'
 *   },
 * });
 */
export function useFindConversationBetweenUsersQuery(baseOptions: ApolloReactHooks.QueryHookOptions<FindConversationBetweenUsersQuery, FindConversationBetweenUsersQueryVariables> & ({ variables: FindConversationBetweenUsersQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<FindConversationBetweenUsersQuery, FindConversationBetweenUsersQueryVariables>(FindConversationBetweenUsersDocument, options);
      }
export function useFindConversationBetweenUsersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<FindConversationBetweenUsersQuery, FindConversationBetweenUsersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<FindConversationBetweenUsersQuery, FindConversationBetweenUsersQueryVariables>(FindConversationBetweenUsersDocument, options);
        }
export function useFindConversationBetweenUsersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<FindConversationBetweenUsersQuery, FindConversationBetweenUsersQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<FindConversationBetweenUsersQuery, FindConversationBetweenUsersQueryVariables>(FindConversationBetweenUsersDocument, options);
        }
export type FindConversationBetweenUsersQueryHookResult = ReturnType<typeof useFindConversationBetweenUsersQuery>;
export type FindConversationBetweenUsersLazyQueryHookResult = ReturnType<typeof useFindConversationBetweenUsersLazyQuery>;
export type FindConversationBetweenUsersSuspenseQueryHookResult = ReturnType<typeof useFindConversationBetweenUsersSuspenseQuery>;
export type FindConversationBetweenUsersQueryResult = ApolloReactCommon.QueryResult<FindConversationBetweenUsersQuery, FindConversationBetweenUsersQueryVariables>;
export function refetchFindConversationBetweenUsersQuery(variables: FindConversationBetweenUsersQueryVariables) {
      return { query: FindConversationBetweenUsersDocument, variables: variables }
    }
export const GetUnreadConversationsCountDocument = gql`
    query GetUnreadConversationsCount($userId: String!) {
  participant1_unread: conversations_aggregate(
    where: {participant1_id: {_eq: $userId}, participant1_unread_count: {_gt: 0}, status: {_eq: "active"}}
  ) {
    aggregate {
      count
      sum {
        participant1_unread_count
      }
    }
  }
  participant2_unread: conversations_aggregate(
    where: {participant2_id: {_eq: $userId}, participant2_unread_count: {_gt: 0}, status: {_eq: "active"}}
  ) {
    aggregate {
      count
      sum {
        participant2_unread_count
      }
    }
  }
}
    `;

/**
 * __useGetUnreadConversationsCountQuery__
 *
 * To run a query within a React component, call `useGetUnreadConversationsCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUnreadConversationsCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUnreadConversationsCountQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUnreadConversationsCountQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUnreadConversationsCountQuery, GetUnreadConversationsCountQueryVariables> & ({ variables: GetUnreadConversationsCountQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUnreadConversationsCountQuery, GetUnreadConversationsCountQueryVariables>(GetUnreadConversationsCountDocument, options);
      }
export function useGetUnreadConversationsCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUnreadConversationsCountQuery, GetUnreadConversationsCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUnreadConversationsCountQuery, GetUnreadConversationsCountQueryVariables>(GetUnreadConversationsCountDocument, options);
        }
export function useGetUnreadConversationsCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUnreadConversationsCountQuery, GetUnreadConversationsCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUnreadConversationsCountQuery, GetUnreadConversationsCountQueryVariables>(GetUnreadConversationsCountDocument, options);
        }
export type GetUnreadConversationsCountQueryHookResult = ReturnType<typeof useGetUnreadConversationsCountQuery>;
export type GetUnreadConversationsCountLazyQueryHookResult = ReturnType<typeof useGetUnreadConversationsCountLazyQuery>;
export type GetUnreadConversationsCountSuspenseQueryHookResult = ReturnType<typeof useGetUnreadConversationsCountSuspenseQuery>;
export type GetUnreadConversationsCountQueryResult = ApolloReactCommon.QueryResult<GetUnreadConversationsCountQuery, GetUnreadConversationsCountQueryVariables>;
export function refetchGetUnreadConversationsCountQuery(variables: GetUnreadConversationsCountQueryVariables) {
      return { query: GetUnreadConversationsCountDocument, variables: variables }
    }
export const GetMessageDocument = gql`
    query GetMessage($id: uuid!) {
  messages(where: {id: {_eq: $id}}, limit: 1) {
    id
    conversation_id
    sender_id
    recipient_id
    subject
    content
    message_type
    job_id
    application_id
    is_read
    read_at
    is_archived
    attachments
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetMessageQuery__
 *
 * To run a query within a React component, call `useGetMessageQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMessageQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMessageQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetMessageQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetMessageQuery, GetMessageQueryVariables> & ({ variables: GetMessageQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMessageQuery, GetMessageQueryVariables>(GetMessageDocument, options);
      }
export function useGetMessageLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMessageQuery, GetMessageQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMessageQuery, GetMessageQueryVariables>(GetMessageDocument, options);
        }
export function useGetMessageSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMessageQuery, GetMessageQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMessageQuery, GetMessageQueryVariables>(GetMessageDocument, options);
        }
export type GetMessageQueryHookResult = ReturnType<typeof useGetMessageQuery>;
export type GetMessageLazyQueryHookResult = ReturnType<typeof useGetMessageLazyQuery>;
export type GetMessageSuspenseQueryHookResult = ReturnType<typeof useGetMessageSuspenseQuery>;
export type GetMessageQueryResult = ApolloReactCommon.QueryResult<GetMessageQuery, GetMessageQueryVariables>;
export function refetchGetMessageQuery(variables: GetMessageQueryVariables) {
      return { query: GetMessageDocument, variables: variables }
    }
export const ListConversationMessagesDocument = gql`
    query ListConversationMessages($conversationId: uuid!, $limit: Int = 50, $offset: Int = 0) {
  messages(
    where: {conversation_id: {_eq: $conversationId}}
    limit: $limit
    offset: $offset
    order_by: [{created_at: asc}]
  ) {
    id
    conversation_id
    sender_id
    recipient_id
    content
    message_type
    is_read
    read_at
    attachments
    created_at
  }
  messages_aggregate(where: {conversation_id: {_eq: $conversationId}}) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useListConversationMessagesQuery__
 *
 * To run a query within a React component, call `useListConversationMessagesQuery` and pass it any options that fit your needs.
 * When your component renders, `useListConversationMessagesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListConversationMessagesQuery({
 *   variables: {
 *      conversationId: // value for 'conversationId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useListConversationMessagesQuery(baseOptions: ApolloReactHooks.QueryHookOptions<ListConversationMessagesQuery, ListConversationMessagesQueryVariables> & ({ variables: ListConversationMessagesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ListConversationMessagesQuery, ListConversationMessagesQueryVariables>(ListConversationMessagesDocument, options);
      }
export function useListConversationMessagesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ListConversationMessagesQuery, ListConversationMessagesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ListConversationMessagesQuery, ListConversationMessagesQueryVariables>(ListConversationMessagesDocument, options);
        }
export function useListConversationMessagesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ListConversationMessagesQuery, ListConversationMessagesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<ListConversationMessagesQuery, ListConversationMessagesQueryVariables>(ListConversationMessagesDocument, options);
        }
export type ListConversationMessagesQueryHookResult = ReturnType<typeof useListConversationMessagesQuery>;
export type ListConversationMessagesLazyQueryHookResult = ReturnType<typeof useListConversationMessagesLazyQuery>;
export type ListConversationMessagesSuspenseQueryHookResult = ReturnType<typeof useListConversationMessagesSuspenseQuery>;
export type ListConversationMessagesQueryResult = ApolloReactCommon.QueryResult<ListConversationMessagesQuery, ListConversationMessagesQueryVariables>;
export function refetchListConversationMessagesQuery(variables: ListConversationMessagesQueryVariables) {
      return { query: ListConversationMessagesDocument, variables: variables }
    }
export const ListUserMessagesDocument = gql`
    query ListUserMessages($userId: String!, $limit: Int = 50, $offset: Int = 0, $isArchived: Boolean = false) {
  messages(
    where: {_or: [{sender_id: {_eq: $userId}}, {recipient_id: {_eq: $userId}}], is_archived: {_eq: $isArchived}}
    limit: $limit
    offset: $offset
    order_by: [{created_at: desc}]
  ) {
    id
    sender_id
    recipient_id
    subject
    content
    message_type
    job_id
    application_id
    is_read
    read_at
    is_archived
    created_at
  }
  messages_aggregate(
    where: {_or: [{sender_id: {_eq: $userId}}, {recipient_id: {_eq: $userId}}], is_archived: {_eq: $isArchived}}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useListUserMessagesQuery__
 *
 * To run a query within a React component, call `useListUserMessagesQuery` and pass it any options that fit your needs.
 * When your component renders, `useListUserMessagesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListUserMessagesQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      isArchived: // value for 'isArchived'
 *   },
 * });
 */
export function useListUserMessagesQuery(baseOptions: ApolloReactHooks.QueryHookOptions<ListUserMessagesQuery, ListUserMessagesQueryVariables> & ({ variables: ListUserMessagesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ListUserMessagesQuery, ListUserMessagesQueryVariables>(ListUserMessagesDocument, options);
      }
export function useListUserMessagesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ListUserMessagesQuery, ListUserMessagesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ListUserMessagesQuery, ListUserMessagesQueryVariables>(ListUserMessagesDocument, options);
        }
export function useListUserMessagesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ListUserMessagesQuery, ListUserMessagesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<ListUserMessagesQuery, ListUserMessagesQueryVariables>(ListUserMessagesDocument, options);
        }
export type ListUserMessagesQueryHookResult = ReturnType<typeof useListUserMessagesQuery>;
export type ListUserMessagesLazyQueryHookResult = ReturnType<typeof useListUserMessagesLazyQuery>;
export type ListUserMessagesSuspenseQueryHookResult = ReturnType<typeof useListUserMessagesSuspenseQuery>;
export type ListUserMessagesQueryResult = ApolloReactCommon.QueryResult<ListUserMessagesQuery, ListUserMessagesQueryVariables>;
export function refetchListUserMessagesQuery(variables: ListUserMessagesQueryVariables) {
      return { query: ListUserMessagesDocument, variables: variables }
    }
export const GetUnreadMessagesCountDocument = gql`
    query GetUnreadMessagesCount($userId: String!) {
  messages_aggregate(
    where: {recipient_id: {_eq: $userId}, is_read: {_eq: false}, is_archived: {_eq: false}}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetUnreadMessagesCountQuery__
 *
 * To run a query within a React component, call `useGetUnreadMessagesCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUnreadMessagesCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUnreadMessagesCountQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUnreadMessagesCountQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUnreadMessagesCountQuery, GetUnreadMessagesCountQueryVariables> & ({ variables: GetUnreadMessagesCountQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUnreadMessagesCountQuery, GetUnreadMessagesCountQueryVariables>(GetUnreadMessagesCountDocument, options);
      }
export function useGetUnreadMessagesCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUnreadMessagesCountQuery, GetUnreadMessagesCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUnreadMessagesCountQuery, GetUnreadMessagesCountQueryVariables>(GetUnreadMessagesCountDocument, options);
        }
export function useGetUnreadMessagesCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUnreadMessagesCountQuery, GetUnreadMessagesCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUnreadMessagesCountQuery, GetUnreadMessagesCountQueryVariables>(GetUnreadMessagesCountDocument, options);
        }
export type GetUnreadMessagesCountQueryHookResult = ReturnType<typeof useGetUnreadMessagesCountQuery>;
export type GetUnreadMessagesCountLazyQueryHookResult = ReturnType<typeof useGetUnreadMessagesCountLazyQuery>;
export type GetUnreadMessagesCountSuspenseQueryHookResult = ReturnType<typeof useGetUnreadMessagesCountSuspenseQuery>;
export type GetUnreadMessagesCountQueryResult = ApolloReactCommon.QueryResult<GetUnreadMessagesCountQuery, GetUnreadMessagesCountQueryVariables>;
export function refetchGetUnreadMessagesCountQuery(variables: GetUnreadMessagesCountQueryVariables) {
      return { query: GetUnreadMessagesCountDocument, variables: variables }
    }
export const SearchMessagesDocument = gql`
    query SearchMessages($userId: String!, $searchTerm: String!, $limit: Int = 20) {
  messages(
    where: {_or: [{sender_id: {_eq: $userId}}, {recipient_id: {_eq: $userId}}], _and: [{_or: [{subject: {_ilike: $searchTerm}}, {content: {_ilike: $searchTerm}}]}]}
    limit: $limit
    order_by: [{created_at: desc}]
  ) {
    id
    sender_id
    recipient_id
    subject
    content
    message_type
    is_read
    created_at
  }
}
    `;

/**
 * __useSearchMessagesQuery__
 *
 * To run a query within a React component, call `useSearchMessagesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchMessagesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchMessagesQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      searchTerm: // value for 'searchTerm'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useSearchMessagesQuery(baseOptions: ApolloReactHooks.QueryHookOptions<SearchMessagesQuery, SearchMessagesQueryVariables> & ({ variables: SearchMessagesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SearchMessagesQuery, SearchMessagesQueryVariables>(SearchMessagesDocument, options);
      }
export function useSearchMessagesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SearchMessagesQuery, SearchMessagesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SearchMessagesQuery, SearchMessagesQueryVariables>(SearchMessagesDocument, options);
        }
export function useSearchMessagesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<SearchMessagesQuery, SearchMessagesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<SearchMessagesQuery, SearchMessagesQueryVariables>(SearchMessagesDocument, options);
        }
export type SearchMessagesQueryHookResult = ReturnType<typeof useSearchMessagesQuery>;
export type SearchMessagesLazyQueryHookResult = ReturnType<typeof useSearchMessagesLazyQuery>;
export type SearchMessagesSuspenseQueryHookResult = ReturnType<typeof useSearchMessagesSuspenseQuery>;
export type SearchMessagesQueryResult = ApolloReactCommon.QueryResult<SearchMessagesQuery, SearchMessagesQueryVariables>;
export function refetchSearchMessagesQuery(variables: SearchMessagesQueryVariables) {
      return { query: SearchMessagesDocument, variables: variables }
    }
export const GetJobCompleteDocument = gql`
    query GetJobComplete($id: uuid!) {
  jobs_by_pk(id: $id) {
    id
    title
    description
    job_type
    country
    city
    address
    required_skills
    preferred_nationality
    languages_required
    minimum_experience_years
    age_preference_min
    age_preference_max
    education_requirement
    working_hours_per_day
    working_days_per_week
    days_off_per_week
    overtime_available
    live_in_required
    salary_min
    salary_max
    currency
    salary_period
    benefits
    contract_duration_months
    start_date
    end_date
    probation_period_months
    status
    urgency_level
    max_applications
    auto_expire_days
    requires_approval
    featured
    featured_until
    expires_at
    applications_count
    views_count
    created_at
    updated_at
    sponsor_profile {
      id
      full_name
      phone_number
      avatar_url
      country
    }
    applications(order_by: {created_at: desc}, limit: 50) {
      id
      status
      application_status
      cover_letter
      notes
      match_score
      offer_amount
      offer_currency
      created_at
      updated_at
      maid_profile {
        id
        first_name
        last_name
        profile_photo_url
        verification_status
      }
    }
  }
}
    `;

/**
 * __useGetJobCompleteQuery__
 *
 * To run a query within a React component, call `useGetJobCompleteQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetJobCompleteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetJobCompleteQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetJobCompleteQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetJobCompleteQuery, GetJobCompleteQueryVariables> & ({ variables: GetJobCompleteQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetJobCompleteQuery, GetJobCompleteQueryVariables>(GetJobCompleteDocument, options);
      }
export function useGetJobCompleteLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetJobCompleteQuery, GetJobCompleteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetJobCompleteQuery, GetJobCompleteQueryVariables>(GetJobCompleteDocument, options);
        }
export function useGetJobCompleteSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetJobCompleteQuery, GetJobCompleteQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetJobCompleteQuery, GetJobCompleteQueryVariables>(GetJobCompleteDocument, options);
        }
export type GetJobCompleteQueryHookResult = ReturnType<typeof useGetJobCompleteQuery>;
export type GetJobCompleteLazyQueryHookResult = ReturnType<typeof useGetJobCompleteLazyQuery>;
export type GetJobCompleteSuspenseQueryHookResult = ReturnType<typeof useGetJobCompleteSuspenseQuery>;
export type GetJobCompleteQueryResult = ApolloReactCommon.QueryResult<GetJobCompleteQuery, GetJobCompleteQueryVariables>;
export function refetchGetJobCompleteQuery(variables: GetJobCompleteQueryVariables) {
      return { query: GetJobCompleteDocument, variables: variables }
    }
export const GetJobsWithFiltersDocument = gql`
    query GetJobsWithFilters($limit: Int = 20, $offset: Int = 0, $where: jobs_bool_exp, $orderBy: [jobs_order_by!] = [{created_at: desc}]) {
  jobs(where: $where, limit: $limit, offset: $offset, order_by: $orderBy) {
    id
    title
    description
    job_type
    country
    city
    required_skills
    languages_required
    salary_min
    salary_max
    currency
    salary_period
    status
    urgency_level
    applications_count
    views_count
    featured
    expires_at
    created_at
    live_in_required
    sponsor_profile {
      id
      full_name
      avatar_url
    }
  }
  jobs_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetJobsWithFiltersQuery__
 *
 * To run a query within a React component, call `useGetJobsWithFiltersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetJobsWithFiltersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetJobsWithFiltersQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      where: // value for 'where'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useGetJobsWithFiltersQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetJobsWithFiltersQuery, GetJobsWithFiltersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetJobsWithFiltersQuery, GetJobsWithFiltersQueryVariables>(GetJobsWithFiltersDocument, options);
      }
export function useGetJobsWithFiltersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetJobsWithFiltersQuery, GetJobsWithFiltersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetJobsWithFiltersQuery, GetJobsWithFiltersQueryVariables>(GetJobsWithFiltersDocument, options);
        }
export function useGetJobsWithFiltersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetJobsWithFiltersQuery, GetJobsWithFiltersQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetJobsWithFiltersQuery, GetJobsWithFiltersQueryVariables>(GetJobsWithFiltersDocument, options);
        }
export type GetJobsWithFiltersQueryHookResult = ReturnType<typeof useGetJobsWithFiltersQuery>;
export type GetJobsWithFiltersLazyQueryHookResult = ReturnType<typeof useGetJobsWithFiltersLazyQuery>;
export type GetJobsWithFiltersSuspenseQueryHookResult = ReturnType<typeof useGetJobsWithFiltersSuspenseQuery>;
export type GetJobsWithFiltersQueryResult = ApolloReactCommon.QueryResult<GetJobsWithFiltersQuery, GetJobsWithFiltersQueryVariables>;
export function refetchGetJobsWithFiltersQuery(variables?: GetJobsWithFiltersQueryVariables) {
      return { query: GetJobsWithFiltersDocument, variables: variables }
    }
export const GetSponsorJobsDocument = gql`
    query GetSponsorJobs($sponsorId: String!, $status: String, $limit: Int = 50, $offset: Int = 0, $orderBy: [jobs_order_by!] = [{created_at: desc}]) {
  jobs(
    where: {sponsor_id: {_eq: $sponsorId}, _and: [{status: {_eq: $status}}]}
    limit: $limit
    offset: $offset
    order_by: $orderBy
  ) {
    id
    title
    description
    job_type
    country
    city
    status
    salary_min
    salary_max
    currency
    applications_count
    views_count
    featured
    created_at
    updated_at
  }
  jobs_aggregate(
    where: {sponsor_id: {_eq: $sponsorId}, _and: [{status: {_eq: $status}}]}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetSponsorJobsQuery__
 *
 * To run a query within a React component, call `useGetSponsorJobsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSponsorJobsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSponsorJobsQuery({
 *   variables: {
 *      sponsorId: // value for 'sponsorId'
 *      status: // value for 'status'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useGetSponsorJobsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetSponsorJobsQuery, GetSponsorJobsQueryVariables> & ({ variables: GetSponsorJobsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSponsorJobsQuery, GetSponsorJobsQueryVariables>(GetSponsorJobsDocument, options);
      }
export function useGetSponsorJobsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSponsorJobsQuery, GetSponsorJobsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSponsorJobsQuery, GetSponsorJobsQueryVariables>(GetSponsorJobsDocument, options);
        }
export function useGetSponsorJobsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSponsorJobsQuery, GetSponsorJobsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSponsorJobsQuery, GetSponsorJobsQueryVariables>(GetSponsorJobsDocument, options);
        }
export type GetSponsorJobsQueryHookResult = ReturnType<typeof useGetSponsorJobsQuery>;
export type GetSponsorJobsLazyQueryHookResult = ReturnType<typeof useGetSponsorJobsLazyQuery>;
export type GetSponsorJobsSuspenseQueryHookResult = ReturnType<typeof useGetSponsorJobsSuspenseQuery>;
export type GetSponsorJobsQueryResult = ApolloReactCommon.QueryResult<GetSponsorJobsQuery, GetSponsorJobsQueryVariables>;
export function refetchGetSponsorJobsQuery(variables: GetSponsorJobsQueryVariables) {
      return { query: GetSponsorJobsDocument, variables: variables }
    }
export const GetJobApplicationsDocument = gql`
    query GetJobApplications($jobId: uuid!) {
  applications(where: {job_id: {_eq: $jobId}}, order_by: {created_at: desc}) {
    id
    status
    application_status
    cover_letter
    notes
    match_score
    offer_amount
    offer_currency
    created_at
    updated_at
    maid_profile {
      id
      first_name
      last_name
      profile_photo_url
      verification_status
    }
    job {
      id
      title
      sponsor_id
    }
  }
}
    `;

/**
 * __useGetJobApplicationsQuery__
 *
 * To run a query within a React component, call `useGetJobApplicationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetJobApplicationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetJobApplicationsQuery({
 *   variables: {
 *      jobId: // value for 'jobId'
 *   },
 * });
 */
export function useGetJobApplicationsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetJobApplicationsQuery, GetJobApplicationsQueryVariables> & ({ variables: GetJobApplicationsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetJobApplicationsQuery, GetJobApplicationsQueryVariables>(GetJobApplicationsDocument, options);
      }
export function useGetJobApplicationsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetJobApplicationsQuery, GetJobApplicationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetJobApplicationsQuery, GetJobApplicationsQueryVariables>(GetJobApplicationsDocument, options);
        }
export function useGetJobApplicationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetJobApplicationsQuery, GetJobApplicationsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetJobApplicationsQuery, GetJobApplicationsQueryVariables>(GetJobApplicationsDocument, options);
        }
export type GetJobApplicationsQueryHookResult = ReturnType<typeof useGetJobApplicationsQuery>;
export type GetJobApplicationsLazyQueryHookResult = ReturnType<typeof useGetJobApplicationsLazyQuery>;
export type GetJobApplicationsSuspenseQueryHookResult = ReturnType<typeof useGetJobApplicationsSuspenseQuery>;
export type GetJobApplicationsQueryResult = ApolloReactCommon.QueryResult<GetJobApplicationsQuery, GetJobApplicationsQueryVariables>;
export function refetchGetJobApplicationsQuery(variables: GetJobApplicationsQueryVariables) {
      return { query: GetJobApplicationsDocument, variables: variables }
    }
export const GetMaidApplicationsDocument = gql`
    query GetMaidApplications($maidId: String!, $status: String, $limit: Int = 50, $offset: Int = 0) {
  applications(
    where: {maid_id: {_eq: $maidId}, _and: [{status: {_eq: $status}}]}
    limit: $limit
    offset: $offset
    order_by: {created_at: desc}
  ) {
    id
    status
    application_status
    cover_letter
    notes
    match_score
    offer_amount
    offer_currency
    created_at
    updated_at
    job {
      id
      title
      description
      country
      city
      job_type
      salary_min
      salary_max
      currency
      status
      sponsor_profile {
        id
        full_name
        avatar_url
      }
    }
  }
  applications_aggregate(
    where: {maid_id: {_eq: $maidId}, _and: [{status: {_eq: $status}}]}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetMaidApplicationsQuery__
 *
 * To run a query within a React component, call `useGetMaidApplicationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMaidApplicationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMaidApplicationsQuery({
 *   variables: {
 *      maidId: // value for 'maidId'
 *      status: // value for 'status'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetMaidApplicationsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetMaidApplicationsQuery, GetMaidApplicationsQueryVariables> & ({ variables: GetMaidApplicationsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMaidApplicationsQuery, GetMaidApplicationsQueryVariables>(GetMaidApplicationsDocument, options);
      }
export function useGetMaidApplicationsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMaidApplicationsQuery, GetMaidApplicationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMaidApplicationsQuery, GetMaidApplicationsQueryVariables>(GetMaidApplicationsDocument, options);
        }
export function useGetMaidApplicationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMaidApplicationsQuery, GetMaidApplicationsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMaidApplicationsQuery, GetMaidApplicationsQueryVariables>(GetMaidApplicationsDocument, options);
        }
export type GetMaidApplicationsQueryHookResult = ReturnType<typeof useGetMaidApplicationsQuery>;
export type GetMaidApplicationsLazyQueryHookResult = ReturnType<typeof useGetMaidApplicationsLazyQuery>;
export type GetMaidApplicationsSuspenseQueryHookResult = ReturnType<typeof useGetMaidApplicationsSuspenseQuery>;
export type GetMaidApplicationsQueryResult = ApolloReactCommon.QueryResult<GetMaidApplicationsQuery, GetMaidApplicationsQueryVariables>;
export function refetchGetMaidApplicationsQuery(variables: GetMaidApplicationsQueryVariables) {
      return { query: GetMaidApplicationsDocument, variables: variables }
    }
export const GetApplicationByIdDocument = gql`
    query GetApplicationById($id: uuid!) {
  applications_by_pk(id: $id) {
    id
    status
    application_status
    cover_letter
    notes
    match_score
    offer_amount
    offer_currency
    created_at
    updated_at
    maid_profile {
      id
      first_name
      last_name
      profile_photo_url
      verification_status
    }
    job {
      id
      title
      description
      country
      city
      salary_min
      salary_max
      currency
      status
      sponsor_id
      sponsor_profile {
        id
        full_name
        avatar_url
      }
    }
  }
}
    `;

/**
 * __useGetApplicationByIdQuery__
 *
 * To run a query within a React component, call `useGetApplicationByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetApplicationByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetApplicationByIdQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetApplicationByIdQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetApplicationByIdQuery, GetApplicationByIdQueryVariables> & ({ variables: GetApplicationByIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetApplicationByIdQuery, GetApplicationByIdQueryVariables>(GetApplicationByIdDocument, options);
      }
export function useGetApplicationByIdLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetApplicationByIdQuery, GetApplicationByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetApplicationByIdQuery, GetApplicationByIdQueryVariables>(GetApplicationByIdDocument, options);
        }
export function useGetApplicationByIdSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetApplicationByIdQuery, GetApplicationByIdQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetApplicationByIdQuery, GetApplicationByIdQueryVariables>(GetApplicationByIdDocument, options);
        }
export type GetApplicationByIdQueryHookResult = ReturnType<typeof useGetApplicationByIdQuery>;
export type GetApplicationByIdLazyQueryHookResult = ReturnType<typeof useGetApplicationByIdLazyQuery>;
export type GetApplicationByIdSuspenseQueryHookResult = ReturnType<typeof useGetApplicationByIdSuspenseQuery>;
export type GetApplicationByIdQueryResult = ApolloReactCommon.QueryResult<GetApplicationByIdQuery, GetApplicationByIdQueryVariables>;
export function refetchGetApplicationByIdQuery(variables: GetApplicationByIdQueryVariables) {
      return { query: GetApplicationByIdDocument, variables: variables }
    }
export const GetSponsorJobStatsDocument = gql`
    query GetSponsorJobStats($sponsorId: String!) {
  all_jobs: jobs_aggregate(where: {sponsor_id: {_eq: $sponsorId}}) {
    aggregate {
      count
      sum {
        applications_count
        views_count
      }
    }
  }
  active_jobs: jobs_aggregate(
    where: {sponsor_id: {_eq: $sponsorId}, status: {_eq: "active"}}
  ) {
    aggregate {
      count
    }
  }
  draft_jobs: jobs_aggregate(
    where: {sponsor_id: {_eq: $sponsorId}, status: {_eq: "draft"}}
  ) {
    aggregate {
      count
    }
  }
  filled_jobs: jobs_aggregate(
    where: {sponsor_id: {_eq: $sponsorId}, status: {_eq: "filled"}}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetSponsorJobStatsQuery__
 *
 * To run a query within a React component, call `useGetSponsorJobStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSponsorJobStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSponsorJobStatsQuery({
 *   variables: {
 *      sponsorId: // value for 'sponsorId'
 *   },
 * });
 */
export function useGetSponsorJobStatsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetSponsorJobStatsQuery, GetSponsorJobStatsQueryVariables> & ({ variables: GetSponsorJobStatsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSponsorJobStatsQuery, GetSponsorJobStatsQueryVariables>(GetSponsorJobStatsDocument, options);
      }
export function useGetSponsorJobStatsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSponsorJobStatsQuery, GetSponsorJobStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSponsorJobStatsQuery, GetSponsorJobStatsQueryVariables>(GetSponsorJobStatsDocument, options);
        }
export function useGetSponsorJobStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSponsorJobStatsQuery, GetSponsorJobStatsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSponsorJobStatsQuery, GetSponsorJobStatsQueryVariables>(GetSponsorJobStatsDocument, options);
        }
export type GetSponsorJobStatsQueryHookResult = ReturnType<typeof useGetSponsorJobStatsQuery>;
export type GetSponsorJobStatsLazyQueryHookResult = ReturnType<typeof useGetSponsorJobStatsLazyQuery>;
export type GetSponsorJobStatsSuspenseQueryHookResult = ReturnType<typeof useGetSponsorJobStatsSuspenseQuery>;
export type GetSponsorJobStatsQueryResult = ApolloReactCommon.QueryResult<GetSponsorJobStatsQuery, GetSponsorJobStatsQueryVariables>;
export function refetchGetSponsorJobStatsQuery(variables: GetSponsorJobStatsQueryVariables) {
      return { query: GetSponsorJobStatsDocument, variables: variables }
    }
export const GetAvailableJobsDocument = gql`
    query GetAvailableJobs($limit: Int = 20, $offset: Int = 0, $where: jobs_bool_exp) {
  jobs(
    where: $where
    limit: $limit
    offset: $offset
    order_by: {created_at: desc}
  ) {
    id
    title
    description
    country
    city
    job_type
    salary_min
    salary_max
    currency
    status
    created_at
    sponsor_profile {
      id
      full_name
    }
  }
  jobs_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetAvailableJobsQuery__
 *
 * To run a query within a React component, call `useGetAvailableJobsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAvailableJobsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAvailableJobsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      where: // value for 'where'
 *   },
 * });
 */
export function useGetAvailableJobsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAvailableJobsQuery, GetAvailableJobsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAvailableJobsQuery, GetAvailableJobsQueryVariables>(GetAvailableJobsDocument, options);
      }
export function useGetAvailableJobsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAvailableJobsQuery, GetAvailableJobsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAvailableJobsQuery, GetAvailableJobsQueryVariables>(GetAvailableJobsDocument, options);
        }
export function useGetAvailableJobsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAvailableJobsQuery, GetAvailableJobsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAvailableJobsQuery, GetAvailableJobsQueryVariables>(GetAvailableJobsDocument, options);
        }
export type GetAvailableJobsQueryHookResult = ReturnType<typeof useGetAvailableJobsQuery>;
export type GetAvailableJobsLazyQueryHookResult = ReturnType<typeof useGetAvailableJobsLazyQuery>;
export type GetAvailableJobsSuspenseQueryHookResult = ReturnType<typeof useGetAvailableJobsSuspenseQuery>;
export type GetAvailableJobsQueryResult = ApolloReactCommon.QueryResult<GetAvailableJobsQuery, GetAvailableJobsQueryVariables>;
export function refetchGetAvailableJobsQuery(variables?: GetAvailableJobsQueryVariables) {
      return { query: GetAvailableJobsDocument, variables: variables }
    }
export const GetMaidProfileCompleteDocument = gql`
    query GetMaidProfileComplete($id: String!) {
  maid_profiles_by_pk(id: $id) {
    id
    full_name
    date_of_birth
    nationality
    current_location
    marital_status
    children_count
    iso_country_code
    religion
    experience_years
    previous_countries
    skills
    languages
    education_level
    primary_profession
    preferred_salary_min
    preferred_salary_max
    preferred_currency
    available_from
    contract_duration_preference
    live_in_preference
    passport_number
    passport_expiry
    visa_status
    medical_certificate_valid
    police_clearance_valid
    availability_status
    profile_completion_percentage
    verification_status
    is_agency_managed
    agency_id
    profile_views
    total_applications
    successful_placements
    average_rating
    about_me
    profile_photo_url
    introduction_video_url
    additional_notes
    additional_services
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetMaidProfileCompleteQuery__
 *
 * To run a query within a React component, call `useGetMaidProfileCompleteQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMaidProfileCompleteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMaidProfileCompleteQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetMaidProfileCompleteQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetMaidProfileCompleteQuery, GetMaidProfileCompleteQueryVariables> & ({ variables: GetMaidProfileCompleteQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMaidProfileCompleteQuery, GetMaidProfileCompleteQueryVariables>(GetMaidProfileCompleteDocument, options);
      }
export function useGetMaidProfileCompleteLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMaidProfileCompleteQuery, GetMaidProfileCompleteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMaidProfileCompleteQuery, GetMaidProfileCompleteQueryVariables>(GetMaidProfileCompleteDocument, options);
        }
export function useGetMaidProfileCompleteSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMaidProfileCompleteQuery, GetMaidProfileCompleteQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMaidProfileCompleteQuery, GetMaidProfileCompleteQueryVariables>(GetMaidProfileCompleteDocument, options);
        }
export type GetMaidProfileCompleteQueryHookResult = ReturnType<typeof useGetMaidProfileCompleteQuery>;
export type GetMaidProfileCompleteLazyQueryHookResult = ReturnType<typeof useGetMaidProfileCompleteLazyQuery>;
export type GetMaidProfileCompleteSuspenseQueryHookResult = ReturnType<typeof useGetMaidProfileCompleteSuspenseQuery>;
export type GetMaidProfileCompleteQueryResult = ApolloReactCommon.QueryResult<GetMaidProfileCompleteQuery, GetMaidProfileCompleteQueryVariables>;
export function refetchGetMaidProfileCompleteQuery(variables: GetMaidProfileCompleteQueryVariables) {
      return { query: GetMaidProfileCompleteDocument, variables: variables }
    }
export const GetMaidsWithFiltersDocument = gql`
    query GetMaidsWithFilters($limit: Int = 20, $offset: Int = 0, $where: maid_profiles_bool_exp, $orderBy: [maid_profiles_order_by!] = [{created_at: desc}]) {
  maid_profiles(where: $where, limit: $limit, offset: $offset, order_by: $orderBy) {
    id
    full_name
    nationality
    experience_years
    availability_status
    skills
    languages
    current_location
    preferred_salary_min
    preferred_salary_max
    preferred_currency
    verification_status
    average_rating
    profile_completion_percentage
    profile_photo_url
    created_at
    introduction_video_url
    primary_profession
    live_in_preference
    contract_duration_preference
    is_agency_managed
    iso_country_code
  }
  maid_profiles_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetMaidsWithFiltersQuery__
 *
 * To run a query within a React component, call `useGetMaidsWithFiltersQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMaidsWithFiltersQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMaidsWithFiltersQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      where: // value for 'where'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useGetMaidsWithFiltersQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMaidsWithFiltersQuery, GetMaidsWithFiltersQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMaidsWithFiltersQuery, GetMaidsWithFiltersQueryVariables>(GetMaidsWithFiltersDocument, options);
      }
export function useGetMaidsWithFiltersLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMaidsWithFiltersQuery, GetMaidsWithFiltersQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMaidsWithFiltersQuery, GetMaidsWithFiltersQueryVariables>(GetMaidsWithFiltersDocument, options);
        }
export function useGetMaidsWithFiltersSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMaidsWithFiltersQuery, GetMaidsWithFiltersQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMaidsWithFiltersQuery, GetMaidsWithFiltersQueryVariables>(GetMaidsWithFiltersDocument, options);
        }
export type GetMaidsWithFiltersQueryHookResult = ReturnType<typeof useGetMaidsWithFiltersQuery>;
export type GetMaidsWithFiltersLazyQueryHookResult = ReturnType<typeof useGetMaidsWithFiltersLazyQuery>;
export type GetMaidsWithFiltersSuspenseQueryHookResult = ReturnType<typeof useGetMaidsWithFiltersSuspenseQuery>;
export type GetMaidsWithFiltersQueryResult = ApolloReactCommon.QueryResult<GetMaidsWithFiltersQuery, GetMaidsWithFiltersQueryVariables>;
export function refetchGetMaidsWithFiltersQuery(variables?: GetMaidsWithFiltersQueryVariables) {
      return { query: GetMaidsWithFiltersDocument, variables: variables }
    }
export const GetUserFavoriteMaidsDocument = gql`
    query GetUserFavoriteMaids($sponsorId: String!, $limit: Int = 20, $offset: Int = 0) {
  favorites(
    where: {sponsor_id: {_eq: $sponsorId}}
    limit: $limit
    offset: $offset
    order_by: {created_at: desc}
  ) {
    created_at
    maid_id
  }
  favorites_aggregate(where: {sponsor_id: {_eq: $sponsorId}}) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetUserFavoriteMaidsQuery__
 *
 * To run a query within a React component, call `useGetUserFavoriteMaidsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserFavoriteMaidsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserFavoriteMaidsQuery({
 *   variables: {
 *      sponsorId: // value for 'sponsorId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetUserFavoriteMaidsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserFavoriteMaidsQuery, GetUserFavoriteMaidsQueryVariables> & ({ variables: GetUserFavoriteMaidsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserFavoriteMaidsQuery, GetUserFavoriteMaidsQueryVariables>(GetUserFavoriteMaidsDocument, options);
      }
export function useGetUserFavoriteMaidsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserFavoriteMaidsQuery, GetUserFavoriteMaidsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserFavoriteMaidsQuery, GetUserFavoriteMaidsQueryVariables>(GetUserFavoriteMaidsDocument, options);
        }
export function useGetUserFavoriteMaidsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserFavoriteMaidsQuery, GetUserFavoriteMaidsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUserFavoriteMaidsQuery, GetUserFavoriteMaidsQueryVariables>(GetUserFavoriteMaidsDocument, options);
        }
export type GetUserFavoriteMaidsQueryHookResult = ReturnType<typeof useGetUserFavoriteMaidsQuery>;
export type GetUserFavoriteMaidsLazyQueryHookResult = ReturnType<typeof useGetUserFavoriteMaidsLazyQuery>;
export type GetUserFavoriteMaidsSuspenseQueryHookResult = ReturnType<typeof useGetUserFavoriteMaidsSuspenseQuery>;
export type GetUserFavoriteMaidsQueryResult = ApolloReactCommon.QueryResult<GetUserFavoriteMaidsQuery, GetUserFavoriteMaidsQueryVariables>;
export function refetchGetUserFavoriteMaidsQuery(variables: GetUserFavoriteMaidsQueryVariables) {
      return { query: GetUserFavoriteMaidsDocument, variables: variables }
    }
export const CheckFavoriteStatusDocument = gql`
    query CheckFavoriteStatus($sponsorId: String!, $maidIds: [String!]!) {
  favorites(where: {sponsor_id: {_eq: $sponsorId}, maid_id: {_in: $maidIds}}) {
    maid_id
  }
}
    `;

/**
 * __useCheckFavoriteStatusQuery__
 *
 * To run a query within a React component, call `useCheckFavoriteStatusQuery` and pass it any options that fit your needs.
 * When your component renders, `useCheckFavoriteStatusQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCheckFavoriteStatusQuery({
 *   variables: {
 *      sponsorId: // value for 'sponsorId'
 *      maidIds: // value for 'maidIds'
 *   },
 * });
 */
export function useCheckFavoriteStatusQuery(baseOptions: ApolloReactHooks.QueryHookOptions<CheckFavoriteStatusQuery, CheckFavoriteStatusQueryVariables> & ({ variables: CheckFavoriteStatusQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<CheckFavoriteStatusQuery, CheckFavoriteStatusQueryVariables>(CheckFavoriteStatusDocument, options);
      }
export function useCheckFavoriteStatusLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<CheckFavoriteStatusQuery, CheckFavoriteStatusQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<CheckFavoriteStatusQuery, CheckFavoriteStatusQueryVariables>(CheckFavoriteStatusDocument, options);
        }
export function useCheckFavoriteStatusSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<CheckFavoriteStatusQuery, CheckFavoriteStatusQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<CheckFavoriteStatusQuery, CheckFavoriteStatusQueryVariables>(CheckFavoriteStatusDocument, options);
        }
export type CheckFavoriteStatusQueryHookResult = ReturnType<typeof useCheckFavoriteStatusQuery>;
export type CheckFavoriteStatusLazyQueryHookResult = ReturnType<typeof useCheckFavoriteStatusLazyQuery>;
export type CheckFavoriteStatusSuspenseQueryHookResult = ReturnType<typeof useCheckFavoriteStatusSuspenseQuery>;
export type CheckFavoriteStatusQueryResult = ApolloReactCommon.QueryResult<CheckFavoriteStatusQuery, CheckFavoriteStatusQueryVariables>;
export function refetchCheckFavoriteStatusQuery(variables: CheckFavoriteStatusQueryVariables) {
      return { query: CheckFavoriteStatusDocument, variables: variables }
    }
export const GetMaidProfileDocument = gql`
    query GetMaidProfile($id: String!) {
  maid_profiles_by_pk(id: $id) {
    id
    full_name
    experience_years
    languages
    availability_status
    education_level
    nationality
    current_location
    about_me
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetMaidProfileQuery__
 *
 * To run a query within a React component, call `useGetMaidProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMaidProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMaidProfileQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetMaidProfileQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetMaidProfileQuery, GetMaidProfileQueryVariables> & ({ variables: GetMaidProfileQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMaidProfileQuery, GetMaidProfileQueryVariables>(GetMaidProfileDocument, options);
      }
export function useGetMaidProfileLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMaidProfileQuery, GetMaidProfileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMaidProfileQuery, GetMaidProfileQueryVariables>(GetMaidProfileDocument, options);
        }
export function useGetMaidProfileSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMaidProfileQuery, GetMaidProfileQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMaidProfileQuery, GetMaidProfileQueryVariables>(GetMaidProfileDocument, options);
        }
export type GetMaidProfileQueryHookResult = ReturnType<typeof useGetMaidProfileQuery>;
export type GetMaidProfileLazyQueryHookResult = ReturnType<typeof useGetMaidProfileLazyQuery>;
export type GetMaidProfileSuspenseQueryHookResult = ReturnType<typeof useGetMaidProfileSuspenseQuery>;
export type GetMaidProfileQueryResult = ApolloReactCommon.QueryResult<GetMaidProfileQuery, GetMaidProfileQueryVariables>;
export function refetchGetMaidProfileQuery(variables: GetMaidProfileQueryVariables) {
      return { query: GetMaidProfileDocument, variables: variables }
    }
export const GetAvailableMaidsDocument = gql`
    query GetAvailableMaids($limit: Int = 20, $offset: Int = 0, $where: maid_profiles_bool_exp) {
  maid_profiles(
    where: $where
    limit: $limit
    offset: $offset
    order_by: {created_at: desc}
  ) {
    id
    full_name
    experience_years
    languages
    availability_status
    nationality
    current_location
  }
  maid_profiles_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetAvailableMaidsQuery__
 *
 * To run a query within a React component, call `useGetAvailableMaidsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAvailableMaidsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAvailableMaidsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      where: // value for 'where'
 *   },
 * });
 */
export function useGetAvailableMaidsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAvailableMaidsQuery, GetAvailableMaidsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAvailableMaidsQuery, GetAvailableMaidsQueryVariables>(GetAvailableMaidsDocument, options);
      }
export function useGetAvailableMaidsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAvailableMaidsQuery, GetAvailableMaidsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAvailableMaidsQuery, GetAvailableMaidsQueryVariables>(GetAvailableMaidsDocument, options);
        }
export function useGetAvailableMaidsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAvailableMaidsQuery, GetAvailableMaidsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAvailableMaidsQuery, GetAvailableMaidsQueryVariables>(GetAvailableMaidsDocument, options);
        }
export type GetAvailableMaidsQueryHookResult = ReturnType<typeof useGetAvailableMaidsQuery>;
export type GetAvailableMaidsLazyQueryHookResult = ReturnType<typeof useGetAvailableMaidsLazyQuery>;
export type GetAvailableMaidsSuspenseQueryHookResult = ReturnType<typeof useGetAvailableMaidsSuspenseQuery>;
export type GetAvailableMaidsQueryResult = ApolloReactCommon.QueryResult<GetAvailableMaidsQuery, GetAvailableMaidsQueryVariables>;
export function refetchGetAvailableMaidsQuery(variables?: GetAvailableMaidsQueryVariables) {
      return { query: GetAvailableMaidsDocument, variables: variables }
    }
export const GetNotificationDocument = gql`
    query GetNotification($id: uuid!) {
  notifications_by_pk(id: $id) {
    id
    user_id
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
 * __useGetNotificationQuery__
 *
 * To run a query within a React component, call `useGetNotificationQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNotificationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNotificationQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetNotificationQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetNotificationQuery, GetNotificationQueryVariables> & ({ variables: GetNotificationQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetNotificationQuery, GetNotificationQueryVariables>(GetNotificationDocument, options);
      }
export function useGetNotificationLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetNotificationQuery, GetNotificationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetNotificationQuery, GetNotificationQueryVariables>(GetNotificationDocument, options);
        }
export function useGetNotificationSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetNotificationQuery, GetNotificationQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetNotificationQuery, GetNotificationQueryVariables>(GetNotificationDocument, options);
        }
export type GetNotificationQueryHookResult = ReturnType<typeof useGetNotificationQuery>;
export type GetNotificationLazyQueryHookResult = ReturnType<typeof useGetNotificationLazyQuery>;
export type GetNotificationSuspenseQueryHookResult = ReturnType<typeof useGetNotificationSuspenseQuery>;
export type GetNotificationQueryResult = ApolloReactCommon.QueryResult<GetNotificationQuery, GetNotificationQueryVariables>;
export function refetchGetNotificationQuery(variables: GetNotificationQueryVariables) {
      return { query: GetNotificationDocument, variables: variables }
    }
export const ListUserNotificationsDocument = gql`
    query ListUserNotifications($userId: String!, $limit: Int = 20, $offset: Int = 0, $read: Boolean) {
  notifications(
    where: {user_id: {_eq: $userId}, read: {_eq: $read}, _or: [{expires_at: {_is_null: true}}, {expires_at: {_gt: "now()"}}]}
    limit: $limit
    offset: $offset
    order_by: [{created_at: desc}]
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
  notifications_aggregate(
    where: {user_id: {_eq: $userId}, read: {_eq: $read}, _or: [{expires_at: {_is_null: true}}, {expires_at: {_gt: "now()"}}]}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useListUserNotificationsQuery__
 *
 * To run a query within a React component, call `useListUserNotificationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListUserNotificationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListUserNotificationsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      read: // value for 'read'
 *   },
 * });
 */
export function useListUserNotificationsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<ListUserNotificationsQuery, ListUserNotificationsQueryVariables> & ({ variables: ListUserNotificationsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ListUserNotificationsQuery, ListUserNotificationsQueryVariables>(ListUserNotificationsDocument, options);
      }
export function useListUserNotificationsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ListUserNotificationsQuery, ListUserNotificationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ListUserNotificationsQuery, ListUserNotificationsQueryVariables>(ListUserNotificationsDocument, options);
        }
export function useListUserNotificationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ListUserNotificationsQuery, ListUserNotificationsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<ListUserNotificationsQuery, ListUserNotificationsQueryVariables>(ListUserNotificationsDocument, options);
        }
export type ListUserNotificationsQueryHookResult = ReturnType<typeof useListUserNotificationsQuery>;
export type ListUserNotificationsLazyQueryHookResult = ReturnType<typeof useListUserNotificationsLazyQuery>;
export type ListUserNotificationsSuspenseQueryHookResult = ReturnType<typeof useListUserNotificationsSuspenseQuery>;
export type ListUserNotificationsQueryResult = ApolloReactCommon.QueryResult<ListUserNotificationsQuery, ListUserNotificationsQueryVariables>;
export function refetchListUserNotificationsQuery(variables: ListUserNotificationsQueryVariables) {
      return { query: ListUserNotificationsDocument, variables: variables }
    }
export const ListAllUserNotificationsDocument = gql`
    query ListAllUserNotifications($userId: String!, $limit: Int = 50, $offset: Int = 0) {
  notifications(
    where: {user_id: {_eq: $userId}, _or: [{expires_at: {_is_null: true}}, {expires_at: {_gt: "now()"}}]}
    limit: $limit
    offset: $offset
    order_by: [{created_at: desc}]
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
  notifications_aggregate(
    where: {user_id: {_eq: $userId}, _or: [{expires_at: {_is_null: true}}, {expires_at: {_gt: "now()"}}]}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useListAllUserNotificationsQuery__
 *
 * To run a query within a React component, call `useListAllUserNotificationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useListAllUserNotificationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListAllUserNotificationsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useListAllUserNotificationsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<ListAllUserNotificationsQuery, ListAllUserNotificationsQueryVariables> & ({ variables: ListAllUserNotificationsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ListAllUserNotificationsQuery, ListAllUserNotificationsQueryVariables>(ListAllUserNotificationsDocument, options);
      }
export function useListAllUserNotificationsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ListAllUserNotificationsQuery, ListAllUserNotificationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ListAllUserNotificationsQuery, ListAllUserNotificationsQueryVariables>(ListAllUserNotificationsDocument, options);
        }
export function useListAllUserNotificationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ListAllUserNotificationsQuery, ListAllUserNotificationsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<ListAllUserNotificationsQuery, ListAllUserNotificationsQueryVariables>(ListAllUserNotificationsDocument, options);
        }
export type ListAllUserNotificationsQueryHookResult = ReturnType<typeof useListAllUserNotificationsQuery>;
export type ListAllUserNotificationsLazyQueryHookResult = ReturnType<typeof useListAllUserNotificationsLazyQuery>;
export type ListAllUserNotificationsSuspenseQueryHookResult = ReturnType<typeof useListAllUserNotificationsSuspenseQuery>;
export type ListAllUserNotificationsQueryResult = ApolloReactCommon.QueryResult<ListAllUserNotificationsQuery, ListAllUserNotificationsQueryVariables>;
export function refetchListAllUserNotificationsQuery(variables: ListAllUserNotificationsQueryVariables) {
      return { query: ListAllUserNotificationsDocument, variables: variables }
    }
export const GetUnreadNotificationsCountDocument = gql`
    query GetUnreadNotificationsCount($userId: String!) {
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
 * __useGetUnreadNotificationsCountQuery__
 *
 * To run a query within a React component, call `useGetUnreadNotificationsCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUnreadNotificationsCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUnreadNotificationsCountQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUnreadNotificationsCountQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUnreadNotificationsCountQuery, GetUnreadNotificationsCountQueryVariables> & ({ variables: GetUnreadNotificationsCountQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUnreadNotificationsCountQuery, GetUnreadNotificationsCountQueryVariables>(GetUnreadNotificationsCountDocument, options);
      }
export function useGetUnreadNotificationsCountLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUnreadNotificationsCountQuery, GetUnreadNotificationsCountQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUnreadNotificationsCountQuery, GetUnreadNotificationsCountQueryVariables>(GetUnreadNotificationsCountDocument, options);
        }
export function useGetUnreadNotificationsCountSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUnreadNotificationsCountQuery, GetUnreadNotificationsCountQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUnreadNotificationsCountQuery, GetUnreadNotificationsCountQueryVariables>(GetUnreadNotificationsCountDocument, options);
        }
export type GetUnreadNotificationsCountQueryHookResult = ReturnType<typeof useGetUnreadNotificationsCountQuery>;
export type GetUnreadNotificationsCountLazyQueryHookResult = ReturnType<typeof useGetUnreadNotificationsCountLazyQuery>;
export type GetUnreadNotificationsCountSuspenseQueryHookResult = ReturnType<typeof useGetUnreadNotificationsCountSuspenseQuery>;
export type GetUnreadNotificationsCountQueryResult = ApolloReactCommon.QueryResult<GetUnreadNotificationsCountQuery, GetUnreadNotificationsCountQueryVariables>;
export function refetchGetUnreadNotificationsCountQuery(variables: GetUnreadNotificationsCountQueryVariables) {
      return { query: GetUnreadNotificationsCountDocument, variables: variables }
    }
export const GetNotificationsByTypeDocument = gql`
    query GetNotificationsByType($userId: String!, $type: String!, $limit: Int = 20, $offset: Int = 0) {
  notifications(
    where: {user_id: {_eq: $userId}, type: {_eq: $type}, _or: [{expires_at: {_is_null: true}}, {expires_at: {_gt: "now()"}}]}
    limit: $limit
    offset: $offset
    order_by: [{created_at: desc}]
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
  notifications_aggregate(
    where: {user_id: {_eq: $userId}, type: {_eq: $type}, _or: [{expires_at: {_is_null: true}}, {expires_at: {_gt: "now()"}}]}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetNotificationsByTypeQuery__
 *
 * To run a query within a React component, call `useGetNotificationsByTypeQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNotificationsByTypeQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNotificationsByTypeQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      type: // value for 'type'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetNotificationsByTypeQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetNotificationsByTypeQuery, GetNotificationsByTypeQueryVariables> & ({ variables: GetNotificationsByTypeQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetNotificationsByTypeQuery, GetNotificationsByTypeQueryVariables>(GetNotificationsByTypeDocument, options);
      }
export function useGetNotificationsByTypeLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetNotificationsByTypeQuery, GetNotificationsByTypeQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetNotificationsByTypeQuery, GetNotificationsByTypeQueryVariables>(GetNotificationsByTypeDocument, options);
        }
export function useGetNotificationsByTypeSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetNotificationsByTypeQuery, GetNotificationsByTypeQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetNotificationsByTypeQuery, GetNotificationsByTypeQueryVariables>(GetNotificationsByTypeDocument, options);
        }
export type GetNotificationsByTypeQueryHookResult = ReturnType<typeof useGetNotificationsByTypeQuery>;
export type GetNotificationsByTypeLazyQueryHookResult = ReturnType<typeof useGetNotificationsByTypeLazyQuery>;
export type GetNotificationsByTypeSuspenseQueryHookResult = ReturnType<typeof useGetNotificationsByTypeSuspenseQuery>;
export type GetNotificationsByTypeQueryResult = ApolloReactCommon.QueryResult<GetNotificationsByTypeQuery, GetNotificationsByTypeQueryVariables>;
export function refetchGetNotificationsByTypeQuery(variables: GetNotificationsByTypeQueryVariables) {
      return { query: GetNotificationsByTypeDocument, variables: variables }
    }
export const GetNotificationsByPriorityDocument = gql`
    query GetNotificationsByPriority($userId: String!, $priority: String!, $limit: Int = 20, $offset: Int = 0) {
  notifications(
    where: {user_id: {_eq: $userId}, priority: {_eq: $priority}, read: {_eq: false}, _or: [{expires_at: {_is_null: true}}, {expires_at: {_gt: "now()"}}]}
    limit: $limit
    offset: $offset
    order_by: [{created_at: desc}]
  ) {
    id
    type
    title
    message
    link
    action_url
    priority
    read
    created_at
  }
  notifications_aggregate(
    where: {user_id: {_eq: $userId}, priority: {_eq: $priority}, read: {_eq: false}}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetNotificationsByPriorityQuery__
 *
 * To run a query within a React component, call `useGetNotificationsByPriorityQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNotificationsByPriorityQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNotificationsByPriorityQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      priority: // value for 'priority'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetNotificationsByPriorityQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetNotificationsByPriorityQuery, GetNotificationsByPriorityQueryVariables> & ({ variables: GetNotificationsByPriorityQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetNotificationsByPriorityQuery, GetNotificationsByPriorityQueryVariables>(GetNotificationsByPriorityDocument, options);
      }
export function useGetNotificationsByPriorityLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetNotificationsByPriorityQuery, GetNotificationsByPriorityQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetNotificationsByPriorityQuery, GetNotificationsByPriorityQueryVariables>(GetNotificationsByPriorityDocument, options);
        }
export function useGetNotificationsByPrioritySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetNotificationsByPriorityQuery, GetNotificationsByPriorityQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetNotificationsByPriorityQuery, GetNotificationsByPriorityQueryVariables>(GetNotificationsByPriorityDocument, options);
        }
export type GetNotificationsByPriorityQueryHookResult = ReturnType<typeof useGetNotificationsByPriorityQuery>;
export type GetNotificationsByPriorityLazyQueryHookResult = ReturnType<typeof useGetNotificationsByPriorityLazyQuery>;
export type GetNotificationsByPrioritySuspenseQueryHookResult = ReturnType<typeof useGetNotificationsByPrioritySuspenseQuery>;
export type GetNotificationsByPriorityQueryResult = ApolloReactCommon.QueryResult<GetNotificationsByPriorityQuery, GetNotificationsByPriorityQueryVariables>;
export function refetchGetNotificationsByPriorityQuery(variables: GetNotificationsByPriorityQueryVariables) {
      return { query: GetNotificationsByPriorityDocument, variables: variables }
    }
export const GetRecentNotificationsDocument = gql`
    query GetRecentNotifications($userId: String!, $limit: Int = 10) {
  notifications(
    where: {user_id: {_eq: $userId}, _or: [{expires_at: {_is_null: true}}, {expires_at: {_gt: "now()"}}]}
    limit: $limit
    order_by: [{created_at: desc}]
  ) {
    id
    type
    title
    message
    link
    read
    priority
    created_at
  }
}
    `;

/**
 * __useGetRecentNotificationsQuery__
 *
 * To run a query within a React component, call `useGetRecentNotificationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetRecentNotificationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetRecentNotificationsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetRecentNotificationsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetRecentNotificationsQuery, GetRecentNotificationsQueryVariables> & ({ variables: GetRecentNotificationsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetRecentNotificationsQuery, GetRecentNotificationsQueryVariables>(GetRecentNotificationsDocument, options);
      }
export function useGetRecentNotificationsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetRecentNotificationsQuery, GetRecentNotificationsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetRecentNotificationsQuery, GetRecentNotificationsQueryVariables>(GetRecentNotificationsDocument, options);
        }
export function useGetRecentNotificationsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetRecentNotificationsQuery, GetRecentNotificationsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetRecentNotificationsQuery, GetRecentNotificationsQueryVariables>(GetRecentNotificationsDocument, options);
        }
export type GetRecentNotificationsQueryHookResult = ReturnType<typeof useGetRecentNotificationsQuery>;
export type GetRecentNotificationsLazyQueryHookResult = ReturnType<typeof useGetRecentNotificationsLazyQuery>;
export type GetRecentNotificationsSuspenseQueryHookResult = ReturnType<typeof useGetRecentNotificationsSuspenseQuery>;
export type GetRecentNotificationsQueryResult = ApolloReactCommon.QueryResult<GetRecentNotificationsQuery, GetRecentNotificationsQueryVariables>;
export function refetchGetRecentNotificationsQuery(variables: GetRecentNotificationsQueryVariables) {
      return { query: GetRecentNotificationsDocument, variables: variables }
    }
export const GetNotificationStatisticsDocument = gql`
    query GetNotificationStatistics($userId: String!) {
  total: notifications_aggregate(where: {user_id: {_eq: $userId}}) {
    aggregate {
      count
    }
  }
  unread: notifications_aggregate(
    where: {user_id: {_eq: $userId}, read: {_eq: false}}
  ) {
    aggregate {
      count
    }
  }
  urgent: notifications_aggregate(
    where: {user_id: {_eq: $userId}, priority: {_eq: "urgent"}, read: {_eq: false}}
  ) {
    aggregate {
      count
    }
  }
  high: notifications_aggregate(
    where: {user_id: {_eq: $userId}, priority: {_eq: "high"}, read: {_eq: false}}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetNotificationStatisticsQuery__
 *
 * To run a query within a React component, call `useGetNotificationStatisticsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNotificationStatisticsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNotificationStatisticsQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetNotificationStatisticsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetNotificationStatisticsQuery, GetNotificationStatisticsQueryVariables> & ({ variables: GetNotificationStatisticsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetNotificationStatisticsQuery, GetNotificationStatisticsQueryVariables>(GetNotificationStatisticsDocument, options);
      }
export function useGetNotificationStatisticsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetNotificationStatisticsQuery, GetNotificationStatisticsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetNotificationStatisticsQuery, GetNotificationStatisticsQueryVariables>(GetNotificationStatisticsDocument, options);
        }
export function useGetNotificationStatisticsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetNotificationStatisticsQuery, GetNotificationStatisticsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetNotificationStatisticsQuery, GetNotificationStatisticsQueryVariables>(GetNotificationStatisticsDocument, options);
        }
export type GetNotificationStatisticsQueryHookResult = ReturnType<typeof useGetNotificationStatisticsQuery>;
export type GetNotificationStatisticsLazyQueryHookResult = ReturnType<typeof useGetNotificationStatisticsLazyQuery>;
export type GetNotificationStatisticsSuspenseQueryHookResult = ReturnType<typeof useGetNotificationStatisticsSuspenseQuery>;
export type GetNotificationStatisticsQueryResult = ApolloReactCommon.QueryResult<GetNotificationStatisticsQuery, GetNotificationStatisticsQueryVariables>;
export function refetchGetNotificationStatisticsQuery(variables: GetNotificationStatisticsQueryVariables) {
      return { query: GetNotificationStatisticsDocument, variables: variables }
    }
export const GetPlacementWorkflowDocument = gql`
    query GetPlacementWorkflow($id: uuid!) {
  placement_workflows_by_pk(id: $id) {
    id
    sponsor_id
    agency_id
    maid_id
    status
    platform_fee_amount
    platform_fee_currency
    fee_status
    contact_date
    interview_scheduled_date
    interview_completed_date
    trial_start_date
    trial_end_date
    placement_confirmed_date
    sponsor_confirmed
    agency_confirmed
    interview_outcome
    trial_outcome
    failure_reason
    failure_stage
    guarantee_end_date
    guarantee_claimed
    notes
    metadata
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetPlacementWorkflowQuery__
 *
 * To run a query within a React component, call `useGetPlacementWorkflowQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPlacementWorkflowQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPlacementWorkflowQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetPlacementWorkflowQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetPlacementWorkflowQuery, GetPlacementWorkflowQueryVariables> & ({ variables: GetPlacementWorkflowQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPlacementWorkflowQuery, GetPlacementWorkflowQueryVariables>(GetPlacementWorkflowDocument, options);
      }
export function useGetPlacementWorkflowLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPlacementWorkflowQuery, GetPlacementWorkflowQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPlacementWorkflowQuery, GetPlacementWorkflowQueryVariables>(GetPlacementWorkflowDocument, options);
        }
export function useGetPlacementWorkflowSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPlacementWorkflowQuery, GetPlacementWorkflowQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetPlacementWorkflowQuery, GetPlacementWorkflowQueryVariables>(GetPlacementWorkflowDocument, options);
        }
export type GetPlacementWorkflowQueryHookResult = ReturnType<typeof useGetPlacementWorkflowQuery>;
export type GetPlacementWorkflowLazyQueryHookResult = ReturnType<typeof useGetPlacementWorkflowLazyQuery>;
export type GetPlacementWorkflowSuspenseQueryHookResult = ReturnType<typeof useGetPlacementWorkflowSuspenseQuery>;
export type GetPlacementWorkflowQueryResult = ApolloReactCommon.QueryResult<GetPlacementWorkflowQuery, GetPlacementWorkflowQueryVariables>;
export function refetchGetPlacementWorkflowQuery(variables: GetPlacementWorkflowQueryVariables) {
      return { query: GetPlacementWorkflowDocument, variables: variables }
    }
export const GetSponsorPlacementWorkflowsDocument = gql`
    query GetSponsorPlacementWorkflows($sponsorId: String!, $status: String) {
  placement_workflows(
    where: {sponsor_id: {_eq: $sponsorId}, status: {_eq: $status}}
    order_by: {created_at: desc}
  ) {
    id
    maid_id
    agency_id
    status
    platform_fee_amount
    platform_fee_currency
    fee_status
    contact_date
    interview_scheduled_date
    trial_start_date
    trial_end_date
    sponsor_confirmed
    agency_confirmed
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetSponsorPlacementWorkflowsQuery__
 *
 * To run a query within a React component, call `useGetSponsorPlacementWorkflowsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSponsorPlacementWorkflowsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSponsorPlacementWorkflowsQuery({
 *   variables: {
 *      sponsorId: // value for 'sponsorId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetSponsorPlacementWorkflowsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetSponsorPlacementWorkflowsQuery, GetSponsorPlacementWorkflowsQueryVariables> & ({ variables: GetSponsorPlacementWorkflowsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSponsorPlacementWorkflowsQuery, GetSponsorPlacementWorkflowsQueryVariables>(GetSponsorPlacementWorkflowsDocument, options);
      }
export function useGetSponsorPlacementWorkflowsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSponsorPlacementWorkflowsQuery, GetSponsorPlacementWorkflowsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSponsorPlacementWorkflowsQuery, GetSponsorPlacementWorkflowsQueryVariables>(GetSponsorPlacementWorkflowsDocument, options);
        }
export function useGetSponsorPlacementWorkflowsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSponsorPlacementWorkflowsQuery, GetSponsorPlacementWorkflowsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSponsorPlacementWorkflowsQuery, GetSponsorPlacementWorkflowsQueryVariables>(GetSponsorPlacementWorkflowsDocument, options);
        }
export type GetSponsorPlacementWorkflowsQueryHookResult = ReturnType<typeof useGetSponsorPlacementWorkflowsQuery>;
export type GetSponsorPlacementWorkflowsLazyQueryHookResult = ReturnType<typeof useGetSponsorPlacementWorkflowsLazyQuery>;
export type GetSponsorPlacementWorkflowsSuspenseQueryHookResult = ReturnType<typeof useGetSponsorPlacementWorkflowsSuspenseQuery>;
export type GetSponsorPlacementWorkflowsQueryResult = ApolloReactCommon.QueryResult<GetSponsorPlacementWorkflowsQuery, GetSponsorPlacementWorkflowsQueryVariables>;
export function refetchGetSponsorPlacementWorkflowsQuery(variables: GetSponsorPlacementWorkflowsQueryVariables) {
      return { query: GetSponsorPlacementWorkflowsDocument, variables: variables }
    }
export const GetAgencyPlacementWorkflowsDocument = gql`
    query GetAgencyPlacementWorkflows($agencyId: String!, $status: String) {
  placement_workflows(
    where: {agency_id: {_eq: $agencyId}, status: {_eq: $status}}
    order_by: {created_at: desc}
  ) {
    id
    sponsor_id
    maid_id
    status
    platform_fee_amount
    platform_fee_currency
    fee_status
    contact_date
    interview_scheduled_date
    trial_start_date
    trial_end_date
    sponsor_confirmed
    agency_confirmed
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetAgencyPlacementWorkflowsQuery__
 *
 * To run a query within a React component, call `useGetAgencyPlacementWorkflowsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAgencyPlacementWorkflowsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAgencyPlacementWorkflowsQuery({
 *   variables: {
 *      agencyId: // value for 'agencyId'
 *      status: // value for 'status'
 *   },
 * });
 */
export function useGetAgencyPlacementWorkflowsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetAgencyPlacementWorkflowsQuery, GetAgencyPlacementWorkflowsQueryVariables> & ({ variables: GetAgencyPlacementWorkflowsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAgencyPlacementWorkflowsQuery, GetAgencyPlacementWorkflowsQueryVariables>(GetAgencyPlacementWorkflowsDocument, options);
      }
export function useGetAgencyPlacementWorkflowsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAgencyPlacementWorkflowsQuery, GetAgencyPlacementWorkflowsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAgencyPlacementWorkflowsQuery, GetAgencyPlacementWorkflowsQueryVariables>(GetAgencyPlacementWorkflowsDocument, options);
        }
export function useGetAgencyPlacementWorkflowsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAgencyPlacementWorkflowsQuery, GetAgencyPlacementWorkflowsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAgencyPlacementWorkflowsQuery, GetAgencyPlacementWorkflowsQueryVariables>(GetAgencyPlacementWorkflowsDocument, options);
        }
export type GetAgencyPlacementWorkflowsQueryHookResult = ReturnType<typeof useGetAgencyPlacementWorkflowsQuery>;
export type GetAgencyPlacementWorkflowsLazyQueryHookResult = ReturnType<typeof useGetAgencyPlacementWorkflowsLazyQuery>;
export type GetAgencyPlacementWorkflowsSuspenseQueryHookResult = ReturnType<typeof useGetAgencyPlacementWorkflowsSuspenseQuery>;
export type GetAgencyPlacementWorkflowsQueryResult = ApolloReactCommon.QueryResult<GetAgencyPlacementWorkflowsQuery, GetAgencyPlacementWorkflowsQueryVariables>;
export function refetchGetAgencyPlacementWorkflowsQuery(variables: GetAgencyPlacementWorkflowsQueryVariables) {
      return { query: GetAgencyPlacementWorkflowsDocument, variables: variables }
    }
export const GetMaidActivePlacementDocument = gql`
    query GetMaidActivePlacement($maidId: String!) {
  placement_workflows(
    where: {maid_id: {_eq: $maidId}, status: {_nin: ["placement_failed", "placement_confirmed"]}}
    order_by: {created_at: desc}
    limit: 1
  ) {
    id
    sponsor_id
    agency_id
    status
    trial_start_date
    trial_end_date
    sponsor_confirmed
    agency_confirmed
    created_at
  }
}
    `;

/**
 * __useGetMaidActivePlacementQuery__
 *
 * To run a query within a React component, call `useGetMaidActivePlacementQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMaidActivePlacementQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMaidActivePlacementQuery({
 *   variables: {
 *      maidId: // value for 'maidId'
 *   },
 * });
 */
export function useGetMaidActivePlacementQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetMaidActivePlacementQuery, GetMaidActivePlacementQueryVariables> & ({ variables: GetMaidActivePlacementQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMaidActivePlacementQuery, GetMaidActivePlacementQueryVariables>(GetMaidActivePlacementDocument, options);
      }
export function useGetMaidActivePlacementLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMaidActivePlacementQuery, GetMaidActivePlacementQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMaidActivePlacementQuery, GetMaidActivePlacementQueryVariables>(GetMaidActivePlacementDocument, options);
        }
export function useGetMaidActivePlacementSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMaidActivePlacementQuery, GetMaidActivePlacementQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMaidActivePlacementQuery, GetMaidActivePlacementQueryVariables>(GetMaidActivePlacementDocument, options);
        }
export type GetMaidActivePlacementQueryHookResult = ReturnType<typeof useGetMaidActivePlacementQuery>;
export type GetMaidActivePlacementLazyQueryHookResult = ReturnType<typeof useGetMaidActivePlacementLazyQuery>;
export type GetMaidActivePlacementSuspenseQueryHookResult = ReturnType<typeof useGetMaidActivePlacementSuspenseQuery>;
export type GetMaidActivePlacementQueryResult = ApolloReactCommon.QueryResult<GetMaidActivePlacementQuery, GetMaidActivePlacementQueryVariables>;
export function refetchGetMaidActivePlacementQuery(variables: GetMaidActivePlacementQueryVariables) {
      return { query: GetMaidActivePlacementDocument, variables: variables }
    }
export const GetExpiringTrialsDocument = gql`
    query GetExpiringTrials {
  placement_workflows(
    where: {status: {_eq: "trial_started"}}
    order_by: {trial_end_date: asc}
  ) {
    id
    sponsor_id
    agency_id
    maid_id
    trial_start_date
    trial_end_date
    sponsor_confirmed
    agency_confirmed
  }
}
    `;

/**
 * __useGetExpiringTrialsQuery__
 *
 * To run a query within a React component, call `useGetExpiringTrialsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetExpiringTrialsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetExpiringTrialsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetExpiringTrialsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetExpiringTrialsQuery, GetExpiringTrialsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetExpiringTrialsQuery, GetExpiringTrialsQueryVariables>(GetExpiringTrialsDocument, options);
      }
export function useGetExpiringTrialsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetExpiringTrialsQuery, GetExpiringTrialsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetExpiringTrialsQuery, GetExpiringTrialsQueryVariables>(GetExpiringTrialsDocument, options);
        }
export function useGetExpiringTrialsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetExpiringTrialsQuery, GetExpiringTrialsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetExpiringTrialsQuery, GetExpiringTrialsQueryVariables>(GetExpiringTrialsDocument, options);
        }
export type GetExpiringTrialsQueryHookResult = ReturnType<typeof useGetExpiringTrialsQuery>;
export type GetExpiringTrialsLazyQueryHookResult = ReturnType<typeof useGetExpiringTrialsLazyQuery>;
export type GetExpiringTrialsSuspenseQueryHookResult = ReturnType<typeof useGetExpiringTrialsSuspenseQuery>;
export type GetExpiringTrialsQueryResult = ApolloReactCommon.QueryResult<GetExpiringTrialsQuery, GetExpiringTrialsQueryVariables>;
export function refetchGetExpiringTrialsQuery(variables?: GetExpiringTrialsQueryVariables) {
      return { query: GetExpiringTrialsDocument, variables: variables }
    }
export const GetPlacementStatsDocument = gql`
    query GetPlacementStats($startDate: timestamptz!, $endDate: timestamptz!) {
  total: placement_workflows_aggregate(
    where: {created_at: {_gte: $startDate, _lte: $endDate}}
  ) {
    aggregate {
      count
    }
  }
  successful: placement_workflows_aggregate(
    where: {status: {_eq: "placement_confirmed"}, created_at: {_gte: $startDate, _lte: $endDate}}
  ) {
    aggregate {
      count
    }
  }
  failed: placement_workflows_aggregate(
    where: {status: {_eq: "placement_failed"}, created_at: {_gte: $startDate, _lte: $endDate}}
  ) {
    aggregate {
      count
    }
  }
  in_trial: placement_workflows_aggregate(where: {status: {_eq: "trial_started"}}) {
    aggregate {
      count
    }
  }
  revenue: placement_workflows_aggregate(
    where: {fee_status: {_eq: "earned"}, created_at: {_gte: $startDate, _lte: $endDate}}
  ) {
    aggregate {
      sum {
        platform_fee_amount
      }
    }
  }
}
    `;

/**
 * __useGetPlacementStatsQuery__
 *
 * To run a query within a React component, call `useGetPlacementStatsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPlacementStatsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPlacementStatsQuery({
 *   variables: {
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *   },
 * });
 */
export function useGetPlacementStatsQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetPlacementStatsQuery, GetPlacementStatsQueryVariables> & ({ variables: GetPlacementStatsQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPlacementStatsQuery, GetPlacementStatsQueryVariables>(GetPlacementStatsDocument, options);
      }
export function useGetPlacementStatsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPlacementStatsQuery, GetPlacementStatsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPlacementStatsQuery, GetPlacementStatsQueryVariables>(GetPlacementStatsDocument, options);
        }
export function useGetPlacementStatsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPlacementStatsQuery, GetPlacementStatsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetPlacementStatsQuery, GetPlacementStatsQueryVariables>(GetPlacementStatsDocument, options);
        }
export type GetPlacementStatsQueryHookResult = ReturnType<typeof useGetPlacementStatsQuery>;
export type GetPlacementStatsLazyQueryHookResult = ReturnType<typeof useGetPlacementStatsLazyQuery>;
export type GetPlacementStatsSuspenseQueryHookResult = ReturnType<typeof useGetPlacementStatsSuspenseQuery>;
export type GetPlacementStatsQueryResult = ApolloReactCommon.QueryResult<GetPlacementStatsQuery, GetPlacementStatsQueryVariables>;
export function refetchGetPlacementStatsQuery(variables: GetPlacementStatsQueryVariables) {
      return { query: GetPlacementStatsDocument, variables: variables }
    }
export const GetPlatformFeeRequirementsDocument = gql`
    query GetPlatformFeeRequirements {
  platform_fee_requirements(
    where: {is_active: {_eq: true}}
    order_by: {country_name: asc}
  ) {
    id
    country_code
    country_name
    currency
    amount
    is_active
  }
}
    `;

/**
 * __useGetPlatformFeeRequirementsQuery__
 *
 * To run a query within a React component, call `useGetPlatformFeeRequirementsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPlatformFeeRequirementsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPlatformFeeRequirementsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPlatformFeeRequirementsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetPlatformFeeRequirementsQuery, GetPlatformFeeRequirementsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPlatformFeeRequirementsQuery, GetPlatformFeeRequirementsQueryVariables>(GetPlatformFeeRequirementsDocument, options);
      }
export function useGetPlatformFeeRequirementsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPlatformFeeRequirementsQuery, GetPlatformFeeRequirementsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPlatformFeeRequirementsQuery, GetPlatformFeeRequirementsQueryVariables>(GetPlatformFeeRequirementsDocument, options);
        }
export function useGetPlatformFeeRequirementsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPlatformFeeRequirementsQuery, GetPlatformFeeRequirementsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetPlatformFeeRequirementsQuery, GetPlatformFeeRequirementsQueryVariables>(GetPlatformFeeRequirementsDocument, options);
        }
export type GetPlatformFeeRequirementsQueryHookResult = ReturnType<typeof useGetPlatformFeeRequirementsQuery>;
export type GetPlatformFeeRequirementsLazyQueryHookResult = ReturnType<typeof useGetPlatformFeeRequirementsLazyQuery>;
export type GetPlatformFeeRequirementsSuspenseQueryHookResult = ReturnType<typeof useGetPlatformFeeRequirementsSuspenseQuery>;
export type GetPlatformFeeRequirementsQueryResult = ApolloReactCommon.QueryResult<GetPlatformFeeRequirementsQuery, GetPlatformFeeRequirementsQueryVariables>;
export function refetchGetPlatformFeeRequirementsQuery(variables?: GetPlatformFeeRequirementsQueryVariables) {
      return { query: GetPlatformFeeRequirementsDocument, variables: variables }
    }
export const GetPlatformFeeForCountryDocument = gql`
    query GetPlatformFeeForCountry($countryCode: String!) {
  platform_fee_requirements(
    where: {country_code: {_eq: $countryCode}, is_active: {_eq: true}}
    limit: 1
  ) {
    id
    country_code
    country_name
    currency
    amount
  }
}
    `;

/**
 * __useGetPlatformFeeForCountryQuery__
 *
 * To run a query within a React component, call `useGetPlatformFeeForCountryQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPlatformFeeForCountryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPlatformFeeForCountryQuery({
 *   variables: {
 *      countryCode: // value for 'countryCode'
 *   },
 * });
 */
export function useGetPlatformFeeForCountryQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetPlatformFeeForCountryQuery, GetPlatformFeeForCountryQueryVariables> & ({ variables: GetPlatformFeeForCountryQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPlatformFeeForCountryQuery, GetPlatformFeeForCountryQueryVariables>(GetPlatformFeeForCountryDocument, options);
      }
export function useGetPlatformFeeForCountryLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPlatformFeeForCountryQuery, GetPlatformFeeForCountryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPlatformFeeForCountryQuery, GetPlatformFeeForCountryQueryVariables>(GetPlatformFeeForCountryDocument, options);
        }
export function useGetPlatformFeeForCountrySuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPlatformFeeForCountryQuery, GetPlatformFeeForCountryQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetPlatformFeeForCountryQuery, GetPlatformFeeForCountryQueryVariables>(GetPlatformFeeForCountryDocument, options);
        }
export type GetPlatformFeeForCountryQueryHookResult = ReturnType<typeof useGetPlatformFeeForCountryQuery>;
export type GetPlatformFeeForCountryLazyQueryHookResult = ReturnType<typeof useGetPlatformFeeForCountryLazyQuery>;
export type GetPlatformFeeForCountrySuspenseQueryHookResult = ReturnType<typeof useGetPlatformFeeForCountrySuspenseQuery>;
export type GetPlatformFeeForCountryQueryResult = ApolloReactCommon.QueryResult<GetPlatformFeeForCountryQuery, GetPlatformFeeForCountryQueryVariables>;
export function refetchGetPlatformFeeForCountryQuery(variables: GetPlatformFeeForCountryQueryVariables) {
      return { query: GetPlatformFeeForCountryDocument, variables: variables }
    }
export const GetRecentPlacementsDocument = gql`
    query GetRecentPlacements($limit: Int = 10) {
  placement_workflows(order_by: {created_at: desc}, limit: $limit) {
    id
    sponsor_id
    agency_id
    maid_id
    status
    fee_status
    platform_fee_amount
    platform_fee_currency
    contact_date
    placement_confirmed_date
    created_at
  }
}
    `;

/**
 * __useGetRecentPlacementsQuery__
 *
 * To run a query within a React component, call `useGetRecentPlacementsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetRecentPlacementsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetRecentPlacementsQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetRecentPlacementsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetRecentPlacementsQuery, GetRecentPlacementsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetRecentPlacementsQuery, GetRecentPlacementsQueryVariables>(GetRecentPlacementsDocument, options);
      }
export function useGetRecentPlacementsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetRecentPlacementsQuery, GetRecentPlacementsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetRecentPlacementsQuery, GetRecentPlacementsQueryVariables>(GetRecentPlacementsDocument, options);
        }
export function useGetRecentPlacementsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetRecentPlacementsQuery, GetRecentPlacementsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetRecentPlacementsQuery, GetRecentPlacementsQueryVariables>(GetRecentPlacementsDocument, options);
        }
export type GetRecentPlacementsQueryHookResult = ReturnType<typeof useGetRecentPlacementsQuery>;
export type GetRecentPlacementsLazyQueryHookResult = ReturnType<typeof useGetRecentPlacementsLazyQuery>;
export type GetRecentPlacementsSuspenseQueryHookResult = ReturnType<typeof useGetRecentPlacementsSuspenseQuery>;
export type GetRecentPlacementsQueryResult = ApolloReactCommon.QueryResult<GetRecentPlacementsQuery, GetRecentPlacementsQueryVariables>;
export function refetchGetRecentPlacementsQuery(variables?: GetRecentPlacementsQueryVariables) {
      return { query: GetRecentPlacementsDocument, variables: variables }
    }
export const GetProfileDocument = gql`
    query GetProfile($id: String!) {
  profiles_by_pk(id: $id) {
    id
    full_name
    email
    phone
    user_type
    avatar_url
    country
    location
    registration_complete
    is_active
    profile_completion
    verification_status
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetProfileQuery__
 *
 * To run a query within a React component, call `useGetProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProfileQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetProfileQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetProfileQuery, GetProfileQueryVariables> & ({ variables: GetProfileQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetProfileQuery, GetProfileQueryVariables>(GetProfileDocument, options);
      }
export function useGetProfileLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetProfileQuery, GetProfileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetProfileQuery, GetProfileQueryVariables>(GetProfileDocument, options);
        }
export function useGetProfileSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetProfileQuery, GetProfileQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetProfileQuery, GetProfileQueryVariables>(GetProfileDocument, options);
        }
export type GetProfileQueryHookResult = ReturnType<typeof useGetProfileQuery>;
export type GetProfileLazyQueryHookResult = ReturnType<typeof useGetProfileLazyQuery>;
export type GetProfileSuspenseQueryHookResult = ReturnType<typeof useGetProfileSuspenseQuery>;
export type GetProfileQueryResult = ApolloReactCommon.QueryResult<GetProfileQuery, GetProfileQueryVariables>;
export function refetchGetProfileQuery(variables: GetProfileQueryVariables) {
      return { query: GetProfileDocument, variables: variables }
    }
export const GetAllProfilesDocument = gql`
    query GetAllProfiles($limit: Int = 20, $offset: Int = 0, $where: profiles_bool_exp) {
  profiles(
    limit: $limit
    offset: $offset
    where: $where
    order_by: {created_at: desc}
  ) {
    id
    full_name
    email
    user_type
    avatar_url
    location
    country
    created_at
  }
  profiles_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetAllProfilesQuery__
 *
 * To run a query within a React component, call `useGetAllProfilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAllProfilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAllProfilesQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      where: // value for 'where'
 *   },
 * });
 */
export function useGetAllProfilesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAllProfilesQuery, GetAllProfilesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAllProfilesQuery, GetAllProfilesQueryVariables>(GetAllProfilesDocument, options);
      }
export function useGetAllProfilesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAllProfilesQuery, GetAllProfilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAllProfilesQuery, GetAllProfilesQueryVariables>(GetAllProfilesDocument, options);
        }
export function useGetAllProfilesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAllProfilesQuery, GetAllProfilesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAllProfilesQuery, GetAllProfilesQueryVariables>(GetAllProfilesDocument, options);
        }
export type GetAllProfilesQueryHookResult = ReturnType<typeof useGetAllProfilesQuery>;
export type GetAllProfilesLazyQueryHookResult = ReturnType<typeof useGetAllProfilesLazyQuery>;
export type GetAllProfilesSuspenseQueryHookResult = ReturnType<typeof useGetAllProfilesSuspenseQuery>;
export type GetAllProfilesQueryResult = ApolloReactCommon.QueryResult<GetAllProfilesQuery, GetAllProfilesQueryVariables>;
export function refetchGetAllProfilesQuery(variables?: GetAllProfilesQueryVariables) {
      return { query: GetAllProfilesDocument, variables: variables }
    }
export const GetProfileByEmailDocument = gql`
    query GetProfileByEmail($email: String!) {
  profiles(where: {email: {_eq: $email}}, limit: 1) {
    id
    full_name
    email
    user_type
    avatar_url
  }
}
    `;

/**
 * __useGetProfileByEmailQuery__
 *
 * To run a query within a React component, call `useGetProfileByEmailQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProfileByEmailQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProfileByEmailQuery({
 *   variables: {
 *      email: // value for 'email'
 *   },
 * });
 */
export function useGetProfileByEmailQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetProfileByEmailQuery, GetProfileByEmailQueryVariables> & ({ variables: GetProfileByEmailQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetProfileByEmailQuery, GetProfileByEmailQueryVariables>(GetProfileByEmailDocument, options);
      }
export function useGetProfileByEmailLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetProfileByEmailQuery, GetProfileByEmailQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetProfileByEmailQuery, GetProfileByEmailQueryVariables>(GetProfileByEmailDocument, options);
        }
export function useGetProfileByEmailSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetProfileByEmailQuery, GetProfileByEmailQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetProfileByEmailQuery, GetProfileByEmailQueryVariables>(GetProfileByEmailDocument, options);
        }
export type GetProfileByEmailQueryHookResult = ReturnType<typeof useGetProfileByEmailQuery>;
export type GetProfileByEmailLazyQueryHookResult = ReturnType<typeof useGetProfileByEmailLazyQuery>;
export type GetProfileByEmailSuspenseQueryHookResult = ReturnType<typeof useGetProfileByEmailSuspenseQuery>;
export type GetProfileByEmailQueryResult = ApolloReactCommon.QueryResult<GetProfileByEmailQuery, GetProfileByEmailQueryVariables>;
export function refetchGetProfileByEmailQuery(variables: GetProfileByEmailQueryVariables) {
      return { query: GetProfileByEmailDocument, variables: variables }
    }
export const UpdateProfileDocument = gql`
    mutation UpdateProfile($id: String!, $data: profiles_set_input!) {
  update_profiles_by_pk(pk_columns: {id: $id}, _set: $data) {
    id
    full_name
    email
    phone
    avatar_url
    location
    country
    updated_at
  }
}
    `;

/**
 * __useUpdateProfileMutation__
 *
 * To run a mutation, you first call `useUpdateProfileMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateProfileMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateProfileMutation, { data, loading, error }] = useUpdateProfileMutation({
 *   variables: {
 *      id: // value for 'id'
 *      data: // value for 'data'
 *   },
 * });
 */
export function useUpdateProfileMutation(baseOptions?: ApolloReactHooks.MutationHookOptions<UpdateProfileMutation, UpdateProfileMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useMutation<UpdateProfileMutation, UpdateProfileMutationVariables>(UpdateProfileDocument, options);
      }
export type UpdateProfileMutationHookResult = ReturnType<typeof useUpdateProfileMutation>;
export type UpdateProfileMutationResult = ApolloReactCommon.MutationResult<UpdateProfileMutation>;
export type UpdateProfileMutationOptions = ApolloReactCommon.BaseMutationOptions<UpdateProfileMutation, UpdateProfileMutationVariables>;
export const GetMaidProfileDataDocument = gql`
    query GetMaidProfileData($userId: String!) {
  profiles_by_pk(id: $userId) {
    id
    email
    full_name
    phone
    country
    avatar_url
    user_type
    created_at
    updated_at
    maid_profile {
      id
      user_id
      first_name
      middle_name
      last_name
      full_name
      date_of_birth
      marital_status
      nationality
      country
      current_location
      street_address
      suburb
      state_province
      languages
      profile_photo_url
      primary_profession
      primary_profession_other
      visa_status
      current_visa_status
      skills
      special_skills
      experience_years
      key_responsibilities
      preferred_salary_min
      preferred_salary_max
      preferred_currency
      availability_status
      available_from
      about_me
      additional_services
      work_preferences
      introduction_video_url
      phone_number
      phone_country_code
      education_level
      religion
      children_count
    }
  }
}
    `;

/**
 * __useGetMaidProfileDataQuery__
 *
 * To run a query within a React component, call `useGetMaidProfileDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMaidProfileDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMaidProfileDataQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetMaidProfileDataQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetMaidProfileDataQuery, GetMaidProfileDataQueryVariables> & ({ variables: GetMaidProfileDataQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMaidProfileDataQuery, GetMaidProfileDataQueryVariables>(GetMaidProfileDataDocument, options);
      }
export function useGetMaidProfileDataLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMaidProfileDataQuery, GetMaidProfileDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMaidProfileDataQuery, GetMaidProfileDataQueryVariables>(GetMaidProfileDataDocument, options);
        }
export function useGetMaidProfileDataSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMaidProfileDataQuery, GetMaidProfileDataQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMaidProfileDataQuery, GetMaidProfileDataQueryVariables>(GetMaidProfileDataDocument, options);
        }
export type GetMaidProfileDataQueryHookResult = ReturnType<typeof useGetMaidProfileDataQuery>;
export type GetMaidProfileDataLazyQueryHookResult = ReturnType<typeof useGetMaidProfileDataLazyQuery>;
export type GetMaidProfileDataSuspenseQueryHookResult = ReturnType<typeof useGetMaidProfileDataSuspenseQuery>;
export type GetMaidProfileDataQueryResult = ApolloReactCommon.QueryResult<GetMaidProfileDataQuery, GetMaidProfileDataQueryVariables>;
export function refetchGetMaidProfileDataQuery(variables: GetMaidProfileDataQueryVariables) {
      return { query: GetMaidProfileDataDocument, variables: variables }
    }
export const GetSponsorProfileDataDocument = gql`
    query GetSponsorProfileData($userId: String!) {
  profiles_by_pk(id: $userId) {
    id
    email
    full_name
    phone
    country
    avatar_url
    user_type
    created_at
    updated_at
  }
  sponsor_profiles(where: {id: {_eq: $userId}}, limit: 1) {
    id
    full_name
    household_size
    number_of_children
    children_ages
    elderly_care_needed
    pets
    pet_types
    city
    country
    address
    phone_number
    religion
    accommodation_type
    preferred_nationality
    preferred_experience_years
    required_skills
    preferred_languages
    salary_budget_min
    salary_budget_max
    currency
    live_in_required
    working_hours_per_day
    days_off_per_week
    overtime_available
    additional_benefits
  }
}
    `;

/**
 * __useGetSponsorProfileDataQuery__
 *
 * To run a query within a React component, call `useGetSponsorProfileDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSponsorProfileDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSponsorProfileDataQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetSponsorProfileDataQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetSponsorProfileDataQuery, GetSponsorProfileDataQueryVariables> & ({ variables: GetSponsorProfileDataQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSponsorProfileDataQuery, GetSponsorProfileDataQueryVariables>(GetSponsorProfileDataDocument, options);
      }
export function useGetSponsorProfileDataLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSponsorProfileDataQuery, GetSponsorProfileDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSponsorProfileDataQuery, GetSponsorProfileDataQueryVariables>(GetSponsorProfileDataDocument, options);
        }
export function useGetSponsorProfileDataSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSponsorProfileDataQuery, GetSponsorProfileDataQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSponsorProfileDataQuery, GetSponsorProfileDataQueryVariables>(GetSponsorProfileDataDocument, options);
        }
export type GetSponsorProfileDataQueryHookResult = ReturnType<typeof useGetSponsorProfileDataQuery>;
export type GetSponsorProfileDataLazyQueryHookResult = ReturnType<typeof useGetSponsorProfileDataLazyQuery>;
export type GetSponsorProfileDataSuspenseQueryHookResult = ReturnType<typeof useGetSponsorProfileDataSuspenseQuery>;
export type GetSponsorProfileDataQueryResult = ApolloReactCommon.QueryResult<GetSponsorProfileDataQuery, GetSponsorProfileDataQueryVariables>;
export function refetchGetSponsorProfileDataQuery(variables: GetSponsorProfileDataQueryVariables) {
      return { query: GetSponsorProfileDataDocument, variables: variables }
    }
export const GetAgencyProfileDataDocument = gql`
    query GetAgencyProfileData($userId: String!) {
  profiles_by_pk(id: $userId) {
    id
    email
    full_name
    phone
    country
    avatar_url
    user_type
    created_at
    updated_at
  }
  agency_profiles(where: {id: {_eq: $userId}}, limit: 1) {
    id
    full_name
    agency_description
    license_number
    license_expiry_date
    business_email
    business_phone
    address
    city
    country
    website_url
    logo_url
    authorized_person_name
    authorized_person_email
    authorized_person_phone
    service_countries
    specialization
    total_maids
    active_listings
    successful_placements
    average_rating
    verification_status
    verified
  }
}
    `;

/**
 * __useGetAgencyProfileDataQuery__
 *
 * To run a query within a React component, call `useGetAgencyProfileDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAgencyProfileDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAgencyProfileDataQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetAgencyProfileDataQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetAgencyProfileDataQuery, GetAgencyProfileDataQueryVariables> & ({ variables: GetAgencyProfileDataQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAgencyProfileDataQuery, GetAgencyProfileDataQueryVariables>(GetAgencyProfileDataDocument, options);
      }
export function useGetAgencyProfileDataLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAgencyProfileDataQuery, GetAgencyProfileDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAgencyProfileDataQuery, GetAgencyProfileDataQueryVariables>(GetAgencyProfileDataDocument, options);
        }
export function useGetAgencyProfileDataSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAgencyProfileDataQuery, GetAgencyProfileDataQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAgencyProfileDataQuery, GetAgencyProfileDataQueryVariables>(GetAgencyProfileDataDocument, options);
        }
export type GetAgencyProfileDataQueryHookResult = ReturnType<typeof useGetAgencyProfileDataQuery>;
export type GetAgencyProfileDataLazyQueryHookResult = ReturnType<typeof useGetAgencyProfileDataLazyQuery>;
export type GetAgencyProfileDataSuspenseQueryHookResult = ReturnType<typeof useGetAgencyProfileDataSuspenseQuery>;
export type GetAgencyProfileDataQueryResult = ApolloReactCommon.QueryResult<GetAgencyProfileDataQuery, GetAgencyProfileDataQueryVariables>;
export function refetchGetAgencyProfileDataQuery(variables: GetAgencyProfileDataQueryVariables) {
      return { query: GetAgencyProfileDataDocument, variables: variables }
    }
export const GetUserProfileDataDocument = gql`
    query GetUserProfileData($userId: String!) {
  profiles_by_pk(id: $userId) {
    id
    email
    full_name
    phone
    country
    avatar_url
    user_type
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetUserProfileDataQuery__
 *
 * To run a query within a React component, call `useGetUserProfileDataQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetUserProfileDataQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetUserProfileDataQuery({
 *   variables: {
 *      userId: // value for 'userId'
 *   },
 * });
 */
export function useGetUserProfileDataQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetUserProfileDataQuery, GetUserProfileDataQueryVariables> & ({ variables: GetUserProfileDataQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetUserProfileDataQuery, GetUserProfileDataQueryVariables>(GetUserProfileDataDocument, options);
      }
export function useGetUserProfileDataLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetUserProfileDataQuery, GetUserProfileDataQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetUserProfileDataQuery, GetUserProfileDataQueryVariables>(GetUserProfileDataDocument, options);
        }
export function useGetUserProfileDataSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetUserProfileDataQuery, GetUserProfileDataQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetUserProfileDataQuery, GetUserProfileDataQueryVariables>(GetUserProfileDataDocument, options);
        }
export type GetUserProfileDataQueryHookResult = ReturnType<typeof useGetUserProfileDataQuery>;
export type GetUserProfileDataLazyQueryHookResult = ReturnType<typeof useGetUserProfileDataLazyQuery>;
export type GetUserProfileDataSuspenseQueryHookResult = ReturnType<typeof useGetUserProfileDataSuspenseQuery>;
export type GetUserProfileDataQueryResult = ApolloReactCommon.QueryResult<GetUserProfileDataQuery, GetUserProfileDataQueryVariables>;
export function refetchGetUserProfileDataQuery(variables: GetUserProfileDataQueryVariables) {
      return { query: GetUserProfileDataDocument, variables: variables }
    }
export const GetSponsorProfileCompleteDocument = gql`
    query GetSponsorProfileComplete($id: String!) {
  sponsor_profiles_by_pk(id: $id) {
    id
    full_name
    household_size
    number_of_children
    children_ages
    elderly_care_needed
    pets
    pet_types
    city
    country
    address
    accommodation_type
    preferred_nationality
    preferred_experience_years
    required_skills
    preferred_languages
    salary_budget_min
    salary_budget_max
    currency
    live_in_required
    working_hours_per_day
    days_off_per_week
    overtime_available
    additional_benefits
    identity_verified
    background_check_completed
    active_job_postings
    total_hires
    average_rating
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetSponsorProfileCompleteQuery__
 *
 * To run a query within a React component, call `useGetSponsorProfileCompleteQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSponsorProfileCompleteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSponsorProfileCompleteQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetSponsorProfileCompleteQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetSponsorProfileCompleteQuery, GetSponsorProfileCompleteQueryVariables> & ({ variables: GetSponsorProfileCompleteQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSponsorProfileCompleteQuery, GetSponsorProfileCompleteQueryVariables>(GetSponsorProfileCompleteDocument, options);
      }
export function useGetSponsorProfileCompleteLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSponsorProfileCompleteQuery, GetSponsorProfileCompleteQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSponsorProfileCompleteQuery, GetSponsorProfileCompleteQueryVariables>(GetSponsorProfileCompleteDocument, options);
        }
export function useGetSponsorProfileCompleteSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSponsorProfileCompleteQuery, GetSponsorProfileCompleteQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSponsorProfileCompleteQuery, GetSponsorProfileCompleteQueryVariables>(GetSponsorProfileCompleteDocument, options);
        }
export type GetSponsorProfileCompleteQueryHookResult = ReturnType<typeof useGetSponsorProfileCompleteQuery>;
export type GetSponsorProfileCompleteLazyQueryHookResult = ReturnType<typeof useGetSponsorProfileCompleteLazyQuery>;
export type GetSponsorProfileCompleteSuspenseQueryHookResult = ReturnType<typeof useGetSponsorProfileCompleteSuspenseQuery>;
export type GetSponsorProfileCompleteQueryResult = ApolloReactCommon.QueryResult<GetSponsorProfileCompleteQuery, GetSponsorProfileCompleteQueryVariables>;
export function refetchGetSponsorProfileCompleteQuery(variables: GetSponsorProfileCompleteQueryVariables) {
      return { query: GetSponsorProfileCompleteDocument, variables: variables }
    }
export const GetSponsorProfileDocument = gql`
    query GetSponsorProfile($id: String!) {
  sponsor_profiles_by_pk(id: $id) {
    id
    full_name
    household_size
    number_of_children
    city
    country
    preferred_nationality
    required_skills
    preferred_languages
    salary_budget_min
    salary_budget_max
    currency
    identity_verified
    background_check_completed
    active_job_postings
    total_hires
    average_rating
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetSponsorProfileQuery__
 *
 * To run a query within a React component, call `useGetSponsorProfileQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSponsorProfileQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSponsorProfileQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetSponsorProfileQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetSponsorProfileQuery, GetSponsorProfileQueryVariables> & ({ variables: GetSponsorProfileQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSponsorProfileQuery, GetSponsorProfileQueryVariables>(GetSponsorProfileDocument, options);
      }
export function useGetSponsorProfileLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSponsorProfileQuery, GetSponsorProfileQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSponsorProfileQuery, GetSponsorProfileQueryVariables>(GetSponsorProfileDocument, options);
        }
export function useGetSponsorProfileSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSponsorProfileQuery, GetSponsorProfileQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSponsorProfileQuery, GetSponsorProfileQueryVariables>(GetSponsorProfileDocument, options);
        }
export type GetSponsorProfileQueryHookResult = ReturnType<typeof useGetSponsorProfileQuery>;
export type GetSponsorProfileLazyQueryHookResult = ReturnType<typeof useGetSponsorProfileLazyQuery>;
export type GetSponsorProfileSuspenseQueryHookResult = ReturnType<typeof useGetSponsorProfileSuspenseQuery>;
export type GetSponsorProfileQueryResult = ApolloReactCommon.QueryResult<GetSponsorProfileQuery, GetSponsorProfileQueryVariables>;
export function refetchGetSponsorProfileQuery(variables: GetSponsorProfileQueryVariables) {
      return { query: GetSponsorProfileDocument, variables: variables }
    }
export const ListSponsorProfilesDocument = gql`
    query ListSponsorProfiles($limit: Int = 20, $offset: Int = 0, $where: sponsor_profiles_bool_exp, $orderBy: [sponsor_profiles_order_by!] = [{created_at: desc}]) {
  sponsor_profiles(
    where: $where
    limit: $limit
    offset: $offset
    order_by: $orderBy
  ) {
    id
    full_name
    household_size
    number_of_children
    city
    country
    salary_budget_min
    salary_budget_max
    currency
    active_job_postings
    total_hires
    average_rating
    created_at
  }
  sponsor_profiles_aggregate(where: $where) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useListSponsorProfilesQuery__
 *
 * To run a query within a React component, call `useListSponsorProfilesQuery` and pass it any options that fit your needs.
 * When your component renders, `useListSponsorProfilesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useListSponsorProfilesQuery({
 *   variables: {
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *      where: // value for 'where'
 *      orderBy: // value for 'orderBy'
 *   },
 * });
 */
export function useListSponsorProfilesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<ListSponsorProfilesQuery, ListSponsorProfilesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<ListSponsorProfilesQuery, ListSponsorProfilesQueryVariables>(ListSponsorProfilesDocument, options);
      }
export function useListSponsorProfilesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<ListSponsorProfilesQuery, ListSponsorProfilesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<ListSponsorProfilesQuery, ListSponsorProfilesQueryVariables>(ListSponsorProfilesDocument, options);
        }
export function useListSponsorProfilesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<ListSponsorProfilesQuery, ListSponsorProfilesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<ListSponsorProfilesQuery, ListSponsorProfilesQueryVariables>(ListSponsorProfilesDocument, options);
        }
export type ListSponsorProfilesQueryHookResult = ReturnType<typeof useListSponsorProfilesQuery>;
export type ListSponsorProfilesLazyQueryHookResult = ReturnType<typeof useListSponsorProfilesLazyQuery>;
export type ListSponsorProfilesSuspenseQueryHookResult = ReturnType<typeof useListSponsorProfilesSuspenseQuery>;
export type ListSponsorProfilesQueryResult = ApolloReactCommon.QueryResult<ListSponsorProfilesQuery, ListSponsorProfilesQueryVariables>;
export function refetchListSponsorProfilesQuery(variables?: ListSponsorProfilesQueryVariables) {
      return { query: ListSponsorProfilesDocument, variables: variables }
    }
export const GetWhatsAppMessagesDocument = gql`
    query GetWhatsAppMessages($phoneNumber: String, $sender: String, $limit: Int = 50, $offset: Int = 0) {
  whatsapp_messages(
    where: {_and: [{phone_number: {_eq: $phoneNumber}}, {sender: {_eq: $sender}}]}
    order_by: {received_at: desc}
    limit: $limit
    offset: $offset
  ) {
    id
    phone_number
    message_content
    message_type
    received_at
    sender
    ai_response
    processed
    created_at
  }
  whatsapp_messages_aggregate(
    where: {_and: [{phone_number: {_eq: $phoneNumber}}, {sender: {_eq: $sender}}]}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetWhatsAppMessagesQuery__
 *
 * To run a query within a React component, call `useGetWhatsAppMessagesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWhatsAppMessagesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWhatsAppMessagesQuery({
 *   variables: {
 *      phoneNumber: // value for 'phoneNumber'
 *      sender: // value for 'sender'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetWhatsAppMessagesQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetWhatsAppMessagesQuery, GetWhatsAppMessagesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetWhatsAppMessagesQuery, GetWhatsAppMessagesQueryVariables>(GetWhatsAppMessagesDocument, options);
      }
export function useGetWhatsAppMessagesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetWhatsAppMessagesQuery, GetWhatsAppMessagesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetWhatsAppMessagesQuery, GetWhatsAppMessagesQueryVariables>(GetWhatsAppMessagesDocument, options);
        }
export function useGetWhatsAppMessagesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetWhatsAppMessagesQuery, GetWhatsAppMessagesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetWhatsAppMessagesQuery, GetWhatsAppMessagesQueryVariables>(GetWhatsAppMessagesDocument, options);
        }
export type GetWhatsAppMessagesQueryHookResult = ReturnType<typeof useGetWhatsAppMessagesQuery>;
export type GetWhatsAppMessagesLazyQueryHookResult = ReturnType<typeof useGetWhatsAppMessagesLazyQuery>;
export type GetWhatsAppMessagesSuspenseQueryHookResult = ReturnType<typeof useGetWhatsAppMessagesSuspenseQuery>;
export type GetWhatsAppMessagesQueryResult = ApolloReactCommon.QueryResult<GetWhatsAppMessagesQuery, GetWhatsAppMessagesQueryVariables>;
export function refetchGetWhatsAppMessagesQuery(variables?: GetWhatsAppMessagesQueryVariables) {
      return { query: GetWhatsAppMessagesDocument, variables: variables }
    }
export const GetWhatsAppConversationDocument = gql`
    query GetWhatsAppConversation($phoneNumber: String!, $limit: Int = 100) {
  whatsapp_messages(
    where: {phone_number: {_eq: $phoneNumber}}
    order_by: {received_at: asc}
    limit: $limit
  ) {
    id
    phone_number
    message_content
    message_type
    received_at
    sender
    ai_response
    processed
  }
}
    `;

/**
 * __useGetWhatsAppConversationQuery__
 *
 * To run a query within a React component, call `useGetWhatsAppConversationQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWhatsAppConversationQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWhatsAppConversationQuery({
 *   variables: {
 *      phoneNumber: // value for 'phoneNumber'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useGetWhatsAppConversationQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetWhatsAppConversationQuery, GetWhatsAppConversationQueryVariables> & ({ variables: GetWhatsAppConversationQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetWhatsAppConversationQuery, GetWhatsAppConversationQueryVariables>(GetWhatsAppConversationDocument, options);
      }
export function useGetWhatsAppConversationLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetWhatsAppConversationQuery, GetWhatsAppConversationQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetWhatsAppConversationQuery, GetWhatsAppConversationQueryVariables>(GetWhatsAppConversationDocument, options);
        }
export function useGetWhatsAppConversationSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetWhatsAppConversationQuery, GetWhatsAppConversationQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetWhatsAppConversationQuery, GetWhatsAppConversationQueryVariables>(GetWhatsAppConversationDocument, options);
        }
export type GetWhatsAppConversationQueryHookResult = ReturnType<typeof useGetWhatsAppConversationQuery>;
export type GetWhatsAppConversationLazyQueryHookResult = ReturnType<typeof useGetWhatsAppConversationLazyQuery>;
export type GetWhatsAppConversationSuspenseQueryHookResult = ReturnType<typeof useGetWhatsAppConversationSuspenseQuery>;
export type GetWhatsAppConversationQueryResult = ApolloReactCommon.QueryResult<GetWhatsAppConversationQuery, GetWhatsAppConversationQueryVariables>;
export function refetchGetWhatsAppConversationQuery(variables: GetWhatsAppConversationQueryVariables) {
      return { query: GetWhatsAppConversationDocument, variables: variables }
    }
export const GetWhatsAppContactsDocument = gql`
    query GetWhatsAppContacts {
  whatsapp_messages(order_by: {received_at: desc}) {
    phone_number
    message_content
    received_at
    sender
  }
}
    `;

/**
 * __useGetWhatsAppContactsQuery__
 *
 * To run a query within a React component, call `useGetWhatsAppContactsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWhatsAppContactsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWhatsAppContactsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetWhatsAppContactsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetWhatsAppContactsQuery, GetWhatsAppContactsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetWhatsAppContactsQuery, GetWhatsAppContactsQueryVariables>(GetWhatsAppContactsDocument, options);
      }
export function useGetWhatsAppContactsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetWhatsAppContactsQuery, GetWhatsAppContactsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetWhatsAppContactsQuery, GetWhatsAppContactsQueryVariables>(GetWhatsAppContactsDocument, options);
        }
export function useGetWhatsAppContactsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetWhatsAppContactsQuery, GetWhatsAppContactsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetWhatsAppContactsQuery, GetWhatsAppContactsQueryVariables>(GetWhatsAppContactsDocument, options);
        }
export type GetWhatsAppContactsQueryHookResult = ReturnType<typeof useGetWhatsAppContactsQuery>;
export type GetWhatsAppContactsLazyQueryHookResult = ReturnType<typeof useGetWhatsAppContactsLazyQuery>;
export type GetWhatsAppContactsSuspenseQueryHookResult = ReturnType<typeof useGetWhatsAppContactsSuspenseQuery>;
export type GetWhatsAppContactsQueryResult = ApolloReactCommon.QueryResult<GetWhatsAppContactsQuery, GetWhatsAppContactsQueryVariables>;
export function refetchGetWhatsAppContactsQuery(variables?: GetWhatsAppContactsQueryVariables) {
      return { query: GetWhatsAppContactsDocument, variables: variables }
    }
export const GetWhatsAppMaidBookingsDocument = gql`
    query GetWhatsAppMaidBookings($phoneNumber: String, $status: String, $bookingType: String, $startDate: timestamptz, $endDate: timestamptz, $limit: Int = 50, $offset: Int = 0) {
  maid_bookings(
    where: {_and: [{phone_number: {_eq: $phoneNumber}}, {status: {_eq: $status}}, {booking_type: {_eq: $bookingType}}, {booking_date: {_gte: $startDate}}, {booking_date: {_lte: $endDate}}]}
    order_by: {created_at: desc}
    limit: $limit
    offset: $offset
  ) {
    id
    phone_number
    sponsor_name
    sponsor_id
    maid_id
    maid_name
    booking_type
    booking_date
    status
    notes
    metadata
    created_at
    updated_at
  }
  maid_bookings_aggregate(
    where: {_and: [{phone_number: {_eq: $phoneNumber}}, {status: {_eq: $status}}, {booking_type: {_eq: $bookingType}}, {booking_date: {_gte: $startDate}}, {booking_date: {_lte: $endDate}}]}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetWhatsAppMaidBookingsQuery__
 *
 * To run a query within a React component, call `useGetWhatsAppMaidBookingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWhatsAppMaidBookingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWhatsAppMaidBookingsQuery({
 *   variables: {
 *      phoneNumber: // value for 'phoneNumber'
 *      status: // value for 'status'
 *      bookingType: // value for 'bookingType'
 *      startDate: // value for 'startDate'
 *      endDate: // value for 'endDate'
 *      limit: // value for 'limit'
 *      offset: // value for 'offset'
 *   },
 * });
 */
export function useGetWhatsAppMaidBookingsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetWhatsAppMaidBookingsQuery, GetWhatsAppMaidBookingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetWhatsAppMaidBookingsQuery, GetWhatsAppMaidBookingsQueryVariables>(GetWhatsAppMaidBookingsDocument, options);
      }
export function useGetWhatsAppMaidBookingsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetWhatsAppMaidBookingsQuery, GetWhatsAppMaidBookingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetWhatsAppMaidBookingsQuery, GetWhatsAppMaidBookingsQueryVariables>(GetWhatsAppMaidBookingsDocument, options);
        }
export function useGetWhatsAppMaidBookingsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetWhatsAppMaidBookingsQuery, GetWhatsAppMaidBookingsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetWhatsAppMaidBookingsQuery, GetWhatsAppMaidBookingsQueryVariables>(GetWhatsAppMaidBookingsDocument, options);
        }
export type GetWhatsAppMaidBookingsQueryHookResult = ReturnType<typeof useGetWhatsAppMaidBookingsQuery>;
export type GetWhatsAppMaidBookingsLazyQueryHookResult = ReturnType<typeof useGetWhatsAppMaidBookingsLazyQuery>;
export type GetWhatsAppMaidBookingsSuspenseQueryHookResult = ReturnType<typeof useGetWhatsAppMaidBookingsSuspenseQuery>;
export type GetWhatsAppMaidBookingsQueryResult = ApolloReactCommon.QueryResult<GetWhatsAppMaidBookingsQuery, GetWhatsAppMaidBookingsQueryVariables>;
export function refetchGetWhatsAppMaidBookingsQuery(variables?: GetWhatsAppMaidBookingsQueryVariables) {
      return { query: GetWhatsAppMaidBookingsDocument, variables: variables }
    }
export const GetWhatsAppBookingStatisticsDocument = gql`
    query GetWhatsAppBookingStatistics {
  total: maid_bookings_aggregate {
    aggregate {
      count
    }
  }
  pending: maid_bookings_aggregate(where: {status: {_eq: "pending"}}) {
    aggregate {
      count
    }
  }
  confirmed: maid_bookings_aggregate(where: {status: {_eq: "confirmed"}}) {
    aggregate {
      count
    }
  }
  cancelled: maid_bookings_aggregate(where: {status: {_eq: "cancelled"}}) {
    aggregate {
      count
    }
  }
  completed: maid_bookings_aggregate(where: {status: {_eq: "completed"}}) {
    aggregate {
      count
    }
  }
  rescheduled: maid_bookings_aggregate(where: {status: {_eq: "rescheduled"}}) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useGetWhatsAppBookingStatisticsQuery__
 *
 * To run a query within a React component, call `useGetWhatsAppBookingStatisticsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWhatsAppBookingStatisticsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWhatsAppBookingStatisticsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetWhatsAppBookingStatisticsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetWhatsAppBookingStatisticsQuery, GetWhatsAppBookingStatisticsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetWhatsAppBookingStatisticsQuery, GetWhatsAppBookingStatisticsQueryVariables>(GetWhatsAppBookingStatisticsDocument, options);
      }
export function useGetWhatsAppBookingStatisticsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetWhatsAppBookingStatisticsQuery, GetWhatsAppBookingStatisticsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetWhatsAppBookingStatisticsQuery, GetWhatsAppBookingStatisticsQueryVariables>(GetWhatsAppBookingStatisticsDocument, options);
        }
export function useGetWhatsAppBookingStatisticsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetWhatsAppBookingStatisticsQuery, GetWhatsAppBookingStatisticsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetWhatsAppBookingStatisticsQuery, GetWhatsAppBookingStatisticsQueryVariables>(GetWhatsAppBookingStatisticsDocument, options);
        }
export type GetWhatsAppBookingStatisticsQueryHookResult = ReturnType<typeof useGetWhatsAppBookingStatisticsQuery>;
export type GetWhatsAppBookingStatisticsLazyQueryHookResult = ReturnType<typeof useGetWhatsAppBookingStatisticsLazyQuery>;
export type GetWhatsAppBookingStatisticsSuspenseQueryHookResult = ReturnType<typeof useGetWhatsAppBookingStatisticsSuspenseQuery>;
export type GetWhatsAppBookingStatisticsQueryResult = ApolloReactCommon.QueryResult<GetWhatsAppBookingStatisticsQuery, GetWhatsAppBookingStatisticsQueryVariables>;
export function refetchGetWhatsAppBookingStatisticsQuery(variables?: GetWhatsAppBookingStatisticsQueryVariables) {
      return { query: GetWhatsAppBookingStatisticsDocument, variables: variables }
    }
export const GetPlatformSettingsDocument = gql`
    query GetPlatformSettings {
  platform_settings(limit: 1) {
    id
    platform_name
    about_platform
    support_email
    support_phone
    working_hours
    available_services
    ai_model
    ai_temperature
    max_context_messages
    max_tokens
    auto_response_enabled
    business_hours_only
    greeting_message
    offline_message
    error_message
    system_prompt
    whatsapp_webhook_url
    validate_signature
    rate_limiting_enabled
    rate_limit
    notify_new_messages
    notify_bookings
    notify_errors
    notification_email
    auto_confirm_bookings
    send_reminders
    send_followups
    debug_mode
    store_ai_responses
    allowed_numbers
    blocked_numbers
    cache_timeout
    timeout
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetPlatformSettingsQuery__
 *
 * To run a query within a React component, call `useGetPlatformSettingsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPlatformSettingsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPlatformSettingsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPlatformSettingsQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetPlatformSettingsQuery, GetPlatformSettingsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetPlatformSettingsQuery, GetPlatformSettingsQueryVariables>(GetPlatformSettingsDocument, options);
      }
export function useGetPlatformSettingsLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetPlatformSettingsQuery, GetPlatformSettingsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetPlatformSettingsQuery, GetPlatformSettingsQueryVariables>(GetPlatformSettingsDocument, options);
        }
export function useGetPlatformSettingsSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetPlatformSettingsQuery, GetPlatformSettingsQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetPlatformSettingsQuery, GetPlatformSettingsQueryVariables>(GetPlatformSettingsDocument, options);
        }
export type GetPlatformSettingsQueryHookResult = ReturnType<typeof useGetPlatformSettingsQuery>;
export type GetPlatformSettingsLazyQueryHookResult = ReturnType<typeof useGetPlatformSettingsLazyQuery>;
export type GetPlatformSettingsSuspenseQueryHookResult = ReturnType<typeof useGetPlatformSettingsSuspenseQuery>;
export type GetPlatformSettingsQueryResult = ApolloReactCommon.QueryResult<GetPlatformSettingsQuery, GetPlatformSettingsQueryVariables>;
export function refetchGetPlatformSettingsQuery(variables?: GetPlatformSettingsQueryVariables) {
      return { query: GetPlatformSettingsDocument, variables: variables }
    }
export const SearchWhatsAppMessagesDocument = gql`
    query SearchWhatsAppMessages($searchTerm: String!, $limit: Int = 50) {
  whatsapp_messages(
    where: {message_content: {_ilike: $searchTerm}}
    order_by: {received_at: desc}
    limit: $limit
  ) {
    id
    phone_number
    message_content
    message_type
    received_at
    sender
  }
}
    `;

/**
 * __useSearchWhatsAppMessagesQuery__
 *
 * To run a query within a React component, call `useSearchWhatsAppMessagesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchWhatsAppMessagesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchWhatsAppMessagesQuery({
 *   variables: {
 *      searchTerm: // value for 'searchTerm'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useSearchWhatsAppMessagesQuery(baseOptions: ApolloReactHooks.QueryHookOptions<SearchWhatsAppMessagesQuery, SearchWhatsAppMessagesQueryVariables> & ({ variables: SearchWhatsAppMessagesQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SearchWhatsAppMessagesQuery, SearchWhatsAppMessagesQueryVariables>(SearchWhatsAppMessagesDocument, options);
      }
export function useSearchWhatsAppMessagesLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SearchWhatsAppMessagesQuery, SearchWhatsAppMessagesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SearchWhatsAppMessagesQuery, SearchWhatsAppMessagesQueryVariables>(SearchWhatsAppMessagesDocument, options);
        }
export function useSearchWhatsAppMessagesSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<SearchWhatsAppMessagesQuery, SearchWhatsAppMessagesQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<SearchWhatsAppMessagesQuery, SearchWhatsAppMessagesQueryVariables>(SearchWhatsAppMessagesDocument, options);
        }
export type SearchWhatsAppMessagesQueryHookResult = ReturnType<typeof useSearchWhatsAppMessagesQuery>;
export type SearchWhatsAppMessagesLazyQueryHookResult = ReturnType<typeof useSearchWhatsAppMessagesLazyQuery>;
export type SearchWhatsAppMessagesSuspenseQueryHookResult = ReturnType<typeof useSearchWhatsAppMessagesSuspenseQuery>;
export type SearchWhatsAppMessagesQueryResult = ApolloReactCommon.QueryResult<SearchWhatsAppMessagesQuery, SearchWhatsAppMessagesQueryVariables>;
export function refetchSearchWhatsAppMessagesQuery(variables: SearchWhatsAppMessagesQueryVariables) {
      return { query: SearchWhatsAppMessagesDocument, variables: variables }
    }
export const GetMaidBookingByIdDocument = gql`
    query GetMaidBookingById($id: uuid!) {
  maid_bookings_by_pk(id: $id) {
    id
    phone_number
    sponsor_name
    sponsor_id
    maid_id
    maid_name
    booking_type
    booking_date
    status
    notes
    metadata
    created_at
    updated_at
  }
}
    `;

/**
 * __useGetMaidBookingByIdQuery__
 *
 * To run a query within a React component, call `useGetMaidBookingByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMaidBookingByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMaidBookingByIdQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetMaidBookingByIdQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetMaidBookingByIdQuery, GetMaidBookingByIdQueryVariables> & ({ variables: GetMaidBookingByIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMaidBookingByIdQuery, GetMaidBookingByIdQueryVariables>(GetMaidBookingByIdDocument, options);
      }
export function useGetMaidBookingByIdLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMaidBookingByIdQuery, GetMaidBookingByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMaidBookingByIdQuery, GetMaidBookingByIdQueryVariables>(GetMaidBookingByIdDocument, options);
        }
export function useGetMaidBookingByIdSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMaidBookingByIdQuery, GetMaidBookingByIdQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMaidBookingByIdQuery, GetMaidBookingByIdQueryVariables>(GetMaidBookingByIdDocument, options);
        }
export type GetMaidBookingByIdQueryHookResult = ReturnType<typeof useGetMaidBookingByIdQuery>;
export type GetMaidBookingByIdLazyQueryHookResult = ReturnType<typeof useGetMaidBookingByIdLazyQuery>;
export type GetMaidBookingByIdSuspenseQueryHookResult = ReturnType<typeof useGetMaidBookingByIdSuspenseQuery>;
export type GetMaidBookingByIdQueryResult = ApolloReactCommon.QueryResult<GetMaidBookingByIdQuery, GetMaidBookingByIdQueryVariables>;
export function refetchGetMaidBookingByIdQuery(variables: GetMaidBookingByIdQueryVariables) {
      return { query: GetMaidBookingByIdDocument, variables: variables }
    }
export const OnAdminProfileStatsDocument = gql`
    subscription OnAdminProfileStats {
  profiles(where: {is_active: {_eq: true}}) {
    id
    user_type
    is_active
    created_at
  }
}
    `;

/**
 * __useOnAdminProfileStatsSubscription__
 *
 * To run a query within a React component, call `useOnAdminProfileStatsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnAdminProfileStatsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnAdminProfileStatsSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnAdminProfileStatsSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<OnAdminProfileStatsSubscription, OnAdminProfileStatsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnAdminProfileStatsSubscription, OnAdminProfileStatsSubscriptionVariables>(OnAdminProfileStatsDocument, options);
      }
export type OnAdminProfileStatsSubscriptionHookResult = ReturnType<typeof useOnAdminProfileStatsSubscription>;
export type OnAdminProfileStatsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnAdminProfileStatsSubscription>;
export const OnAdminActivityLogsDocument = gql`
    subscription OnAdminActivityLogs($limit: Int!) {
  admin_activity_logs(order_by: {created_at: desc}, limit: $limit) {
    id
    action
    resource_type
    resource_id
    created_at
    admin_user {
      full_name
    }
  }
}
    `;

/**
 * __useOnAdminActivityLogsSubscription__
 *
 * To run a query within a React component, call `useOnAdminActivityLogsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnAdminActivityLogsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnAdminActivityLogsSubscription({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useOnAdminActivityLogsSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnAdminActivityLogsSubscription, OnAdminActivityLogsSubscriptionVariables> & ({ variables: OnAdminActivityLogsSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnAdminActivityLogsSubscription, OnAdminActivityLogsSubscriptionVariables>(OnAdminActivityLogsDocument, options);
      }
export type OnAdminActivityLogsSubscriptionHookResult = ReturnType<typeof useOnAdminActivityLogsSubscription>;
export type OnAdminActivityLogsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnAdminActivityLogsSubscription>;
export const OnPendingMaidVerificationsDocument = gql`
    subscription OnPendingMaidVerifications {
  maid_profiles_aggregate(where: {verification_status: {_eq: "pending"}}) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useOnPendingMaidVerificationsSubscription__
 *
 * To run a query within a React component, call `useOnPendingMaidVerificationsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnPendingMaidVerificationsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnPendingMaidVerificationsSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnPendingMaidVerificationsSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<OnPendingMaidVerificationsSubscription, OnPendingMaidVerificationsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnPendingMaidVerificationsSubscription, OnPendingMaidVerificationsSubscriptionVariables>(OnPendingMaidVerificationsDocument, options);
      }
export type OnPendingMaidVerificationsSubscriptionHookResult = ReturnType<typeof useOnPendingMaidVerificationsSubscription>;
export type OnPendingMaidVerificationsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnPendingMaidVerificationsSubscription>;
export const OnPendingJobListingsDocument = gql`
    subscription OnPendingJobListings {
  jobs_aggregate(where: {status: {_in: ["pending", "pending_review", "draft"]}}) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useOnPendingJobListingsSubscription__
 *
 * To run a query within a React component, call `useOnPendingJobListingsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnPendingJobListingsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnPendingJobListingsSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnPendingJobListingsSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<OnPendingJobListingsSubscription, OnPendingJobListingsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnPendingJobListingsSubscription, OnPendingJobListingsSubscriptionVariables>(OnPendingJobListingsDocument, options);
      }
export type OnPendingJobListingsSubscriptionHookResult = ReturnType<typeof useOnPendingJobListingsSubscription>;
export type OnPendingJobListingsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnPendingJobListingsSubscription>;
export const OnOpenSupportTicketsDocument = gql`
    subscription OnOpenSupportTickets {
  support_tickets_aggregate(
    where: {status: {_in: ["open", "in_progress", "waiting_user"]}}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useOnOpenSupportTicketsSubscription__
 *
 * To run a query within a React component, call `useOnOpenSupportTicketsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnOpenSupportTicketsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnOpenSupportTicketsSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnOpenSupportTicketsSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<OnOpenSupportTicketsSubscription, OnOpenSupportTicketsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnOpenSupportTicketsSubscription, OnOpenSupportTicketsSubscriptionVariables>(OnOpenSupportTicketsDocument, options);
      }
export type OnOpenSupportTicketsSubscriptionHookResult = ReturnType<typeof useOnOpenSupportTicketsSubscription>;
export type OnOpenSupportTicketsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnOpenSupportTicketsSubscription>;
export const OnRecentTransactionsDocument = gql`
    subscription OnRecentTransactions($limit: Int!) {
  placement_fee_transactions(order_by: {created_at: desc}, limit: $limit) {
    id
    fee_amount
    amount_charged
    credits_applied
    currency
    fee_status
    created_at
    agency_id
  }
}
    `;

/**
 * __useOnRecentTransactionsSubscription__
 *
 * To run a query within a React component, call `useOnRecentTransactionsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnRecentTransactionsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnRecentTransactionsSubscription({
 *   variables: {
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useOnRecentTransactionsSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnRecentTransactionsSubscription, OnRecentTransactionsSubscriptionVariables> & ({ variables: OnRecentTransactionsSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnRecentTransactionsSubscription, OnRecentTransactionsSubscriptionVariables>(OnRecentTransactionsDocument, options);
      }
export type OnRecentTransactionsSubscriptionHookResult = ReturnType<typeof useOnRecentTransactionsSubscription>;
export type OnRecentTransactionsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnRecentTransactionsSubscription>;
export const OnMonthlyFinancialStatsDocument = gql`
    subscription OnMonthlyFinancialStats($startOfMonth: timestamptz!) {
  placement_fee_transactions_aggregate(where: {created_at: {_gte: $startOfMonth}}) {
    aggregate {
      count
      sum {
        fee_amount
        amount_charged
      }
    }
  }
}
    `;

/**
 * __useOnMonthlyFinancialStatsSubscription__
 *
 * To run a query within a React component, call `useOnMonthlyFinancialStatsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnMonthlyFinancialStatsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnMonthlyFinancialStatsSubscription({
 *   variables: {
 *      startOfMonth: // value for 'startOfMonth'
 *   },
 * });
 */
export function useOnMonthlyFinancialStatsSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnMonthlyFinancialStatsSubscription, OnMonthlyFinancialStatsSubscriptionVariables> & ({ variables: OnMonthlyFinancialStatsSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnMonthlyFinancialStatsSubscription, OnMonthlyFinancialStatsSubscriptionVariables>(OnMonthlyFinancialStatsDocument, options);
      }
export type OnMonthlyFinancialStatsSubscriptionHookResult = ReturnType<typeof useOnMonthlyFinancialStatsSubscription>;
export type OnMonthlyFinancialStatsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnMonthlyFinancialStatsSubscription>;
export const OnMaidCountDocument = gql`
    subscription OnMaidCount {
  maid_profiles_aggregate {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useOnMaidCountSubscription__
 *
 * To run a query within a React component, call `useOnMaidCountSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnMaidCountSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnMaidCountSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnMaidCountSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<OnMaidCountSubscription, OnMaidCountSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnMaidCountSubscription, OnMaidCountSubscriptionVariables>(OnMaidCountDocument, options);
      }
export type OnMaidCountSubscriptionHookResult = ReturnType<typeof useOnMaidCountSubscription>;
export type OnMaidCountSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnMaidCountSubscription>;
export const OnAgencyCountDocument = gql`
    subscription OnAgencyCount {
  agency_profiles_aggregate {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useOnAgencyCountSubscription__
 *
 * To run a query within a React component, call `useOnAgencyCountSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnAgencyCountSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnAgencyCountSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnAgencyCountSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<OnAgencyCountSubscription, OnAgencyCountSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnAgencyCountSubscription, OnAgencyCountSubscriptionVariables>(OnAgencyCountDocument, options);
      }
export type OnAgencyCountSubscriptionHookResult = ReturnType<typeof useOnAgencyCountSubscription>;
export type OnAgencyCountSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnAgencyCountSubscription>;
export const OnSponsorCountDocument = gql`
    subscription OnSponsorCount {
  sponsor_profiles_aggregate {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useOnSponsorCountSubscription__
 *
 * To run a query within a React component, call `useOnSponsorCountSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnSponsorCountSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnSponsorCountSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnSponsorCountSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<OnSponsorCountSubscription, OnSponsorCountSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnSponsorCountSubscription, OnSponsorCountSubscriptionVariables>(OnSponsorCountDocument, options);
      }
export type OnSponsorCountSubscriptionHookResult = ReturnType<typeof useOnSponsorCountSubscription>;
export type OnSponsorCountSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnSponsorCountSubscription>;
export const OnPendingAgencyVerificationsDocument = gql`
    subscription OnPendingAgencyVerifications {
  agency_profiles_aggregate(where: {verification_status: {_eq: "pending"}}) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useOnPendingAgencyVerificationsSubscription__
 *
 * To run a query within a React component, call `useOnPendingAgencyVerificationsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnPendingAgencyVerificationsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnPendingAgencyVerificationsSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnPendingAgencyVerificationsSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<OnPendingAgencyVerificationsSubscription, OnPendingAgencyVerificationsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnPendingAgencyVerificationsSubscription, OnPendingAgencyVerificationsSubscriptionVariables>(OnPendingAgencyVerificationsDocument, options);
      }
export type OnPendingAgencyVerificationsSubscriptionHookResult = ReturnType<typeof useOnPendingAgencyVerificationsSubscription>;
export type OnPendingAgencyVerificationsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnPendingAgencyVerificationsSubscription>;
export const OnHighPrioritySupportTicketsDocument = gql`
    subscription OnHighPrioritySupportTickets {
  support_tickets_aggregate(
    where: {status: {_in: ["open", "in_progress"]}, priority: {_in: ["high", "urgent"]}}
  ) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useOnHighPrioritySupportTicketsSubscription__
 *
 * To run a query within a React component, call `useOnHighPrioritySupportTicketsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnHighPrioritySupportTicketsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnHighPrioritySupportTicketsSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnHighPrioritySupportTicketsSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<OnHighPrioritySupportTicketsSubscription, OnHighPrioritySupportTicketsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnHighPrioritySupportTicketsSubscription, OnHighPrioritySupportTicketsSubscriptionVariables>(OnHighPrioritySupportTicketsDocument, options);
      }
export type OnHighPrioritySupportTicketsSubscriptionHookResult = ReturnType<typeof useOnHighPrioritySupportTicketsSubscription>;
export type OnHighPrioritySupportTicketsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnHighPrioritySupportTicketsSubscription>;
export const OnNewApplicationsDocument = gql`
    subscription OnNewApplications($sponsorId: String!) {
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
    subscription OnApplicationStatusChange($maidId: String!) {
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
    subscription OnBookingUpdates($sponsorId: String!) {
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
    subscription OnBookingRequests($maidId: String!) {
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
    sponsor_profile {
      id
      full_name
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
    subscription OnJobInteractions($sponsorId: String!) {
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
    subscription OnAgencyMaidStats($agencyId: String!) {
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
export const OnNewWhatsAppMessageDocument = gql`
    subscription OnNewWhatsAppMessage {
  whatsapp_messages(order_by: {received_at: desc}, limit: 1) {
    id
    phone_number
    message_content
    message_type
    received_at
    sender
    ai_response
    processed
    created_at
  }
}
    `;

/**
 * __useOnNewWhatsAppMessageSubscription__
 *
 * To run a query within a React component, call `useOnNewWhatsAppMessageSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnNewWhatsAppMessageSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnNewWhatsAppMessageSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnNewWhatsAppMessageSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<OnNewWhatsAppMessageSubscription, OnNewWhatsAppMessageSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnNewWhatsAppMessageSubscription, OnNewWhatsAppMessageSubscriptionVariables>(OnNewWhatsAppMessageDocument, options);
      }
export type OnNewWhatsAppMessageSubscriptionHookResult = ReturnType<typeof useOnNewWhatsAppMessageSubscription>;
export type OnNewWhatsAppMessageSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnNewWhatsAppMessageSubscription>;
export const OnConversationUpdateDocument = gql`
    subscription OnConversationUpdate($phoneNumber: String!) {
  whatsapp_messages(
    where: {phone_number: {_eq: $phoneNumber}}
    order_by: {received_at: desc}
    limit: 50
  ) {
    id
    phone_number
    message_content
    message_type
    received_at
    sender
    ai_response
    processed
  }
}
    `;

/**
 * __useOnConversationUpdateSubscription__
 *
 * To run a query within a React component, call `useOnConversationUpdateSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnConversationUpdateSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnConversationUpdateSubscription({
 *   variables: {
 *      phoneNumber: // value for 'phoneNumber'
 *   },
 * });
 */
export function useOnConversationUpdateSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnConversationUpdateSubscription, OnConversationUpdateSubscriptionVariables> & ({ variables: OnConversationUpdateSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnConversationUpdateSubscription, OnConversationUpdateSubscriptionVariables>(OnConversationUpdateDocument, options);
      }
export type OnConversationUpdateSubscriptionHookResult = ReturnType<typeof useOnConversationUpdateSubscription>;
export type OnConversationUpdateSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnConversationUpdateSubscription>;
export const OnMaidBookingUpdateDocument = gql`
    subscription OnMaidBookingUpdate {
  maid_bookings(order_by: {updated_at: desc}, limit: 10) {
    id
    phone_number
    sponsor_name
    maid_name
    booking_type
    booking_date
    status
    notes
    created_at
    updated_at
  }
}
    `;

/**
 * __useOnMaidBookingUpdateSubscription__
 *
 * To run a query within a React component, call `useOnMaidBookingUpdateSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnMaidBookingUpdateSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnMaidBookingUpdateSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnMaidBookingUpdateSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<OnMaidBookingUpdateSubscription, OnMaidBookingUpdateSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnMaidBookingUpdateSubscription, OnMaidBookingUpdateSubscriptionVariables>(OnMaidBookingUpdateDocument, options);
      }
export type OnMaidBookingUpdateSubscriptionHookResult = ReturnType<typeof useOnMaidBookingUpdateSubscription>;
export type OnMaidBookingUpdateSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnMaidBookingUpdateSubscription>;
export const OnPendingBookingsCountDocument = gql`
    subscription OnPendingBookingsCount {
  maid_bookings_aggregate(where: {status: {_eq: "pending"}}) {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useOnPendingBookingsCountSubscription__
 *
 * To run a query within a React component, call `useOnPendingBookingsCountSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnPendingBookingsCountSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnPendingBookingsCountSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnPendingBookingsCountSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<OnPendingBookingsCountSubscription, OnPendingBookingsCountSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnPendingBookingsCountSubscription, OnPendingBookingsCountSubscriptionVariables>(OnPendingBookingsCountDocument, options);
      }
export type OnPendingBookingsCountSubscriptionHookResult = ReturnType<typeof useOnPendingBookingsCountSubscription>;
export type OnPendingBookingsCountSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnPendingBookingsCountSubscription>;
export const OnTodaysBookingsDocument = gql`
    subscription OnTodaysBookings($today: timestamptz!, $tomorrow: timestamptz!) {
  maid_bookings(
    where: {booking_date: {_gte: $today, _lt: $tomorrow}}
    order_by: {booking_date: asc}
  ) {
    id
    phone_number
    sponsor_name
    maid_name
    booking_type
    booking_date
    status
  }
}
    `;

/**
 * __useOnTodaysBookingsSubscription__
 *
 * To run a query within a React component, call `useOnTodaysBookingsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnTodaysBookingsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnTodaysBookingsSubscription({
 *   variables: {
 *      today: // value for 'today'
 *      tomorrow: // value for 'tomorrow'
 *   },
 * });
 */
export function useOnTodaysBookingsSubscription(baseOptions: ApolloReactHooks.SubscriptionHookOptions<OnTodaysBookingsSubscription, OnTodaysBookingsSubscriptionVariables> & ({ variables: OnTodaysBookingsSubscriptionVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnTodaysBookingsSubscription, OnTodaysBookingsSubscriptionVariables>(OnTodaysBookingsDocument, options);
      }
export type OnTodaysBookingsSubscriptionHookResult = ReturnType<typeof useOnTodaysBookingsSubscription>;
export type OnTodaysBookingsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnTodaysBookingsSubscription>;
export const OnMessageStatsDocument = gql`
    subscription OnMessageStats {
  whatsapp_messages_aggregate {
    aggregate {
      count
    }
  }
}
    `;

/**
 * __useOnMessageStatsSubscription__
 *
 * To run a query within a React component, call `useOnMessageStatsSubscription` and pass it any options that fit your needs.
 * When your component renders, `useOnMessageStatsSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOnMessageStatsSubscription({
 *   variables: {
 *   },
 * });
 */
export function useOnMessageStatsSubscription(baseOptions?: ApolloReactHooks.SubscriptionHookOptions<OnMessageStatsSubscription, OnMessageStatsSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useSubscription<OnMessageStatsSubscription, OnMessageStatsSubscriptionVariables>(OnMessageStatsDocument, options);
      }
export type OnMessageStatsSubscriptionHookResult = ReturnType<typeof useOnMessageStatsSubscription>;
export type OnMessageStatsSubscriptionResult = ApolloReactCommon.SubscriptionResult<OnMessageStatsSubscription>;