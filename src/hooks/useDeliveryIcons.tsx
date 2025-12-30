import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { defaultDeliveryIcons, DeliveryIcon } from "@/components/StyledQRCode";
import { useState, useEffect, useCallback } from "react";

const HIDDEN_DEFAULTS_KEY = "hidden-default-delivery-icons";
const ICONS_ORDER_KEY = "delivery-icons-order";

export interface OrderedDeliveryIcon extends DeliveryIcon {
  displayOrder: number;
}

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

  // Store order for all icons (both default and custom)
  const [iconsOrder, setIconsOrder] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(ICONS_ORDER_KEY) || "[]");
    } catch {
      return [];
    }
  });

  // Save hidden defaults to localStorage
  useEffect(() => {
    localStorage.setItem(HIDDEN_DEFAULTS_KEY, JSON.stringify(hiddenDefaults));
  }, [hiddenDefaults]);

  // Save order to localStorage
  useEffect(() => {
    localStorage.setItem(ICONS_ORDER_KEY, JSON.stringify(iconsOrder));
  }, [iconsOrder]);

  const { data: dbIcons = [], isLoading } = useQuery({
    queryKey: ["delivery-icons", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("delivery_icons")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true });

      if (error) throw error;
      
      return data.map((icon) => ({
        id: icon.id,
        name: icon.name,
        url: icon.url,
        displayOrder: icon.display_order ?? 0,
      })) as OrderedDeliveryIcon[];
    },
    enabled: !!user,
  });

  // Filter out hidden default icons and combine with user's custom icons
  const visibleDefaults = defaultDeliveryIcons.filter(
    icon => !hiddenDefaults.includes(icon.id)
  );
  
  // Combine and sort by saved order
  const allIcons = [...visibleDefaults, ...dbIcons];
  
  // Sort icons based on saved order
  const deliveryIcons = [...allIcons].sort((a, b) => {
    const orderA = iconsOrder.indexOf(a.id);
    const orderB = iconsOrder.indexOf(b.id);
    
    // If both are in the order list, sort by position
    if (orderA !== -1 && orderB !== -1) {
      return orderA - orderB;
    }
    // If only a is in the list, it comes first
    if (orderA !== -1) return -1;
    // If only b is in the list, it comes first
    if (orderB !== -1) return 1;
    // Otherwise, keep original order
    return 0;
  });

  const addIcon = useMutation({
    mutationFn: async ({ name, url }: { name: string; url: string }) => {
      if (!user) throw new Error("User not authenticated");

      // Get the max order
      const maxOrder = dbIcons.length > 0 
        ? Math.max(...dbIcons.map(i => i.displayOrder ?? 0)) + 1 
        : visibleDefaults.length;

      const { data, error } = await supabase
        .from("delivery_icons")
        .insert({
          user_id: user.id,
          name,
          url,
          display_order: maxOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-icons", user?.id] });
      // Add new icon to the end of order
      setIconsOrder(prev => [...prev, data.id]);
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
      return iconId;
    },
    onSuccess: (iconId) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-icons", user?.id] });
      // Remove from order
      setIconsOrder(prev => prev.filter(id => id !== iconId));
    },
  });

  // Hide a default icon (for "deleting" defaults)
  const hideDefaultIcon = (iconId: string) => {
    setHiddenDefaults(prev => [...prev, iconId]);
    setIconsOrder(prev => prev.filter(id => id !== iconId));
  };

  // Restore a hidden default icon
  const restoreDefaultIcon = (iconId: string) => {
    setHiddenDefaults(prev => prev.filter(id => id !== iconId));
  };

  // Restore all hidden defaults
  const restoreAllDefaults = () => {
    setHiddenDefaults([]);
  };

  // Reorder icons - move from one position to another
  const reorderIcons = useCallback((fromIndex: number, toIndex: number) => {
    const currentOrder = deliveryIcons.map(icon => icon.id);
    const newOrder = [...currentOrder];
    const [movedItem] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedItem);
    setIconsOrder(newOrder);
  }, [deliveryIcons]);

  // Move icon up in order
  const moveIconUp = useCallback((iconId: string) => {
    const currentIndex = deliveryIcons.findIndex(icon => icon.id === iconId);
    if (currentIndex > 0) {
      reorderIcons(currentIndex, currentIndex - 1);
    }
  }, [deliveryIcons, reorderIcons]);

  // Move icon down in order
  const moveIconDown = useCallback((iconId: string) => {
    const currentIndex = deliveryIcons.findIndex(icon => icon.id === iconId);
    if (currentIndex < deliveryIcons.length - 1) {
      reorderIcons(currentIndex, currentIndex + 1);
    }
  }, [deliveryIcons, reorderIcons]);

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
    reorderIcons,
    moveIconUp,
    moveIconDown,
  };
};
