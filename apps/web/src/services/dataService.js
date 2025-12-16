/**
 * 🗄️ Unified Data Service
 * Standardized data operations with caching, pagination, and error handling
 * Migrated to GraphQL/Hasura
 */

import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';
import { handleDatabaseError } from '@/services/centralizedErrorHandler';

class DataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Build GraphQL where clause from filters
   */
  buildWhereClause(filters) {
    const where = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          where[key] = { _in: value };
        } else if (typeof value === 'object' && value.operator) {
          // Advanced filtering: { operator: 'gte', value: 18 }
          const operatorMap = {
            eq: '_eq',
            neq: '_neq',
            gt: '_gt',
            gte: '_gte',
            lt: '_lt',
            lte: '_lte',
            like: '_like',
            ilike: '_ilike',
          };
          const gqlOperator = operatorMap[value.operator] || '_eq';
          where[key] = { [gqlOperator]: value.value };
        } else {
          where[key] = { _eq: value };
        }
      }
    });

    return where;
  }

  /**
   * Generic query builder with standardized options
   */
  async query(table, options = {}) {
    const {
      select = null,
      filters = {},
      orderBy = null,
      limit = null,
      offset = 0,
      useCache = false,
      cacheKey = null,
    } = options;

    // Check cache first
    if (useCache) {
      const cached = this.getFromCache(
        cacheKey || `${table}_${JSON.stringify(options)}`
      );
      if (cached) return cached;
    }

    try {
      const whereClause = this.buildWhereClause(filters);

      // Build dynamic query
      const QUERY = gql`
        query DynamicQuery($where: ${table}_bool_exp, $limit: Int, $offset: Int, $orderBy: [${table}_order_by!]) {
          ${table}(
            where: $where
            limit: $limit
            offset: $offset
            order_by: $orderBy
          ) {
            id
            created_at
            updated_at
          }
          ${table}_aggregate(where: $where) {
            aggregate {
              count
            }
          }
        }
      `;

      const variables = {
        where: Object.keys(whereClause).length > 0 ? whereClause : {},
        limit,
        offset,
        orderBy: orderBy ? [{ [orderBy.column]: orderBy.ascending ? 'asc' : 'desc' }] : null,
      };

      const { data, errors } = await apolloClient.query({
        query: QUERY,
        variables,
        fetchPolicy: 'network-only'
      });

      if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

      const items = data?.[table] || [];
      const count = data?.[`${table}_aggregate`]?.aggregate?.count || 0;

      const result = {
        data: items,
        count,
        hasMore: limit ? items.length === limit : false,
        offset,
        limit,
      };

      // Cache result if requested
      if (useCache) {
        this.setCache(
          cacheKey || `${table}_${JSON.stringify(options)}`,
          result
        );
      }

      return result;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    }
  }

  /**
   * Get single record by ID
   */
  async getById(table, id, options = {}) {
    const { useCache = true } = options;

    try {
      const QUERY = gql`
        query GetById($id: uuid!) {
          ${table}_by_pk(id: $id) {
            id
            created_at
            updated_at
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: QUERY,
        variables: { id },
        fetchPolicy: 'network-only'
      });

      if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

      const record = data?.[`${table}_by_pk`];

      if (useCache && record) {
        this.setCache(`${table}_${id}`, record);
      }

      return record;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    }
  }

  /**
   * Create new record
   */
  async create(table, recordData, options = {}) {
    const { clearCache = true } = options;

    try {
      const MUTATION = gql`
        mutation CreateRecord($object: ${table}_insert_input!) {
          insert_${table}_one(object: $object) {
            id
            created_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: MUTATION,
        variables: { object: recordData }
      });

      if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

      const result = data?.[`insert_${table}_one`];

      if (clearCache) {
        this.clearCacheByPattern(table);
      }

      return result;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    }
  }

  /**
   * Update record
   */
  async update(table, id, recordData, options = {}) {
    const { clearCache = true } = options;

    try {
      const MUTATION = gql`
        mutation UpdateRecord($id: uuid!, $set: ${table}_set_input!) {
          update_${table}_by_pk(pk_columns: { id: $id }, _set: $set) {
            id
            updated_at
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: MUTATION,
        variables: { id, set: recordData }
      });

      if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

      const result = data?.[`update_${table}_by_pk`];

      if (clearCache) {
        this.clearCacheByPattern(table);
        this.clearCache(`${table}_${id}`);
      }

      return result;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    }
  }

  /**
   * Delete record
   */
  async delete(table, id, options = {}) {
    const { clearCache = true } = options;

    try {
      const MUTATION = gql`
        mutation DeleteRecord($id: uuid!) {
          delete_${table}_by_pk(id: $id) {
            id
          }
        }
      `;

      const { data, errors } = await apolloClient.mutate({
        mutation: MUTATION,
        variables: { id }
      });

      if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

      if (clearCache) {
        this.clearCacheByPattern(table);
        this.clearCache(`${table}_${id}`);
      }

      return true;
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    }
  }

  /**
   * Paginated query with standardized response
   */
  async getPaginated(table, page = 1, pageSize = 20, options = {}) {
    const offset = (page - 1) * pageSize;

    const result = await this.query(table, {
      ...options,
      limit: pageSize,
      offset,
    });

    return {
      data: result.data,
      pagination: {
        page,
        pageSize,
        total: result.count,
        totalPages: Math.ceil(result.count / pageSize),
        hasNext: result.hasMore,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Search with full-text search
   */
  async search(table, searchTerm, searchColumns = [], options = {}) {
    try {
      // Build OR conditions for search columns
      const orConditions = searchColumns.map(col => ({
        [col]: { _ilike: `%${searchTerm}%` }
      }));

      const whereClause = orConditions.length > 0
        ? { _or: orConditions }
        : { name: { _ilike: `%${searchTerm}%` } };

      const QUERY = gql`
        query SearchQuery($where: ${table}_bool_exp!) {
          ${table}(where: $where) {
            id
            created_at
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: QUERY,
        variables: { where: whereClause },
        fetchPolicy: 'network-only'
      });

      if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

      return data?.[table] || [];
    } catch (error) {
      await handleDatabaseError(error);
      throw error;
    }
  }

  /**
   * Batch operations
   */
  async batchCreate(table, records, options = {}) {
    const { batchSize = 100, clearCache = true } = options;
    const results = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      try {
        const MUTATION = gql`
          mutation BatchInsert($objects: [${table}_insert_input!]!) {
            insert_${table}(objects: $objects) {
              returning {
                id
                created_at
              }
            }
          }
        `;

        const { data, errors } = await apolloClient.mutate({
          mutation: MUTATION,
          variables: { objects: batch }
        });

        if (errors) throw new Error(errors[0]?.message || 'GraphQL error');

        results.push(...(data?.[`insert_${table}`]?.returning || []));
      } catch (error) {
        await handleDatabaseError(error);
        throw error;
      }
    }

    if (clearCache) {
      this.clearCacheByPattern(table);
    }

    return results;
  }

  /**
   * Cache management
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache(key) {
    this.cache.delete(key);
  }

  clearCacheByPattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clearAllCache() {
    this.cache.clear();
  }

  /**
   * Real-time subscriptions (using GraphQL subscriptions)
   * Note: Requires WebSocket connection setup in Apollo Client
   */
  subscribe(table, callback, filters = {}) {
    const whereClause = this.buildWhereClause(filters);

    const SUBSCRIPTION = gql`
      subscription OnTableChange($where: ${table}_bool_exp) {
        ${table}(where: $where) {
          id
          created_at
          updated_at
        }
      }
    `;

    const observable = apolloClient.subscribe({
      query: SUBSCRIPTION,
      variables: { where: Object.keys(whereClause).length > 0 ? whereClause : {} }
    });

    const subscription = observable.subscribe({
      next: (result) => {
        if (result.data) {
          callback({
            eventType: 'UPDATE',
            new: result.data[table],
            old: null,
          });
        }
      },
      error: (error) => {
        console.error('Subscription error:', error);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const HEALTH_QUERY = gql`
        query HealthCheck {
          profiles(limit: 1) {
            id
          }
        }
      `;

      const { data, errors } = await apolloClient.query({
        query: HEALTH_QUERY,
        fetchPolicy: 'network-only'
      });

      return { healthy: !errors, error: errors?.[0]?.message };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

// Export singleton instance
export const dataService = new DataService();

// Convenience functions for common operations
export const getMaidProfiles = (filters = {}, options = {}) =>
  dataService.query('maid_profiles', { filters, ...options });

export const getSponsorProfiles = (filters = {}, options = {}) =>
  dataService.query('sponsor_profiles', { filters, ...options });

export const getJobPostings = (filters = {}, options = {}) =>
  dataService.query('jobs', { filters, ...options });

export const searchMaids = (searchTerm, options = {}) =>
  dataService.search(
    'maid_profiles',
    searchTerm,
    ['full_name', 'skills'],
    options
  );

export const searchJobs = (searchTerm, options = {}) =>
  dataService.search('jobs', searchTerm, ['title', 'description'], options);
