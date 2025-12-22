import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Property {
  id: string;
  user_id: string;
  name: string;
  address: string;
  image_url: string | null;
  is_online: boolean;
  visitor_always_connected: boolean;
  created_at: string;
  updated_at: string;
}

export function useProperties() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['properties', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Property[];
    },
    enabled: !!user
  });
}

export function useAddProperty() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (property: { name: string; address: string; image_url?: string }) => {
      const { data, error } = await supabase
        .from('properties')
        .insert({
          user_id: user!.id,
          name: property.name,
          address: property.address,
          image_url: property.image_url || null,
          is_online: false
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    }
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, data }: { propertyId: string; data: { name?: string; image_url?: string; visitor_always_connected?: boolean } }) => {
      const { error } = await supabase
        .from('properties')
        .update(data)
        .eq('id', propertyId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    }
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      console.log('Deleting property:', propertyId);
      
      // First, delete related records to avoid foreign key constraint errors
      // Delete access_codes
      const { error: accessCodesError } = await supabase
        .from('access_codes')
        .delete()
        .eq('property_id', propertyId);
      
      if (accessCodesError) {
        console.error('Error deleting access_codes:', accessCodesError);
      }

      // Delete activity_logs
      const { error: activityLogsError } = await supabase
        .from('activity_logs')
        .delete()
        .eq('property_id', propertyId);
      
      if (activityLogsError) {
        console.error('Error deleting activity_logs:', activityLogsError);
      }

      // Delete video_calls
      const { error: videoCallsError } = await supabase
        .from('video_calls')
        .delete()
        .eq('property_id', propertyId);
      
      if (videoCallsError) {
        console.error('Error deleting video_calls:', videoCallsError);
      }

      // Now delete the property
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyId);
      
      if (error) {
        console.error('Error deleting property:', error);
        throw error;
      }
      console.log('Property deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['accessCodes'] });
    },
    onError: (error) => {
      console.error('Delete mutation error:', error);
    }
  });
}
