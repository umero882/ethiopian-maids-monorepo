/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* Auto-generated file - types are defined in graphql-relay.ts */
import { gql } from '@apollo/client';
import * as ApolloReactCommon from '@apollo/client/react';
import * as ApolloReactHooks from '@apollo/client/react';
const defaultOptions = {} as const;

export const GetAllProfilesConnectionDocument = gql`
    query GetAllProfilesConnection($first: Int, $after: String, $where: profiles_bool_exp, $order_by: [profiles_order_by!]) {
  profiles_connection(
    first: $first
    after: $after
    where: $where
    order_by: $order_by
  ) {
    edges {
      cursor
      node {
        id
        name
        email
        phone
        user_type
        avatar_url
        country
        location
        created_at
        updated_at
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useGetAllProfilesConnectionQuery__
 *
 * To run a query within a React component, call `useGetAllProfilesConnectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAllProfilesConnectionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAllProfilesConnectionQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      where: // value for 'where'
 *      order_by: // value for 'order_by'
 *   },
 * });
 */
export function useGetAllProfilesConnectionQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAllProfilesConnectionQuery, GetAllProfilesConnectionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAllProfilesConnectionQuery, GetAllProfilesConnectionQueryVariables>(GetAllProfilesConnectionDocument, options);
      }
export function useGetAllProfilesConnectionLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAllProfilesConnectionQuery, GetAllProfilesConnectionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAllProfilesConnectionQuery, GetAllProfilesConnectionQueryVariables>(GetAllProfilesConnectionDocument, options);
        }
export function useGetAllProfilesConnectionSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAllProfilesConnectionQuery, GetAllProfilesConnectionQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAllProfilesConnectionQuery, GetAllProfilesConnectionQueryVariables>(GetAllProfilesConnectionDocument, options);
        }
export type GetAllProfilesConnectionQueryHookResult = ReturnType<typeof useGetAllProfilesConnectionQuery>;
export type GetAllProfilesConnectionLazyQueryHookResult = ReturnType<typeof useGetAllProfilesConnectionLazyQuery>;
export type GetAllProfilesConnectionSuspenseQueryHookResult = ReturnType<typeof useGetAllProfilesConnectionSuspenseQuery>;
export type GetAllProfilesConnectionQueryResult = ApolloReactCommon.QueryResult<GetAllProfilesConnectionQuery, GetAllProfilesConnectionQueryVariables>;
export function refetchGetAllProfilesConnectionQuery(variables?: GetAllProfilesConnectionQueryVariables) {
      return { query: GetAllProfilesConnectionDocument, variables: variables }
    }
export const GetMaidProfilesConnectionDocument = gql`
    query GetMaidProfilesConnection($first: Int, $after: String, $where: maid_profiles_bool_exp, $order_by: [maid_profiles_order_by!]) {
  maid_profiles_connection(
    first: $first
    after: $after
    where: $where
    order_by: $order_by
  ) {
    edges {
      cursor
      node {
        id
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
        created_at
        updated_at
        average_rating
        profile {
          id
          email
          name
          phone
          avatar_url
          user_type
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useGetMaidProfilesConnectionQuery__
 *
 * To run a query within a React component, call `useGetMaidProfilesConnectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMaidProfilesConnectionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMaidProfilesConnectionQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      where: // value for 'where'
 *      order_by: // value for 'order_by'
 *   },
 * });
 */
export function useGetMaidProfilesConnectionQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetMaidProfilesConnectionQuery, GetMaidProfilesConnectionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMaidProfilesConnectionQuery, GetMaidProfilesConnectionQueryVariables>(GetMaidProfilesConnectionDocument, options);
      }
export function useGetMaidProfilesConnectionLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMaidProfilesConnectionQuery, GetMaidProfilesConnectionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMaidProfilesConnectionQuery, GetMaidProfilesConnectionQueryVariables>(GetMaidProfilesConnectionDocument, options);
        }
export function useGetMaidProfilesConnectionSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMaidProfilesConnectionQuery, GetMaidProfilesConnectionQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMaidProfilesConnectionQuery, GetMaidProfilesConnectionQueryVariables>(GetMaidProfilesConnectionDocument, options);
        }
export type GetMaidProfilesConnectionQueryHookResult = ReturnType<typeof useGetMaidProfilesConnectionQuery>;
export type GetMaidProfilesConnectionLazyQueryHookResult = ReturnType<typeof useGetMaidProfilesConnectionLazyQuery>;
export type GetMaidProfilesConnectionSuspenseQueryHookResult = ReturnType<typeof useGetMaidProfilesConnectionSuspenseQuery>;
export type GetMaidProfilesConnectionQueryResult = ApolloReactCommon.QueryResult<GetMaidProfilesConnectionQuery, GetMaidProfilesConnectionQueryVariables>;
export function refetchGetMaidProfilesConnectionQuery(variables?: GetMaidProfilesConnectionQueryVariables) {
      return { query: GetMaidProfilesConnectionDocument, variables: variables }
    }
export const GetAvailableMaidsConnectionDocument = gql`
    query GetAvailableMaidsConnection($first: Int, $after: String, $order_by: [maid_profiles_order_by!]) {
  maid_profiles_connection(
    first: $first
    after: $after
    where: {availability_status: {_eq: "available"}}
    order_by: $order_by
  ) {
    edges {
      cursor
      node {
        id
        full_name
        profile_photo_url
        nationality
        country
        current_location
        languages
        primary_profession
        skills
        special_skills
        experience_years
        preferred_salary_min
        preferred_salary_max
        preferred_currency
        availability_status
        available_from
        about_me
        introduction_video_url
        average_rating
        profile {
          id
          email
          avatar_url
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useGetAvailableMaidsConnectionQuery__
 *
 * To run a query within a React component, call `useGetAvailableMaidsConnectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAvailableMaidsConnectionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAvailableMaidsConnectionQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      order_by: // value for 'order_by'
 *   },
 * });
 */
export function useGetAvailableMaidsConnectionQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAvailableMaidsConnectionQuery, GetAvailableMaidsConnectionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAvailableMaidsConnectionQuery, GetAvailableMaidsConnectionQueryVariables>(GetAvailableMaidsConnectionDocument, options);
      }
export function useGetAvailableMaidsConnectionLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAvailableMaidsConnectionQuery, GetAvailableMaidsConnectionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAvailableMaidsConnectionQuery, GetAvailableMaidsConnectionQueryVariables>(GetAvailableMaidsConnectionDocument, options);
        }
export function useGetAvailableMaidsConnectionSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAvailableMaidsConnectionQuery, GetAvailableMaidsConnectionQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAvailableMaidsConnectionQuery, GetAvailableMaidsConnectionQueryVariables>(GetAvailableMaidsConnectionDocument, options);
        }
export type GetAvailableMaidsConnectionQueryHookResult = ReturnType<typeof useGetAvailableMaidsConnectionQuery>;
export type GetAvailableMaidsConnectionLazyQueryHookResult = ReturnType<typeof useGetAvailableMaidsConnectionLazyQuery>;
export type GetAvailableMaidsConnectionSuspenseQueryHookResult = ReturnType<typeof useGetAvailableMaidsConnectionSuspenseQuery>;
export type GetAvailableMaidsConnectionQueryResult = ApolloReactCommon.QueryResult<GetAvailableMaidsConnectionQuery, GetAvailableMaidsConnectionQueryVariables>;
export function refetchGetAvailableMaidsConnectionQuery(variables?: GetAvailableMaidsConnectionQueryVariables) {
      return { query: GetAvailableMaidsConnectionDocument, variables: variables }
    }
export const GetSponsorProfilesConnectionDocument = gql`
    query GetSponsorProfilesConnection($first: Int, $after: String, $where: sponsor_profiles_bool_exp, $order_by: [sponsor_profiles_order_by!]) {
  sponsor_profiles_connection(
    first: $first
    after: $after
    where: $where
    order_by: $order_by
  ) {
    edges {
      cursor
      node {
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
        created_at
        updated_at
        profile {
          id
          email
          name
          phone
          avatar_url
          user_type
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useGetSponsorProfilesConnectionQuery__
 *
 * To run a query within a React component, call `useGetSponsorProfilesConnectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSponsorProfilesConnectionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSponsorProfilesConnectionQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      where: // value for 'where'
 *      order_by: // value for 'order_by'
 *   },
 * });
 */
export function useGetSponsorProfilesConnectionQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetSponsorProfilesConnectionQuery, GetSponsorProfilesConnectionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetSponsorProfilesConnectionQuery, GetSponsorProfilesConnectionQueryVariables>(GetSponsorProfilesConnectionDocument, options);
      }
export function useGetSponsorProfilesConnectionLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetSponsorProfilesConnectionQuery, GetSponsorProfilesConnectionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetSponsorProfilesConnectionQuery, GetSponsorProfilesConnectionQueryVariables>(GetSponsorProfilesConnectionDocument, options);
        }
export function useGetSponsorProfilesConnectionSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetSponsorProfilesConnectionQuery, GetSponsorProfilesConnectionQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetSponsorProfilesConnectionQuery, GetSponsorProfilesConnectionQueryVariables>(GetSponsorProfilesConnectionDocument, options);
        }
export type GetSponsorProfilesConnectionQueryHookResult = ReturnType<typeof useGetSponsorProfilesConnectionQuery>;
export type GetSponsorProfilesConnectionLazyQueryHookResult = ReturnType<typeof useGetSponsorProfilesConnectionLazyQuery>;
export type GetSponsorProfilesConnectionSuspenseQueryHookResult = ReturnType<typeof useGetSponsorProfilesConnectionSuspenseQuery>;
export type GetSponsorProfilesConnectionQueryResult = ApolloReactCommon.QueryResult<GetSponsorProfilesConnectionQuery, GetSponsorProfilesConnectionQueryVariables>;
export function refetchGetSponsorProfilesConnectionQuery(variables?: GetSponsorProfilesConnectionQueryVariables) {
      return { query: GetSponsorProfilesConnectionDocument, variables: variables }
    }
export const GetAgencyProfilesConnectionDocument = gql`
    query GetAgencyProfilesConnection($first: Int, $after: String, $where: agency_profiles_bool_exp, $order_by: [agency_profiles_order_by!]) {
  agency_profiles_connection(
    first: $first
    after: $after
    where: $where
    order_by: $order_by
  ) {
    edges {
      cursor
      node {
        id
        agency_name
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
        created_at
        updated_at
        profile {
          id
          email
          name
          phone
          avatar_url
          user_type
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useGetAgencyProfilesConnectionQuery__
 *
 * To run a query within a React component, call `useGetAgencyProfilesConnectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAgencyProfilesConnectionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAgencyProfilesConnectionQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      where: // value for 'where'
 *      order_by: // value for 'order_by'
 *   },
 * });
 */
export function useGetAgencyProfilesConnectionQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<GetAgencyProfilesConnectionQuery, GetAgencyProfilesConnectionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetAgencyProfilesConnectionQuery, GetAgencyProfilesConnectionQueryVariables>(GetAgencyProfilesConnectionDocument, options);
      }
export function useGetAgencyProfilesConnectionLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetAgencyProfilesConnectionQuery, GetAgencyProfilesConnectionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetAgencyProfilesConnectionQuery, GetAgencyProfilesConnectionQueryVariables>(GetAgencyProfilesConnectionDocument, options);
        }
export function useGetAgencyProfilesConnectionSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetAgencyProfilesConnectionQuery, GetAgencyProfilesConnectionQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetAgencyProfilesConnectionQuery, GetAgencyProfilesConnectionQueryVariables>(GetAgencyProfilesConnectionDocument, options);
        }
export type GetAgencyProfilesConnectionQueryHookResult = ReturnType<typeof useGetAgencyProfilesConnectionQuery>;
export type GetAgencyProfilesConnectionLazyQueryHookResult = ReturnType<typeof useGetAgencyProfilesConnectionLazyQuery>;
export type GetAgencyProfilesConnectionSuspenseQueryHookResult = ReturnType<typeof useGetAgencyProfilesConnectionSuspenseQuery>;
export type GetAgencyProfilesConnectionQueryResult = ApolloReactCommon.QueryResult<GetAgencyProfilesConnectionQuery, GetAgencyProfilesConnectionQueryVariables>;
export function refetchGetAgencyProfilesConnectionQuery(variables?: GetAgencyProfilesConnectionQueryVariables) {
      return { query: GetAgencyProfilesConnectionDocument, variables: variables }
    }
export const GetProfileByIdDocument = gql`
    query GetProfileById($id: ID!) {
  node(id: $id) {
    ... on profiles {
      id
      name
      email
      phone
      user_type
      avatar_url
      country
      location
      created_at
      updated_at
    }
  }
}
    `;

/**
 * __useGetProfileByIdQuery__
 *
 * To run a query within a React component, call `useGetProfileByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetProfileByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetProfileByIdQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetProfileByIdQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetProfileByIdQuery, GetProfileByIdQueryVariables> & ({ variables: GetProfileByIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetProfileByIdQuery, GetProfileByIdQueryVariables>(GetProfileByIdDocument, options);
      }
export function useGetProfileByIdLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetProfileByIdQuery, GetProfileByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetProfileByIdQuery, GetProfileByIdQueryVariables>(GetProfileByIdDocument, options);
        }
export function useGetProfileByIdSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetProfileByIdQuery, GetProfileByIdQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetProfileByIdQuery, GetProfileByIdQueryVariables>(GetProfileByIdDocument, options);
        }
export type GetProfileByIdQueryHookResult = ReturnType<typeof useGetProfileByIdQuery>;
export type GetProfileByIdLazyQueryHookResult = ReturnType<typeof useGetProfileByIdLazyQuery>;
export type GetProfileByIdSuspenseQueryHookResult = ReturnType<typeof useGetProfileByIdSuspenseQuery>;
export type GetProfileByIdQueryResult = ApolloReactCommon.QueryResult<GetProfileByIdQuery, GetProfileByIdQueryVariables>;
export function refetchGetProfileByIdQuery(variables: GetProfileByIdQueryVariables) {
      return { query: GetProfileByIdDocument, variables: variables }
    }
export const GetMaidProfileByIdDocument = gql`
    query GetMaidProfileById($id: ID!) {
  node(id: $id) {
    ... on maid_profiles {
      id
      first_name
      middle_name
      last_name
      full_name
      date_of_birth
      marital_status
      nationality
      country
      current_location
      languages
      profile_photo_url
      primary_profession
      skills
      special_skills
      experience_years
      preferred_salary_min
      preferred_salary_max
      preferred_currency
      availability_status
      about_me
      average_rating
      profile {
        id
        email
        name
        phone
        avatar_url
        user_type
      }
    }
  }
}
    `;

/**
 * __useGetMaidProfileByIdQuery__
 *
 * To run a query within a React component, call `useGetMaidProfileByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMaidProfileByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMaidProfileByIdQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetMaidProfileByIdQuery(baseOptions: ApolloReactHooks.QueryHookOptions<GetMaidProfileByIdQuery, GetMaidProfileByIdQueryVariables> & ({ variables: GetMaidProfileByIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<GetMaidProfileByIdQuery, GetMaidProfileByIdQueryVariables>(GetMaidProfileByIdDocument, options);
      }
export function useGetMaidProfileByIdLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<GetMaidProfileByIdQuery, GetMaidProfileByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<GetMaidProfileByIdQuery, GetMaidProfileByIdQueryVariables>(GetMaidProfileByIdDocument, options);
        }
export function useGetMaidProfileByIdSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<GetMaidProfileByIdQuery, GetMaidProfileByIdQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<GetMaidProfileByIdQuery, GetMaidProfileByIdQueryVariables>(GetMaidProfileByIdDocument, options);
        }
export type GetMaidProfileByIdQueryHookResult = ReturnType<typeof useGetMaidProfileByIdQuery>;
export type GetMaidProfileByIdLazyQueryHookResult = ReturnType<typeof useGetMaidProfileByIdLazyQuery>;
export type GetMaidProfileByIdSuspenseQueryHookResult = ReturnType<typeof useGetMaidProfileByIdSuspenseQuery>;
export type GetMaidProfileByIdQueryResult = ApolloReactCommon.QueryResult<GetMaidProfileByIdQuery, GetMaidProfileByIdQueryVariables>;
export function refetchGetMaidProfileByIdQuery(variables: GetMaidProfileByIdQueryVariables) {
      return { query: GetMaidProfileByIdDocument, variables: variables }
    }
export const SearchProfilesConnectionDocument = gql`
    query SearchProfilesConnection($first: Int = 20, $after: String, $searchTerm: String, $userType: String, $country: String, $order_by: [profiles_order_by!] = [{created_at: desc}]) {
  profiles_connection(
    first: $first
    after: $after
    where: {_and: [{user_type: {_eq: $userType}}, {_or: [{name: {_ilike: $searchTerm}}, {email: {_ilike: $searchTerm}}, {location: {_ilike: $searchTerm}}]}, {country: {_eq: $country}}]}
    order_by: $order_by
  ) {
    edges {
      cursor
      node {
        id
        name
        email
        phone
        user_type
        avatar_url
        country
        location
        created_at
        updated_at
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useSearchProfilesConnectionQuery__
 *
 * To run a query within a React component, call `useSearchProfilesConnectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchProfilesConnectionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchProfilesConnectionQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      searchTerm: // value for 'searchTerm'
 *      userType: // value for 'userType'
 *      country: // value for 'country'
 *      order_by: // value for 'order_by'
 *   },
 * });
 */
export function useSearchProfilesConnectionQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<SearchProfilesConnectionQuery, SearchProfilesConnectionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SearchProfilesConnectionQuery, SearchProfilesConnectionQueryVariables>(SearchProfilesConnectionDocument, options);
      }
export function useSearchProfilesConnectionLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SearchProfilesConnectionQuery, SearchProfilesConnectionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SearchProfilesConnectionQuery, SearchProfilesConnectionQueryVariables>(SearchProfilesConnectionDocument, options);
        }
export function useSearchProfilesConnectionSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<SearchProfilesConnectionQuery, SearchProfilesConnectionQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<SearchProfilesConnectionQuery, SearchProfilesConnectionQueryVariables>(SearchProfilesConnectionDocument, options);
        }
export type SearchProfilesConnectionQueryHookResult = ReturnType<typeof useSearchProfilesConnectionQuery>;
export type SearchProfilesConnectionLazyQueryHookResult = ReturnType<typeof useSearchProfilesConnectionLazyQuery>;
export type SearchProfilesConnectionSuspenseQueryHookResult = ReturnType<typeof useSearchProfilesConnectionSuspenseQuery>;
export type SearchProfilesConnectionQueryResult = ApolloReactCommon.QueryResult<SearchProfilesConnectionQuery, SearchProfilesConnectionQueryVariables>;
export function refetchSearchProfilesConnectionQuery(variables?: SearchProfilesConnectionQueryVariables) {
      return { query: SearchProfilesConnectionDocument, variables: variables }
    }
export const SearchAvailableMaidsConnectionDocument = gql`
    query SearchAvailableMaidsConnection($first: Int = 20, $after: String, $nationality: String, $minExperience: Int, $maxSalary: Int, $order_by: [maid_profiles_order_by!] = [{created_at: desc}]) {
  maid_profiles_connection(
    first: $first
    after: $after
    where: {_and: [{availability_status: {_eq: "available"}}, {nationality: {_eq: $nationality}}, {experience_years: {_gte: $minExperience}}, {preferred_salary_max: {_lte: $maxSalary}}]}
    order_by: $order_by
  ) {
    edges {
      cursor
      node {
        id
        full_name
        profile_photo_url
        nationality
        country
        current_location
        languages
        primary_profession
        skills
        special_skills
        experience_years
        preferred_salary_min
        preferred_salary_max
        preferred_currency
        availability_status
        about_me
        average_rating
        profile {
          id
          email
          avatar_url
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
    `;

/**
 * __useSearchAvailableMaidsConnectionQuery__
 *
 * To run a query within a React component, call `useSearchAvailableMaidsConnectionQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchAvailableMaidsConnectionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchAvailableMaidsConnectionQuery({
 *   variables: {
 *      first: // value for 'first'
 *      after: // value for 'after'
 *      nationality: // value for 'nationality'
 *      minExperience: // value for 'minExperience'
 *      maxSalary: // value for 'maxSalary'
 *      order_by: // value for 'order_by'
 *   },
 * });
 */
export function useSearchAvailableMaidsConnectionQuery(baseOptions?: ApolloReactHooks.QueryHookOptions<SearchAvailableMaidsConnectionQuery, SearchAvailableMaidsConnectionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return ApolloReactHooks.useQuery<SearchAvailableMaidsConnectionQuery, SearchAvailableMaidsConnectionQueryVariables>(SearchAvailableMaidsConnectionDocument, options);
      }
export function useSearchAvailableMaidsConnectionLazyQuery(baseOptions?: ApolloReactHooks.LazyQueryHookOptions<SearchAvailableMaidsConnectionQuery, SearchAvailableMaidsConnectionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useLazyQuery<SearchAvailableMaidsConnectionQuery, SearchAvailableMaidsConnectionQueryVariables>(SearchAvailableMaidsConnectionDocument, options);
        }
export function useSearchAvailableMaidsConnectionSuspenseQuery(baseOptions?: ApolloReactHooks.SkipToken | ApolloReactHooks.SuspenseQueryHookOptions<SearchAvailableMaidsConnectionQuery, SearchAvailableMaidsConnectionQueryVariables>) {
          const options = baseOptions === ApolloReactHooks.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return ApolloReactHooks.useSuspenseQuery<SearchAvailableMaidsConnectionQuery, SearchAvailableMaidsConnectionQueryVariables>(SearchAvailableMaidsConnectionDocument, options);
        }
export type SearchAvailableMaidsConnectionQueryHookResult = ReturnType<typeof useSearchAvailableMaidsConnectionQuery>;
export type SearchAvailableMaidsConnectionLazyQueryHookResult = ReturnType<typeof useSearchAvailableMaidsConnectionLazyQuery>;
export type SearchAvailableMaidsConnectionSuspenseQueryHookResult = ReturnType<typeof useSearchAvailableMaidsConnectionSuspenseQuery>;
export type SearchAvailableMaidsConnectionQueryResult = ApolloReactCommon.QueryResult<SearchAvailableMaidsConnectionQuery, SearchAvailableMaidsConnectionQueryVariables>;
export function refetchSearchAvailableMaidsConnectionQuery(variables?: SearchAvailableMaidsConnectionQueryVariables) {
      return { query: SearchAvailableMaidsConnectionDocument, variables: variables }
    }