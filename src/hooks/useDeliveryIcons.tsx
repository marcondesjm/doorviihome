import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { defaultDeliveryIcons, DeliveryIcon } from "@/components/StyledQRCode";
import { useState, useEffect } from "react";

const HIDDEN_DEFAULTS_KEY = "hidden-default-delivery-icons";

export const useDeliveryIcons = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hiddenDefaults, setHiddenDefaults] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(HIDDEN_DEFAULTS_KEY) || "[]");
    } catch {
      return [];
    }
  });

  // Save hidden defaults to localStorage
  useEffect(() => {
    localStorage.setItem(HIDDEN_DEFAULTS_KEY, JSON.stringify(hiddenDefaults));
  }, [hiddenDefaults]);

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

  // Filter out hidden default icons and combine with user's custom icons
  const visibleDefaults = defaultDeliveryIcons.filter(
    icon => !hiddenDefaults.includes(icon.id)
  );
  const deliveryIcons = [...visibleDefaults, ...dbIcons];

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

  const updateIcon = useMutation({
    mutationFn: async ({ id, name, url }: { id: string; name: string; url: string }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("delivery_icons")
        .update({ name, url })
        .eq("id", id)
        .eq("user_id", user.id)
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

  // Hide a default icon (for "deleting" defaults)
  const hideDefaultIcon = (iconId: string) => {
    setHiddenDefaults(prev => [...prev, iconId]);
  };

  // Restore a hidden default icon
  const restoreDefaultIcon = (iconId: string) => {
    setHiddenDefaults(prev => prev.filter(id => id !== iconId));
  };

  // Restore all hidden defaults
  const restoreAllDefaults = () => {
    setHiddenDefaults([]);
  };

  return {
    deliveryIcons,
    dbIcons,
    hiddenDefaults,
    isLoading,
    addIcon,
    updateIcon,
    removeIcon,
    hideDefaultIcon,
    restoreDefaultIcon,
    restoreAllDefaults,
  };
};
