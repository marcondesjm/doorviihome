import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, ExternalLink, Copy, Check, Bell, CheckCircle, User, Phone, Volume2, Pause, Play, Mic, MessageCircle, Clock, ArrowLeft, PhoneOff, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { VisitorAudioRecorder } from '@/components/VisitorAudioRecorder';
import { VisitorVideoRecorder } from '@/components/VisitorVideoRecorder';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

type CallStatus = 'waiting' | 'ringing' | 'answered' | 'video_call' | 'audio_message' | 'ended' | 'not_answered';

interface AudioMessage {
  url: string;
  timestamp: number;
}

const VisitorCall = () => {
  const { roomName } = useParams<{ roomName: string }>();
  const [searchParams] = useSearchParams();
  const propertyName = searchParams.get('property') || 'Propriedade';
  const initialMeetLink = searchParams.get('meet');
  
  const [copied, setCopied] = useState(false);
  const [notified, setNotified] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>('waiting');
  const [audioMessages, setAudioMessages] = useState<AudioMessage[]>([]);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number | null>(null);
  const [meetLink, setMeetLink] = useState<string | null>(initialMeetLink);
  const [visitorAlwaysConnected, setVisitorAlwaysConnected] = useState(false);
  const [ownerPhone, setOwnerPhone] = useState<string | null>(null);
  const [waitStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');
  const [showNotAnsweredDialog, setShowNotAnsweredDialog] = useState(false);
  const [showMessageSentDialog, setShowMessageSentDialog] = useState(false);
  const [showEmergencyContact, setShowEmergencyContact] = useState(false);
  const [emergencyCountdown, setEmergencyCountdown] = useState(5);
  const [emergencyMessage, setEmergencyMessage] = useState('Tentei entrar em contato com você via DoorVi - QR Code. Por favor, responda-me');
  const [hasAutoRung, setHasAutoRung] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const ringingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Format elapsed time
  const formatElapsedTime = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - waitStartTime;
      setElapsedTime(formatElapsedTime(elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [waitStartTime, formatElapsedTime]);

  // Fetch owner phone number
  useEffect(() => {
    const fetchOwnerPhone = async () => {
      if (!roomName) return;
      
      // Get the owner_id from the video_call
      const { data: callData } = await supabase
        .from('video_calls')
        .select('owner_id')
        .eq('room_name', roomName)
        .maybeSingle();
      
      if (callData?.owner_id) {
        // Get owner's phone from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('phone')
          .eq('user_id', callData.owner_id)
          .maybeSingle();
        
        if (profile?.phone) {
          setOwnerPhone(profile.phone);
        }
      }
    };
    
    fetchOwnerPhone();
  }, [roomName]);

  const handleWhatsApp = () => {
    const phone = ownerPhone?.replace(/\D/g, '') || '';
    const message = encodeURIComponent(`Olá! Estou na porta - ${decodeURIComponent(propertyName)}`);
    const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  // Subscribe to real-time updates for owner join status and meet link
  useEffect(() => {
    if (!roomName) return;

    console.log('Setting up real-time subscription for visitor call:', roomName);

    // Fetch initial call status and check if visitor_always_connected is enabled
    const fetchCallStatus = async () => {
      // Look for active calls only (not ended)
      const { data, error } = await supabase
        .from('video_calls')
        .select('*, properties:property_id(visitor_always_connected)')
        .eq('room_name', roomName)
        .neq('status', 'ended')
        .maybeSingle();

      if (!error && data) {
        console.log('Initial call status:', data);
        const callData = data as any;
        
        // Check if visitor_always_connected is enabled
        if (callData.properties?.visitor_always_connected) {
          setVisitorAlwaysConnected(true);
        }
        
        // Update meet link if available from database
        if (callData.meet_link && !meetLink) {
          setMeetLink(callData.meet_link);
        }
        
        if (callData.owner_joined) {
          setCallStatus('video_call');
        } else if (callData.status === 'audio_message' && callData.audio_message_url) {
          setCallStatus('audio_message');
          // Add initial audio message
          setAudioMessages(prev => {
            const exists = prev.some(m => m.url === callData.audio_message_url);
            if (!exists) {
              return [...prev, { url: callData.audio_message_url, timestamp: Date.now() }];
            }
            return prev;
          });
        } else if (callData.status === 'answered') {
          setCallStatus('answered');
        }
        // For 'doorbell_ringing', 'pending' or other statuses, keep 'waiting' 
        // so visitor sees the button and can ring again
        // Don't set 'ended' status on initial load - treat as new session
      } else {
        // No active call found - start fresh at waiting
        setCallStatus('waiting');
      }
    };

    fetchCallStatus();

    // Set up real-time subscription
    const channel = supabase
      .channel(`visitor_realtime_${roomName}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'video_calls',
          filter: `room_name=eq.${roomName}`,
        },
        (payload) => {
          console.log('Call updated (visitor):', payload.new);
          const updatedCall = payload.new as any;
          
          // Update meet link if it becomes available
          if (updatedCall.meet_link && !meetLink) {
            console.log('Meet link received:', updatedCall.meet_link);
            setMeetLink(updatedCall.meet_link);
          }
          
          if (updatedCall.owner_joined) {
            setCallStatus('video_call');
            toast.success('Morador iniciou a videochamada! Entre agora.');
            if ('vibrate' in navigator) {
              navigator.vibrate([300, 100, 300]);
            }
          } else if (updatedCall.status === 'audio_message' && updatedCall.audio_message_url) {
            setCallStatus('audio_message');
            // Add new audio message to the list
            setAudioMessages(prev => {
              const exists = prev.some(m => m.url === updatedCall.audio_message_url);
              if (!exists) {
                return [...prev, { url: updatedCall.audio_message_url, timestamp: Date.now() }];
              }
              return prev;
            });
            toast.success('Nova mensagem de áudio do morador!');
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
          } else if (updatedCall.status === 'answered') {
            setCallStatus('answered');
            toast.success('Morador atendeu! Aguarde...');
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          } else if (updatedCall.status === 'ended') {
            setCallStatus('ended');
            toast.info('O morador encerrou a chamada.');
            if ('vibrate' in navigator) {
              navigator.vibrate([500, 200, 500, 200, 500]);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Removing visitor real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [roomName]);

  // Notify owner when visitor scans QR code (page loads)
  useEffect(() => {
    if (!roomName || notified) return;

    const notifyOwner = async () => {
      try {
        // First try to update existing video_call
        const { data: existingCall, error: fetchError } = await supabase
          .from('video_calls')
          .select('id, property_id')
          .eq('room_name', roomName)
          .maybeSingle();

        if (existingCall) {
          // Call exists, update it
          const { error } = await supabase
            .from('video_calls')
            .update({
              visitor_joined: true,
              status: 'pending',
            })
            .eq('room_name', roomName);

          if (error) {
            console.log('Could not notify owner:', error);
          } else {
            console.log('Owner notified - visitor scanned QR code');
            setNotified(true);
          }
        } else {
          // Call doesn't exist - need to find property by access_code and create a new call
          console.log('No existing call found for room:', roomName);
          
          // The roomName is the access code - find the property
          const { data: accessCode, error: accessError } = await supabase
            .from('access_codes')
            .select('property_id, user_id')
            .eq('code', roomName)
            .maybeSingle();

          if (accessCode && accessCode.property_id) {
            // Get property name
            const { data: property } = await supabase
              .from('properties')
              .select('name, visitor_always_connected')
              .eq('id', accessCode.property_id)
              .maybeSingle();

            if (property) {
              // Create a new video_call entry using the original access code as room_name
              // This ensures the real-time subscription will work correctly
              const { error: insertError } = await supabase
                .from('video_calls')
                .insert({
                  room_name: roomName, // Keep the original access code as room_name
                  property_id: accessCode.property_id,
                  property_name: property.name,
                  owner_id: accessCode.user_id,
                  visitor_joined: true,
                  status: 'pending',
                });

              if (insertError) {
                console.error('Error creating video call:', insertError);
              } else {
                console.log('Created new video call for visitor with room:', roomName);
                setNotified(true);
                
                // Check if visitor_always_connected is enabled
                if (property.visitor_always_connected) {
                  setVisitorAlwaysConnected(true);
                }
              }
            }
          } else {
            console.log('Access code not found or no property linked:', roomName);
          }
        }
      } catch (err) {
        console.error('Error notifying owner:', err);
      }
    };

    notifyOwner();
  }, [roomName, notified]);

  const handleJoinCall = () => {
    if (meetLink) {
      const decodedLink = decodeURIComponent(meetLink);
      console.log('Redirecting to Google Meet:', decodedLink);
      window.location.href = decodedLink;
    } else {
      toast.error('Link da reunião não disponível');
    }
  };

  const handleCopyLink = async () => {
    if (meetLink) {
      try {
        await navigator.clipboard.writeText(decodeURIComponent(meetLink));
        setCopied(true);
        toast.success('Link copiado!');
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error('Erro ao copiar link');
      }
    }
  };

  const handleRingDoorbell = async () => {
    if (!roomName || callStatus === 'ringing') return;
    
    // Set status to ringing - timeout will be started by useEffect
    setCallStatus('ringing');
    
    try {
      // Get the call to find the owner_id
      const { data: callData } = await supabase
        .from('video_calls')
        .select('owner_id, property_name')
        .eq('room_name', roomName)
        .maybeSingle();
      
      const { error } = await supabase
        .from('video_calls')
        .update({
          status: 'doorbell_ringing',
        })
        .eq('room_name', roomName);

      if (error) {
        console.error('Error ringing doorbell:', error);
        toast.error('Erro ao tocar campainha');
        setCallStatus('waiting');
      } else {
        toast.success('Campainha tocando! Aguarde o morador atender...');
        
        // Send push notification to owner
        if (callData?.owner_id) {
          supabase.functions.invoke('send-push-notification', {
            body: {
              userId: callData.owner_id,
              title: '🔔 Campainha tocando!',
              body: `Visitante na porta - ${callData.property_name || propertyName}`,
              data: { roomName, propertyName: callData.property_name || propertyName },
            },
          }).catch(err => console.error('Error sending push notification:', err));
        }
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro ao tocar campainha');
      setCallStatus('waiting');
    }
  };

  // Manage ringing timeout - start when ringing, clear when answered
  useEffect(() => {
    // Clear timeout if call was answered
    if (callStatus === 'answered' || callStatus === 'video_call' || callStatus === 'audio_message' || callStatus === 'ended') {
      if (ringingTimeoutRef.current) {
        console.log('Clearing ringing timeout - call answered or ended');
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
      }
    }
    
    // Start timeout if ringing and no timeout exists
    if (callStatus === 'ringing' && !ringingTimeoutRef.current) {
      console.log('Starting 60 second timeout for not_answered');
      ringingTimeoutRef.current = setTimeout(async () => {
        console.log('Timeout reached - showing not answered dialog');
        setCallStatus('not_answered');
        setShowNotAnsweredDialog(true);
        
        // Update database status to stop doorbell on owner's panel
        if (roomName) {
          await supabase
            .from('video_calls')
            .update({ status: 'not_answered' })
            .eq('room_name', roomName);
        }
      }, 60000); // 60 seconds
    }
    
    // Cleanup only on unmount, not on every re-render
  }, [callStatus]);
  
  // Separate cleanup effect for unmount only
  useEffect(() => {
    return () => {
      if (ringingTimeoutRef.current) {
        console.log('Component unmounting - clearing timeout');
        clearTimeout(ringingTimeoutRef.current);
      }
    };
  }, []);

  // Auto-ring is disabled - visitor must manually press doorbell button
  // This ensures the visitor always sees the doorbell button first

  const handleTryAgain = () => {
    setShowNotAnsweredDialog(false);
    setShowEmergencyContact(false);
    setEmergencyCountdown(5);
    // Toca a campainha novamente para alertar o proprietário
    handleRingDoorbell();
  };

  // Auto-show emergency contact after 5 seconds when dialog opens with countdown
  useEffect(() => {
    if (showNotAnsweredDialog && !showEmergencyContact) {
      setEmergencyCountdown(5);
      const interval = setInterval(() => {
        setEmergencyCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowEmergencyContact(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showNotAnsweredDialog, showEmergencyContact]);

  const handleGoBack = () => {
    window.history.back();
  };

  // Status display component
  const StatusDisplay = () => {
    console.log('StatusDisplay render - callStatus:', callStatus, 'visitorAlwaysConnected:', visitorAlwaysConnected);
    // If visitor_always_connected is enabled OR ringing, show the connected status
    if (visitorAlwaysConnected || callStatus === 'ringing' || callStatus === 'waiting') {
      const isRinging = callStatus === 'ringing';
      console.log('isRinging:', isRinging);
      
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/20 border border-green-500/50 rounded-xl p-5 mb-6"
        >
          <motion.div 
            className="flex items-center justify-center gap-2 mb-3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {isRinging ? (
              <Bell className="w-8 h-8 text-amber-500 animate-bounce" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
          </motion.div>
          <h3 className={`font-bold text-lg ${isRinging ? 'text-amber-500' : 'text-green-500'}`}>
            {isRinging ? "Visitante Conectado!" : "Visitante Conectado!"}
          </h3>
          <div className="flex items-center justify-center gap-2 text-foreground mt-2">
            <User className="w-4 h-4" />
            <p className="text-sm">
              {isRinging ? "Aguardando..." : "Conectando..."}
            </p>
          </div>
        </motion.div>
      );
    }

    switch (callStatus) {
      case 'answered':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/20 border border-green-500/50 rounded-xl p-5 mb-6"
          >
            <motion.div 
              className="flex items-center justify-center gap-2 mb-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-8 h-8 text-green-500" />
            </motion.div>
            <h3 className="font-bold text-lg text-green-500 mb-2">Morador atendeu!</h3>
            <div className="flex items-center justify-center gap-2 text-foreground">
              <User className="w-4 h-4" />
              <p className="text-sm">
                O morador está se dirigindo até você ou iniciará uma videochamada em breve.
              </p>
            </div>
          </motion.div>
        );
      
      case 'video_call':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/20 border border-primary/50 rounded-xl p-5 mb-6"
          >
            <motion.div 
              className="flex items-center justify-center gap-2 mb-3"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Video className="w-8 h-8 text-primary" />
            </motion.div>
            <h3 className="font-bold text-lg text-primary mb-2">Videochamada iniciada!</h3>
            <p className="text-sm text-foreground mb-4">
              O morador está aguardando você na chamada de vídeo.
            </p>
            <motion.div 
              whileTap={{ scale: 0.98 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Button
                variant="call"
                size="lg"
                className="w-full text-lg py-6"
                onClick={handleJoinCall}
              >
                <Phone className="w-6 h-6" />
                Entrar na chamada agora
              </Button>
            </motion.div>
          </motion.div>
        );
      
      case 'audio_message':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/20 border border-primary/50 rounded-xl p-5 mb-6"
          >
            <motion.div 
              className="flex items-center justify-center gap-2 mb-3"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Volume2 className="w-8 h-8 text-primary" />
            </motion.div>
            <h3 className="font-bold text-lg text-primary mb-3">
              {audioMessages.length > 1 ? `${audioMessages.length} mensagens do morador` : 'Mensagem do morador'}
            </h3>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {audioMessages.map((message, index) => (
                <motion.div
                  key={message.url}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    currentPlayingIndex === index ? 'bg-primary/30' : 'bg-secondary/50'
                  }`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 rounded-full flex-shrink-0"
                    onClick={async () => {
                      console.log('[Audio] Button clicked, index:', index, 'currentPlayingIndex:', currentPlayingIndex);
                      
                      if (currentPlayingIndex === index && audioRef.current) {
                        console.log('[Audio] Pausing current audio');
                        audioRef.current.pause();
                        setCurrentPlayingIndex(null);
                        return;
                      }
                      
                      try {
                        // Create a new Audio element for better mobile compatibility
                        const audio = new Audio();
                        audio.preload = 'auto';
                        audio.crossOrigin = 'anonymous';
                        
                        // Set up event handlers before setting src
                        audio.oncanplaythrough = async () => {
                          console.log('[Audio] Can play through, starting playback');
                          try {
                            await audio.play();
                            console.log('[Audio] Playback started successfully');
                            setCurrentPlayingIndex(index);
                            
                            // Update the ref to control this audio
                            if (audioRef.current) {
                              audioRef.current.pause();
                            }
                            (audioRef as any).current = audio;
                          } catch (playError) {
                            console.error('[Audio] Play error:', playError);
                            toast.error('Toque novamente para ouvir');
                          }
                        };
                        
                        audio.onended = () => {
                          console.log('[Audio] Playback ended');
                          setCurrentPlayingIndex(null);
                        };
                        
                        audio.onerror = (e) => {
                          console.error('[Audio] Error loading audio:', e);
                          toast.error('Erro ao carregar áudio');
                          setCurrentPlayingIndex(null);
                        };
                        
                        // Set source and load
                        console.log('[Audio] Loading audio from:', message.url);
                        audio.src = message.url;
                        audio.load();
                        
                        // For some mobile browsers, we need to call play immediately
                        // after user interaction, even before canplaythrough
                        setTimeout(async () => {
                          if (audio.readyState >= 2) {
                            try {
                              await audio.play();
                              setCurrentPlayingIndex(index);
                              (audioRef as any).current = audio;
                            } catch (e) {
                              console.log('[Audio] Waiting for canplaythrough...');
                            }
                          }
                        }, 100);
                        
                      } catch (error) {
                        console.error('[Audio] Error:', error);
                        toast.error('Erro ao reproduzir áudio');
                      }
                    }}
                  >
                    {currentPlayingIndex === index ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Mensagem {index + 1}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {currentPlayingIndex === index && (
                    <motion.div
                      className="flex gap-0.5"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 0.8 }}
                    >
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-1 h-3 bg-primary rounded-full" style={{ height: `${8 + i * 4}px` }} />
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
            
            <audio 
              ref={audioRef}
              onEnded={() => setCurrentPlayingIndex(null)}
              onError={(e) => {
                console.error('Audio error:', e);
                toast.error('Erro ao carregar áudio');
              }}
              preload="auto"
              playsInline
              className="hidden"
            />

            {/* Visitor Audio Response */}
            <div className="mt-4 pt-4 border-t border-primary/30">
              <p className="text-xs text-muted-foreground mb-2 text-center">Responder com áudio</p>
              <VisitorAudioRecorder 
                roomName={roomName || ''} 
                onAudioSent={() => toast.success('Resposta enviada!')}
              />
            </div>
          </motion.div>
        );
      
      case 'ended':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-b from-destructive/20 to-destructive/5 border border-destructive/30 rounded-xl p-6 mb-6"
          >
            {/* Animated icon */}
            <motion.div 
              className="flex items-center justify-center mb-4"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              <div className="relative">
                <motion.div
                  className="absolute inset-0 bg-destructive/20 rounded-full blur-xl"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative w-16 h-16 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center">
                  <PhoneOff className="w-8 h-8 text-destructive" />
                </div>
              </div>
            </motion.div>
            
            {/* Title and message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-bold text-xl text-destructive mb-2">Chamada Encerrada</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                O morador finalizou a chamada.
                <br />
                <span className="text-foreground font-medium">Obrigado pela visita!</span>
              </p>
            </motion.div>
            
            {/* Action buttons */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Button
                variant="default"
                size="lg"
                className="w-full"
                onClick={() => {
                  setCallStatus('waiting');
                  setAudioMessages([]);
                  setMeetLink(null);
                  setNotified(false);
                  setHasAutoRung(false);
                }}
              >
                <Bell className="w-5 h-5 mr-2" />
                Tocar campainha novamente
              </Button>
              
              {ownerPhone && (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full gap-2 text-green-600 border-green-600/50 hover:bg-green-600/10"
                  onClick={handleWhatsApp}
                >
                  <WhatsAppIcon className="w-5 h-5" />
                  Enviar mensagem via WhatsApp
                </Button>
              )}
            </motion.div>
            
            {/* Footer message */}
            <motion.p 
              className="text-xs text-muted-foreground mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Você pode tocar a campainha novamente ou entrar em contato pelo WhatsApp
            </motion.p>
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  // Show the visitor call page if we have a roomName (with or without meetLink)
  if (roomName) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="glass rounded-3xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
            {/* Animated rings */}
            <div className="relative w-28 h-28 mx-auto mb-6">
              <AnimatePresence mode="wait">
                {callStatus === 'video_call' ? (
                  <motion.div
                    key="video"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative w-28 h-28 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center"
                  >
                    <Video className="w-10 h-10 text-primary" />
                  </motion.div>
                ) : callStatus === 'audio_message' ? (
                  <motion.div
                    key="audio"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative w-28 h-28 rounded-full bg-primary/20 border-4 border-primary flex items-center justify-center"
                  >
                    <motion.div
                      animate={currentPlayingIndex !== null ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                    >
                      <Volume2 className="w-10 h-10 text-primary" />
                    </motion.div>
                    {audioMessages.length > 1 && (
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {audioMessages.length}
                      </div>
                    )}
                  </motion.div>
                ) : callStatus === 'answered' ? (
                  <motion.div
                    key="answered"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative w-28 h-28 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center"
                  >
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </motion.div>
                ) : callStatus === 'ended' ? (
                  <motion.div
                    key="ended"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative w-28 h-28 rounded-full bg-destructive/20 border-4 border-destructive flex items-center justify-center"
                  >
                    <Phone className="w-10 h-10 text-destructive" />
                  </motion.div>
                ) : callStatus === 'not_answered' ? (
                  <motion.div
                    key="not_answered"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative w-28 h-28 rounded-full bg-amber-500/20 border-4 border-amber-500 flex items-center justify-center"
                  >
                    <PhoneOff className="w-10 h-10 text-amber-500" />
                  </motion.div>
                ) : (
                  <motion.div key="default">
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-primary/20"
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div 
                      className="absolute inset-0 rounded-full border-2 border-primary/20"
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    />
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                    <div className="relative w-28 h-28 rounded-full bg-primary/10 border-4 border-primary/50 flex items-center justify-center">
                      <Bell className="w-10 h-10 text-primary" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <h1 className="text-2xl font-bold mb-2">{decodeURIComponent(propertyName)}</h1>
            <p className="text-muted-foreground mb-2">Portaria Virtual</p>
            
            {/* Wait time counter */}
            {callStatus !== 'ended' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-2 mb-4"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-mono">{elapsedTime}</span>
                  <span className="text-xs">de espera</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-500">
                  <span className="font-bold">!</span>
                  <span>Esta chamada está sendo gravada para consultas futuras</span>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <StatusDisplay key={callStatus} />
            </AnimatePresence>

            {callStatus !== 'video_call' && callStatus !== 'ended' && (
              <div className="space-y-3">
                {/* Botão de campainha */}
                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  animate={callStatus === 'waiting' ? { scale: [1, 1.03, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Button
                    size="lg"
                    className={`w-full font-semibold text-lg py-6 ${
                      callStatus === 'answered' || callStatus === 'audio_message'
                        ? 'bg-green-600 hover:bg-green-700'
                        : callStatus === 'ringing' 
                          ? 'bg-amber-600 hover:bg-amber-700' 
                          : 'bg-amber-500 hover:bg-amber-600'
                    } text-white`}
                    onClick={handleRingDoorbell}
                    disabled={callStatus === 'ringing' || callStatus === 'answered' || callStatus === 'audio_message'}
                  >
                    {callStatus === 'answered' || callStatus === 'audio_message' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Aguarde, estou indo até você</span>
                      </div>
                    ) : callStatus === 'ringing' ? (
                      <>
                        <Bell className="w-6 h-6 animate-bounce" />
                        <span>Aguardando...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-6 h-6" />
                        <span>Tocar Campainha</span>
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Video recorder button in a box */}
                <VisitorVideoRecorder 
                  roomName={roomName || ''} 
                  onVideoSent={() => toast.success('Vídeo enviado!')}
                />

                {(callStatus === 'answered' || callStatus === 'ringing') && (
                  <div className="border-t border-border my-4 pt-4">
                    <p className="text-xs text-muted-foreground mb-3">
                      Se o morador iniciar videochamada:
                    </p>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={handleJoinCall}
                    >
                      <ExternalLink className="w-5 h-5" />
                      Entrar na chamada
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2"
                      onClick={handleCopyLink}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copiado!' : 'Copiar link'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {callStatus === 'video_call' && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar link da chamada'}
              </Button>
            )}

            <p className="text-xs text-muted-foreground mt-6">
              Powered by DoorVii Home
            </p>
          </div>
        </motion.div>

        {/* Not Answered Dialog */}
        <AlertDialog open={showNotAnsweredDialog} onOpenChange={setShowNotAnsweredDialog}>
          <AlertDialogContent className="max-w-sm">
            <AlertDialogTitle className="text-center text-lg font-semibold">
              Chamada Não Atendida
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              O morador não atendeu. Por favor, tente novamente ou entre em contato por outro meio.
            </AlertDialogDescription>
            
            {/* Countdown timer with contact button */}
            {!showEmergencyContact && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center gap-3 py-2"
              >
                {emergencyCountdown > 0 ? (
                  <>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Opções de contato em <span className="font-bold text-foreground">{emergencyCountdown}s</span>
                    </span>
                  </>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-primary hover:text-primary/80"
                  onClick={() => setShowEmergencyContact(true)}
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Contato
                </Button>
              </motion.div>
            )}
            <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
              <AlertDialogAction 
                onClick={handleTryAgain}
                className="w-full bg-primary hover:bg-primary/90"
              >
                Tentar Novamente
              </AlertDialogAction>
              
              <AnimatePresence>
                {showEmergencyContact && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full border-t border-border pt-4 mt-2 overflow-hidden"
                  >
                    <p className="text-sm text-muted-foreground mb-3 text-center">Contato de Emergência</p>
                    <div className="flex items-center justify-center gap-2">
                      {ownerPhone && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="rounded-full h-10 w-10"
                          onClick={() => window.open(`tel:${ownerPhone}`, '_self')}
                        >
                          <Phone className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="outline"
                        className="rounded-full h-10 w-10 bg-green-500 hover:bg-green-600 border-green-500"
                        onClick={handleWhatsApp}
                      >
                        <WhatsAppIcon className="w-4 h-4 text-white" />
                      </Button>
                      {ownerPhone && (
                        <Button
                          variant="outline"
                          className="rounded-full h-10 px-4"
                          onClick={() => {
                            setShowNotAnsweredDialog(false);
                            setShowEmergencyContact(false);
                            setShowMessageSentDialog(true);
                          }}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Mensagem
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Message Sent Dialog */}
        <Dialog open={showMessageSentDialog} onOpenChange={setShowMessageSentDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center text-lg font-semibold">
                Enviou uma mensagem para o proprietário
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Textarea 
                value={emergencyMessage}
                onChange={(e) => setEmergencyMessage(e.target.value)}
                className="min-h-[100px] resize-none border-primary/50"
                placeholder="Digite sua mensagem..."
              />
            </div>
            <Button 
              className="w-full bg-foreground text-background hover:bg-foreground/90"
              onClick={async () => {
                // Send message to database so owner can see it
                if (roomName && emergencyMessage.trim()) {
                  try {
                    const { error } = await supabase
                      .from('video_calls')
                      .update({ 
                        visitor_text_message: emergencyMessage.trim(),
                        status: 'visitor_text_message'
                      })
                      .eq('room_name', roomName);
                    
                    if (error) {
                      console.error('Error sending message:', error);
                      toast.error('Erro ao enviar mensagem');
                    } else {
                      toast.success('Mensagem enviada!');
                    }
                  } catch (e) {
                    console.error('Error:', e);
                    toast.error('Erro ao enviar mensagem');
                  }
                }
                setShowMessageSentDialog(false);
              }}
            >
              Mensagem Enviada
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Not answered state - show buttons even outside dialog
  if (callStatus === 'not_answered' && !showNotAnsweredDialog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="glass rounded-3xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="relative w-28 h-28 mx-auto mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative w-28 h-28 rounded-full bg-amber-500/20 border-4 border-amber-500 flex items-center justify-center"
              >
                <PhoneOff className="w-10 h-10 text-amber-500" />
              </motion.div>
            </div>

            <h2 className="text-xl font-bold mb-2">Chamada Não Atendida</h2>
            <p className="text-muted-foreground mb-6">
              O morador não está disponível no momento.
            </p>

            <div className="flex gap-3 mb-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleGoBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleTryAgain}
              >
                <Phone className="w-4 h-4 mr-2" />
                Ligar Novamente
              </Button>
            </div>

            {ownerPhone && (
              <div className="border-t border-border pt-4">
                <p className="text-sm text-muted-foreground mb-3">Contato de Emergência</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{ownerPhone}</span>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full h-10 w-10"
                      onClick={() => window.open(`tel:${ownerPhone}`, '_self')}
                    >
                      <Phone className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full h-10 w-10"
                      onClick={() => window.open(`sms:${ownerPhone}`, '_self')}
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-full h-10 w-10 bg-green-500 hover:bg-green-600 border-green-500"
                      onClick={handleWhatsApp}
                    >
                      <WhatsAppIcon className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-6">
              Powered by DoorVii Home
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Fallback for links without roomName
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <div className="glass rounded-3xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-muted/20 blur-2xl rounded-full" />
            <div className="relative w-32 h-32 rounded-full bg-muted/10 border-4 border-muted/50 flex items-center justify-center">
              <Video className="w-12 h-12 text-muted-foreground" />
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-2">Link inválido</h1>
          <p className="text-muted-foreground mb-4">
            Este link de chamada não é válido ou expirou.
          </p>
          <p className="text-sm text-muted-foreground">
            Peça um novo QR code ao morador.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VisitorCall;
