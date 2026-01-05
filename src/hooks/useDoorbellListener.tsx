import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface DoorbellState {
  isRinging: boolean;
  isAnswered: boolean;
  propertyName: string;
  roomName: string | null;
  visitorAudioResponse: string | null;
  visitorTextMessage: string | null;
}

// Helper function to detect if URL is a video file
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  const hasVideoExtension = lowerUrl.endsWith('.webm') || 
                            lowerUrl.endsWith('.mp4') || 
                            lowerUrl.endsWith('.mov') ||
                            lowerUrl.endsWith('.avi');
  const hasVideoMarker = lowerUrl.includes('visitor_video') || 
                         lowerUrl.includes('/video/') ||
                         lowerUrl.includes('video%2f');
  return hasVideoExtension || hasVideoMarker;
};

export const useDoorbellListener = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [doorbellState, setDoorbellState] = useState<DoorbellState>({
    isRinging: false,
    isAnswered: false,
    propertyName: '',
    roomName: null,
    visitorAudioResponse: null,
    visitorTextMessage: null,
  });
  
  const doorbellIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play doorbell sound
  const playDoorbellSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 392; // G4 - ding
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 523; // C5 - dong
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.5, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.7);
      }, 300);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  // Clear doorbell interval and stop vibration when stopped
  useEffect(() => {
    if (!doorbellState.isRinging && doorbellIntervalRef.current) {
      clearInterval(doorbellIntervalRef.current);
      doorbellIntervalRef.current = null;
      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      }
    }
  }, [doorbellState.isRinging]);

  // Listen for doorbell rings
  useEffect(() => {
    if (!user) return;

    console.log('Setting up doorbell listener for user:', user.id);

    const channel = supabase
      .channel('global-doorbell-rings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_calls',
          filter: `owner_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Doorbell event received:', payload.new.status);
          
          if (payload.new.status === 'doorbell_ringing') {
            setDoorbellState(prev => ({
              ...prev,
              isRinging: true,
              isAnswered: false,
              propertyName: payload.new.property_name || 'Propriedade',
              roomName: payload.new.room_name || null,
              visitorAudioResponse: null,
              visitorTextMessage: null,
            }));
            
            // Update property status to online
            if (payload.new.property_id) {
              await supabase
                .from('properties')
                .update({ is_online: true })
                .eq('id', payload.new.property_id);
            }
            
            // Vibrate phone if supported
            if ('vibrate' in navigator) {
              navigator.vibrate([500, 200, 500, 200, 500]);
            }
            
            // Play sound immediately
            playDoorbellSound();
            
            // Keep playing sound every 2 seconds
            const interval = setInterval(() => {
              playDoorbellSound();
              if ('vibrate' in navigator) {
                navigator.vibrate([500, 200, 500]);
              }
            }, 2000);
            doorbellIntervalRef.current = interval;

            toast({
              title: "🔔 Campainha tocando!",
              description: `Visitante na porta - ${payload.new.property_name}`,
              duration: 10000,
            });
          }
          
          // Handle not answered - stop doorbell ringing
          if (payload.new.status === 'not_answered') {
            console.log('Call not answered - stopping doorbell');
            setDoorbellState(prev => ({
              ...prev,
              isRinging: false,
            }));
            if (doorbellIntervalRef.current) {
              clearInterval(doorbellIntervalRef.current);
              doorbellIntervalRef.current = null;
            }
          }
          
          // Handle visitor audio response
          if (payload.new.status === 'visitor_audio_response' && payload.new.visitor_audio_url) {
            setDoorbellState(prev => ({
              ...prev,
              isRinging: true,
              isAnswered: true,
              propertyName: payload.new.property_name || 'Propriedade',
              roomName: payload.new.room_name || null,
              visitorAudioResponse: payload.new.visitor_audio_url,
            }));
            
            // Play notification sound
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 587; // D5
              osc.type = 'sine';
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
              osc.start(ctx.currentTime);
              osc.stop(ctx.currentTime + 0.2);
              
              setTimeout(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.frequency.value = 784; // G5
                osc2.type = 'sine';
                gain2.gain.setValueAtTime(0.3, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc2.start(ctx.currentTime);
                osc2.stop(ctx.currentTime + 0.2);
              }, 150);
            } catch (e) {
              console.log('Audio not supported');
            }
            
            if ('vibrate' in navigator) {
              navigator.vibrate([300, 100, 300]);
            }
            
            const isVideo = isVideoUrl(payload.new.visitor_audio_url);
            toast({
              title: isVideo ? "🎬 Resposta do visitante!" : "🎤 Resposta do visitante!",
              description: isVideo ? "O visitante enviou uma mensagem de vídeo" : "O visitante enviou uma mensagem de áudio",
              duration: 8000,
            });
          }
          
          // Handle visitor text message
          if (payload.new.status === 'visitor_text_message' && payload.new.visitor_text_message) {
            setDoorbellState(prev => ({
              ...prev,
              isRinging: true,
              isAnswered: true,
              propertyName: payload.new.property_name || 'Propriedade',
              roomName: payload.new.room_name || null,
              visitorTextMessage: payload.new.visitor_text_message,
            }));
            
            if ('vibrate' in navigator) {
              navigator.vibrate([300, 100, 300]);
            }
            
            toast({
              title: "💬 Mensagem do visitante!",
              description: "O visitante enviou uma mensagem de texto",
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up doorbell listener');
      supabase.removeChannel(channel);
      if (doorbellIntervalRef.current) {
        clearInterval(doorbellIntervalRef.current);
      }
    };
  }, [user, toast]);

  const dismissDoorbell = () => {
    setDoorbellState(prev => ({
      ...prev,
      isRinging: false,
      isAnswered: false,
      visitorAudioResponse: null,
      visitorTextMessage: null,
    }));
    if (doorbellIntervalRef.current) {
      clearInterval(doorbellIntervalRef.current);
      doorbellIntervalRef.current = null;
    }
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
  };

  return {
    doorbellState,
    dismissDoorbell,
    isVideoUrl,
  };
};
