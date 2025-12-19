import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { defaultDeliveryIcons, DeliveryIcon } from "@/components/StyledQRCode";

export const useDeliveryIcons = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: dbIcons = [], isLoading } = useQuery({
    queryKey: ["delivery-icons", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("delivery_icons")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      return data.map((icon) => ({
        id: icon.id,
        name: icon.name,
        url: icon.url,
      })) as DeliveryIcon[];
    },
    enabled: !!user,
  });

  // Combine default icons with user's custom icons
  const deliveryIcons = [...defaultDeliveryIcons, ...dbIcons];

  const addIcon = useMutation({
    mutationFn: async ({ name, url }: { name: string; url: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("delivery_icons")
        .insert({
          user_id: user.id,
          name,
          url,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-icons", user?.id] });
    },
  });

  const removeIcon = useMutation({
    mutationFn: async (iconId: string) => {
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("delivery_icons")
        .delete()
        .eq("id", iconId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-icons", user?.id] });
    },
  });

  return {
    deliveryIcons,
    dbIcons,
    isLoading,
    addIcon,
    removeIcon,
  };
};
