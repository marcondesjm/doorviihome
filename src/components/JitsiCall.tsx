import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

interface JitsiCallProps {
  roomName: string;
  displayName: string;
  propertyName: string;
  onCallEnd: (duration: number) => void;
  onJoined?: () => void;
}

export const JitsiCall = ({ roomName, displayName, propertyName, onCallEnd, onJoined }: JitsiCallProps) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Load Jitsi script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => initJitsi();
    document.body.appendChild(script);

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose();
      }
      document.body.removeChild(script);
    };
  }, []);

  // Timer for call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const initJitsi = () => {
    if (!jitsiContainerRef.current || !window.JitsiMeetExternalAPI) {
      console.error('Missing container or JitsiMeetExternalAPI');
      return;
    }

    const domain = 'meet.jit.si';
    const jitsiRoomName = `DoorV_${roomName.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    console.log('Owner joining Jitsi room:', jitsiRoomName);
    
    const options = {
      roomName: jitsiRoomName,
      width: '100%',
      height: '100%',
      parentNode: jitsiContainerRef.current,
      userInfo: {
        displayName: displayName,
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
        // Disable lobby mode
        lobbyModeEnabled: false,
        enableLobbyChat: false,
        membersOnly: false,
        requireDisplayName: false,
        disableLobbyPassword: true,
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
      console.error('Jitsi connection timeout for owner');
      setIsLoading(false);
    }, 30000);

    try {
      apiRef.current = new window.JitsiMeetExternalAPI(domain, options);

      apiRef.current.addListener('videoConferenceJoined', () => {
        console.log('Owner: Video conference joined successfully');
        clearTimeout(connectionTimeout);
        setIsLoading(false);
        startTimeRef.current = Date.now();
        // Notify parent that owner has joined the Jitsi room
        onJoined?.();
      });

      apiRef.current.addListener('videoConferenceLeft', () => {
        console.log('Owner: Video conference left');
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
        console.error('Jitsi error (owner):', error);
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleEndCall = () => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    if (apiRef.current) {
      apiRef.current.executeCommand('hangup');
      apiRef.current.dispose();
      apiRef.current = null;
    }
    onCallEnd(duration);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed z-50 bg-background/95 backdrop-blur-xl ${
        isFullscreen 
          ? 'inset-0' 
          : 'inset-4 md:inset-8 lg:inset-16 rounded-2xl overflow-hidden'
      }`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-background/90 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">{propertyName}</h3>
            <p className="text-sm text-muted-foreground">Chamada com visitante</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/20 text-success text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              {formatDuration(callDuration)}
            </span>
            <Button
              variant="glass"
              size="icon"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Jitsi Container */}
      <div 
        ref={jitsiContainerRef} 
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Conectando à chamada...</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-background/90 to-transparent p-6">
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
    </motion.div>
  );
};
