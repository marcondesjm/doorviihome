import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    // Check if already subscribed
    if (user && isSupported) {
      checkSubscription();
    }
  }, [user, isSupported]);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const getVapidPublicKey = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-keys');
      if (error) throw error;
      return data.publicKey;
    } catch (error) {
      console.error('Error getting VAPID key:', error);
      return null;
    }
  };

  const urlBase64ToUint8Array = (base64String: string): ArrayBuffer => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
  };

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return false;

    setLoading(true);
    try {
      // Check if permission was previously denied
      if (Notification.permission === 'denied') {
        toast.error('Notificações bloqueadas. Vá nas configurações do navegador para permitir notificações para este site.');
        setLoading(false);
        return false;
      }
      
      // Request notification permission
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      
      if (newPermission !== 'granted') {
        if (newPermission === 'denied') {
          toast.error('Notificações bloqueadas. Para ativar, vá nas configurações do navegador e permita notificações para este site.');
        } else {
          toast.error('Permissão de notificação não concedida');
        }
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // Get VAPID public key
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        throw new Error('Failed to get VAPID public key');
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subscriptionJson = subscription.toJSON();

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
        }, {
          onConflict: 'endpoint',
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success('Notificações ativadas com sucesso!');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Erro ao ativar notificações');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      toast.success('Notificações desativadas');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Erro ao desativar notificações');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const sendNotification = useCallback(async (
    targetUserId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ) => {
    try {
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: { userId: targetUserId, title, body, data },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
    sendNotification,
  };
}
