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
  media_url: string | null;
  media_type: 'audio' | 'video' | null;
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
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching activities:', error);
        throw error;
      }
      return data as ActivityLog[];
    },
    enabled: !!user
  });
}

export function useAllActivities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Real-time subscription for new activities
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('all-activity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_logs'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['all-activities'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ['all-activities', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching all activities:', error);
        throw error;
      }
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
      media_url?: string;
      media_type?: 'audio' | 'video';
    }) => {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          user_id: user!.id,
          property_id: activity.property_id || null,
          type: activity.type,
          title: activity.title,
          property_name: activity.property_name,
          duration: activity.duration || null,
          media_url: activity.media_url || null,
          media_type: activity.media_type || null
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['all-activities'] });
    }
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activityId: string) => {
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('id', activityId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['all-activities'] });
    }
  });
}

export function useDeleteAllActivities() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('activity_logs')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['all-activities'] });
    }
  });
}
