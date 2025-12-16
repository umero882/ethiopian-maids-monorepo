/**
 * Apollo Client Diagnostic Page
 * Visit: http://localhost:5173/diagnose-apollo
 */

import { useState, useEffect } from 'react';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';

export default function DiagnoseApollo() {
  const [results, setResults] = useState({});

  useEffect(() => {
    // Check environment variable
    const envSecret = import.meta.env.VITE_HASURA_ADMIN_SECRET;
    setResults(prev => ({
      ...prev,
      envCheck: {
        available: !!envSecret,
        value: envSecret ? `${envSecret.substring(0, 30)}...` : 'NOT AVAILABLE'
      }
    }));
  }, []);

  const testQuery = async () => {
    try {
      // Intercept the request to see headers
      const originalFetch = window.fetch;
      let capturedHeaders = null;

      window.fetch = async (url, options) => {
        if (url.includes('graphql')) {
          capturedHeaders = options.headers;
          console.log('🔍 Intercepted GraphQL request headers:', options.headers);
        }
        return originalFetch(url, options);
      };

      const { data, errors } = await apolloClient.query({
        query: gql`
          query DiagnosticQuery {
            maid_profiles(
              where: { agency_id: { _eq: "9b0fec92-bf93-43e8-a9f7-1a20a7dc11c6" } }
              limit: 5
            ) {
              id
              full_name
            }
          }
        `,
        fetchPolicy: 'network-only'
      });

      // Restore original fetch
      window.fetch = originalFetch;

      setResults(prev => ({
        ...prev,
        queryResult: {
          success: !errors,
          count: data?.maid_profiles?.length || 0,
          headers: capturedHeaders,
          hasAdminSecret: !!capturedHeaders?.['x-hasura-admin-secret'],
          adminSecretValue: capturedHeaders?.['x-hasura-admin-secret']
            ? `${capturedHeaders['x-hasura-admin-secret'].substring(0, 30)}...`
            : 'NOT SENT',
          errors: errors?.map(e => e.message) || null
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        queryResult: { error: error.message }
      }));
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1000px' }}>
      <h1>Apollo Client Diagnostic</h1>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={testQuery}
          style={{
            padding: '15px 30px',
            fontSize: '16px',
            cursor: 'pointer',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          Run Diagnostic Query
        </button>
      </div>

      {/* Environment Variable Check */}
      <div style={{
        padding: '15px',
        marginBottom: '20px',
        background: results.envCheck?.available ? '#d4edda' : '#f8d7da',
        border: '1px solid ' + (results.envCheck?.available ? '#c3e6cb' : '#f5c6cb'),
        borderRadius: '4px'
      }}>
        <h2>1. Environment Variable Check</h2>
        <p><strong>Status:</strong> {results.envCheck?.available ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}</p>
        <p><strong>Value:</strong> <code>{results.envCheck?.value}</code></p>
      </div>

      {/* Query Results */}
      {results.queryResult && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          background: results.queryResult.count > 0 ? '#d4edda' : '#fff3cd',
          border: '1px solid ' + (results.queryResult.count > 0 ? '#c3e6cb' : '#ffc107'),
          borderRadius: '4px'
        }}>
          <h2>2. Query Results</h2>
          <p><strong>Maids Returned:</strong> {results.queryResult.count}</p>
          <p><strong>Admin Secret in Headers:</strong> {results.queryResult.hasAdminSecret ? '✅ YES' : '❌ NO'}</p>
          <p><strong>Admin Secret Value:</strong> <code>{results.queryResult.adminSecretValue}</code></p>
          {results.queryResult.errors && (
            <div>
              <strong>Errors:</strong>
              <pre>{JSON.stringify(results.queryResult.errors, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Full Results */}
      <div style={{
        padding: '15px',
        background: '#f5f5f5',
        borderRadius: '4px'
      }}>
        <h2>3. Full Diagnostic Data</h2>
        <pre style={{ overflow: 'auto', maxHeight: '400px' }}>
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '4px'
      }}>
        <h2>What This Tests</h2>
        <ol>
          <li><strong>Environment Variable:</strong> Checks if VITE_HASURA_ADMIN_SECRET is accessible</li>
          <li><strong>Headers:</strong> Intercepts the GraphQL request to see actual headers sent</li>
          <li><strong>Results:</strong> Shows how many maids are returned</li>
        </ol>

        <h3>Expected Results</h3>
        <ul>
          <li>✅ Environment Variable: AVAILABLE</li>
          <li>✅ Admin Secret in Headers: YES</li>
          <li>✅ Maids Returned: 24 (or more)</li>
        </ul>

        <h3>If Maids = 0</h3>
        <p>This means the admin secret is NOT being sent in the request headers, even though it's available in the environment.</p>

        <h3>Solution</h3>
        <p>The Apollo Client needs to be configured to actually USE the admin secret from the environment.</p>
      </div>
    </div>
  );
}
