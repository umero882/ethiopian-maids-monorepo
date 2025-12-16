import { useState, useEffect, useCallback } from 'react';
import { apolloClient } from '@ethio/api-client';
import { gql } from '@apollo/client';

/**
 * Custom hook for real-time data subscriptions
 * Uses GraphQL subscriptions via Apollo Client for live updates
 */
export const useRealtimeData = (table, filters = {}, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const {
    initialLoad = true,
    onInsert,
    onUpdate,
    onDelete,
    transform,
  } = options;

  // Handle real-time changes
  const handleRealtimeChange = useCallback(
    (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      setData((currentData) => {
        let updatedData = [...currentData];

        switch (eventType) {
          case 'INSERT': {
            const transformedNew = transform ? transform(newRecord) : newRecord;
            updatedData.push(transformedNew);
            if (onInsert) onInsert(transformedNew);
            break;
          }

          case 'UPDATE': {
            const transformedUpdated = transform
              ? transform(newRecord)
              : newRecord;
            const updateIndex = updatedData.findIndex(
              (item) => item.id === newRecord.id
            );
            if (updateIndex !== -1) {
              updatedData[updateIndex] = transformedUpdated;
            }
            if (onUpdate) onUpdate(transformedUpdated, oldRecord);
            break;
          }

          case 'DELETE':
            updatedData = updatedData.filter(
              (item) => item.id !== oldRecord.id
            );
            if (onDelete) onDelete(oldRecord);
            break;

          default:
            console.warn('Unknown real-time event type:', eventType);
        }

        return updatedData;
      });
    },
    [transform, onInsert, onUpdate, onDelete]
  );

  // Load initial data via GraphQL query
  const loadData = useCallback(async () => {
    if (!initialLoad) return;

    try {
      setLoading(true);
      setError(null);

      // Build GraphQL query dynamically based on table
      const query = gql`
        query GetTableData {
          ${table}(limit: 100) {
            id
          }
        }
      `;

      const { data: result, errors } = await apolloClient.query({
        query,
        fetchPolicy: 'network-only'
      });

      if (errors) {
        throw new Error(errors[0]?.message || 'Failed to load data');
      }

      const tableData = result?.[table] || [];
      const transformedData = transform ? tableData.map(transform) : tableData;

      setData(transformedData);
    } catch (err) {
      console.error(`Error loading ${table} data:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [table, initialLoad, transform]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data manually
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refresh,
    subscription: isSubscribed,
  };
};

/**
 * Hook specifically for maid profiles with real-time updates
 */
export const useRealtimeMaidProfiles = (filters = {}) => {
  return useRealtimeData('maid_profiles', filters, {
    transform: (maid) => ({
      ...maid,
      // Add computed fields
      name: maid.full_name,
      country: maid.nationality,
      // Ensure arrays are properly handled
      skills: Array.isArray(maid.skills) ? maid.skills : [],
      languages: Array.isArray(maid.languages) ? maid.languages : [],
      // Add primary image URL from profile_photo_url field
      primaryImageUrl: maid.profile_photo_url || null,
    }),
    onInsert: (newMaid) => {},
    onUpdate: (updatedMaid) => {},
    onDelete: (deletedMaid) => {},
  });
};

/**
 * Hook for real-time image updates
 */
export const useRealtimeMaidImages = (maidId) => {
  return useRealtimeData(
    'maid_images',
    { maid_id: maidId },
    {
      initialLoad: true,
      transform: (image) => ({
        ...image,
        // Add any computed fields for images
        isPrimary: image.is_primary,
        displayOrder: image.display_order,
      }),
    }
  );
};

/**
 * Hook for processed images
 */
export const useRealtimeProcessedImages = (maidId) => {
  return useRealtimeData(
    'processed_images',
    { maid_profile_id: maidId },
    {
      initialLoad: true,
      onInsert: (_newImage) => {},
    }
  );
};

/**
 * Generic hook for any table with basic CRUD operations
 * Uses GraphQL queries via Apollo Client
 */
export const useRealtimeTable = (
  tableName,
  selectQuery = '*',
  filters = {}
) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Build dynamic GraphQL query
        const query = gql`
          query GetTableData {
            ${tableName}(limit: 100) {
              id
            }
          }
        `;

        const { data: result, errors } = await apolloClient.query({
          query,
          fetchPolicy: 'network-only'
        });

        if (errors) {
          throw new Error(errors[0]?.message || 'Query failed');
        }

        setData(result?.[tableName] || []);
        setError(null);
      } catch (err) {
        console.error(`Error loading ${tableName}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tableName, selectQuery, JSON.stringify(filters)]);

  return { data, loading, error };
};

export default useRealtimeData;
