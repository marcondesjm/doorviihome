import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Phone, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVisitorCall } from '@/hooks/useVideoCalls';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const VisitorCall = () => {
  const { roomName } = useParams<{ roomName: string }>();
  const [searchParams] = useSearchParams();
  const propertyName = searchParams.get('property') || 'Propriedade';
  
  const { callInfo, ownerJoined, visitorJoin, loading: callLoading } = useVisitorCall(roomName);
  
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());
  
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

  // Load Jitsi script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => setIsLoading(false);
    document.body.appendChild(script);

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
      const existingScript = document.querySelector('script[src="https://meet.jit.si/external_api.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  // Timer for call duration
  useEffect(() => {
    if (!isConnected) return;
    
    const timer = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [isConnected]);

  const joinCall = async () => {
    if (!jitsiContainerRef.current || !roomName) {
      console.error('Missing container or room name');
      return;
    }

    if (!window.JitsiMeetExternalAPI) {
      console.error('JitsiMeetExternalAPI not loaded yet');
      // Retry loading the script
      setIsLoading(true);
      return;
    }

    setHasJoined(true);
    setIsLoading(true);

    // Notify the owner that visitor is joining
    await visitorJoin();

    const domain = 'meet.jit.si';
    const jitsiRoomName = `DoorV_${roomName.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    console.log('Joining Jitsi room:', jitsiRoomName);
    
    const options = {
      roomName: jitsiRoomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: 'Visitante',
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: false,
        disableDeepLinking: true,
        enableWelcomePage: false,
        enableClosePage: false,
        disableInviteFunctions: true,
        toolbarButtons: [],
        hideConferenceSubject: true,
        hideConferenceTimer: true,
        disableProfile: true,
        disableRemoteMute: true,
        remoteVideoMenu: {
          disableKick: true,
          disableGrantModerator: true,
        },
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        BRAND_WATERMARK_LINK: '',
        SHOW_POWERED_BY: false,
        SHOW_PROMOTIONAL_CLOSE_PAGE: false,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        FILM_STRIP_MAX_HEIGHT: 0,
        VERTICAL_FILMSTRIP: false,
        TILE_VIEW_MAX_COLUMNS: 1,
        MOBILE_APP_PROMO: false,
        DEFAULT_BACKGROUND: '#1a1a2e',
      },
    };

    // Set a timeout to detect connection failure
    const connectionTimeout = setTimeout(() => {
      if (!isConnected) {
        console.error('Jitsi connection timeout');
        setIsLoading(false);
      }
    }, 30000); // 30 second timeout

    try {
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      apiRef.current.addListener('videoConferenceJoined', () => {
        console.log('Video conference joined successfully');
        clearTimeout(connectionTimeout);
        setIsLoading(false);
        setIsConnected(true);
        startTimeRef.current = Date.now();
      });

      apiRef.current.addListener('videoConferenceLeft', () => {
        console.log('Video conference left');
        clearTimeout(connectionTimeout);
        handleEndCall();
      });

      apiRef.current.addListener('audioMuteStatusChanged', (data: { muted: boolean }) => {
        setIsAudioMuted(data.muted);
      });

      apiRef.current.addListener('videoMuteStatusChanged', (data: { muted: boolean }) => {
        setIsVideoMuted(data.muted);
      });

      // Listen for errors
      apiRef.current.addListener('errorOccurred', (error: any) => {
        console.error('Jitsi error:', error);
        clearTimeout(connectionTimeout);
        setIsLoading(false);
      });

    } catch (error) {
      console.error('Failed to initialize Jitsi:', error);
      clearTimeout(connectionTimeout);
      setIsLoading(false);
    }
  };

  const toggleAudio = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleVideo');
    }
  };

  const handleEndCall = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('hangup');
      apiRef.current.dispose();
      apiRef.current = null;
    }
    setIsConnected(false);
    setCallEnded(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (callEnded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <PhoneOff className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Chamada encerrada</h1>
          <p className="text-muted-foreground mb-4">
            Duração: {formatDuration(callDuration)}
          </p>
          <p className="text-sm text-muted-foreground">
            Você pode fechar esta página
          </p>
        </motion.div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="glass rounded-3xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
            {/* Animated rings */}
            <div className="relative w-32 h-32 mx-auto mb-6">
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
              <div className="relative w-32 h-32 rounded-full bg-primary/10 border-4 border-primary/50 flex items-center justify-center">
                <Video className="w-12 h-12 text-primary" />
              </div>
            </div>

            <h1 className="text-2xl font-bold mb-2">Chamada de vídeo</h1>
            <p className="text-primary font-medium mb-1">{decodeURIComponent(propertyName)}</p>
            
            {/* Owner status indicator */}
            {callInfo && (
              <div className={`flex items-center justify-center gap-2 mb-4 px-3 py-2 rounded-full ${ownerJoined ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {ownerJoined ? 'Morador online' : 'Aguardando morador...'}
                </span>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mb-8">
              {ownerJoined ? 'O morador está na chamada. Entre agora!' : 'O morador será notificado quando você entrar'}
            </p>

            {isLoading || callLoading ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Carregando...</span>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="call"
                  size="lg"
                  className="w-full"
                  onClick={joinCall}
                >
                  <Phone className="w-5 h-5" />
                  Iniciar chamada
                </Button>
              </motion.div>
            )}

            <p className="text-xs text-muted-foreground mt-6">
              Permita o acesso à câmera e microfone quando solicitado
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/90 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{decodeURIComponent(propertyName)}</h3>
            <p className="text-sm text-muted-foreground">Chamada com morador</p>
          </div>
          {isConnected && (
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/20 text-success text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              {formatDuration(callDuration)}
            </span>
          )}
        </div>
      </div>

      {/* Jitsi Container */}
      <div 
        ref={jitsiContainerRef} 
        className="w-full h-screen"
      />

      {/* Loading State */}
      {isLoading && hasJoined && (
        <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur z-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Conectando à chamada...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {isConnected && (
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-background/90 to-transparent p-6">
          <div className="flex items-center justify-center gap-4">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="glass"
                size="iconLg"
                onClick={toggleAudio}
                className={isAudioMuted ? 'bg-destructive/20 text-destructive border-destructive/30' : ''}
              >
                {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="endCall"
                size="iconXl"
                onClick={handleEndCall}
              >
                <PhoneOff className="w-7 h-7" />
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="glass"
                size="iconLg"
                onClick={toggleVideo}
                className={isVideoMuted ? 'bg-destructive/20 text-destructive border-destructive/30' : ''}
              >
                {isVideoMuted ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </Button>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorCall;
