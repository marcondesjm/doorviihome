import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AccessCode {
  id: string;
  user_id: string;
  property_id: string | null;
  code: string;
  expires_at: string;
  created_at: string;
}

function generateAccessCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'DOOR-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function useAccessCodes() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['accessCodes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_codes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AccessCode[];
    },
    enabled: !!user
  });
}

export function useGenerateAccessCode() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ propertyId }: { propertyId?: string }) => {
      const code = generateAccessCode();
      // Set expiration to 100 years in the future (effectively permanent)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 100);

      const { data, error } = await supabase
        .from('access_codes')
        .insert({
          user_id: user!.id,
          property_id: propertyId || null,
          code,
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as AccessCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessCodes'] });
    }
  });
}
