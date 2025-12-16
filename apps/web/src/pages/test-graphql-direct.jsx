/**
 * Direct GraphQL Test - No Login Required
 * Visit: http://localhost:5173/test-graphql-direct
 */

import { useState } from 'react';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';

export default function TestGraphQLDirect() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const AGENCY_ID = '9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6';

  const testGetMaids = async () => {
    setLoading(true);
    try {
      const { data, errors } = await apolloClient.query({
        query: gql`
          query TestGetMaids {
            maid_profiles(
              where: { agency_id: { _eq: "${AGENCY_ID}" } }
              limit: 10
            ) {
              id
              full_name
              nationality
            }
          }
        `,
        fetchPolicy: 'network-only'
      });

      setResults(prev => ({
        ...prev,
        maids: {
          success: !errors,
          count: data?.maid_profiles?.length || 0,
          data: data?.maid_profiles || [],
          errors: errors || null
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        maids: { success: false, error: error.message }
      }));
    }
    setLoading(false);
  };

  const testGetJobs = async () => {
    setLoading(true);
    try {
      const { data, errors } = await apolloClient.query({
        query: gql`
          query TestGetJobs {
            agency_jobs(
              where: { agency_id: { _eq: "${AGENCY_ID}" } }
              limit: 10
            ) {
              id
              title
              status
            }
          }
        `,
        fetchPolicy: 'network-only'
      });

      setResults(prev => ({
        ...prev,
        jobs: {
          success: !errors,
          count: data?.agency_jobs?.length || 0,
          data: data?.agency_jobs || [],
          errors: errors || null
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        jobs: { success: false, error: error.message }
      }));
    }
    setLoading(false);
  };

  const testEnvVar = () => {
    const secret = import.meta.env.VITE_HASURA_ADMIN_SECRET;
    setResults(prev => ({
      ...prev,
      envVar: {
        loaded: !!secret,
        value: secret ? `${secret.substring(0, 20)}...` : 'NOT LOADED'
      }
    }));
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Direct GraphQL Test (No Login Required)</h1>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={testEnvVar}
          style={{ marginRight: '10px', padding: '10px', cursor: 'pointer' }}
        >
          Check Environment Variable
        </button>

        <button
          onClick={testGetMaids}
          disabled={loading}
          style={{ marginRight: '10px', padding: '10px', cursor: 'pointer' }}
        >
          Test Get Maids
        </button>

        <button
          onClick={testGetJobs}
          disabled={loading}
          style={{ padding: '10px', cursor: 'pointer' }}
        >
          Test Get Jobs
        </button>
      </div>

      {loading && <div>Loading...</div>}

      <div style={{ marginTop: '20px' }}>
        <h2>Results:</h2>
        <pre style={{
          background: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '600px'
        }}>
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#d4edda', borderRadius: '4px' }}>
        <h3>What This Tests:</h3>
        <ul>
          <li><strong>Environment Variable:</strong> Checks if VITE_HASURA_ADMIN_SECRET is loaded</li>
          <li><strong>Get Maids:</strong> Should return 5+ maids if admin secret works</li>
          <li><strong>Get Jobs:</strong> Should return 3+ jobs if admin secret works</li>
        </ul>

        <h3>Expected Results:</h3>
        <ul>
          <li>✅ Environment Variable: LOADED</li>
          <li>✅ Maids count: 5+ (not 0)</li>
          <li>✅ Jobs count: 3+ (not 0)</li>
        </ul>

        {results.maids?.count === 0 && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#f8d7da', borderRadius: '4px' }}>
            <strong>⚠️ If you see 0 maids/jobs:</strong>
            <ol>
              <li>Environment variable not loaded correctly</li>
              <li>Apollo Client not using admin secret</li>
              <li>Server needs restart</li>
            </ol>
          </div>
        )}

        {results.maids?.count > 0 && (
          <div style={{ marginTop: '10px', padding: '10px', background: '#d4edda', borderRadius: '4px' }}>
            <strong>✅ SUCCESS!</strong> The GraphQL integration is working correctly!
          </div>
        )}
      </div>
    </div>
  );
}
