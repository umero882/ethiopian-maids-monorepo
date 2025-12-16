/**
 * Relay Pagination Utilities
 *
 * Hasura uses Relay-style connections with base64-encoded cursor IDs.
 * These utilities help encode/decode IDs and work with cursor pagination.
 */

/**
 * Encode a UUID to a base64 Relay cursor
 * Hasura format: ["table_name", {"id": "uuid-value"}]
 *
 * @param tableName - The table name (e.g., "profiles", "maid_profiles")
 * @param id - The UUID to encode
 * @returns Base64-encoded cursor string
 */
export function encodeRelayId(tableName: string, id: string): string {
  const obj = [tableName, { id }];
  const jsonStr = JSON.stringify(obj);
  return btoa(jsonStr);
}

/**
 * Decode a base64 Relay cursor to get the UUID
 *
 * @param cursor - Base64-encoded cursor string
 * @returns The decoded UUID string
 */
export function decodeRelayId(cursor: string): string {
  try {
    const jsonStr = atob(cursor);
    const [, obj] = JSON.parse(jsonStr);
    return obj.id;
  } catch (error) {
    console.error('Failed to decode Relay cursor:', error);
    throw new Error('Invalid Relay cursor format');
  }
}

/**
 * Extract the table name from a Relay cursor
 *
 * @param cursor - Base64-encoded cursor string
 * @returns The table name
 */
export function getTableNameFromCursor(cursor: string): string {
  try {
    const jsonStr = atob(cursor);
    const [tableName] = JSON.parse(jsonStr);
    return tableName;
  } catch (error) {
    console.error('Failed to decode table name from cursor:', error);
    throw new Error('Invalid Relay cursor format');
  }
}

/**
 * Create a Relay global ID from table name and UUID
 * This is useful for the `node` query which requires a global ID
 *
 * @param tableName - The table name
 * @param id - The UUID
 * @returns The global Relay ID
 */
export function toGlobalId(tableName: string, id: string): string {
  return encodeRelayId(tableName, id);
}

/**
 * Parse a global Relay ID to get table name and UUID
 *
 * @param globalId - The global Relay ID
 * @returns Object with tableName and id
 */
export function fromGlobalId(globalId: string): { tableName: string; id: string } {
  try {
    const jsonStr = atob(globalId);
    const [tableName, obj] = JSON.parse(jsonStr);
    return { tableName, id: obj.id };
  } catch (error) {
    console.error('Failed to parse global ID:', error);
    throw new Error('Invalid global Relay ID format');
  }
}

/**
 * Check if a string is a valid base64 Relay cursor
 *
 * @param cursor - String to validate
 * @returns True if valid Relay cursor
 */
export function isValidRelayCursor(cursor: string): boolean {
  try {
    const jsonStr = atob(cursor);
    const parsed = JSON.parse(jsonStr);
    return (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === 'string' &&
      typeof parsed[1] === 'object' &&
      'id' in parsed[1]
    );
  } catch {
    return false;
  }
}

/**
 * Extract nodes from a Relay connection response
 *
 * @param connection - The connection object from GraphQL response
 * @returns Array of node objects
 */
export function extractNodesFromConnection<T>(
  connection: { edges?: Array<{ node?: T }> } | null | undefined
): T[] {
  if (!connection?.edges) {
    return [];
  }
  return connection.edges
    .map(edge => edge.node)
    .filter((node): node is T => node !== null && node !== undefined);
}

/**
 * Get pagination info from a connection
 *
 * @param connection - The connection object from GraphQL response
 * @returns PageInfo object with pagination details
 */
export function getPageInfo(
  connection: {
    pageInfo?: {
      hasNextPage?: boolean;
      hasPreviousPage?: boolean;
      startCursor?: string | null;
      endCursor?: string | null;
    };
  } | null | undefined
) {
  return {
    hasNextPage: connection?.pageInfo?.hasNextPage ?? false,
    hasPreviousPage: connection?.pageInfo?.hasPreviousPage ?? false,
    startCursor: connection?.pageInfo?.startCursor ?? null,
    endCursor: connection?.pageInfo?.endCursor ?? null,
  };
}

/**
 * Create variables for forward pagination (load more)
 *
 * @param endCursor - The cursor to start after
 * @param first - Number of items to fetch
 * @returns Variables object for GraphQL query
 */
export function createForwardPaginationVars(
  endCursor: string | null,
  first: number = 20
) {
  return {
    first,
    after: endCursor,
  };
}

/**
 * Create variables for backward pagination (load previous)
 *
 * @param startCursor - The cursor to start before
 * @param last - Number of items to fetch
 * @returns Variables object for GraphQL query
 */
export function createBackwardPaginationVars(
  startCursor: string | null,
  last: number = 20
) {
  return {
    last,
    before: startCursor,
  };
}

/**
 * Merge connection edges for infinite scrolling
 * This is useful for Apollo Client's fetchMore function
 *
 * @param existing - Existing connection data
 * @param incoming - New connection data
 * @returns Merged connection data
 */
export function mergeConnections<T>(
  existing: { edges: Array<{ cursor: string; node: T }> } | undefined,
  incoming: { edges: Array<{ cursor: string; node: T }> }
) {
  if (!existing) {
    return incoming;
  }

  const existingCursors = new Set(existing.edges.map(e => e.cursor));
  const newEdges = incoming.edges.filter(e => !existingCursors.has(e.cursor));

  return {
    ...incoming,
    edges: [...existing.edges, ...newEdges],
  };
}

/**
 * Example usage for pagination hook
 *
 * ```typescript
 * const { data, fetchMore } = useGetAllProfilesConnectionQuery({
 *   variables: { first: 20 }
 * });
 *
 * const profiles = extractNodesFromConnection(data?.profiles_connection);
 * const pageInfo = getPageInfo(data?.profiles_connection);
 *
 * const loadMore = () => {
 *   if (pageInfo.hasNextPage) {
 *     fetchMore({
 *       variables: createForwardPaginationVars(pageInfo.endCursor)
 *     });
 *   }
 * };
 * ```
 */

// Type definitions for Relay connections
export interface RelayEdge<T> {
  cursor: string;
  node: T;
}

export interface RelayPageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface RelayConnection<T> {
  edges: RelayEdge<T>[];
  pageInfo: RelayPageInfo;
}

export interface RelayPaginationVars {
  first?: number;
  after?: string | null;
  last?: number;
  before?: string | null;
}
