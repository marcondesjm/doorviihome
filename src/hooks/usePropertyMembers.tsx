import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Generate a random 6-character alphanumeric code
const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const usePropertyMembers = (propertyId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["property-members", propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      
      const { data, error } = await supabase
        .from("property_members")
        .select("*")
        .eq("property_id", propertyId)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
    enabled: !!propertyId && !!user,
  });
};

export const useMyMemberships = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-memberships", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("property_members")
        .select(`
          *,
          properties:property_id (
            id,
            name,
            address,
            image_url,
            is_online
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateInviteCode = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, expiresInHours = 24, maxUses = 1 }: { 
      propertyId: string; 
      expiresInHours?: number;
      maxUses?: number;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const code = generateCode();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      const { data, error } = await supabase
        .from("property_invite_codes")
        .insert({
          property_id: propertyId,
          code,
          created_by: user.id,
          expires_at: expiresAt.toISOString(),
          max_uses: maxUses,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["invite-codes", variables.propertyId] });
    },
  });
};

export const useInviteCodes = (propertyId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["invite-codes", propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      
      const { data, error } = await supabase
        .from("property_invite_codes")
        .select("*")
        .eq("property_id", propertyId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!propertyId && !!user,
  });
};

export const useJoinWithCode = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      if (!user) throw new Error("User not authenticated");

      // Find the invite code
      const { data: inviteCode, error: codeError } = await supabase
        .from("property_invite_codes")
        .select("*")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (codeError) throw codeError;
      if (!inviteCode) throw new Error("Código inválido ou expirado");

      if (inviteCode.max_uses && inviteCode.uses_count >= inviteCode.max_uses) {
        throw new Error("Este código já atingiu o limite de usos");
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from("property_members")
        .select("id")
        .eq("property_id", inviteCode.property_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMember) {
        throw new Error("Você já é membro desta propriedade");
      }

      // Check if user is the owner
      const { data: property } = await supabase
        .from("properties")
        .select("user_id, name")
        .eq("id", inviteCode.property_id)
        .single();

      if (property?.user_id === user.id) {
        throw new Error("Você é o proprietário desta propriedade");
      }

      // Add as member
      const { error: memberError } = await supabase
        .from("property_members")
        .insert({
          property_id: inviteCode.property_id,
          user_id: user.id,
          role: "member",
          invited_by: inviteCode.created_by,
        });

      if (memberError) throw memberError;

      // Update uses count
      await supabase
        .from("property_invite_codes")
        .update({ uses_count: inviteCode.uses_count + 1 })
        .eq("id", inviteCode.id);

      return { propertyName: property?.name };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ memberId, propertyId }: { memberId: string; propertyId: string }) => {
      const { error } = await supabase
        .from("property_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
      return { propertyId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["property-members", data.propertyId] });
    },
  });
};

export const useLeaveMembership = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("property_members")
        .delete()
        .eq("property_id", propertyId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
};
