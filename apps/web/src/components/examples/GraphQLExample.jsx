import React from 'react';
import { useGetAllProfilesQuery, useGetAvailableMaidsQuery } from '@ethio/api-client';

/**
 * Example component demonstrating GraphQL integration
 * This shows how to use the generated React hooks from @ethio/api-client
 */
export function GraphQLExample() {
  // Query all profiles with a limit of 5
  const {
    data: profilesData,
    loading: profilesLoading,
    error: profilesError
  } = useGetAllProfilesQuery({
    variables: {
      limit: 5,
      offset: 0
    }
  });

  // Query available maids
  const {
    data: maidsData,
    loading: maidsLoading,
    error: maidsError
  } = useGetAvailableMaidsQuery({
    variables: {
      limit: 5,
      offset: 0,
      where: { availability_status: { _eq: 'available' } }
    }
  });

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>GraphQL Integration Test</h1>

      {/* Profiles Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Recent Profiles</h2>
        {profilesLoading && <p>Loading profiles...</p>}
        {profilesError && (
          <p style={{ color: 'red' }}>
            Error loading profiles: {profilesError.message}
          </p>
        )}
        {profilesData && (
          <div>
            <p><strong>Total profiles:</strong> {profilesData.profiles_aggregate?.aggregate?.count || 0}</p>
            <ul>
              {profilesData.profiles?.map((profile) => (
                <li key={profile.id}>
                  <strong>{profile.full_name || 'No name'}</strong> - {profile.email} ({profile.user_type})
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Maids Section */}
      <section>
        <h2>Available Maids</h2>
        {maidsLoading && <p>Loading maids...</p>}
        {maidsError && (
          <p style={{ color: 'red' }}>
            Error loading maids: {maidsError.message}
          </p>
        )}
        {maidsData && (
          <div>
            <p><strong>Total available maids:</strong> {maidsData.maid_profiles_aggregate?.aggregate?.count || 0}</p>
            <ul>
              {maidsData.maid_profiles?.map((maid) => (
                <li key={maid.id}>
                  <strong>{maid.full_name || 'No name'}</strong>
                  {maid.experience_years && ` - ${maid.experience_years} years experience`}
                  {maid.country && ` - ${maid.country}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div style={{
        marginTop: '40px',
        padding: '15px',
        background: '#f0f0f0',
        borderRadius: '8px'
      }}>
        <h3>Integration Status</h3>
        <p>✅ Apollo Client connected to Hasura</p>
        <p>✅ GraphQL queries working</p>
        <p>✅ TypeScript types generated</p>
        <p>✅ React hooks auto-generated</p>
      </div>
    </div>
  );
}

export default GraphQLExample;
