import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, ExternalLink, Copy, Check, Bell, CheckCircle, User, Phone, Volume2, Pause, Play, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { VisitorAudioRecorder } from '@/components/VisitorAudioRecorder';

type CallStatus = 'waiting' | 'ringing' | 'answered' | 'video_call' | 'audio_message' | 'ended';

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
  const audioRef = useRef<HTMLAudioElement>(null);

  // Subscribe to real-time updates for owner join status and meet link
  useEffect(() => {
    if (!roomName) return;

    console.log('Setting up real-time subscription for visitor call:', roomName);

    // Fetch initial call status
    const fetchCallStatus = async () => {
      const { data, error } = await supabase
        .from('video_calls')
        .select('owner_joined, status, audio_message_url, meet_link')
        .eq('room_name', roomName)
        .maybeSingle();

      if (!error && data) {
        console.log('Initial call status:', data);
        
        // Update meet link if available from database
        if (data.meet_link && !meetLink) {
          setMeetLink(data.meet_link);
        }
        
        if (data.owner_joined) {
          setCallStatus('video_call');
        } else if (data.status === 'audio_message' && data.audio_message_url) {
          setCallStatus('audio_message');
          // Add initial audio message
          setAudioMessages(prev => {
            const exists = prev.some(m => m.url === data.audio_message_url);
            if (!exists) {
              return [...prev, { url: data.audio_message_url, timestamp: Date.now() }];
            }
            return prev;
          });
        } else if (data.status === 'doorbell_ringing') {
          setCallStatus('ringing');
        } else if (data.status === 'answered') {
          setCallStatus('answered');
        } else if (data.status === 'ended') {
          setCallStatus('ended');
        }
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
            toast.info('A chamada foi encerrada.');
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
    
    setCallStatus('ringing');
    
    try {
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
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Erro ao tocar campainha');
      setCallStatus('waiting');
    }
  };

  // Status display component
  const StatusDisplay = () => {
    switch (callStatus) {
      case 'waiting':
        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-amber-500">Primeiro passo</span>
            </div>
            <p className="text-sm text-foreground">
              Toque a campainha para avisar o morador que você chegou!
            </p>
          </motion.div>
        );
      
      case 'ringing':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4 mb-6"
          >
            <motion.div 
              className="flex items-center justify-center gap-2 mb-2"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Bell className="w-5 h-5 text-amber-500 animate-bounce" />
              <span className="font-semibold text-amber-500">Campainha tocando...</span>
            </motion.div>
            <p className="text-sm text-foreground">
              Aguarde o morador atender
            </p>
          </motion.div>
        );
      
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
                    onClick={() => {
                      if (audioRef.current) {
                        if (currentPlayingIndex === index) {
                          audioRef.current.pause();
                          setCurrentPlayingIndex(null);
                        } else {
                          audioRef.current.src = message.url;
                          audioRef.current.play();
                          setCurrentPlayingIndex(index);
                        }
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-muted/20 border border-muted/50 rounded-xl p-4 mb-6"
          >
            <p className="text-muted-foreground">
              A chamada foi encerrada.
            </p>
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
            <p className="text-muted-foreground mb-4">Portaria Virtual</p>

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
                      callStatus === 'ringing' 
                        ? 'bg-amber-600 hover:bg-amber-700' 
                        : 'bg-amber-500 hover:bg-amber-600'
                    } text-white`}
                    onClick={handleRingDoorbell}
                    disabled={callStatus === 'ringing' || callStatus === 'answered'}
                  >
                    <Bell className={`w-6 h-6 ${callStatus === 'ringing' ? 'animate-bounce' : ''}`} />
                    {callStatus === 'ringing' ? 'Aguardando...' : callStatus === 'answered' ? 'Atendido!' : 'Tocar Campainha'}
                  </Button>
                </motion.div>

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
