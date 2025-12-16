/**
 * Temporary page to verify environment variables are loaded
 * Visit: http://localhost:5173/test-env
 */

export default function TestEnvPage() {
  const hasuraSecret = import.meta.env.VITE_HASURA_ADMIN_SECRET;
  const allEnv = import.meta.env;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variables Test</h1>

      <h2>VITE_HASURA_ADMIN_SECRET:</h2>
      <div style={{
        padding: '10px',
        background: hasuraSecret ? '#d4edda' : '#f8d7da',
        border: '1px solid ' + (hasuraSecret ? '#c3e6cb' : '#f5c6cb'),
        borderRadius: '4px',
        marginBottom: '20px'
      }}>
        {hasuraSecret ? (
          <>
            <div>✅ <strong>LOADED</strong></div>
            <div>Value: {hasuraSecret.substring(0, 20)}...</div>
          </>
        ) : (
          <>
            <div>❌ <strong>NOT LOADED</strong></div>
            <div>Server needs to be restarted!</div>
          </>
        )}
      </div>

      <h2>All Environment Variables:</h2>
      <pre style={{
        background: '#f5f5f5',
        padding: '10px',
        borderRadius: '4px',
        overflow: 'auto',
        maxHeight: '400px'
      }}>
        {JSON.stringify(allEnv, null, 2)}
      </pre>

      <div style={{ marginTop: '20px', padding: '10px', background: '#fff3cd', borderRadius: '4px' }}>
        <strong>Instructions:</strong>
        <ol>
          <li>If VITE_HASURA_ADMIN_SECRET shows "NOT LOADED", your server needs restarting</li>
          <li>Stop the dev server completely (Ctrl+C)</li>
          <li>Run: <code>pnpm run dev</code></li>
          <li>Refresh this page</li>
          <li>Verify it shows "LOADED"</li>
        </ol>
      </div>
    </div>
  );
}
