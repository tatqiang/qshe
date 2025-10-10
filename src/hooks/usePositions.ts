import { useState, useEffect } from 'react';
import { supabase } from '../lib/api/supabase';
import type { Position } from '../types';

interface UsePositionsOptions {
  userType?: 'internal' | 'external' | 'worker';
  enabled?: boolean;
}

export const usePositions = ({ userType, enabled = true }: UsePositionsOptions = {}) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchPositions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let query = (supabase.from('positions') as any).select('*');
        
        // Filter by user type if specified
        if (userType) {
          query = query.eq('type', userType);
        }
        
        const { data, error } = await query.order('level').order('position_title');

        if (error) {
          throw error;
        }

        const formattedPositions: Position[] = data.map(pos => ({
          id: pos.id,
          level: pos.level,
          positionTitle: pos.position_title,
          code: pos.code,
          type: pos.type,
          createdAt: pos.created_at,
          updatedAt: pos.updated_at,
        }));

        setPositions(formattedPositions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch positions');
        console.error('Error fetching positions:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositions();
  }, [userType, enabled]);

  return {
    positions,
    isLoading,
    error,
    refetch: () => {
      if (enabled) {
        // Re-trigger the useEffect
        setPositions([]);
      }
    },
  };
};

// Hook for getting authority level options
export const useAuthorityLevels = () => {
  const authorityLevels = [
    { value: 'system_admin', label: 'System Administrator', description: 'Full system access' },
    { value: 'admin', label: 'Administrator', description: 'Administrative access' },
    { value: 'project_manager', label: 'Project Manager', description: 'Manage projects and teams' },
    { value: 'site_manager', label: 'Site Manager', description: 'Manage site operations' },
    { value: 'qshe_manager', label: 'QSHE Manager', description: 'Safety and quality management' },
    { value: 'supervisor', label: 'Supervisor', description: 'Team supervision' },
    { value: 'member', label: 'Member', description: 'Standard user access' },
    { value: 'worker', label: 'Worker', description: 'Basic worker access' },
  ];

  return { authorityLevels };
};
