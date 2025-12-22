import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, Mic, MicOff, Volume2, VolumeX, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { getSelectedRingtoneUrl } from "./RingtoneConfigDialog";

// WhatsApp icon component
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

interface IncomingCallProps {
  callerName: string;
  propertyName: string;
  imageUrl?: string;
  onAnswer: () => void;
  onDecline: () => void;
  isActive?: boolean;
  callDuration?: number;
  formatDuration?: (seconds: number) => string;
  ownerPhone?: string;
}

export const IncomingCall = ({
  callerName,
  propertyName,
  imageUrl,
  onAnswer,
  onDecline,
  isActive = false,
  callDuration = 0,
  formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`,
  ownerPhone,
}: IncomingCallProps) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play ringtone when ringing (not active) - keeps playing until answered
  useEffect(() => {
    if (!isActive) {
      const ringtoneUrl = getSelectedRingtoneUrl();
      const audio = new Audio(ringtoneUrl);
      audio.loop = true;
      audio.volume = 1.0;
      audioRef.current = audio;
      
      const playRingtone = () => {
        audio.play().catch((err) => {
          console.log('Could not play ringtone:', err);
        });
      };
      
      playRingtone();
      
      // Ensure audio keeps playing if it somehow stops
      const checkInterval = setInterval(() => {
        if (audioRef.current && audioRef.current.paused && !isActive) {
          playRingtone();
        }
      }, 1000);
      
      return () => {
        clearInterval(checkInterval);
        audio.pause();
        audio.currentTime = 0;
        audioRef.current = null;
      };
    } else {
      // Stop ringtone when call is answered
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    }
  }, [isActive]);

  const handleWhatsApp = () => {
    const phone = ownerPhone?.replace(/\D/g, '') || '';
    const message = encodeURIComponent(`Olá! Estou na porta - ${propertyName}`);
    const url = phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  // Auto-hide controls after 5 seconds during active call
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => setShowControls(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isActive, showControls]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={() => isActive && setShowControls(true)}
    >
      {/* Pulse Rings - Only when ringing */}
      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div 
            className="absolute w-48 h-48 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div 
            className="absolute w-48 h-48 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
          />
          <motion.div 
            className="absolute w-48 h-48 rounded-full border-2 border-primary/30"
            animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
          />
        </div>
      )}

      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-xs glass rounded-3xl p-6 text-center"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        {/* Avatar */}
        <motion.div
          animate={!isActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ repeat: isActive ? 0 : Infinity, duration: 2 }}
          className="relative w-20 h-20 mx-auto mb-4"
        >
          {isVideoOff && isActive ? (
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-4 border-muted">
              <VideoOff className="w-8 h-8 text-muted-foreground" />
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={callerName}
              className={`w-20 h-20 rounded-full object-cover border-4 transition-colors ${isActive ? 'border-success/50' : 'border-primary/50'}`}
            />
          ) : (
            <div className={`w-20 h-20 rounded-full bg-secondary flex items-center justify-center border-4 transition-colors ${isActive ? 'border-success/50' : 'border-primary/50'}`}>
              <Video className="w-8 h-8 text-primary" />
            </div>
          )}
          
          {/* Online indicator */}
          <motion.span 
            className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-card ${isActive ? 'bg-success' : 'bg-warning'}`}
            animate={isActive ? {} : { scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          />
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-6"
            >
              <h2 className="text-lg font-bold text-success mb-1">Chamada em andamento</h2>
              <motion.p 
                className="text-2xl font-mono font-bold text-foreground"
                key={callDuration}
              >
                {formatDuration(callDuration)}
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="ringing"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-6"
            >
              <h2 className="text-xl font-bold mb-1">Campainha tocando!</h2>
              <motion.p 
                className="text-sm text-muted-foreground"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {propertyName}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          {isActive ? (
            <>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="glass"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-12 h-12 rounded-full ${isMuted ? "bg-destructive/20 text-destructive border-destructive/30" : ""}`}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="endCall"
                  size="icon"
                  onClick={onDecline}
                  className="w-14 h-14 rounded-full"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="glass"
                  size="icon"
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`w-12 h-12 rounded-full ${!isSpeakerOn ? "bg-warning/20 text-warning border-warning/30" : ""}`}
                >
                  {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div 
                whileTap={{ scale: 0.95 }}
                animate={{ x: [-1, 1, -1] }}
                transition={{ repeat: Infinity, duration: 0.2 }}
              >
                <Button 
                  variant="endCall" 
                  size="icon" 
                  onClick={onDecline}
                  className="w-14 h-14 rounded-full"
                >
                  <PhoneOff className="w-6 h-6" />
                </Button>
              </motion.div>
              <motion.div 
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="glass"
                  size="icon" 
                  onClick={handleWhatsApp}
                  className="w-12 h-12 rounded-full bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30 hover:bg-[#25D366]/30"
                >
                  <WhatsAppIcon className="w-5 h-5" />
                </Button>
              </motion.div>
              <motion.div 
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Button 
                  variant="call" 
                  size="icon" 
                  onClick={onAnswer}
                  className="w-14 h-14 rounded-full"
                >
                  <Phone className="w-6 h-6" />
                </Button>
              </motion.div>
            </>
          )}
        </div>

        {!isActive && (
          <motion.p 
            className="text-xs text-muted-foreground mt-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            Toque para atender ou recusar
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
};
