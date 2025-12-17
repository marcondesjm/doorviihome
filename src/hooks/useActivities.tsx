import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ActivityLog {
  id: string;
  user_id: string;
  property_id: string | null;
  type: 'doorbell' | 'answered' | 'missed' | 'incoming';
  title: string;
  property_name: string;
  duration: string | null;
  created_at: string;
}

export function useActivities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Real-time subscription for new activities
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['activities'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['activities', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as ActivityLog[];
    },
    enabled: !!user
  });
}

export function useAddActivity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (activity: {
      property_id?: string;
      type: 'doorbell' | 'answered' | 'missed' | 'incoming';
      title: string;
      property_name: string;
      duration?: string;
    }) => {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user!.id,
          property_id: activity.property_id || null,
          type: activity.type,
          title: activity.title,
          property_name: activity.property_name,
          duration: activity.duration || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    }
  });
}
